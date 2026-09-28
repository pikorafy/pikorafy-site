/* eslint-disable @typescript-eslint/no-explicit-any -- probe script: raw IGDB response shapes */
// Read-only probe: can IGDB be the shared identity of a game across our four catalogs?
// Links each store's games to an IGDB game (Steam by app id, Xbox by Microsoft Store
// product id, PlayStation already is IGDB, Nintendo by IGDB's Nintendo link or else by
// title against IGDB's Switch games) and reports coverage, how the stores line up, how
// often it agrees with today's title-based links to Steam, and the top unmatched games.
// Writes nothing. Never prints the keys.
//
//   node scripts/probe-catalog-match.mts
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET.

import { createClient } from "@supabase/supabase-js";

const BATCH = 500;
const required = (name: string) => {
  const v = process.env[name]?.trim();
  if (!v) { console.log(`Missing secret: ${name}`); process.exit(1); }
  return v;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chunks = <T,>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
const pct = (n: number, d: number) => `${d ? Math.round((n / d) * 100) : 0}%`;

/**
 * Loose title key: lower case, no marks or punctuation, and no store decorations: platform
 * names ("Xbox One & Xbox Series X|S", "for Nintendo Switch 2", "(Windows)"), edition names
 * ("Standard / Deluxe / Gold / Complete … Edition"), previews, launchers and "+ DLC" tails.
 */
const norm = (s: string) => s.toLowerCase()
  .replace(/[™®©]/g, "")
  .replace(/\s*[-–:]?\s*\(?(game preview|early access|launcher)\)?\s*$/g, "")
  .replace(/\s*\+\s*[^+]*\(dlc\)\s*$/g, "")
  .replace(/\bxbox( one)?( ?(&|and|y|\/) ?xbox)? series x ?\| ?s\b|\bxbox series x ?\| ?s\b|\bxbox one\b|\bxbox\b/g, " ")
  .replace(/\((windows|pc)\)|\bfor windows( 10)?\b|\bwindows edition\b/g, " ")
  .replace(/\b(nintendo switch( 2)?|switch( 2)?) edition\b|\b(for )?nintendo switch( 2)?\b/g, " ")
  .replace(/\b(standard|digital|deluxe|digital deluxe|complete|definitive|ultimate|gold|premium|special|collector'?s|launch|cross-gen|vault|anniversary|enhanced|remastered|goty|game of the year|holiday play) edition\b/g, " ")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();

/** IGDB games on the given platforms, indexed by loose title (name and alternative names). */
async function titleIndex(platforms: number[]): Promise<Map<string, number[]>> {
  const index = new Map<string, number[]>();
  for (let last = 0; ;) {
    const rows = await igdb<{ id: number; name?: string; alternative_names?: { name?: string }[] }[]>("games",
      `fields id,name,alternative_names.name; where platforms = (${platforms.join(",")}) & game_type = (0,4,8,9,10,11) & id > ${last}; sort id asc; limit ${BATCH};`);
    if (!rows.length) break;
    for (const g of rows) {
      for (const n of [g.name, ...(g.alternative_names ?? []).map((a) => a.name)]) {
        if (!n) continue;
        const k = norm(n);
        if (k) index.set(k, [...new Set([...(index.get(k) ?? []), g.id])]);
      }
    }
    last = rows[rows.length - 1].id;
  }
  return index;
}

// ─── Our catalogs ────────────────────────────────────────────────────────────

const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
async function all<T>(table: string, columns: string, order: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).order(order).range(from, from + 999);
    if (error) { console.log(`${table}: ${error.message}`); process.exit(1); }
    out.push(...((data ?? []) as T[]));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}
const steam = await all<{ steam_app_id: number; name: string; popularity_rank: number | null }>("games", "steam_app_id, name, popularity_rank", "steam_app_id");
const xbox = await all<{ product_id: string; title: string; is_primary: boolean; group_key: string | null; steam_app_id: number | null; popularity_rank: number | null }>(
  "xbox_games", "product_id, title, is_primary, group_key, steam_app_id, popularity_rank", "product_id");
const ps = await all<{ igdb_id: number; title: string; steam_app_id: number | null; popularity: number | null }>("playstation_games", "igdb_id, title, steam_app_id, popularity", "igdb_id");
const nin = await all<{ nsuid: string; title: string; steam_app_id: number | null; popularity: number | null }>("nintendo_games", "nsuid, title, steam_app_id, popularity", "nsuid");
console.log(`Our catalogs: Steam ${steam.length} · Xbox ${xbox.length} products (${xbox.filter((x) => x.is_primary).length} groups) · PlayStation ${ps.length} · Nintendo ${nin.length}`);

// ─── IGDB ────────────────────────────────────────────────────────────────────

const ID = required("IGDB_CLIENT_ID");
const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${ID}&client_secret=${required("IGDB_CLIENT_SECRET")}&grant_type=client_credentials`, { method: "POST" });
const TOKEN = ((await tokenRes.json()) as { access_token?: string }).access_token;
if (!TOKEN) { console.log(`IGDB token: HTTP ${tokenRes.status}`); process.exit(1); }
async function igdb<T = any>(endpoint: string, query: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await sleep(260);
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST", headers: { "Client-ID": ID, Authorization: `Bearer ${TOKEN}`, Accept: "application/json" }, body: query,
    });
    if (res.ok) return (await res.json()) as T;
    if (attempt >= 3 || (res.status !== 429 && res.status < 500)) throw new Error(`IGDB ${endpoint}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    await sleep(2000 * 2 ** attempt);
  }
}

/** Store id → IGDB game id, through IGDB's external_games for one source. */
async function byExternal(source: number, uids: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (const batch of chunks(uids, BATCH)) {
    const rows = await igdb<{ game?: number; uid?: string }[]>("external_games",
      `fields game,uid; where external_game_source = ${source} & uid = (${batch.map((u) => `"${u}"`).join(",")}); limit ${BATCH};`);
    for (const r of rows) if (r.game && r.uid && !out.has(r.uid.toUpperCase())) out.set(r.uid.toUpperCase(), r.game);
  }
  return out;
}

const sources = await igdb<{ id: number; name: string }[]>("external_game_sources", "fields id,name; limit 200;");
const src = (re: RegExp) => sources.filter((s) => re.test(s.name));
console.log(`IGDB link sources: Steam ${JSON.stringify(src(/^steam$/i))} · Microsoft ${JSON.stringify(src(/microsoft|xbox/i))} · Nintendo ${JSON.stringify(src(/nintendo|eshop/i))} · PlayStation ${JSON.stringify(src(/playstation/i))}`);

// Steam by app id.
const steamMap = await byExternal(1, steam.map((g) => String(g.steam_app_id)));
// Xbox by product id: Microsoft (11), then Game Pass cloud (54).
const xboxMap = await byExternal(11, xbox.map((x) => x.product_id));
const xboxCloud = await byExternal(54, xbox.map((x) => x.product_id).filter((id) => !xboxMap.has(id)));
for (const [k, v] of xboxCloud) xboxMap.set(k, v);
// Nintendo: IGDB's own Nintendo link source, if any, by NSUID.
const ninMap = new Map<string, number>();
for (const s of src(/nintendo|eshop/i)) {
  const m = await byExternal(s.id, nin.map((g) => g.nsuid));
  for (const [k, v] of m) if (!ninMap.has(k)) ninMap.set(k, v);
  const sample = await igdb("external_games", `fields uid,url,game.name; where external_game_source = ${s.id}; sort id desc; limit 3;`);
  console.log(`  IGDB ${s.name} (${s.id}) links look like: ${JSON.stringify(sample).slice(0, 300)} · matched ${m.size} of our NSUIDs`);
}
// …else by title against IGDB's Switch games.
const switchPlatforms = await igdb<{ id: number; name: string }[]>("platforms", `fields id,name; where name ~ *"Switch"*; limit 10;`);
console.log(`Switch platforms on IGDB: ${JSON.stringify(switchPlatforms)}`);
const byTitle = switchPlatforms.length ? await titleIndex(switchPlatforms.map((p) => p.id)) : new Map<string, number[]>();
console.log(`IGDB Switch games indexed by title: ${byTitle.size} title keys`);
let ninByTitle = 0, ninAmbiguous = 0;
for (const g of nin) {
  if (ninMap.has(g.nsuid)) continue;
  const hits = byTitle.get(norm(g.title)) ?? [];
  if (hits.length === 1) { ninMap.set(g.nsuid, hits[0]); ninByTitle++; }
  else if (hits.length > 1) ninAmbiguous++;
}

// Xbox products IGDB has no store link for: by title against IGDB's Xbox One / Series / PC games.
const xboxPlatforms = await igdb<{ id: number; name: string }[]>("platforms", `fields id,name; where name = ("Xbox One","Xbox Series X|S","PC (Microsoft Windows)"); limit 5;`);
console.log(`Xbox / PC platforms on IGDB: ${JSON.stringify(xboxPlatforms)}`);
const xboxTitles = await titleIndex(xboxPlatforms.map((p) => p.id));
console.log(`IGDB Xbox / PC games indexed by title: ${xboxTitles.size} title keys`);
let xboxByTitle = 0, xboxAmbiguous = 0;
const xboxTitleMatched: { title: string; key: string }[] = [];
for (const x of xbox) {
  if (xboxMap.has(x.product_id)) continue;
  const hits = xboxTitles.get(norm(x.title)) ?? [];
  if (hits.length === 1) { xboxMap.set(x.product_id, hits[0]); xboxByTitle++; xboxTitleMatched.push({ title: x.title, key: norm(x.title) }); }
  else if (hits.length > 1) xboxAmbiguous++;
}

// ─── Report ──────────────────────────────────────────────────────────────────

console.log("\n══ Coverage: store games linked to an IGDB game ══");
const steamHit = steam.filter((g) => steamMap.has(String(g.steam_app_id))).length;
const xboxPrimary = xbox.filter((x) => x.is_primary);
const xboxHit = xbox.filter((x) => xboxMap.has(x.product_id)).length;
const xboxGroupHit = new Set(xbox.filter((x) => xboxMap.has(x.product_id)).map((x) => x.group_key)).size;
console.log(`  Steam        ${steamHit} / ${steam.length} (${pct(steamHit, steam.length)})`);
console.log(`  Xbox         ${xboxHit} / ${xbox.length} products (${pct(xboxHit, xbox.length)}): ${xboxHit - xboxByTitle} by store link (${xboxCloud.size} of them via Game Pass cloud), ${xboxByTitle} by title, ${xboxAmbiguous} ambiguous titles left out · ${xboxGroupHit} / ${xboxPrimary.length} edition groups linked (${pct(xboxGroupHit, xboxPrimary.length)})`);
console.log(`    title matches, e.g. ${xboxTitleMatched.slice(0, 12).map((m) => `"${m.title}" → "${m.key}"`).join(" · ")}`);
console.log(`  PlayStation  ${ps.length} / ${ps.length} (100%, the catalog comes from IGDB)`);
console.log(`  Nintendo     ${ninMap.size} / ${nin.length} (${pct(ninMap.size, nin.length)}): ${ninMap.size - ninByTitle} by IGDB link, ${ninByTitle} by title, ${ninAmbiguous} ambiguous titles left out`);

// Top-ranked coverage (what matters most).
const topCov = <T,>(rows: T[], rank: (r: T) => number | null, hit: (r: T) => boolean, n: number) => {
  const top = rows.filter((r) => rank(r) !== null).sort((a, b) => rank(a)! - rank(b)!).slice(0, n);
  return `${pct(top.filter(hit).length, top.length)}`;
};
console.log(`  Top 500 by popularity: Steam ${topCov(steam, (g) => g.popularity_rank, (g) => steamMap.has(String(g.steam_app_id)), 500)} · Xbox groups ${topCov(xboxPrimary, (g) => g.popularity_rank, (g) => xbox.some((x) => x.group_key === g.group_key && xboxMap.has(x.product_id)), 500)} · Nintendo ${topCov(nin, (g) => g.popularity, (g) => ninMap.has(g.nsuid), 500)}`);

console.log("\n══ How the stores line up (by IGDB game) ══");
const stores = new Map<number, Set<string>>();
const mark = (igdbId: number | undefined, store: string) => { if (igdbId) stores.set(igdbId, (stores.get(igdbId) ?? new Set()).add(store)); };
for (const g of steam) mark(steamMap.get(String(g.steam_app_id)), "Steam");
for (const x of xbox) mark(xboxMap.get(x.product_id), "Xbox");
for (const g of ps) mark(g.igdb_id, "PlayStation");
for (const g of nin) mark(ninMap.get(g.nsuid), "Nintendo");
const byCount = [1, 2, 3, 4].map((n) => [...stores.values()].filter((s) => s.size === n).length);
console.log(`  ${stores.size} distinct IGDB games · on 1 store ${byCount[0]} · 2 stores ${byCount[1]} · 3 stores ${byCount[2]} · all 4 ${byCount[3]}`);
const combos = new Map<string, number>();
for (const s of stores.values()) if (s.size > 1) { const k = [...s].sort().join(" + "); combos.set(k, (combos.get(k) ?? 0) + 1); }
for (const [k, n] of [...combos].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`    ${k}: ${n}`);
// Several products of one store on one IGDB game = editions (Xbox) or duplicates.
const xboxPerGame = new Map<number, number>();
for (const x of xbox) { const g = xboxMap.get(x.product_id); if (g) xboxPerGame.set(g, (xboxPerGame.get(g) ?? 0) + 1); }
console.log(`  Xbox: ${[...xboxPerGame.values()].filter((n) => n > 1).length} IGDB games have 2+ Xbox products (editions, Xbox One / Series / PC versions)`);

console.log("\n══ Agreement with today's links to Steam ══");
const steamIgdb = (app: number | null) => (app === null ? undefined : steamMap.get(String(app)));
const agree = (rows: { igdb?: number; steam: number | null }[], label: string) => {
  const both = rows.filter((r) => r.igdb && steamIgdb(r.steam));
  const same = both.filter((r) => r.igdb === steamIgdb(r.steam)).length;
  const newLinks = rows.filter((r) => r.igdb && r.steam === null && [...stores.get(r.igdb!) ?? []].includes("Steam")).length;
  console.log(`  ${label}: ${rows.filter((r) => r.steam !== null).length} linked by title today · ${same}/${both.length} agree with IGDB (${pct(same, both.length)}) · ${newLinks} more links IGDB would add`);
};
agree(xbox.map((x) => ({ igdb: xboxMap.get(x.product_id), steam: x.steam_app_id })), "Xbox → Steam");
{
  // Where today's title link and IGDB disagree: which side is right?
  const steamName = new Map(steam.map((g) => [g.steam_app_id, g.name]));
  const igdbSteamName = new Map<number, string>();
  for (const g of steam) { const id = steamMap.get(String(g.steam_app_id)); if (id && !igdbSteamName.has(id)) igdbSteamName.set(id, g.name); }
  const diffs = xbox.filter((x) => x.is_primary && x.steam_app_id !== null && xboxMap.get(x.product_id) && steamIgdb(x.steam_app_id)
    && xboxMap.get(x.product_id) !== steamIgdb(x.steam_app_id))
    .sort((a, b) => (a.popularity_rank ?? 1e9) - (b.popularity_rank ?? 1e9)).slice(0, 30);
  console.log(`  Xbox → Steam disagreements (top 30 by popularity): Xbox title → today's Steam link | Steam game on the same IGDB game as the Xbox product`);
  for (const x of diffs) console.log(`    ${x.title} → ${steamName.get(x.steam_app_id!) ?? x.steam_app_id} | ${igdbSteamName.get(xboxMap.get(x.product_id)!) ?? "(no Steam game in our catalog)"}`);
}
agree(nin.map((g) => ({ igdb: ninMap.get(g.nsuid), steam: g.steam_app_id })), "Nintendo → Steam");
agree(ps.map((g) => ({ igdb: g.igdb_id, steam: g.steam_app_id })), "PlayStation → Steam");

console.log("\n══ Most popular games IGDB doesn't link ══");
const unmatched = <T,>(rows: T[], rank: (r: T) => number | null, hit: (r: T) => boolean, name: (r: T) => string) =>
  rows.filter((r) => !hit(r) && rank(r) !== null).sort((a, b) => rank(a)! - rank(b)!).slice(0, 25).map((r) => `${name(r)} (#${rank(r)})`).join(" · ");
console.log(`  Steam: ${unmatched(steam, (g) => g.popularity_rank, (g) => steamMap.has(String(g.steam_app_id)), (g) => g.name)}`);
console.log(`  Xbox: ${unmatched(xboxPrimary, (g) => g.popularity_rank, (g) => xbox.some((x) => x.group_key === g.group_key && xboxMap.has(x.product_id)), (g) => g.title)}`);
console.log(`  Nintendo: ${unmatched(nin, (g) => g.popularity, (g) => ninMap.has(g.nsuid), (g) => g.title)}`);
