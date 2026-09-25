// Steam → Supabase importer for the game catalog.
// Schema: supabase/migrations/20260924000000_game_catalog.sql
//
// Usage (Node ≥ 23.6 runs .mts directly; on Node 22 add --experimental-strip-types):
//   node scripts/import-steam.mts seed [topN]        queue the top N games from SteamSpy (default 2000)
//   node scripts/import-steam.mts seed-ids 730,570   queue specific app IDs at top priority
//   node scripts/import-steam.mts run [maxGames]     import due games from the queue (default 60)
//   node scripts/import-steam.mts backfill-trailers [max]  English trailers for games missing them
//   node scripts/import-steam.mts art [max]                key-art assets (also topped up after every run)
//   node scripts/import-steam.mts items [max]              raw GetItems data for queued apps (works from GitHub)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Rate limits: Steam's store API allows ~200 requests / 5 min per IP, and GitHub's
// shared runner IPs are often already throttled. We make 2 requests per game
// (appdetails ES + appreviews; English trailers only for games that don't have them
// yet), space every request by REQUEST_GAP_MS, and when Steam throttles we back off
// 1 → 2 → 4 → 8 min before giving up; the queue resumes on the next hourly run.
// Games never imported go before refreshes of games we already have.

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

/**
 * SteamSpy's `all` endpoint returns 1000 apps per page and allows 1 call/min.
 * Its JSON is keyed by app ID, and JS objects iterate integer keys in ascending
 * order, so the server's ordering is lost — we rank by review volume ourselves.
 */
async function seed(topN: number) {
  const pages = Math.ceil(topN / 1000) + 1;  // fetch a buffer page so the cut-off is meaningful
  const apps: { id: number; score: number }[] = [];
  for (let page = 0; page < pages; page++) {
    if (page > 0) await sleep(61_000);
    console.log(`SteamSpy page ${page}…`);
    const res = await fetch(`https://steamspy.com/api.php?request=all&page=${page}`);
    if (!res.ok) throw new Error(`SteamSpy HTTP ${res.status}`);
    const body = (await res.json()) as Record<string, { positive?: number; negative?: number }>;
    const entries = Object.entries(body);
    if (entries.length === 0) break;
    for (const [id, app] of entries) {
      apps.push({ id: Number(id), score: (app.positive ?? 0) + (app.negative ?? 0) });
    }
  }
  apps.sort((a, b) => b.score - a.score);

  // Demote everything from the previous seed (manual seed-ids keep priority 0),
  // so games that fell out of the top N don't keep their old rank.
  const { error } = await supabase.from("import_queue").update({ priority: 100_000 }).gt("priority", 0);
  if (error) throw new Error(`import_queue reset: ${error.message}`);
  await supabase.from("games").update({ popularity_rank: null }).not("popularity_rank", "is", null);

  await enqueue(apps.slice(0, topN).map((a, i) => ({ steam_app_id: a.id, priority: i + 1 })));
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
 * Raw IStoreBrowseService/GetItems data for queued apps (new ones first), 50 per request,
 * into steam_store_items, plus the tag-name list. Works from GitHub runners, unlike
 * appdetails. The mapping into `games` reads from what is stored here.
 */
async function fetchItems(max: number) {
  // Tag names, so tag ids can become genres.
  try {
    const res = await fetch("https://api.steampowered.com/IStoreService/GetTagList/v1/?language=english");
    const body = (await res.json()) as { response?: { tags?: { tagid: number; name: string }[] } };
    const tags = body.response?.tags ?? [];
    if (tags.length) {
      const { error } = await supabase.from("steam_tags").upsert(tags.map((t) => ({ tagid: t.tagid, name: t.name })));
      if (error) console.warn(`steam_tags upsert: ${error.message}`);
    }
    console.log(`Tags: ${tags.length}`);
  } catch (err) {
    console.warn(`GetTagList: ${String(err)}`);
  }

  const { data: have } = await supabase.from("steam_store_items").select("steam_app_id").limit(10000);
  const fetched = new Set((have ?? []).map((r) => r.steam_app_id as number));
  const { data: queue, error } = await supabase
    .from("import_queue")
    .select("steam_app_id")
    .eq("skip", false)
    .order("imported_at", { ascending: true, nullsFirst: true })
    .order("priority", { ascending: true })
    .limit(10000);
  if (error) throw new Error(`import_queue select: ${error.message}`);
  const ids = (queue ?? []).map((r) => r.steam_app_id as number).filter((id) => !fetched.has(id)).slice(0, max);

  let saved = 0, missing = 0;
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const input = {
      ids: batch.map((appid) => ({ appid })),
      context: { language: "english", country_code: COUNTRY.toUpperCase() },
      data_request: {
        include_assets: true, include_release: true, include_platforms: true,
        include_all_purchase_options: true, include_screenshots: true, include_trailers: true,
        include_ratings: true, include_tag_count: 20, include_reviews: true, include_basic_info: true,
      },
    };
    const url = `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(input))}`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`GetItems HTTP ${res.status}`);
      const body = (await res.json()) as { response?: { store_items?: { appid?: number; success?: number }[] } };
      const items = (body.response?.store_items ?? []).filter((it) => it.appid && it.success === 1);
      missing += batch.length - items.length;
      if (items.length) {
        const now = new Date().toISOString();
        const { error: e } = await supabase.from("steam_store_items")
          .upsert(items.map((item) => ({ steam_app_id: item.appid, item, fetched_at: now })));
        if (e) throw new Error(`steam_store_items upsert: ${e.message}`);
        saved += items.length;
      }
      if (i === 0 && items[0]) console.log(`Item keys: ${Object.keys(items[0]).join(", ")}`);
    } catch (err) {
      console.warn(`items batch ${i / 50 + 1}: ${String(err)}`);
    }
    await sleep(500);
  }
  console.log(`Store items: ${saved} saved, ${missing} not returned, of ${ids.length} requested.`);
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

async function run(maxGames: number) {
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
  case "seed":     await seed(Number(arg ?? 2000)); break;
  case "seed-ids": await seedIds((arg ?? "").split(",").map(Number).filter(Boolean)); break;
  case "run":      await run(Number(arg ?? 60)); break;
  case "backfill-trailers": await backfillTrailers(Number(arg ?? 500)); break;
  case "art":      await backfillArt(Number(arg ?? 2000)); break;
  case "items":    await fetchItems(Number(arg ?? 3000)); break;
  default:
    console.error("Usage: import-steam.mts seed [topN] | seed-ids <id,id> | run [maxGames] | backfill-trailers [max] | art [max] | items [max]");
    process.exit(1);
}
