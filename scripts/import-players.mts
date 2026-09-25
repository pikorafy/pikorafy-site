// Steam concurrent players → Supabase, for every ranked game. Run hourly.
//
// Usage (Node ≥ 23.6 runs .mts directly; on Node 22 add --experimental-strip-types):
//   node scripts/import-players.mts
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// GetNumberOfCurrentPlayers is a public Web API endpoint (no key). It has a far
// higher limit than the store API (~100k calls/day); ~2k calls/hour is well inside it.

import { createClient } from "@supabase/supabase-js";

const CONCURRENCY = 8;

const supabase = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

async function currentPlayers(appId: number): Promise<number | null> {
  const res = await fetch(
    `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`,
    { headers: { "User-Agent": "PikorafyBot/1.0 (+https://pikorafy.com)" } },
  );
  if (res.status === 404) return null;             // no stats for this app
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as { response?: { result?: number; player_count?: number } };
  return body.response?.result === 1 && typeof body.response.player_count === "number"
    ? body.response.player_count
    : null;
}

async function main() {
  // PostgREST returns at most 1000 rows per request: page through the whole catalog.
  const ids: number[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("games")
      .select("steam_app_id")
      .eq("type", "game")
      .not("popularity_rank", "is", null)
      .order("popularity_rank", { ascending: true })
      .order("steam_app_id", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(`games select: ${error.message}`);
    ids.push(...(data ?? []).map((r) => r.steam_app_id as number));
    if (!data || data.length < 1000) break;
  }
  const hour = new Date();
  hour.setUTCMinutes(0, 0, 0);
  const at = hour.toISOString();
  const now = new Date().toISOString();

  const rows: { steam_app_id: number; at: string; players: number }[] = [];
  let failed = 0;

  // Small worker pool over the id list.
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < ids.length) {
      const appId = ids[next++];
      try {
        const players = await currentPlayers(appId);
        if (players !== null) rows.push({ steam_app_id: appId, at, players });
      } catch {
        failed++;
      }
    }
  }));

  for (let i = 0; i < rows.length; i += 500) {
    const { error: e } = await supabase.from("player_counts").upsert(rows.slice(i, i + 500));
    if (e) throw new Error(`player_counts upsert: ${e.message}`);
  }

  // Update "playing now" on each game in parallel batches.
  for (let i = 0; i < rows.length; i += 50) {
    await Promise.all(rows.slice(i, i + 50).map(async (r) => {
      const { error: e } = await supabase
        .from("games")
        .update({ current_players: r.players, current_players_at: now })
        .eq("steam_app_id", r.steam_app_id);
      if (e) throw new Error(`games update ${r.steam_app_id}: ${e.message}`);
    }));
  }

  const { error: rpcError } = await supabase.rpc("refresh_player_stats");
  if (rpcError) throw new Error(`refresh_player_stats: ${rpcError.message}`);

  console.log(`Players: ${rows.length}/${ids.length} games recorded, ${failed} failed, ${ids.length - rows.length - failed} without stats.`);
  // Fail loudly if Steam blocked us wholesale, so the workflow shows red.
  if (ids.length > 0 && failed > ids.length / 2) process.exit(1);
}

function required(name: string): string {
  // Trim: secrets pasted into GitHub often pick up a trailing space or newline.
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

await main();
