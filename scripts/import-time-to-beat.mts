// "How long to beat" (IGDB) → Supabase (`game_time_to_beat`).
//
//   node scripts/import-time-to-beat.mts        import (weekly)
//   node scripts/import-time-to-beat.mts dry    fetch and log what would change, write nothing
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET.
//
// Maps our story games (see eligible() in lib/time-to-beat.mts) to IGDB through their Steam app ids,
// reads IGDB's player-submitted times and keeps only those that pass the checks in
// lib/time-to-beat.mts. Writes only rows that changed and removes games that no longer pass.

import { createClient } from "@supabase/supabase-js";
import { eligible, judge, type IgdbTimeToBeat, type TimeToBeat } from "./lib/time-to-beat.mts";

const STEAM_SOURCE = 1;
const BATCH = 500;                 // IGDB rows per request
const IGDB_DELAY_MS = 260;         // 4 requests / second
const MIN_ROWS = 80;               // fewer than this passing = something broke; don't write (783 at 2,500 Steam games)
const MAX_SHRINK = 0.3;            // or losing more than 30% of what we have
const dry = process.argv[2] === "dry";

const required = (name: string) => {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

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

const chunks = <T,>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

// ─── Our story games ─────────────────────────────────────────────────────────

const steamIds: number[] = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from("games").select("steam_app_id,is_free,categories,genres")
    .eq("type", "game").order("steam_app_id").range(from, from + 999);
  if (error) throw new Error(`games: ${error.message}`);
  for (const g of data ?? []) if (eligible(g)) steamIds.push(g.steam_app_id);
  if ((data ?? []).length < 1000) break;
}
console.log(`Story games in the catalog: ${steamIds.length}`);

// Steam app id → IGDB game id (the first IGDB game linked to it).
const igdbBySteam = new Map<number, number>();
for (const batch of chunks(steamIds, BATCH)) {
  const rows = await igdb<{ game?: number; uid?: string }[]>("external_games",
    `fields game,uid; where external_game_source = ${STEAM_SOURCE} & uid = (${batch.map((id) => `"${id}"`).join(",")}); sort id asc; limit ${BATCH};`);
  for (const r of rows) if (r.game && r.uid && !igdbBySteam.has(Number(r.uid))) igdbBySteam.set(Number(r.uid), r.game);
}
console.log(`Matched to IGDB: ${igdbBySteam.size}`);

const igdbIds = [...new Set(igdbBySteam.values())];
const times = new Map<number, IgdbTimeToBeat>();
for (const batch of chunks(igdbIds, BATCH)) {
  const rows = await igdb<IgdbTimeToBeat[]>("game_time_to_beats",
    `fields game_id,hastily,normally,completely,count; where game_id = (${batch.join(",")}); limit ${BATCH};`);
  for (const r of rows) times.set(r.game_id, r);
}

interface Row { steam_app_id: number; igdb_id: number; igdb_slug: string | null; main_min: number; extras_min: number | null; full_min: number | null; submissions: number }
const passed: { steamId: number; igdbId: number; ttb: TimeToBeat }[] = [];
const reasons = new Map<string, number>();
for (const steamId of steamIds) {
  const igdbId = igdbBySteam.get(steamId);
  const v = igdbId ? judge(times.get(igdbId)) : ({ ok: false, reason: "not on IGDB" } as const);
  if (v.ok) passed.push({ steamId, igdbId: igdbId!, ttb: v.ttb });
  else reasons.set(v.reason, (reasons.get(v.reason) ?? 0) + 1);
}
console.log(`With times we show: ${passed.length}`);
for (const [reason, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  left out · ${reason}: ${n}`);

// IGDB slugs, for the "on IGDB" link.
const slugs = new Map<number, string>();
for (const batch of chunks([...new Set(passed.map((p) => p.igdbId))], BATCH)) {
  const rows = await igdb<{ id: number; slug?: string }[]>("games", `fields slug; where id = (${batch.join(",")}); limit ${BATCH};`);
  for (const r of rows) if (r.slug) slugs.set(r.id, r.slug);
}

const next: Row[] = passed.map(({ steamId, igdbId, ttb }) => ({
  steam_app_id: steamId, igdb_id: igdbId, igdb_slug: slugs.get(igdbId) ?? null,
  main_min: ttb.main, extras_min: ttb.extras, full_min: ttb.full, submissions: ttb.count,
}));

// ─── Write only what changed ─────────────────────────────────────────────────

const current = new Map<number, Row>();
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from("game_time_to_beat")
    .select("steam_app_id,igdb_id,igdb_slug,main_min,extras_min,full_min,submissions").order("steam_app_id").range(from, from + 999);
  if (error) throw new Error(`game_time_to_beat: ${error.message}`);
  for (const r of (data ?? []) as Row[]) current.set(r.steam_app_id, r);
  if ((data ?? []).length < 1000) break;
}

const same = (a: Row, b: Row) =>
  a.igdb_id === b.igdb_id && a.igdb_slug === b.igdb_slug && a.main_min === b.main_min &&
  a.extras_min === b.extras_min && a.full_min === b.full_min && a.submissions === b.submissions;
const changed = next.filter((r) => { const c = current.get(r.steam_app_id); return !c || !same(c, r); });
const keep = new Set(next.map((r) => r.steam_app_id));
const removed = [...current.keys()].filter((id) => !keep.has(id));
console.log(`\nChanged or new: ${changed.length} · no longer shown: ${removed.length} · unchanged: ${next.length - changed.length}`);

if (dry) {
  for (const r of changed.slice(0, 20)) console.log(`  ${r.steam_app_id} · ${r.igdb_slug} · ${r.main_min} / ${r.extras_min ?? "–"} / ${r.full_min ?? "–"} min · ${r.submissions}`);
  console.log("Dry run: nothing written.");
  process.exit(0);
}
if (next.length < MIN_ROWS) throw new Error(`Only ${next.length} games passed (expected ${MIN_ROWS}+); not writing.`);
if (removed.length > current.size * MAX_SHRINK) throw new Error(`${removed.length} of ${current.size} stored games would be removed; not writing.`);

for (const batch of chunks(changed, BATCH)) {
  const { error } = await db.from("game_time_to_beat").upsert(batch, { onConflict: "steam_app_id" });
  if (error) throw new Error(`upsert: ${error.message}`);
}
for (const batch of chunks(removed, BATCH)) {
  const { error } = await db.from("game_time_to_beat").delete().in("steam_app_id", batch);
  if (error) throw new Error(`delete: ${error.message}`);
}
console.log("Done.");
