// Release calendar (IGDB) → Supabase (`releases`).
//
//   node scripts/import-releases.mts          import (daily)
//   node scripts/import-releases.mts dry      fetch and log what would be written, write nothing
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET.
//
// Reads every release date from ~6 months ago to a year ahead on PC, PlayStation, Xbox and
// Switch, keeps one date per game (European or worldwide first, the earliest day wins) and
// the most anticipated games per month (IGDB hypes, then ratings). Writes only rows that
// changed and removes games that dropped out. Calendar games on Steam are queued for the
// Steam import so they get our own product page (queue_release_games).

import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DAYS_BACK = 183;
const DAYS_AHEAD = 365;
const PER_MONTH = 200;                 // games kept per calendar month
const MIN_RELEASES = 500;              // fewer than this in the window = something broke; don't write
const IGDB_DELAY_MS = 260;             // 4 requests / second
const PLATFORM_NAMES: Record<string, string> = {
  "PC (Microsoft Windows)": "PC",
  "PlayStation 5": "PS5",
  "PlayStation 4": "PS4",
  "Xbox Series X|S": "Xbox Series",
  "Xbox One": "Xbox One",
  "Nintendo Switch 2": "Switch 2",
  "Nintendo Switch": "Switch",
};
const GAME_TYPES = [0, 4, 8, 9, 10, 11];   // main game, standalone expansion, remake, remaster, expanded, port
const PREFERRED_REGIONS = [1, 8];           // IGDB release_region: Europe, worldwide
const STEAM_SOURCE = 1;
const dry = process.argv[2] === "dry";

let client: SupabaseClient | null = null;
const db = () =>
  (client ??= createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } }));

// ─── IGDB ────────────────────────────────────────────────────────────────────

let token: string | null = null;

async function igdb<T>(endpoint: string, query: string): Promise<T> {
  const id = required("IGDB_CLIENT_ID");
  if (!token) {
    const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${required("IGDB_CLIENT_SECRET")}&grant_type=client_credentials`, { method: "POST" });
    const body = (await res.json()) as { access_token?: string };
    if (!body.access_token) throw new Error(`IGDB token: HTTP ${res.status}`);
    token = body.access_token;
  }
  for (let attempt = 0; ; attempt++) {
    await sleep(IGDB_DELAY_MS);
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: { "Client-ID": id, Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: query,
    });
    if (res.ok) return (await res.json()) as T;
    if (attempt >= 3 || (res.status !== 429 && res.status < 500)) throw new Error(`IGDB ${endpoint}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    await sleep(2_000 * 2 ** attempt);
  }
}

interface ReleaseDate {
  id: number;
  game?: number;
  date?: number;              // unix seconds
  y?: number;
  m?: number;
  platform?: number;
  release_region?: number;
  date_format?: number;
}

interface IgdbGame {
  id: number;
  name?: string;
  slug?: string;
  game_type?: number;
  hypes?: number;
  total_rating_count?: number;
  cover?: { image_id?: string };
  artworks?: { image_id?: string }[];
  screenshots?: { image_id?: string }[];
}

type Precision = "day" | "month" | "quarter" | "year";

/** IGDB date formats ("YYYYMMMMDD", "YYYYMMMM", "YYYYQ3", "YYYY", "TBD") → our precision. */
function precisionOf(format: string | undefined): Precision | null {
  if (!format) return null;
  if (/DD$/.test(format)) return "day";
  if (/Q\d$/.test(format)) return "quarter";
  if (/MMMM$/.test(format)) return "month";
  if (/^YYYY$/.test(format)) return "year";
  return null;   // TBD
}

const PRECISION_RANK: Record<Precision, number> = { day: 0, month: 1, quarter: 2, year: 3 };

function periodStart(r: ReleaseDate, precision: Precision): string {
  const d = new Date((r.date ?? 0) * 1000);
  const y = r.y ?? d.getUTCFullYear();
  const m = r.m ?? d.getUTCMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (precision === "day") return d.toISOString().slice(0, 10);
  if (precision === "month") return `${y}-${pad(m)}-01`;
  if (precision === "quarter") return `${y}-${pad(Math.floor((m - 1) / 3) * 3 + 1)}-01`;
  return `${y}-01-01`;
}

// ─── Import ──────────────────────────────────────────────────────────────────

async function main() {
  // Platform and date-format ids, looked up by name so a renamed id can't silently break things.
  const platforms = await igdb<{ id: number; name: string }[]>("platforms",
    `fields id,name; where name = (${Object.keys(PLATFORM_NAMES).map((n) => `"${n}"`).join(",")}); limit 20;`);
  const platformName = new Map(platforms.map((p) => [p.id, PLATFORM_NAMES[p.name]]));
  console.log(`Platforms: ${platforms.map((p) => `${PLATFORM_NAMES[p.name]}=${p.id}`).join(", ")}`);
  if (platforms.length < 5) throw new Error("Expected at least 5 IGDB platforms; check PLATFORM_NAMES.");
  const formats = await igdb<{ id: number; format?: string }[]>("date_formats", "fields id,format; limit 50;");
  const formatOf = new Map(formats.map((f) => [f.id, f.format]));
  console.log(`Date formats: ${formats.map((f) => `${f.id}=${f.format}`).join(", ")}`);

  // 1. Every release date in the window on those platforms.
  const now = Date.now();
  const from = Math.floor((now - DAYS_BACK * 86_400_000) / 1000);
  const to = Math.floor((now + DAYS_AHEAD * 86_400_000) / 1000);
  const dates: ReleaseDate[] = [];
  for (let last = 0; ;) {
    const page = await igdb<ReleaseDate[]>("release_dates",
      `fields game,date,y,m,platform,release_region,date_format; where platform = (${[...platformName.keys()].join(",")}) & date >= ${from} & date < ${to} & id > ${last}; sort id asc; limit 500;`);
    if (!page.length) break;
    dates.push(...page);
    last = page[page.length - 1].id;
  }
  console.log(`Release dates in the window: ${dates.length}`);
  if (dates.length < MIN_RELEASES) throw new Error(`Only ${dates.length} release dates; not writing.`);

  // 2. One date per game: preferred regions first, then the most precise, then the earliest.
  const perGame = new Map<number, { date: string; precision: Precision; preferred: boolean; platforms: Set<string> }>();
  for (const r of dates) {
    const precision = precisionOf(formatOf.get(r.date_format ?? -1));
    const platform = platformName.get(r.platform ?? -1);
    if (!r.game || !precision || !platform || !r.date) continue;
    const date = periodStart(r, precision);
    const preferred = PREFERRED_REGIONS.includes(r.release_region ?? -1);
    const cur = perGame.get(r.game);
    if (!cur) {
      perGame.set(r.game, { date, precision, preferred, platforms: new Set([platform]) });
      continue;
    }
    cur.platforms.add(platform);
    const better = (preferred && !cur.preferred)
      || (preferred === cur.preferred && (PRECISION_RANK[precision] < PRECISION_RANK[cur.precision]
        || (precision === cur.precision && date < cur.date)));
    if (better) Object.assign(cur, { date, precision, preferred });
  }
  console.log(`Games with a release date: ${perGame.size}`);

  // 3. Game details (name, type, hype, art) for every candidate.
  const games = new Map<number, IgdbGame>();
  const ids = [...perGame.keys()];
  for (let i = 0; i < ids.length; i += 500) {
    for (const g of await igdb<IgdbGame[]>("games",
      `fields name,slug,game_type,hypes,total_rating_count,cover.image_id,artworks.image_id,screenshots.image_id; where id = (${ids.slice(i, i + 500).join(",")}); limit 500;`)) {
      if (g.name && GAME_TYPES.includes(g.game_type ?? 0)) games.set(g.id, g);
    }
  }
  const score = (g: IgdbGame) => (g.hypes ?? 0) * 3 + (g.total_rating_count ?? 0);

  // 4. The most anticipated per month (the grid shows one cover per day; a month has room).
  const byMonth = new Map<string, IgdbGame[]>();
  for (const g of games.values()) {
    const month = perGame.get(g.id)!.date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), g]);
  }
  const kept: IgdbGame[] = [];
  for (const [, list] of [...byMonth].sort()) kept.push(...list.sort((a, b) => score(b) - score(a)).slice(0, PER_MONTH));
  console.log(`Kept ${kept.length} of ${games.size} games (top ${PER_MONTH} per month). Per month: ${[...byMonth].sort().map(([m, l]) => `${m}:${Math.min(l.length, PER_MONTH)}/${l.length}`).join(" ")}`);

  // 5. Steam app ids (to link our price pages and use Steam's wide header art).
  const steam = new Map<number, number>();
  const keptIds = kept.map((g) => g.id);
  for (let i = 0; i < keptIds.length; i += 500) {
    for (const r of await igdb<{ game?: number; uid?: string }[]>("external_games",
      `fields game,uid; where external_game_source = ${STEAM_SOURCE} & game = (${keptIds.slice(i, i + 500).join(",")}); limit 500;`)) {
      const app = Number(r.uid);
      if (r.game && Number.isInteger(app) && app > 0 && !steam.has(r.game)) steam.set(r.game, app);
    }
  }

  const rows = kept.map((g) => {
    const d = perGame.get(g.id)!;
    const fields = {
      slug: g.slug ?? String(g.id),
      title: g.name!.trim(),
      release_date: d.date,
      precision: d.precision,
      platforms: [...d.platforms].sort((a, b) => Object.values(PLATFORM_NAMES).indexOf(a) - Object.values(PLATFORM_NAMES).indexOf(b)),
      hypes: g.hypes ?? 0,
      rating_count: g.total_rating_count ?? 0,
      // Rounded so small daily drift in follows doesn't rewrite the row.
      score: Math.round(score(g) / 5) * 5,
      cover_id: g.cover?.image_id ?? null,
      art_id: g.artworks?.find((a) => a.image_id)?.image_id ?? g.screenshots?.find((s) => s.image_id)?.image_id ?? null,
      steam_app_id: steam.get(g.id) ?? null,
    };
    return { igdb_id: g.id, ...fields, content_hash: createHash("sha1").update(JSON.stringify(fields)).digest("hex") };
  });
  const withArt = rows.filter((r) => r.art_id).length;
  console.log(`Wide art from IGDB for ${withArt} of ${rows.length}; Steam links for ${rows.filter((r) => r.steam_app_id).length}.`);
  console.log(`Top 10: ${[...rows].sort((a, b) => b.score - a.score).slice(0, 10).map((r) => `${r.title} (${r.release_date} ${r.precision}, ${r.platforms.join("/")})`).join(" · ")}`);

  if (dry) {
    console.log("Dry run: nothing written.");
    return;
  }

  // 6. Write changes only; drop games no longer in the calendar.
  const stored = new Map<number, string | null>();
  for (let f = 0; ; f += 1000) {
    const { data, error } = await db().from("releases").select("igdb_id, content_hash").order("igdb_id").range(f, f + 999);
    if (error) throw new Error(`releases read: ${error.message}`);
    for (const r of data ?? []) stored.set(r.igdb_id as number, r.content_hash as string | null);
    if (!data || data.length < 1000) break;
  }
  const changed = rows.filter((r) => stored.get(r.igdb_id) !== r.content_hash);
  for (let i = 0; i < changed.length; i += 500) {
    const { error } = await db().from("releases").upsert(changed.slice(i, i + 500), { onConflict: "igdb_id" });
    if (error) throw new Error(`releases write: ${error.message}`);
    await sleep(300);
  }
  const keep = new Set(rows.map((r) => r.igdb_id));
  const gone = [...stored.keys()].filter((id) => !keep.has(id));
  for (let i = 0; i < gone.length; i += 500) {
    const { error } = await db().from("releases").delete().in("igdb_id", gone.slice(i, i + 500));
    if (error) throw new Error(`releases delete: ${error.message}`);
  }
  console.log(`Releases: ${rows.length} in the calendar, ${changed.length} written, ${gone.length} removed, ${rows.length - changed.length} unchanged.`);

  // Their Steam apps become catalog games (our own product pages), kept while recent/upcoming.
  const { data: queued, error: queueError } = await db().rpc("queue_release_games");
  if (queueError) throw new Error(`queue_release_games: ${queueError.message}`);
  console.log(`Queued ${queued} calendar games for the Steam import.`);
}

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

await main();
