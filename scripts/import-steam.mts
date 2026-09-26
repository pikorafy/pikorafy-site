// Steam → Supabase importer for the game catalog.
// Schema: supabase/migrations/20260924000000_game_catalog.sql
//
// Usage (Node ≥ 23.6 runs .mts directly; on Node 22 add --experimental-strip-types):
//   node scripts/import-steam.mts seed [topN]        rank all Steam games by reviews (+ charts), queue the top N (default 20000)
//   node scripts/import-steam.mts discover           add today's most played / trending, prune the rest
//   node scripts/import-steam.mts seed-ids 730,570   queue specific app IDs at top priority
//   node scripts/import-steam.mts run [maxGames]     import due games via GetItems, new first (default: all due)
//   node scripts/import-steam.mts run-appdetails [n] legacy per-game appdetails import (blocked from GitHub)
//   node scripts/import-steam.mts backfill-trailers [max]  English trailers for games missing them
//   node scripts/import-steam.mts art [max]                key-art assets (also topped up after every run)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STEAM_API_KEY (seed / discover)
//
// Rate limits: Steam's store API allows ~200 requests / 5 min per IP, and GitHub's
// shared runner IPs are often already throttled. We make 2 requests per game
// (appdetails ES + appreviews; English trailers only for games that don't have them
// yet), space every request by REQUEST_GAP_MS, and when Steam throttles we back off
// 1 → 2 → 4 → 8 min before giving up; the queue resumes on the next hourly run.
// Games never imported go before refreshes of games we already have.

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const REQUEST_GAP_MS = 1600;   // ≈187 req / 5 min
const THROTTLE_BACKOFF_MS = [60_000, 120_000, 240_000, 480_000];
const COUNTRY = "es";          // prices in EUR, as Spanish users see them
const TRAILER_COUNTRY = "us";  // Steam picks trailers by region; "es" returns Spanish/PEGI cuts
const TOP_REFRESH_RANK = 500;  // games ranked above this refresh daily, the rest weekly

const supabase = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

// ─── Steam types (only the fields we use) ────────────────────────────────────

interface SteamAppDetails {
  type: string;
  name: string;
  steam_appid: number;
  is_free: boolean;
  header_image?: string;
  developers?: string[];
  publishers?: string[];
  genres?: { id: string; description: string }[];
  categories?: { id: number; description: string }[];
  platforms?: { windows: boolean; mac: boolean; linux: boolean };
  metacritic?: { score: number };
  release_date?: { coming_soon: boolean; date: string };
  price_overview?: {
    currency: string;
    initial: number;          // cents
    final: number;            // cents
    discount_percent: number;
  };
}

interface SteamReviewSummary {
  total_positive: number;
  total_reviews: number;
  review_score_desc: string;
}

class RateLimited extends Error {}

// ─── HTTP ────────────────────────────────────────────────────────────────────

let lastRequestAt = 0;

async function steamFetch<T>(url: string): Promise<T> {
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const res = await fetch(url, { headers: { "User-Agent": "PikorafyBot/1.0 (+https://pikorafy.com)" } });
  if (res.status === 429 || res.status === 403) throw new RateLimited(`${res.status} on ${url}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json() as Promise<T>;
}

/**
 * appdetails signals throttling with HTTP 200 and a `null` body (or a 429/403), so an
 * empty body must never be read as "this app doesn't exist". Back off and retry with
 * growing pauses; if Steam is still throttling after ~15 min, stop the run and let
 * the queue resume on the next one.
 * Returns null only when Steam explicitly says success:false (delisted/region-locked).
 */
async function getAppDetails(appId: number, country = COUNTRY): Promise<SteamAppDetails | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${country}&l=english`;
  type Body = Record<string, { success: boolean; data?: SteamAppDetails }> | null;
  for (let attempt = 0; ; attempt++) {
    let body: Body = null;
    try {
      body = await steamFetch<Body>(url);
    } catch (err) {
      if (!(err instanceof RateLimited)) throw err;
    }
    const entry = body?.[appId];
    if (entry) return entry.success && entry.data ? entry.data : null;
    if (attempt >= THROTTLE_BACKOFF_MS.length) throw new RateLimited(`appdetails still throttled for ${appId} after backing off`);
    console.warn(`Steam throttling (app ${appId}); waiting ${THROTTLE_BACKOFF_MS[attempt] / 60_000} min`);
    await sleep(THROTTLE_BACKOFF_MS[attempt]);
  }
}

/** The trailer list as English-speaking regions see it (null if Steam returns none). */
async function getEnglishTrailers(appId: number): Promise<unknown[] | null> {
  const details = await getAppDetails(appId, TRAILER_COUNTRY);
  const movies = (details as { movies?: unknown } | null)?.movies;
  return Array.isArray(movies) && movies.length > 0 ? movies : null;
}

async function getReviewSummary(appId: number): Promise<SteamReviewSummary | null> {
  const url = `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0`;
  const body = await steamFetch<{ success: number; query_summary?: SteamReviewSummary }>(url);
  return body?.success === 1 && body.query_summary ? body.query_summary : null;
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .replace(/[\u2122\u00ae\u00a9]/g, "")  // ™ ® © — strip before NFKD, which expands ™ into "TM"
    .replace(/['\u2019]/g, "")            // "Garry's Mod" → "garrys-mod"
    .replace(/(\d)[.,](?=\d)/g, "$1")                // "40,000" → "40000"
    .replace(/(?<=\b[a-z])\.(?=[a-z]\b)/gi, "")      // "S.T.A.L.K.E.R." → "stalker" (not "BeamNG.drive")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")      // drop accents: "Pokémon" → "pokemon"
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Steam dates look like "3 Aug, 2023", "Aug 3, 2023", "Q4 2026" or "Coming soon".
function parseReleaseDate(raw?: string): string | null {
  if (!raw) return null;
  const t = Date.parse(raw.replace(",", ""));
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

/** Keep an existing slug forever (URLs must not change); dedupe new ones with the app ID. */
async function resolveSlug(appId: number, name: string): Promise<string> {
  const { data: existing } = await supabase.from("games").select("slug").eq("steam_app_id", appId).maybeSingle();
  if (existing?.slug) return existing.slug;

  const base = slugify(name) || String(appId);
  const { data: clash } = await supabase.from("games").select("steam_app_id").eq("slug", base).maybeSingle();
  return clash ? `${base}-${appId}` : base;
}

// ─── Import one game ─────────────────────────────────────────────────────────

async function importGame(appId: number, rank: number): Promise<"ok" | "skip"> {
  const details = await getAppDetails(appId);
  if (!details || details.type !== "game") return "skip";

  const reviews = await getReviewSummary(appId);
  // English trailers rarely change: fetch them once per game (saves a third of the requests).
  const { data: existing } = await supabase.from("games").select("trailers_en").eq("steam_app_id", appId).maybeSingle();
  const hasTrailers = existing?.trailers_en !== null && existing?.trailers_en !== undefined;
  const trailersEn = hasTrailers ? undefined : ((await getEnglishTrailers(appId)) ?? []);
  const now = new Date().toISOString();

  const game = {
    steam_app_id: appId,
    slug: await resolveSlug(appId, details.name),
    name: details.name,
    type: details.type,
    is_free: details.is_free,
    release_date: parseReleaseDate(details.release_date?.date),
    coming_soon: details.release_date?.coming_soon ?? false,
    developers: details.developers ?? [],
    publishers: details.publishers ?? [],
    genres: details.genres?.map((g) => g.description) ?? [],
    categories: details.categories?.map((c) => c.description) ?? [],
    platforms: Object.entries(details.platforms ?? {}).filter(([, v]) => v).map(([k]) => k),
    metacritic: details.metacritic?.score ?? null,
    review_score_pct: reviews && reviews.total_reviews > 0
      ? Math.round((reviews.total_positive / reviews.total_reviews) * 100)
      : null,
    review_count: reviews?.total_reviews ?? null,
    review_label: reviews?.review_score_desc ?? null,
    header_image: details.header_image ?? null,
    popularity_rank: rank,
    raw: details,
    ...(trailersEn !== undefined && { trailers_en: trailersEn }),
    steam_fetched_at: now,
  };

  const { error: gameErr } = await supabase.from("games").upsert(game);
  if (gameErr) throw new Error(`games upsert: ${gameErr.message}`);

  const po = details.price_overview;
  if (po) {
    const price = po.final / 100;
    const regular = po.initial / 100;
    const priceRow = {
      steam_app_id: appId,
      source: "steam",
      store: "Steam",
      currency: po.currency,
      price,
      regular_price: regular,
      discount_pct: po.discount_percent,
      url: `https://store.steampowered.com/app/${appId}/`,
      fetched_at: now,
    };
    const history = {
      steam_app_id: appId,
      store: "Steam",
      currency: po.currency,
      day: now.slice(0, 10),
      price,
      regular_price: regular,
    };
    const [a, b] = await Promise.all([
      supabase.from("game_prices").upsert(priceRow),
      supabase.from("price_history").upsert(history),
    ]);
    if (a.error) throw new Error(`game_prices upsert: ${a.error.message}`);
    if (b.error) throw new Error(`price_history upsert: ${b.error.message}`);
  }

  return "ok";
}

// ─── Commands ────────────────────────────────────────────────────────────────

// ─── Popularity lists (Steam Web API, needs STEAM_API_KEY) ──────────────────

const STEAM_API = "https://api.steampowered.com";

let steamKey = "";
function key(): string {
  return (steamKey ||= required("STEAM_API_KEY"));
}

async function steamApi<T>(path: string, input?: unknown, params: Record<string, string> = {}): Promise<T> {
  const qs = [`key=${key()}`, ...Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`)];
  if (input !== undefined) qs.push(`input_json=${encodeURIComponent(JSON.stringify(input))}`);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${STEAM_API}/${path}?${qs.join("&")}`, { headers: { Accept: "application/json" } });
    if (res.ok) return ((await res.json()) as { response?: T }).response ?? ({} as T);
    // Never print the URL: it carries the key.
    if (attempt >= 3) throw new Error(`${path.split("/")[0]}/${path.split("/")[1]} HTTP ${res.status}`);
    await sleep(10_000 * 2 ** attempt);
  }
}

const appIdsOf = (list?: { appid?: number; id?: number; item_id?: number }[]) =>
  (list ?? []).map((r) => r.appid ?? r.id ?? r.item_id ?? 0).filter((id) => id > 0);

/** Every game on Steam (IStoreService/GetAppList, 50k per page, games only). */
async function allSteamGames(): Promise<number[]> {
  const ids: number[] = [];
  let lastAppid = 0;
  for (let page = 0; page < 10; page++) {
    const res = await steamApi<{ apps?: { appid?: number }[]; have_more_results?: boolean; last_appid?: number }>(
      "IStoreService/GetAppList/v1/", undefined, {
        include_games: "true", include_dlc: "false", include_software: "false", include_videos: "false",
        include_hardware: "false", max_results: "50000", last_appid: String(lastAppid),
      });
    ids.push(...appIdsOf(res.apps));
    if (!res.have_more_results || !res.last_appid) break;
    lastAppid = res.last_appid;
  }
  return ids;
}

/** App IDs already in the import queue (the previous ranking, manual seeds, trending). */
async function queuedApps(): Promise<number[]> {
  const ids: number[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("import_queue").select("steam_app_id").order("steam_app_id").range(from, from + 999);
    if (error) throw new Error(`import_queue read: ${error.message}`);
    ids.push(...(data ?? []).map((r) => r.steam_app_id as number));
    if (!data || data.length < 1000) break;
  }
  return ids;
}

/** Review counts saved on imported games, for apps GetItems didn't return. */
async function storedReviewCounts(appIds: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  for (let i = 0; i < appIds.length; i += 500) {
    const { data, error } = await supabase.from("games").select("steam_app_id, review_count")
      .in("steam_app_id", appIds.slice(i, i + 500)).gt("review_count", 0);
    if (error) throw new Error(`games read: ${error.message}`);
    for (const g of data ?? []) counts.set(g.steam_app_id as number, g.review_count as number);
  }
  return counts;
}

/** Steam's charts: most played, concurrent players, weekly top sellers (ES), top releases. */
async function chartApps(): Promise<Map<string, number[]>> {
  const lists = new Map<string, number[]>();
  const ctx = { language: "english", country_code: "ES" };
  const tryList = async (name: string, fn: () => Promise<number[]>) => {
    try {
      const ids = await fn();
      lists.set(name, ids);
      console.log(`${name}: ${ids.length}`);
    } catch (err) {
      console.warn(`${name}: ${String(err).replaceAll(steamKey || "\0", "***")}`);
    }
  };
  await tryList("Most played", async () =>
    appIdsOf((await steamApi<{ ranks?: { appid?: number }[] }>("ISteamChartsService/GetMostPlayedGames/v1/")).ranks));
  await tryList("Concurrent players", async () =>
    appIdsOf((await steamApi<{ ranks?: { appid?: number }[] }>("ISteamChartsService/GetGamesByConcurrentPlayers/v1/", { context: ctx })).ranks));
  await tryList("Weekly top sellers", async () => {
    const ids: number[] = [];
    for (let start = 0; start < 500; start += 100) {
      const res = await steamApi<{ ranks?: { appid?: number }[] }>("IStoreTopSellersService/GetWeeklyTopSellers/v1/",
        { country_code: "ES", context: ctx, page_start: start, page_count: 100 });
      const page = appIdsOf(res.ranks);
      ids.push(...page);
      if (page.length < 100) break;
    }
    return ids;
  });
  await tryList("Top releases", async () => {
    const res = await steamApi<{ pages?: { item_ids?: { appid?: number }[] }[] }>("ISteamChartsService/GetTopReleasesPages/v1/");
    return (res.pages ?? []).flatMap((p) => appIdsOf(p.item_ids));
  });
  return lists;
}

/** Review counts via GetItems (keyless, 50 apps per call). Apps Steam doesn't return are left out. */
async function reviewCounts(appIds: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  for (let i = 0; i < appIds.length; i += ITEMS_BATCH) {
    const input = {
      ids: appIds.slice(i, i + ITEMS_BATCH).map((appid) => ({ appid })),
      context: { language: "english", country_code: "ES" },
      data_request: { include_reviews: true },
    };
    const url = `${STEAM_API}/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(input))}`;
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const items = ((await res.json()) as { response?: { store_items?: StoreItem[] } }).response?.store_items ?? [];
        for (const it of items) {
          if (it.appid && it.success === 1) counts.set(it.appid, it.reviews?.summary_filtered?.review_count ?? 0);
        }
        break;
      }
      if (attempt >= 3) throw new Error(`GetItems HTTP ${res.status}`);
      await sleep(10_000 * 2 ** attempt);
    }
    if ((i / ITEMS_BATCH) % 200 === 199) console.log(`Review counts: ${Math.min(i + ITEMS_BATCH, appIds.length)}/${appIds.length}`);
    await sleep(100);
  }
  return counts;
}

/**
 * Weekly: rank the catalog from Steam itself. Every game on Steam (GetAppList), plus
 * what's already queued and Steam's charts, is ranked by its review count (GetItems,
 * ~3000 calls, ~20 min). Games on the charts (most played, top sellers…) are always kept.
 * (The store search's "sort by reviews" turned out to miss big games like Skyrim.)
 */
async function seed(topN: number) {
  const all = await allSteamGames();
  console.log(`Steam app list: ${all.length} games.`);
  if (all.length < 50_000) throw new Error(`App list returned only ${all.length} games; keeping the current ranking.`);
  const queued = await queuedApps();
  const charts = [...(await chartApps()).values()].flat();

  const candidates = [...new Set([...all, ...queued, ...charts])];
  const counts = await reviewCounts(candidates);
  console.log(`Review counts for ${counts.size}/${candidates.length} apps.`);
  // Steam returns nothing for some listed games (e.g. GTA IV Complete Edition): keep
  // the review count we stored at their last import rather than ranking them at zero.
  const stored = await storedReviewCounts(queued.filter((id) => !counts.get(id)));
  for (const [id, n] of stored) counts.set(id, n);
  if (stored.size) console.log(`Used stored review counts for ${stored.size} games Steam didn't return.`);
  if (counts.size < all.length / 2) throw new Error(`Too few review counts (${counts.size}); keeping the current ranking.`);

  const onCharts = new Set(charts.filter((id) => counts.has(id)));
  const byReviews = [...counts].filter(([id]) => !onCharts.has(id)).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const byReviewsTop = byReviews.slice(0, Math.max(0, topN - onCharts.size));
  const ranked = [...byReviewsTop, ...onCharts].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
  // Chart games can be pre-orders with no reviews yet, so report the cut-off of the review ranking.
  console.log(`Seeding ${ranked.length} games (${onCharts.size} from charts); review cut-off: ${counts.get(byReviewsTop.at(-1)!) ?? 0} reviews.`);

  // New ranks first, then demote whatever isn't in them (manual seed-ids keep priority 0),
  // so a failed seed can never leave the whole queue demoted.
  await enqueue(ranked.map((id, i) => ({ steam_app_id: id, priority: i + 1 })));
  const { data: demoted, error } = await supabase.rpc("demote_unseeded", { seeded: ranked });
  if (error) throw new Error(`demote_unseeded: ${error.message}`);
  console.log(`Demoted ${demoted} apps that fell out of the top ${topN}.`);

  // Re-rank games we already have right away. (Clearing ranks and waiting for each
  // game's next refresh would hide most of the catalog for up to a day.)
  const { data: reranked, error: rankError } = await supabase.rpc("apply_seed_ranks");
  if (rankError) throw new Error(`apply_seed_ranks: ${rankError.message}`);
  console.log(`Re-ranked ${reranked} games.`);
}

/** One-off: fetch English trailers for games imported before trailers_en existed. */
async function backfillTrailers(max: number) {
  const { data, error } = await supabase
    .from("games")
    .select("steam_app_id")
    .is("trailers_en", null)
    .not("popularity_rank", "is", null)
    .order("popularity_rank", { ascending: true })
    .limit(max);
  if (error) throw new Error(`games select: ${error.message}`);

  let updated = 0;
  for (const { steam_app_id: appId } of data ?? []) {
    try {
      const movies = await getEnglishTrailers(appId);
      // Store [] when Steam has none, so the game isn't retried on every backfill.
      const { error: e } = await supabase.from("games").update({ trailers_en: movies ?? [] }).eq("steam_app_id", appId);
      if (e) throw new Error(e.message);
      updated++;
    } catch (err) {
      if (err instanceof RateLimited) { console.warn(`Rate limited, stopping: ${err.message}`); break; }
      console.warn(`${appId}: ${String(err)}`);
    }
  }
  console.log(`English trailers: ${updated}/${data?.length ?? 0} games updated.`);
}

/**
 * Art assets (header, main capsule, library hero, logo…) from IStoreBrowseService,
 * the API the Steam store itself uses. File names are hash-versioned, so they can't
 * be guessed from the app ID any more; we store the whole "assets" object.
 */
async function fetchArt(appIds: number[]): Promise<Map<number, Record<string, string>>> {
  const input = {
    ids: appIds.map((appid) => ({ appid })),
    context: { language: "english", country_code: COUNTRY },
    data_request: { include_assets: true },
  };
  const url = `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(input))}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GetItems HTTP ${res.status}`);
  const body = (await res.json()) as { response?: { store_items?: { appid?: number; assets?: Record<string, string> }[] } };
  const out = new Map<number, Record<string, string>>();
  for (const item of body.response?.store_items ?? []) {
    if (item.appid && item.assets) out.set(item.appid, item.assets);
  }
  return out;
}

async function backfillArt(max: number) {
  const staleBefore = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("games")
    .select("steam_app_id")
    .not("popularity_rank", "is", null)
    .or(`art_fetched_at.is.null,art_fetched_at.lt.${staleBefore}`)
    .order("popularity_rank", { ascending: true })
    .limit(max);
  if (error) throw new Error(`games select: ${error.message}`);

  const ids = (data ?? []).map((r) => r.steam_app_id as number);
  const keys = new Map<string, number>();
  let updated = 0;
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    let art: Map<number, Record<string, string>>;
    try {
      art = await fetchArt(batch);
    } catch (err) {
      console.warn(`art batch ${i / 50 + 1}: ${String(err)}`);
      continue;
    }
    const now = new Date().toISOString();
    for (const appId of batch) {
      const assets = art.get(appId) ?? null;
      for (const k of Object.keys(assets ?? {})) keys.set(k, (keys.get(k) ?? 0) + 1);
      const { error: e } = await supabase.from("games").update({ art: assets, art_fetched_at: now }).eq("steam_app_id", appId);
      if (e) console.warn(`${appId}: ${e.message}`); else if (assets) updated++;
    }
    await sleep(500);
  }
  console.log(`Art: ${updated}/${ids.length} games. Asset keys seen: ${[...keys].map(([k, n]) => `${k}(${n})`).join(", ") || "none"}`);
}

/**
 * Daily: add what's hot right now — Steam's charts (most played, concurrent players,
 * weekly top sellers, top releases) — then drop games that fell out of both the
 * weekly top N and these lists (prune_catalog), keeping the catalog in budget.
 */
async function discover() {
  const ids = new Set([...(await chartApps()).values()].flat());
  if (!ids.size) throw new Error("No trending apps found; not pruning.");

  const { data: marked, error } = await supabase.rpc("mark_trending", { ids: [...ids] });
  if (error) throw new Error(`mark_trending: ${error.message}`);
  const { data: pruned, error: pruneError } = await supabase.rpc("prune_catalog");
  if (pruneError) throw new Error(`prune_catalog: ${pruneError.message}`);
  const { data: sizeMb } = await supabase.rpc("db_size_mb");
  console.log(`Trending: ${ids.size} apps (${marked} queued/updated). Pruned ${pruned} games. Database: ${sizeMb} MB.`);
}

async function seedIds(ids: number[]) {
  await enqueue(ids.map((id) => ({ steam_app_id: id, priority: 0 })));
}

async function enqueue(rows: { steam_app_id: number; priority: number }[]) {
  // Only priority is updated for games already queued, so their schedule and skip flag are kept.
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from("import_queue")
      .upsert(rows.slice(i, i + 500), { onConflict: "steam_app_id", ignoreDuplicates: false });
    if (error) throw new Error(`import_queue upsert: ${error.message}`);
  }
  console.log(`Queued ${rows.length} apps.`);
}

/** Legacy path: one appdetails call per game. Blocked from GitHub runners; kept for local use. */
async function runAppdetails(maxGames: number) {
  const { data: due, error } = await supabase
    .from("import_queue")
    .select("steam_app_id, priority, attempts")
    .eq("skip", false)
    .lte("next_fetch_at", new Date().toISOString())
    .order("imported_at", { ascending: true, nullsFirst: true })   // never-imported games first
    .order("priority", { ascending: true })
    .limit(maxGames);
  if (error) throw new Error(`import_queue select: ${error.message}`);

  let ok = 0, skipped = 0, failed = 0;
  for (const item of due ?? []) {
    try {
      const result = await importGame(item.steam_app_id, item.priority);
      const days = item.priority <= TOP_REFRESH_RANK ? 1 : 7;
      await supabase.from("import_queue").update({
        next_fetch_at: new Date(Date.now() + days * 86_400_000).toISOString(),
        ...(result === "ok" && { imported_at: new Date().toISOString() }),
        attempts: 0,
        last_error: null,
        skip: result === "skip",
      }).eq("steam_app_id", item.steam_app_id);
      if (result === "ok") ok++; else skipped++;
    } catch (err) {
      if (err instanceof RateLimited) {
        console.warn(`Rate limited, stopping run: ${err.message}`);
        break;
      }
      failed++;
      const attempts = item.attempts + 1;
      await supabase.from("import_queue").update({
        // back off 1h, 4h, 16h… and give up after 5 tries
        next_fetch_at: new Date(Date.now() + 4 ** (attempts - 1) * 3_600_000).toISOString(),
        attempts,
        last_error: String(err).slice(0, 500),
        skip: attempts >= 5,
      }).eq("steam_app_id", item.steam_app_id);
    }
  }
  console.log(`Done: ${ok} imported, ${skipped} skipped (not a game / unavailable), ${failed} failed, ${(due?.length ?? 0) - ok - skipped - failed} left for next run.`);

  // Art uses a different Steam API (no appdetails rate limit): top up missing / week-old art.
  await backfillArt(300);
}

// ─── GetItems import (main path) ─────────────────────────────────────────────
//
// store.steampowered.com/api/appdetails blocks GitHub's runner IPs, so the hourly
// import uses IStoreBrowseService/GetItems on api.steampowered.com instead: 50 apps
// per request with names, descriptions, release, platforms, reviews, price, tags,
// art, screenshots and trailers. Each item is stored raw (steam_store_items) and
// mapped into `games` in the appdetails shape the site already reads (`raw`).

const STORE_ASSETS = "https://shared.akamai.steamstatic.com/store_item_assets/";
const STORE_TRAILERS = "https://video.akamai.steamstatic.com/store_trailers/";
const ITEMS_BATCH = 50;
const MAX_STORED_TRAILERS = 8;
const MAX_STORED_SCREENSHOTS = 16;
// Database budget (free plan: 500 MB; we cap ourselves at 400 MB): above this, runs
// only refresh games we already have and add no new ones.
const DB_BUDGET_MB = 380;
// Games per hourly run (keeps a run well inside the workflow timeout; the first fill
// of a large seed takes a few runs).
const MAX_PER_RUN = 4000;

// Steam genre ids as appdetails reports them; GetItems only has tags, whose names match.
const GENRES: Record<string, { id: string; description: string }> = {
  "Action": { id: "1", description: "Action" },
  "Strategy": { id: "2", description: "Strategy" },
  "RPG": { id: "3", description: "RPG" },
  "Casual": { id: "4", description: "Casual" },
  "Racing": { id: "9", description: "Racing" },
  "Sports": { id: "18", description: "Sports" },
  "Indie": { id: "23", description: "Indie" },
  "Adventure": { id: "25", description: "Adventure" },
  "Simulation": { id: "28", description: "Simulation" },
  "Massively Multiplayer": { id: "29", description: "Massively Multiplayer" },
  "Free to Play": { id: "37", description: "Free To Play" },
  "Early Access": { id: "70", description: "Early Access" },
};

// Store category ids → names (as appdetails names them).
const CATEGORIES: Record<number, string> = {
  1: "Multi-player", 2: "Single-player", 8: "Valve Anti-Cheat enabled", 9: "Co-op", 13: "Captions available",
  14: "Commentary available", 15: "Stats", 16: "Includes Source SDK", 17: "Includes level editor",
  18: "Partial Controller Support", 20: "MMO", 22: "Steam Achievements", 23: "Steam Cloud", 24: "Shared/Split Screen",
  25: "Steam Leaderboards", 27: "Cross-Platform Multiplayer", 28: "Full controller support", 29: "Steam Trading Cards",
  30: "Steam Workshop", 31: "VR Support", 32: "Steam Turn Notifications", 35: "In-App Purchases", 36: "Online PvP",
  37: "Shared/Split Screen PvP", 38: "Online Co-op", 39: "Shared/Split Screen Co-op", 40: "SteamVR Collectibles",
  41: "Remote Play on Phone", 42: "Remote Play on Tablet", 43: "Remote Play on TV", 44: "Remote Play Together",
  47: "LAN PvP", 48: "LAN Co-op", 49: "PvP", 51: "Steam Workshop", 52: "Tracked Controller Support",
  53: "VR Supported", 54: "VR Only", 55: "DualShock Controller Support", 56: "DualShock Controller Support",
  57: "DualSense Controller Support", 58: "DualSense Controller Support", 59: "Steam Input API Support",
  60: "Gamepad Recommended", 61: "HDR available", 62: "Family Sharing", 63: "Steam Timeline",
};

interface StoreTrailer {
  trailer_name?: string;
  trailer_base_id?: number;
  trailer_url_format?: string;
  screenshot_medium?: string;
  screenshot_full?: string;
  adaptive_trailers?: { cdn_path?: string; encoding?: string }[];
}

interface StoreItem {
  appid?: number;
  success?: number;
  type?: number;                 // 0 = game
  name?: string;
  is_free?: boolean;
  is_early_access?: boolean;
  tagids?: number[];
  basic_info?: { short_description?: string; developers?: { name: string }[]; publishers?: { name: string }[] };
  release?: { steam_release_date?: number; original_release_date?: number; is_coming_soon?: boolean };
  platforms?: { windows?: boolean; mac?: boolean; steamos_linux?: boolean };
  reviews?: { summary_filtered?: { review_count?: number; percent_positive?: number; review_score_label?: string } };
  categories?: { supported_player_categoryids?: number[]; feature_categoryids?: number[]; controller_categoryids?: number[] };
  best_purchase_option?: { final_price_in_cents?: string | number; original_price_in_cents?: string | number; discount_pct?: number };
  assets?: Record<string, string>;
  screenshots?: { all_ages_screenshots?: { filename?: string; ordinal?: number }[] };
  trailers?: { highlights?: StoreTrailer[]; other_trailers?: StoreTrailer[] };
}

/** Full items for Spain (EUR prices), or only trailers for another region (`trailersOnly`). */
async function getItems(appIds: number[], country = COUNTRY, trailersOnly = false): Promise<StoreItem[]> {
  const input = {
    ids: appIds.map((appid) => ({ appid })),
    context: { language: "english", country_code: country.toUpperCase() },
    data_request: trailersOnly ? { include_trailers: true } : {
      include_assets: true, include_release: true, include_platforms: true, include_screenshots: true,
      include_trailers: true, include_ratings: true, include_tag_count: 20, include_reviews: true, include_basic_info: true,
    },
  };
  const url = `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(input))}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const body = (await res.json()) as { response?: { store_items?: StoreItem[] } };
      return body.response?.store_items ?? [];
    }
    if (attempt >= 3) throw new Error(`GetItems HTTP ${res.status}`);
    await sleep(10_000 * 2 ** attempt);
  }
}

async function loadTagNames(): Promise<Map<number, string>> {
  try {
    const res = await fetch("https://api.steampowered.com/IStoreService/GetTagList/v1/?language=english");
    const tags = ((await res.json()) as { response?: { tags?: { tagid: number; name: string }[] } }).response?.tags ?? [];
    if (tags.length) await supabase.from("steam_tags").upsert(tags.map((t) => ({ tagid: t.tagid, name: t.name })));
    if (tags.length) return new Map(tags.map((t) => [t.tagid, t.name]));
  } catch (err) {
    console.warn(`GetTagList: ${String(err)} — using stored tag names`);
  }
  const { data } = await supabase.from("steam_tags").select("tagid, name");
  return new Map((data ?? []).map((t) => [t.tagid as number, t.name as string]));
}

const cents = (v: string | number | undefined) => (v === undefined || v === null || v === "" ? null : Number(v) / 100);
const isoDate = (sec?: number) => (sec ? new Date(sec * 1000).toISOString().slice(0, 10) : null);

/** A GetItems item in the appdetails shape `games.raw` has always held (pages read it). */
function toAppdetails(item: StoreItem, tagNames: Map<number, string>) {
  const assets = item.assets ?? {};
  const asset = (file?: string) => (file && assets.asset_url_format ? STORE_ASSETS + assets.asset_url_format.replace("${FILENAME}", file) : null);
  const tags = (item.tagids ?? []).map((id) => tagNames.get(id)).filter((n): n is string => !!n);
  const genres = tags.filter((t) => GENRES[t]).map((t) => GENRES[t]);
  if (item.is_early_access && !genres.some((g) => g.id === "70")) genres.push(GENRES["Early Access"]);
  if (item.is_free && !genres.some((g) => g.id === "37")) genres.push(GENRES["Free to Play"]);
  const categoryIds = [
    ...(item.categories?.supported_player_categoryids ?? []),
    ...(item.categories?.feature_categoryids ?? []),
    ...(item.categories?.controller_categoryids ?? []),
  ];
  const categories = [...new Set(categoryIds)].filter((id) => CATEGORIES[id]).map((id) => ({ id, description: CATEGORIES[id] }));

  const screenshots = (item.screenshots?.all_ages_screenshots ?? [])
    .filter((s) => s.filename)
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
    .slice(0, MAX_STORED_SCREENSHOTS)
    .map((s, id) => {
      const [path, query = ""] = s.filename!.split("?");
      const sized = (size: string) => `${STORE_ASSETS}${path.replace(/\.jpg$/, `.${size}.jpg`)}${query ? `?${query}` : ""}`;
      return { id, path_thumbnail: sized("600x338"), path_full: sized("1920x1080") };
    });

  const trailer = (t: StoreTrailer, highlight: boolean) => {
    const hls = t.adaptive_trailers?.find((a) => a.encoding === "hls_h264")?.cdn_path;
    const thumbFile = t.screenshot_medium;
    const thumb = thumbFile && t.trailer_url_format ? STORE_ASSETS + t.trailer_url_format.replace("${FILENAME}", thumbFile) : null;
    return { id: t.trailer_base_id, name: t.trailer_name ?? "Trailer", thumbnail: thumb, hls_h264: hls ? STORE_TRAILERS + hls : null, highlight };
  };
  // Capped: pages show at most a handful, and every stored byte counts against the DB budget.
  const movies = [
    ...(item.trailers?.highlights ?? []).map((t) => trailer(t, true)),
    ...(item.trailers?.other_trailers ?? []).map((t) => trailer(t, false)),
  ].filter((m) => typeof m.id === "number" && m.thumbnail).slice(0, MAX_STORED_TRAILERS);

  const release = item.release?.steam_release_date ?? item.release?.original_release_date;
  const comingSoon = item.release?.is_coming_soon ?? (!release || release * 1000 > Date.now());
  const bpo = item.best_purchase_option;
  const final = cents(bpo?.final_price_in_cents);
  const initial = cents(bpo?.original_price_in_cents) ?? final;

  return {
    source: "getitems",
    type: item.type === 0 ? "game" : `type_${item.type}`,
    name: item.name ?? String(item.appid),
    steam_appid: item.appid,
    is_free: Boolean(item.is_free),
    short_description: item.basic_info?.short_description ?? "",
    header_image: asset(assets.header),
    developers: (item.basic_info?.developers ?? []).map((d) => d.name),
    publishers: (item.basic_info?.publishers ?? []).map((p) => p.name),
    genres,
    categories,
    tags,
    platforms: { windows: Boolean(item.platforms?.windows), mac: Boolean(item.platforms?.mac), linux: Boolean(item.platforms?.steamos_linux) },
    release_date: { coming_soon: comingSoon, date: isoDate(release) ?? "" },
    price_overview: final !== null && !item.is_free
      ? { currency: "EUR", final: Math.round(final * 100), initial: Math.round((initial ?? final) * 100), discount_percent: bpo?.discount_pct ?? 0 }
      : undefined,
    screenshots,
    movies,
  };
}

/** Import (or refresh) due games through GetItems: new games first, then due refreshes. */
async function run(maxGames: number) {
  const tagNames = await loadTagNames();

  const { data: sizeMb } = await supabase.rpc("db_size_mb");
  const overBudget = typeof sizeMb === "number" && sizeMb > DB_BUDGET_MB;
  if (overBudget) console.warn(`Database is ${sizeMb} MB (budget ${DB_BUDGET_MB} MB): refreshing existing games only.`);
  else console.log(`Database: ${sizeMb ?? "?"} MB of ${DB_BUDGET_MB} MB budget.`);

  // PostgREST caps responses at 1000 rows: page through the due queue.
  const due: { steam_app_id: number; priority: number; attempts: number }[] = [];
  for (let from = 0; due.length < maxGames; from += 1000) {
    let query = supabase
      .from("import_queue")
      .select("steam_app_id, priority, attempts")
      .eq("skip", false)
      .lte("next_fetch_at", new Date().toISOString());
    if (overBudget) query = query.not("imported_at", "is", null);
    const { data, error } = await query
      .order("imported_at", { ascending: true, nullsFirst: true })
      .order("priority", { ascending: true })
      .order("steam_app_id", { ascending: true })
      .range(from, Math.min(from + 999, maxGames - 1));
    if (error) throw new Error(`import_queue select: ${error.message}`);
    due.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  let ok = 0, skipped = 0, failed = 0, changed = 0;
  for (let i = 0; i < due.length; i += ITEMS_BATCH) {
    const batch = due.slice(i, i + ITEMS_BATCH);
    let items: StoreItem[];
    try {
      items = await getItems(batch.map((q) => q.steam_app_id));
    } catch (err) {
      failed += batch.length;
      console.warn(`items batch ${i / ITEMS_BATCH + 1}: ${String(err)}`);
      continue;
    }
    const byId = new Map(items.filter((it) => it.appid).map((it) => [it.appid!, it]));
    // Steam picks trailer cuts by region (Spain gets PEGI/Spanish ones): take trailers from the US.
    const usTrailers = new Map<number, StoreItem["trailers"]>();
    try {
      for (const it of await getItems(batch.map((q) => q.steam_app_id), TRAILER_COUNTRY, true)) {
        if (it.appid && it.trailers) usTrailers.set(it.appid, it.trailers);
      }
    } catch (err) {
      console.warn(`US trailers batch ${i / ITEMS_BATCH + 1}: ${String(err)} — using Spain's`);
    }
    const now = new Date().toISOString();
    // Fingerprints of what we stored last time: unchanged games aren't rewritten (disk I/O budget).
    const { data: stored } = await supabase.from("games").select("steam_app_id, content_hash")
      .in("steam_app_id", batch.map((q) => q.steam_app_id));
    const hashes = new Map((stored ?? []).map((g) => [g.steam_app_id as number, g.content_hash as string | null]));

    for (const q of batch) {
      const item = byId.get(q.steam_app_id);
      try {
        let result: "ok" | "skip";
        if (!item || item.success !== 1) {
          // Not returned: delisted or region-locked. Give it a few tries before skipping.
          result = "skip";
          const attempts = q.attempts + 1;
          await supabase.from("import_queue").update({
            next_fetch_at: new Date(Date.now() + 86_400_000).toISOString(),
            attempts, last_error: "not returned by GetItems", skip: attempts >= 3,
          }).eq("steam_app_id", q.steam_app_id);
          skipped++;
          continue;
        } else if (item.type !== 0) {
          result = "skip";
        } else {
          const saved = await saveItem(item, q.priority, tagNames, now, usTrailers.get(q.steam_app_id), hashes.get(q.steam_app_id));
          if (saved) changed++;
          result = "ok";
        }
        const hours = q.priority <= TOP_REFRESH_RANK ? 6 : 24;
        await supabase.from("import_queue").update({
          next_fetch_at: new Date(Date.now() + hours * 3_600_000).toISOString(),
          ...(result === "ok" && { imported_at: now }),
          attempts: 0, last_error: null, skip: result === "skip",
        }).eq("steam_app_id", q.steam_app_id);
        if (result === "ok") ok++; else skipped++;
      } catch (err) {
        failed++;
        await supabase.from("import_queue").update({
          attempts: q.attempts + 1, last_error: String(err).slice(0, 500),
          next_fetch_at: new Date(Date.now() + 3_600_000).toISOString(), skip: q.attempts + 1 >= 5,
        }).eq("steam_app_id", q.steam_app_id);
      }
    }
    await sleep(300);
  }
  console.log(`Done: ${ok} imported/refreshed (${changed} changed, ${ok - changed} unchanged), ${skipped} skipped (not a game / not returned), ${failed} failed, of ${due.length} due.`);

  // New Steam games may match Xbox products we already have.
  if (changed) {
    const { error: linkError } = await supabase.rpc("refresh_xbox_catalog");
    if (linkError) console.warn(`refresh_xbox_catalog: ${linkError.message}`);
  }
}

/** Saves a game and its Steam price. Returns false (and writes nothing) when nothing changed. */
async function saveItem(
  item: StoreItem, rank: number, tagNames: Map<number, string>, now: string,
  usTrailers?: StoreItem["trailers"], storedHash?: string | null,
): Promise<boolean> {
  const appId = item.appid!;
  const details = toAppdetails(item, tagNames);
  const english = usTrailers ? toAppdetails({ ...item, trailers: usTrailers }, tagNames).movies : details.movies;
  const review = item.reviews?.summary_filtered;
  const contentHash = createHash("sha1")
    .update(JSON.stringify({ details, english, review, rank, assets: item.assets ?? null }))
    .digest("hex");
  if (storedHash === contentHash) return false;

  const game = {
    steam_app_id: appId,
    slug: await resolveSlug(appId, details.name),
    name: details.name,
    type: "game",
    is_free: details.is_free,
    release_date: details.release_date.date || null,
    coming_soon: details.release_date.coming_soon,
    developers: details.developers,
    publishers: details.publishers,
    genres: details.genres.map((g) => g.description),
    categories: details.categories.map((c) => c.description),
    platforms: Object.entries(details.platforms).filter(([, v]) => v).map(([k]) => k),
    review_score_pct: review?.review_count ? review.percent_positive ?? null : null,
    review_count: review?.review_count ?? null,
    review_label: review?.review_score_label ?? null,
    header_image: details.header_image,
    popularity_rank: rank,
    raw: details,
    trailers_en: english,
    art: item.assets ?? null,
    art_fetched_at: now,
    steam_fetched_at: now,
    content_hash: contentHash,
  };
  const { error: gameErr } = await supabase.from("games").upsert(game);
  if (gameErr) throw new Error(`games upsert: ${gameErr.message}`);

  const po = details.price_overview;
  if (po) {
    const price = po.final / 100, regular = po.initial / 100;
    const [a, b] = await Promise.all([
      supabase.from("game_prices").upsert({
        steam_app_id: appId, source: "steam", store: "Steam", currency: po.currency, price, regular_price: regular,
        discount_pct: po.discount_percent, url: `https://store.steampowered.com/app/${appId}/`, fetched_at: now,
      }),
      supabase.from("price_history").upsert({
        steam_app_id: appId, store: "Steam", currency: po.currency, day: now.slice(0, 10), price, regular_price: regular,
      }),
    ]);
    if (a.error) throw new Error(`game_prices upsert: ${a.error.message}`);
    if (b.error) throw new Error(`price_history upsert: ${b.error.message}`);
  }
  return true;
}

// ─── Entry ───────────────────────────────────────────────────────────────────

function required(name: string): string {
  // Trim: secrets pasted into GitHub often pick up a trailing space or newline.
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case "seed":     await seed(Number(arg ?? 20000)); break;
  case "discover": await discover(); break;
  case "seed-ids": await seedIds((arg ?? "").split(",").map(Number).filter(Boolean)); break;
  case "run":      await run(Number(arg ?? MAX_PER_RUN)); break;
  case "run-appdetails": await runAppdetails(Number(arg ?? 60)); break;
  case "backfill-trailers": await backfillTrailers(Number(arg ?? 500)); break;
  case "art":      await backfillArt(Number(arg ?? 2000)); break;
  default:
    console.error("Usage: import-steam.mts seed [topN] | seed-ids <id,id> | run [maxGames] | run-appdetails [maxGames] | discover | backfill-trailers [max] | art [max]");
    process.exit(1);
}
