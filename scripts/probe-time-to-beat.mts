// Read-only probe: how many of our most popular games have IGDB "time to beat" data
// (main story / main + extras / 100%)? Maps our Steam app ids to IGDB games via
// external_games, then reads game_time_to_beats. Writes nothing. Never prints the keys.
//
//   node scripts/probe-time-to-beat.mts [top=1000]
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET.

import { createClient } from "@supabase/supabase-js";

const TOP = Number(process.argv[2]) || 1000;
const STEAM_SOURCE = 1;
const BATCH = 500;
const BUCKETS = [100, 250, 500, 1000, 2500, 5000];

const required = (name: string) => {
  const v = process.env[name]?.trim();
  if (!v) { console.log(`Missing secret: ${name}`); process.exit(1); }
  return v;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Our top games (by popularity rank) ──────────────────────────────────────

const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const games: { steam_app_id: number; name: string; popularity_rank: number }[] = [];
for (let from = 0; from < TOP; from += 1000) {
  const { data, error } = await db.from("games").select("steam_app_id,name,popularity_rank")
    .eq("type", "game").not("popularity_rank", "is", null)
    .order("popularity_rank", { ascending: true }).range(from, Math.min(from + 1000, TOP) - 1);
  if (error) { console.log(`Supabase: ${error.message}`); process.exit(1); }
  games.push(...(data ?? []));
  if ((data ?? []).length < 1000) break;
}
console.log(`Our top ${games.length} games by popularity rank.`);

// ─── IGDB ────────────────────────────────────────────────────────────────────

const ID = required("IGDB_CLIENT_ID");
const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${ID}&client_secret=${required("IGDB_CLIENT_SECRET")}&grant_type=client_credentials`, { method: "POST" });
const TOKEN = ((await tokenRes.json()) as { access_token?: string }).access_token;
if (!TOKEN) { console.log(`IGDB token: HTTP ${tokenRes.status}`); process.exit(1); }

async function igdb<T>(endpoint: string, query: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await sleep(260);
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: { "Client-ID": ID, Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      body: query,
    });
    if (res.ok) return (await res.json()) as T;
    if (attempt >= 3 || (res.status !== 429 && res.status < 500)) throw new Error(`IGDB ${endpoint}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    await sleep(2_000 * 2 ** attempt);
  }
}

// Steam app id → IGDB game id.
const igdbBySteam = new Map<number, number>();
for (let i = 0; i < games.length; i += BATCH) {
  const uids = games.slice(i, i + BATCH).map((g) => `"${g.steam_app_id}"`).join(",");
  const rows = await igdb<{ game?: number; uid?: string }[]>("external_games",
    `fields game,uid; where external_game_source = ${STEAM_SOURCE} & uid = (${uids}); limit ${BATCH};`);
  for (const r of rows) if (r.game && r.uid && !igdbBySteam.has(Number(r.uid))) igdbBySteam.set(Number(r.uid), r.game);
}

// Time to beat, in seconds; count = how many IGDB users submitted a time.
interface Ttb { game_id: number; hastily?: number; normally?: number; completely?: number; count?: number }
const ttbByGame = new Map<number, Ttb>();
const igdbIds = [...new Set(igdbBySteam.values())];
for (let i = 0; i < igdbIds.length; i += BATCH) {
  const rows = await igdb<Ttb[]>("game_time_to_beats",
    `fields game_id,hastily,normally,completely,count; where game_id = (${igdbIds.slice(i, i + BATCH).join(",")}); limit ${BATCH};`);
  for (const r of rows) ttbByGame.set(r.game_id, r);
}

// ─── Report ──────────────────────────────────────────────────────────────────

const h = (s?: number) => (s ? `${Math.round((s / 3600) * 2) / 2}h` : "–");
const pct = (n: number, d: number) => `${d ? Math.round((n / d) * 100) : 0}%`;
const rows = games.map((g) => {
  const igdbId = igdbBySteam.get(g.steam_app_id);
  return { ...g, igdbId, ttb: igdbId ? ttbByGame.get(igdbId) : undefined };
});

console.log(`\nMatched to IGDB: ${rows.filter((r) => r.igdbId).length} / ${rows.length}`);
console.log("\nCoverage by rank (any time / main story / 100% / 5+ submissions):");
for (const top of [...BUCKETS.filter((b) => b < rows.length), rows.length]) {
  const slice = rows.slice(0, top);
  const any = slice.filter((r) => r.ttb).length;
  const main = slice.filter((r) => r.ttb?.hastily || r.ttb?.normally).length;
  const full = slice.filter((r) => r.ttb?.completely).length;
  const solid = slice.filter((r) => (r.ttb?.count ?? 0) >= 5).length;
  console.log(`  top ${String(slice.length).padStart(5)}: ${pct(any, slice.length).padStart(4)} any · ${pct(main, slice.length).padStart(4)} main · ${pct(full, slice.length).padStart(4)} 100% · ${pct(solid, slice.length).padStart(4)} 5+ submissions`);
}

const counts = rows.map((r) => r.ttb?.count ?? 0).filter(Boolean).sort((a, b) => a - b);
if (counts.length) console.log(`\nSubmissions per game with data: median ${counts[Math.floor(counts.length / 2)]}, max ${counts.at(-1)}`);

console.log("\nTop 40 (rank · name · main / main+extras / 100% · submissions):");
for (const r of rows.slice(0, 40)) {
  console.log(`  ${String(r.popularity_rank).padStart(5)} · ${r.name.slice(0, 40).padEnd(40)} · ${r.igdbId ? (r.ttb ? `${h(r.ttb.hastily)} / ${h(r.ttb.normally)} / ${h(r.ttb.completely)} · ${r.ttb.count ?? 0}` : "no time data") : "not matched"}`);
}

console.log("\nMissing among the top 200:");
console.log("  " + rows.slice(0, 200).filter((r) => !r.ttb).map((r) => `${r.name}${r.igdbId ? "" : " (not matched)"}`).join(" · "));
