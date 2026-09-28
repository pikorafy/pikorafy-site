// Read-only probe: how many of our most popular games have IGDB "time to beat" data
// (main story / main + extras / 100%), before and after the checks in lib/time-to-beat.mts?
// Maps our Steam app ids to IGDB games via external_games, then reads game_time_to_beats.
// Writes nothing. Never prints the keys.
//
//   node scripts/probe-time-to-beat.mts [top=1000]
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET.

import { createClient } from "@supabase/supabase-js";
import { eligible, judge, type IgdbTimeToBeat, type Verdict } from "./lib/time-to-beat.mts";

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
const games: { steam_app_id: number; name: string; popularity_rank: number; is_free: boolean | null; categories: string[] | null; genres: string[] | null }[] = [];
for (let from = 0; from < TOP; from += 1000) {
  const { data, error } = await db.from("games").select("steam_app_id,name,popularity_rank,is_free,categories,genres")
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
type Ttb = IgdbTimeToBeat;
const ttbByGame = new Map<number, Ttb>();
const igdbIds = [...new Set(igdbBySteam.values())];
for (let i = 0; i < igdbIds.length; i += BATCH) {
  const rows = await igdb<Ttb[]>("game_time_to_beats",
    `fields game_id,hastily,normally,completely,count; where game_id = (${igdbIds.slice(i, i + BATCH).join(",")}); limit ${BATCH};`);
  for (const r of rows) ttbByGame.set(r.game_id, r);
}

// ─── Report ──────────────────────────────────────────────────────────────────

const h = (min?: number | null) => (min ? `${Math.round((min / 60) * 2) / 2}h` : "–");
const pct = (n: number, d: number) => `${d ? Math.round((n / d) * 100) : 0}%`;
const rows = games.map((g) => {
  const igdbId = igdbBySteam.get(g.steam_app_id);
  const raw = igdbId ? ttbByGame.get(igdbId) : undefined;
  const story = eligible(g);
  return { ...g, igdbId, raw, story, verdict: (story ? judge(raw) : { ok: false, reason: "not a story game" }) as Verdict };
});

console.log(`\nMatched to IGDB: ${rows.filter((r) => r.igdbId).length} / ${rows.length}`);
console.log(`Story games (see eligible()): ${rows.filter((r) => r.story).length} / ${rows.length}`);
console.log("\nShown after the checks, by rank (of all games · of story games · with 100% time):");
for (const top of [...BUCKETS.filter((b) => b < rows.length), rows.length]) {
  const slice = rows.slice(0, top);
  const shown = slice.filter((r) => r.verdict.ok);
  const story = slice.filter((r) => r.story).length;
  const full = shown.filter((r) => r.verdict.ok && r.verdict.ttb.full).length;
  console.log(`  top ${String(slice.length).padStart(5)}: ${pct(shown.length, slice.length).padStart(4)} of all · ${pct(shown.length, story).padStart(4)} of story games · ${pct(full, shown.length).padStart(4)} with 100%`);
}

const reasons = new Map<string, number>();
for (const r of rows) if (!r.verdict.ok) reasons.set(r.verdict.reason, (reasons.get(r.verdict.reason) ?? 0) + 1);
console.log("\nWhy not shown:");
for (const [reason, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)} · ${reason}`);

console.log("\nTop 50 (rank · name · shown: main / main+extras / 100% · submissions, or why not):");
for (const r of rows.slice(0, 50)) {
  const v = r.verdict;
  console.log(`  ${String(r.popularity_rank).padStart(5)} · ${r.name.slice(0, 40).padEnd(40)} · ${v.ok ? `${h(v.ttb.main)} / ${h(v.ttb.extras)} / ${h(v.ttb.full)} · ${v.ttb.count}` : v.reason}`);
}

console.log("\nStory games in the top 200 we would not show:");
console.log("  " + rows.slice(0, 200).filter((r) => r.story && !r.verdict.ok).map((r) => `${r.name} (${r.verdict.ok ? "" : r.verdict.reason})`).join(" · "));
