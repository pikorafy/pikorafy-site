// Read-only probe of IGDB (Twitch): do the keys work, how many PS4/PS5 games are there,
// and which store ids (Steam, Microsoft, PlayStation Store…) are linked to them?
// Writes nothing. Never prints the keys or the token.
//
//   IGDB_CLIENT_ID=… IGDB_CLIENT_SECRET=… node scripts/probe-igdb.mts

const ID = process.env.IGDB_CLIENT_ID?.trim() ?? "";
const SECRET = process.env.IGDB_CLIENT_SECRET?.trim() ?? "";
const mask = (s: string) => [ID, SECRET].filter(Boolean).reduce((out, k) => out.replaceAll(k, "***"), s);

if (!ID || !SECRET) {
  console.log(`Missing secrets: IGDB_CLIENT_ID ${ID ? "ok" : "missing"}, IGDB_CLIENT_SECRET ${SECRET ? "ok" : "missing"}`);
  process.exit(1);
}

// 1. App access token (client credentials).
const tokenRes = await fetch(
  `https://id.twitch.tv/oauth2/token?client_id=${ID}&client_secret=${SECRET}&grant_type=client_credentials`,
  { method: "POST" },
);
const tokenBody = (await tokenRes.json()) as { access_token?: string; expires_in?: number; message?: string };
console.log(`Token: HTTP ${tokenRes.status}${tokenBody.expires_in ? `, valid ${Math.round(tokenBody.expires_in / 86400)} days` : ""}${tokenBody.message ? `, ${mask(tokenBody.message)}` : ""}`);
if (!tokenBody.access_token) process.exit(1);
const TOKEN = tokenBody.access_token;

async function igdb(endpoint: string, query: string): Promise<unknown> {
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: { "Client-ID": ID, Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    body: query,
  });
  const text = await res.text();
  if (!res.ok) {
    console.log(`  ${endpoint}: HTTP ${res.status} ${mask(text).slice(0, 300)}`);
    return null;
  }
  return JSON.parse(text);
}

// 2. Platform ids for PS4 / PS5.
const platforms = (await igdb("platforms", `fields id,name,abbreviation; where abbreviation = ("PS4","PS5"); limit 10;`)) as
  { id: number; name: string; abbreviation: string }[] | null;
console.log(`Platforms: ${JSON.stringify(platforms)}`);
const ids = (platforms ?? []).map((p) => p.id);

// 3. How many games per platform (main games only, no DLC / bundles).
for (const p of platforms ?? []) {
  const count = (await igdb("games/count", `where platforms = (${p.id}) & game_type = 0;`)) as { count?: number } | null;
  const countAll = (await igdb("games/count", `where platforms = (${p.id});`)) as { count?: number } | null;
  console.log(`${p.abbreviation}: ${count?.count ?? "?"} main games (${countAll?.count ?? "?"} incl. DLC, bundles…)`);
}

// 3b. Coverage. A condition on external_games.* matches one link at a time, so "Steam & PS Store"
// can't be asked in one count. Instead read every PlayStation Store link, then look up which of
// those games also have a Steam link (IGDB allows 4 requests/second; 500 rows per request).
const psGames = new Map<number, string>();   // IGDB game id → PS Store concept id
for (let last = 0; ;) {
  const rows = (await igdb("external_games", `fields game,uid; where external_game_source = 36 & id > ${last}; sort id asc; limit 500;`)) as
    { id: number; game?: number; uid?: string }[] | null;
  if (!rows?.length) break;
  for (const r of rows) if (r.game && r.uid) psGames.set(r.game, r.uid);
  last = rows[rows.length - 1].id;
  await new Promise((r) => setTimeout(r, 260));
}
const steamOf = new Map<number, string>();   // IGDB game id → Steam app id
const gameIds = [...psGames.keys()];
for (let i = 0; i < gameIds.length; i += 500) {
  const chunk = gameIds.slice(i, i + 500);
  const rows = (await igdb("external_games", `fields game,uid; where external_game_source = 1 & game = (${chunk.join(",")}); limit 500;`)) as
    { game?: number; uid?: string }[] | null;
  for (const r of rows ?? []) if (r.game && r.uid && !steamOf.has(r.game)) steamOf.set(r.game, r.uid);
  await new Promise((r) => setTimeout(r, 260));
}
console.log(`PlayStation Store links: ${psGames.size} games; ${steamOf.size} of them also on Steam, ${psGames.size - steamOf.size} without a Steam link`);
console.log(`  e.g. ${[...steamOf].slice(0, 5).map(([g, app]) => `game ${g}: concept ${psGames.get(g)} ↔ Steam ${app}`).join("; ")}`);
const both = (await igdb("games/count", `where external_games.external_game_source = [1,36];`)) as { count?: number } | null;
console.log(`Cross-check (games whose links include both sources): ${both?.count ?? "?"}`);

// 4. External store ids: which sources exist, and a few popular PS5 games with their links.
const sources = await igdb("external_game_sources", `fields id,name; limit 100;`);
console.log(`External sources: ${JSON.stringify(sources)}`);
if (ids.length) {
  const games = (await igdb("games", `fields name,first_release_date,platforms,total_rating_count,
    external_games.external_game_source,external_games.uid,external_games.url,external_games.platform;
    where platforms = (${ids.join(",")}) & game_type = 0 & total_rating_count > 200;
    sort total_rating_count desc; limit 5;`)) as unknown[] | null;
  for (const g of games ?? []) console.log(`Game: ${JSON.stringify(g).slice(0, 1500)}`);
}
