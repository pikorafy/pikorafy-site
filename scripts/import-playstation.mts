// PlayStation Store (PS4 / PS5, Spain) → Supabase (`playstation_games`).
//
// Usage (Node ≥ 23.6 runs .mts directly):
//   node scripts/import-playstation.mts catalog     game list from IGDB (daily)
//   node scripts/import-playstation.mts store       store pages that are due (every 6h)
//   node scripts/import-playstation.mts run         both
//   node scripts/import-playstation.mts parse <file.html> [conceptId]   parse a saved page, no database
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET (catalog).
//      STORE_PAGES (optional): store pages per run, default 1000.
//      MAX_GAMES (optional): how many games to track, most popular first, default 15000.
//
// Two sources:
//  - IGDB (Twitch API): every game with a PlayStation Store link gives its store concept id,
//    English title, summary, genres, PS4/PS5 platforms and, when it has one, its Steam app id.
//  - The game's concept page on store.playstation.com/es-es, server-rendered: price, sale
//    and its end date, PS Plus price / catalog tier, lowest 30-day price, art
//    (see scripts/lib/playstation-page.mts). One page every ~2 s, popular games daily, the
//    rest every few days, so the store sees a few thousand requests a day.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseConceptPage, type PsStoreData } from "./lib/playstation-page.mts";

const STORE_URL = "https://store.playstation.com/es-es/concept";
const STORE_PAGES = Number(process.env.STORE_PAGES) || 1000;
const STORE_DELAY_MS = 1500;          // between pages, on top of the page load itself
const STORE_BATCH = 25;               // rows per database call
const MAX_FAILS_IN_A_ROW = 15;        // blocked or the store is down: stop, don't mark games
const IGDB_DELAY_MS = 260;            // IGDB allows 4 requests / second
const PS_STORE_SOURCE = 36;           // IGDB external_game_source: "Playstation Store US"
const STEAM_SOURCE = 1;
const PS_PLATFORMS: Record<number, string> = { 48: "PS4", 167: "PS5" };
const GAME_TYPES = [0, 4, 8, 9, 10, 11];   // main game, standalone expansion, remake, remaster, expanded, port
const MAX_GAMES = Number(process.env.MAX_GAMES) || 15000;  // tracked games, most popular first (DB and store load)
const MIN_CATALOG = 5000;
const MAX_CATALOG_WRITES = 5000;      // per run, most popular first: the first fill takes one daily run per 5000
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

let client: SupabaseClient | null = null;
const db = () =>
  (client ??= createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } }));

// ─── IGDB ────────────────────────────────────────────────────────────────────

let igdbToken: string | null = null;

async function igdb<T>(endpoint: string, query: string): Promise<T> {
  const id = required("IGDB_CLIENT_ID");
  if (!igdbToken) {
    const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${required("IGDB_CLIENT_SECRET")}&grant_type=client_credentials`, { method: "POST" });
    const body = (await res.json()) as { access_token?: string };
    if (!body.access_token) throw new Error(`IGDB token: HTTP ${res.status}`);
    igdbToken = body.access_token;
  }
  for (let attempt = 0; ; attempt++) {
    await sleep(IGDB_DELAY_MS);
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: { "Client-ID": id, Authorization: `Bearer ${igdbToken}`, Accept: "application/json" },
      body: query,
    });
    if (res.ok) return (await res.json()) as T;
    if (attempt >= 3 || (res.status !== 429 && res.status < 500)) throw new Error(`IGDB ${endpoint}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    await sleep(2_000 * 2 ** attempt);
  }
}

interface IgdbGame {
  id: number;
  name?: string;
  slug?: string;
  summary?: string;
  genres?: { name?: string }[];
  platforms?: number[];
  first_release_date?: number;
  total_rating_count?: number;
  hypes?: number;
  game_type?: number;
}

/** Shorter names for IGDB's genres. */
const GENRE_NAMES: Record<string, string> = {
  "Role-playing (RPG)": "RPG",
  "Hack and slash/Beat 'em up": "Hack and Slash",
  "Real Time Strategy (RTS)": "Strategy",
  "Turn-based strategy (TBS)": "Strategy",
  "Point-and-click": "Adventure",
  "Card & Board Game": "Board Game",
  "Quiz/Trivia": "Trivia",
  Simulator: "Simulation",
  Platform: "Platformer",
  Sport: "Sports",
};
const genreName = (g: string) => GENRE_NAMES[g] ?? g;

function slugify(name: string): string {
  return name
    .replace(/[™®©]/g, "")
    .replace(/['’]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface Stored { slug: string; conceptId: string; hash: string | null; popularity: number | null; ratingCount: number | null }

async function storedGames(): Promise<Map<number, Stored>> {
  const stored = new Map<number, Stored>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db().from("playstation_games").select("igdb_id, slug, concept_id, catalog_hash, popularity, rating_count")
      .order("igdb_id").range(from, from + 999);
    if (error) throw new Error(`playstation_games read: ${error.message}`);
    for (const r of data ?? []) {
      stored.set(r.igdb_id as number, {
        slug: r.slug as string, conceptId: r.concept_id as string, hash: r.catalog_hash as string | null,
        popularity: r.popularity as number | null, ratingCount: r.rating_count as number | null,
      });
    }
    if (!data || data.length < 1000) break;
  }
  return stored;
}

/** Steam app ids we already import, to prefer them when IGDB lists several. */
async function knownSteamApps(): Promise<Set<number>> {
  const ids = new Set<number>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db().from("games").select("steam_app_id").order("steam_app_id").range(from, from + 999);
    if (error) throw new Error(`games read: ${error.message}`);
    for (const r of data ?? []) ids.add(r.steam_app_id as number);
    if (!data || data.length < 1000) break;
  }
  return ids;
}

const rankMoved = (before: number | null, after: number) =>
  before === null || Math.abs(before - after) > Math.max(25, before * 0.1);

async function importCatalog(): Promise<void> {
  // 1. Every PlayStation Store link: IGDB game id → concept ids.
  const concepts = new Map<number, string[]>();
  for (let last = 0; ;) {
    const rows = await igdb<{ id: number; game?: number; uid?: string }[]>("external_games",
      `fields game,uid; where external_game_source = ${PS_STORE_SOURCE} & id > ${last}; sort id asc; limit 500;`);
    if (!rows.length) break;
    for (const r of rows) {
      if (!r.game || !r.uid || !/^\d+$/.test(r.uid)) continue;
      const list = concepts.get(r.game) ?? [];
      if (!list.includes(r.uid)) list.push(r.uid);
      concepts.set(r.game, list);
    }
    last = rows[rows.length - 1].id;
  }
  console.log(`IGDB: ${concepts.size} games with a PlayStation Store link.`);

  // 2. Game details (PS4 / PS5 main games only) and Steam links.
  const ids = [...concepts.keys()];
  const games = new Map<number, IgdbGame>();
  const steam = new Map<number, number[]>();
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500).join(",");
    for (const g of await igdb<IgdbGame[]>("games",
      `fields name,slug,summary,genres.name,platforms,first_release_date,total_rating_count,hypes,game_type; where id = (${chunk}); limit 500;`)) {
      if (g.name && g.platforms?.some((p) => PS_PLATFORMS[p]) && GAME_TYPES.includes(g.game_type ?? 0)) games.set(g.id, g);
    }
    for (const r of await igdb<{ game?: number; uid?: string }[]>("external_games",
      `fields game,uid; where external_game_source = ${STEAM_SOURCE} & game = (${chunk}); limit 500;`)) {
      const app = Number(r.uid);
      if (r.game && Number.isInteger(app) && app > 0) steam.set(r.game, [...(steam.get(r.game) ?? []), app]);
    }
  }
  console.log(`IGDB: ${games.size} PS4/PS5 games (main games, remakes, remasters, ports); ${[...games.keys()].filter((g) => steam.has(g)).length} also on Steam.`);
  if (games.size < MIN_CATALOG) throw new Error(`Only ${games.size} games from IGDB; not writing.`);

  // 3. Rank: store rating count once known (PlayStation's own popularity signal), then IGDB's.
  const stored = await storedGames();
  const known = await knownSteamApps();
  const score = (g: IgdbGame) => (stored.get(g.id)?.ratingCount ?? 0) * 10 + (g.total_rating_count ?? 0) * 50 + (g.hypes ?? 0);
  const ordered = [...games.values()].sort((a, b) => score(b) - score(a) || (b.first_release_date ?? 0) - (a.first_release_date ?? 0))
    .slice(0, MAX_GAMES);

  const taken = new Set([...stored.values()].map((g) => g.slug));
  const now = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];
  let deferred = 0, unchanged = 0;
  ordered.forEach((g, i) => {
    const before = stored.get(g.id);
    let slug = before?.slug;
    if (!slug) {
      const base = slugify(g.slug ?? g.name!) || String(g.id);
      slug = taken.has(base) ? `${base}-${g.id}` : base;
      taken.add(slug);
    }
    const apps = steam.get(g.id) ?? [];
    const fields = {
      concept_ids: concepts.get(g.id)!,
      title: g.name!.trim(),
      summary: g.summary?.trim() || null,
      genres: [...new Set((g.genres ?? []).map((x) => x.name).filter((x): x is string => !!x).map(genreName))],
      igdb_platforms: (g.platforms ?? []).map((p) => PS_PLATFORMS[p]).filter(Boolean).sort(),
      first_release: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10) : null,
      igdb_rating_count: g.total_rating_count ?? null,
      steam_app_id: apps.find((a) => known.has(a)) ?? (apps.length ? Math.min(...apps) : null),
    };
    const hash = createHash("sha1").update(JSON.stringify(fields)).digest("hex");
    const popularity = i + 1;
    if (before && before.hash === hash && !rankMoved(before.popularity, popularity)) { unchanged++; return; }
    if (rows.length >= MAX_CATALOG_WRITES) { deferred++; return; }
    // New rows start on IGDB's first concept; the store step moves on to the others if it's missing.
    rows.push({ igdb_id: g.id, slug, concept_id: before?.conceptId ?? fields.concept_ids[0], ...fields,
      popularity, catalog_hash: hash, catalog_at: now });
  });

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db().from("playstation_games").upsert(rows.slice(i, i + 500), { onConflict: "igdb_id" });
    if (error) throw new Error(`playstation_games write: ${error.message}`);
    await sleep(500);
  }
  const fresh = rows.filter((r) => !stored.has(r.igdb_id as number)).length;
  console.log(`Catalog: tracking the top ${ordered.length} of ${games.size} games, ${fresh} new and ${rows.length - fresh} changed written, ${deferred} deferred to the next run, ${unchanged} unchanged.`);
  console.log(`Top 10: ${ordered.slice(0, 10).map((g) => g.name).join(" · ")}`);
}

// ─── Store pages ─────────────────────────────────────────────────────────────

interface Due {
  igdb_id: number;
  concept_id: string;
  concept_ids: string[];
  popularity: number | null;
  store_hash: string | null;
  fail_count: number;
}

/** When to look at a game again: popular games daily, the rest every few days; right after a sale ends. */
function nextCheck(g: Due, data: PsStoreData | null, now: number): string {
  const day = 86_400_000;
  const rank = g.popularity ?? 1e9;
  let wait = !data ? 30 * day : rank <= 1500 ? day : rank <= 5000 ? 3 * day : 7 * day;
  if (data?.discountEndsAt) wait = Math.min(wait, Math.max(Date.parse(data.discountEndsAt) + 30 * 60_000 - now, 3_600_000));
  wait *= 0.9 + Math.random() * 0.2;   // spread checks out over the day
  return new Date(now + wait).toISOString();
}

type Page = { status: "ok"; html: string } | { status: "missing" } | { status: "error"; detail: string };

async function fetchConcept(id: string): Promise<Page> {
  try {
    const res = await fetch(`${STORE_URL}/${id}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml", "Accept-Language": "es-ES,es;q=0.9,en;q=0.8" },
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status === 404) return { status: "missing" };
    if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };
    return { status: "ok", html: await res.text() };
  } catch (err) {
    return { status: "error", detail: String(err).slice(0, 120) };
  }
}

function storeRow(g: Due, conceptId: string, data: PsStoreData | null) {
  const fields = data ? {
    product_id: data.productId, np_title_id: data.npTitleId, store_name: data.storeName,
    classification: data.classification, platforms: data.platforms, release_date: data.releaseDate,
    publisher: data.publisher, sales_status: data.salesStatus, price: data.price, regular_price: data.regularPrice,
    discount_pct: data.discountPct, discount_ends_at: data.discountEndsAt, lowest_30d: data.lowest30d,
    currency: data.currency, is_free: data.isFree, plus_price: data.plusPrice, plus_tier: data.plusTier,
    star_rating: data.starRating, rating_count: data.ratingCount, image_wide: data.images.wide,
    image_hero: data.images.hero, image_square: data.images.square, image_portrait: data.images.portrait,
    image_logo: data.images.logo, screenshots: data.screenshots,
  } : { sales_status: "missing" };
  // Ratings drift by a few every day: round them in the hash so they alone don't cause a rewrite.
  const hashed = data ? { ...fields, star_rating: data.starRating?.toFixed(1), rating_count: Math.round(Math.log2((data.ratingCount ?? 0) + 1)) } : fields;
  const store_hash = createHash("sha1").update(JSON.stringify({ conceptId, ...hashed })).digest("hex");
  return { igdb_id: g.igdb_id, concept_id: conceptId, ...fields, store_hash };
}

async function importStore(): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data, error } = await db().from("playstation_games")
    .select("igdb_id, concept_id, concept_ids, popularity, store_hash, fail_count")
    .or(`next_check_at.is.null,next_check_at.lte.${nowIso}`)
    .order("next_check_at", { ascending: true, nullsFirst: true }).order("popularity")
    .limit(STORE_PAGES);
  if (error) throw new Error(`playstation_games due: ${error.message}`);
  const due = (data ?? []) as Due[];
  console.log(`Store: ${due.length} games due (max ${STORE_PAGES} per run).`);

  const pending: Record<string, unknown>[] = [];
  const statuses = new Map<string, number>();
  let changed = 0, failsInARow = 0, checked = 0, loaded = 0, parsed = 0;
  const flush = async () => {
    if (!pending.length) return;
    const { data: n, error: rpcError } = await db().rpc("apply_playstation_store", { rows: pending.splice(0) });
    if (rpcError) throw new Error(`apply_playstation_store: ${rpcError.message}`);
    changed += Number(n ?? 0);
  };

  for (const g of due) {
    // Try the stored concept first, then IGDB's other ids for the game (regional duplicates).
    const candidates = [g.concept_id, ...g.concept_ids.filter((c) => c !== g.concept_id)];
    let result: { conceptId: string; data: PsStoreData | null } | null = null;
    let error: string | null = null;
    for (const conceptId of candidates) {
      const page = await fetchConcept(conceptId);
      await sleep(STORE_DELAY_MS);
      if (page.status === "error") { error = page.detail; break; }
      const data = page.status === "ok" ? parseConceptPage(page.html, conceptId) : null;
      if (page.status === "ok") loaded++;
      if (data) parsed++;
      result = { conceptId, data };
      if (data) break;
    }
    // Pages load but none parse: the store's page layout changed. Stop before marking games missing.
    if (loaded >= 30 && parsed === 0) {
      await flush();
      throw new Error(`${loaded} store pages loaded but none could be read; the page layout may have changed. Check scripts/lib/playstation-page.mts.`);
    }
    const now = Date.now();
    checked++;

    if (error) {
      statuses.set("error", (statuses.get("error") ?? 0) + 1);
      if (++failsInARow >= MAX_FAILS_IN_A_ROW) {
        await flush();
        throw new Error(`${failsInARow} store pages failed in a row (last: ${error}); stopping so the store isn't hammered.`);
      }
      // Keep the stored data, retry later (sooner if it keeps failing, but never more than daily).
      pending.push({ igdb_id: g.igdb_id, store_hash: g.store_hash, checked_at: new Date(now).toISOString(),
        next_check_at: new Date(now + Math.min(g.fail_count + 1, 7) * 6 * 3_600_000).toISOString(), fail_count: g.fail_count + 1 });
    } else {
      failsInARow = 0;
      const data = result!.data;
      const status = data?.salesStatus ?? "missing";
      statuses.set(status, (statuses.get(status) ?? 0) + 1);
      pending.push({ ...storeRow(g, result!.conceptId, data), checked_at: new Date(now).toISOString(),
        next_check_at: nextCheck(g, data, now), fail_count: 0 });
    }
    if (pending.length >= STORE_BATCH) await flush();
    if (checked % 100 === 0) console.log(`Store: ${checked}/${due.length} checked, ${changed} changed so far.`);
  }
  await flush();
  console.log(`Store: ${checked} checked, ${changed} changed. Status: ${[...statuses].map(([k, v]) => `${k}(${v})`).join(", ") || "-"}`);
}

// ─── Entry ───────────────────────────────────────────────────────────────────

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const [cmd = "run", ...args] = process.argv.slice(2);
if (cmd === "parse") {
  const [file, id = file?.match(/(\d+)\D*$/)?.[1] ?? ""] = args;
  console.log(JSON.stringify(parseConceptPage(readFileSync(file, "utf8"), id), null, 2));
  process.exit(0);
}
switch (cmd) {
  case "run":
    await importCatalog();
    await importStore();
    break;
  case "catalog":
    await importCatalog();
    break;
  case "store":
    await importStore();
    break;
  default:
    console.error("Usage: import-playstation.mts catalog | store | run | parse <file.html> [conceptId]");
    process.exit(1);
}
const { data: sizeMb } = await db().rpc("db_size_mb");
console.log(`Database: ${sizeMb} MB.`);
