// Steam → Supabase importer for the game catalog.
// Schema: supabase/migrations/20260924000000_game_catalog.sql
//
// Usage (Node ≥ 23.6 runs .mts directly; on Node 22 add --experimental-strip-types):
//   node scripts/import-steam.mts seed [topN]        queue the top N games from SteamSpy (default 2000)
//   node scripts/import-steam.mts seed-ids 730,570   queue specific app IDs at top priority
//   node scripts/import-steam.mts run [maxGames]     import due games from the queue (default 120)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Rate limits: Steam's store API allows ~200 requests / 5 min per IP. We make
// 2 requests per game (appdetails + appreviews) and space every request by
// REQUEST_GAP_MS, so a run of 120 games takes ~6.5 min and stays under the cap.
// On a 429/403 we stop the run instead of hammering; the queue resumes next time.

import { createClient } from "@supabase/supabase-js";

const REQUEST_GAP_MS = 1600;   // ≈187 req / 5 min
const COUNTRY = "es";          // prices in EUR, as Spanish users see them
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

async function getAppDetails(appId: number): Promise<SteamAppDetails | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${COUNTRY}&l=english`;
  const body = await steamFetch<Record<string, { success: boolean; data?: SteamAppDetails }>>(url);
  const entry = body?.[appId];
  return entry?.success && entry.data ? entry.data : null;
}

async function getReviewSummary(appId: number): Promise<SteamReviewSummary | null> {
  const url = `https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0`;
  const body = await steamFetch<{ success: number; query_summary?: SteamReviewSummary }>(url);
  return body?.success === 1 && body.query_summary ? body.query_summary : null;
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[™®©]/g, "")
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

/** SteamSpy's `all` endpoint returns 1000 apps per page ordered by owners; it allows 1 call/min. */
async function seed(topN: number) {
  const rows: { steam_app_id: number; priority: number }[] = [];
  for (let page = 0; rows.length < topN; page++) {
    if (page > 0) await sleep(61_000);
    console.log(`SteamSpy page ${page}…`);
    const res = await fetch(`https://steamspy.com/api.php?request=all&page=${page}`);
    if (!res.ok) throw new Error(`SteamSpy HTTP ${res.status}`);
    const apps = Object.keys((await res.json()) as Record<string, unknown>);
    if (apps.length === 0) break;
    for (const id of apps) {
      if (rows.length >= topN) break;
      rows.push({ steam_app_id: Number(id), priority: rows.length + 1 });
    }
  }
  await enqueue(rows);
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
}

// ─── Entry ───────────────────────────────────────────────────────────────────

function required(name: string): string {
  const v = process.env[name];
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
  case "run":      await run(Number(arg ?? 120)); break;
  default:
    console.error("Usage: import-steam.mts seed [topN] | seed-ids <id,id> | run [maxGames]");
    process.exit(1);
}
