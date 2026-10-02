/* eslint-disable @typescript-eslint/no-explicit-any -- raw IGDB response shapes */
// Link every store item (Steam, Xbox, PlayStation, Nintendo) to one game → Supabase
// (`titles`, `title_links`).
//
//   node scripts/link-titles.mts          link (daily)
//   node scripts/link-titles.mts dry      compute and log, write nothing
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET.
//
// A game is a root IGDB game: editions (version_parent) and ports / expanded games
// (parent_game) collapse into it; remakes and remasters stay separate. Store items find
// their IGDB game by, in order:
//  1. a store link on IGDB (Steam app id, Microsoft Store product id; PlayStation items are
//     IGDB games already);
//  2. their title, against IGDB's games on the same platforms only (Xbox / PC for Xbox,
//     Switch for Nintendo) so exclusives can't cross-match; several namesakes → the one
//     released closest to the store item;
//  3. the store's existing link to a Steam game, when IGDB has nothing, or when IGDB splits
//     the same game in two (same cleaned title, neither a remake nor a remaster);
//  4. title_overrides, which always win (title_id null = never link).
// A bundle or undated entry named exactly like one dated game (IGDB has "Assassin's Creed
// III Remastered" as the remaster and as a bundle) merges into that game. Slugs are IGDB's without its "--1"
// suffixes; namesakes get their release year (resident-evil-4-2023). Old slugs of renamed or
// merged titles go to title_slug_aliases, so their pages redirect.
// Writes only titles and links that changed; removes links whose store item is gone.

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { titleKey as norm } from "./lib/title-key.mts";

const BATCH = 500;
const IGDB_DELAY_MS = 260;             // 4 requests / second
const REMAKE_TYPES = new Set([8, 9]);  // remake, remaster: separate games
const COLLAPSE_TYPES = new Set([10, 11]); // expanded game, port: same game as parent_game
const BUNDLE = 3;
const MIN_LINKS = 1200;                // fewer than this = something broke; don't write
const dry = process.argv[2] === "dry";

type Store = "steam" | "xbox" | "playstation" | "nintendo";
interface Item { store: Store; id: string; title: string; release: string | null; steamApp: number | null }

const required = (name: string) => {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const chunks = <T,>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });



// ─── Supabase ────────────────────────────────────────────────────────────────

async function all<T>(table: string, columns: string, order: string, filter?: (q: any) => any): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from(table).select(columns).order(order).range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}

async function loadItems(): Promise<Item[]> {
  const steam = await all<{ steam_app_id: number; name: string; release_date: string | null }>(
    "games", "steam_app_id, name, release_date", "steam_app_id", (q) => q.eq("type", "game"));
  const xbox = await all<{ product_id: string; title: string; release_date: string | null; steam_app_id: number | null }>(
    "xbox_games", "product_id, title, release_date, steam_app_id", "product_id");
  const ps = await all<{ igdb_id: number; title: string; first_release: string | null; steam_app_id: number | null }>(
    "playstation_games", "igdb_id, title, first_release, steam_app_id", "igdb_id");
  const nin = await all<{ nsuid: string; title: string; release_date: string | null; steam_app_id: number | null }>(
    "nintendo_games", "nsuid, title, release_date, steam_app_id", "nsuid");
  return [
    ...steam.map((g) => ({ store: "steam" as const, id: String(g.steam_app_id), title: g.name, release: g.release_date, steamApp: g.steam_app_id })),
    ...xbox.map((g) => ({ store: "xbox" as const, id: g.product_id, title: g.title, release: g.release_date, steamApp: g.steam_app_id })),
    ...ps.map((g) => ({ store: "playstation" as const, id: String(g.igdb_id), title: g.title, release: g.first_release, steamApp: g.steam_app_id })),
    ...nin.map((g) => ({ store: "nintendo" as const, id: g.nsuid, title: g.title, release: g.release_date, steamApp: g.steam_app_id })),
  ];
}

// ─── IGDB ────────────────────────────────────────────────────────────────────

let token: string | null = null;
async function igdb<T = any>(endpoint: string, query: string): Promise<T> {
  const id = required("IGDB_CLIENT_ID");
  if (!token) {
    const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${required("IGDB_CLIENT_SECRET")}&grant_type=client_credentials`, { method: "POST" });
    token = ((await res.json()) as { access_token?: string }).access_token ?? null;
    if (!token) throw new Error(`IGDB token: HTTP ${res.status}`);
  }
  for (let attempt = 0; ; attempt++) {
    await sleep(IGDB_DELAY_MS);
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST", headers: { "Client-ID": id, Authorization: `Bearer ${token}`, Accept: "application/json" }, body: query,
    });
    if (res.ok) return (await res.json()) as T;
    if (attempt >= 3 || (res.status !== 429 && res.status < 500)) throw new Error(`IGDB ${endpoint}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    await sleep(2000 * 2 ** attempt);
  }
}

/** Store id (upper case) → IGDB game id, through external_games for one source. */
async function byExternal(source: number, uids: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (const batch of chunks(uids, BATCH)) {
    const rows = await igdb<{ game?: number; uid?: string }[]>("external_games",
      `fields game,uid; where external_game_source = ${source} & uid = (${batch.map((u) => `"${u}"`).join(",")}); limit ${BATCH};`);
    for (const r of rows) if (r.game && r.uid && !out.has(r.uid.toUpperCase())) out.set(r.uid.toUpperCase(), r.game);
  }
  return out;
}

async function platformIds(names: string[]): Promise<number[]> {
  const rows = await igdb<{ id: number }[]>("platforms", `fields id; where name = (${names.map((n) => `"${n}"`).join(",")}); limit 10;`);
  return rows.map((r) => r.id);
}

/** IGDB games on these platforms by loose title (name and alternative names). */
async function titleIndex(platforms: number[]): Promise<Map<string, number[]>> {
  const index = new Map<string, number[]>();
  for (let last = 0; ;) {
    const rows = await igdb<{ id: number; name?: string; alternative_names?: { name?: string }[] }[]>("games",
      `fields id,name,alternative_names.name; where platforms = (${platforms.join(",")}) & game_type = (0,4,8,9,10,11) & id > ${last}; sort id asc; limit ${BATCH};`);
    if (!rows.length) break;
    for (const g of rows) {
      for (const n of [g.name, ...(g.alternative_names ?? []).map((a) => a.name)]) {
        const k = n ? norm(n) : "";
        if (k) index.set(k, [...new Set([...(index.get(k) ?? []), g.id])]);
      }
    }
    last = rows[rows.length - 1].id;
  }
  return index;
}

interface Meta { id: number; name?: string; game_type?: number; version_parent?: number; parent_game?: number; first_release_date?: number }
const meta = new Map<number, Meta>();
async function loadMeta(ids: number[]) {
  const missing = [...new Set(ids)].filter((id) => !meta.has(id));
  for (const batch of chunks(missing, BATCH)) {
    const rows = await igdb<Meta[]>("games", `fields id,name,game_type,version_parent,parent_game,first_release_date; where id = (${batch.join(",")}); limit ${BATCH};`);
    for (const r of rows) meta.set(r.id, r);
  }
}
const parentOf = (m: Meta | undefined) =>
  m?.version_parent ?? (m?.game_type !== undefined && COLLAPSE_TYPES.has(m.game_type) ? m.parent_game : undefined);
function rootOf(id: number): number {
  let cur = id;
  for (let i = 0; i < 5; i++) { const p = parentOf(meta.get(cur)); if (!p || !meta.has(p)) break; cur = p; }
  return cur;
}
const dayOf = (unix?: number) => (unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null);
const daysApart = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;

// ─── Link ────────────────────────────────────────────────────────────────────

const items = await loadItems();
const count = (s: Store) => items.filter((i) => i.store === s).length;
console.log(`Store items: Steam ${count("steam")} · Xbox ${count("xbox")} · PlayStation ${count("playstation")} · Nintendo ${count("nintendo")}`);
const key = (i: { store: Store; id: string }) => `${i.store}:${i.id}`;

// 1. Store links.
const linked = new Map<string, { igdb: number; method: string }>();
const steamLinks = await byExternal(1, items.filter((i) => i.store === "steam").map((i) => i.id));
const xboxIds = items.filter((i) => i.store === "xbox").map((i) => i.id);
const msLinks = await byExternal(11, xboxIds);
for (const [k, v] of await byExternal(54, xboxIds.filter((id) => !msLinks.has(id)))) msLinks.set(k, v);
for (const i of items) {
  const hit = i.store === "steam" ? steamLinks.get(i.id)
    : i.store === "xbox" ? msLinks.get(i.id.toUpperCase())
    : i.store === "playstation" ? Number(i.id) : undefined;
  if (hit) linked.set(key(i), { igdb: hit, method: "store_link" });
}

// 2. Titles, platform-scoped.
const xboxIndex = await titleIndex(await platformIds(["Xbox One", "Xbox Series X|S", "PC (Microsoft Windows)"]));
const switchIndex = await titleIndex(await platformIds(["Nintendo Switch", "Nintendo Switch 2"]));
console.log(`IGDB title index: Xbox / PC ${xboxIndex.size} keys · Switch ${switchIndex.size} keys`);
const candidates = new Map<string, number[]>();
for (const i of items) {
  if (linked.has(key(i)) || (i.store !== "xbox" && i.store !== "nintendo")) continue;
  const hits = (i.store === "xbox" ? xboxIndex : switchIndex).get(norm(i.title));
  if (hits?.length) candidates.set(key(i), hits);
}

// Collapse versions: every IGDB id we touch, and their parents.
await loadMeta([...[...linked.values()].map((l) => l.igdb), ...[...candidates.values()].flat()]);
for (let round = 0; round < 3; round++) await loadMeta([...meta.values()].map(parentOf).filter((x): x is number => !!x));
for (const l of linked.values()) l.igdb = rootOf(l.igdb);

let ambiguous = 0;
const byKey = new Map(items.map((i) => [key(i), i]));
for (const [k, hits] of candidates) {
  const roots = [...new Set(hits.map(rootOf))];
  if (roots.length === 1) { linked.set(k, { igdb: roots[0], method: "title" }); continue; }
  // Namesakes: the one released closest to the store item, if clearly closest.
  const release = byKey.get(k)!.release;
  const dated = roots.map((r) => ({ r, d: dayOf(meta.get(r)?.first_release_date) }))
    .filter((x): x is { r: number; d: string } => !!x.d && !!release)
    .map((x) => ({ r: x.r, gap: daysApart(x.d, release!) })).sort((a, b) => a.gap - b.gap);
  if (dated.length && (dated.length === 1 || dated[1].gap - dated[0].gap > 180) && dated[0].gap < 3 * 365) {
    linked.set(k, { igdb: dated[0].r, method: "title_date" });
  } else ambiguous++;
}

// 3. Existing links to Steam: fill gaps, and merge IGDB's splits of the same game.
const steamRoot = (app: number | null) => (app === null ? undefined : linked.get(`steam:${app}`)?.igdb);
const steamName = new Map(items.filter((i) => i.store === "steam").map((i) => [Number(i.id), i.title]));
const alias = new Map<number, number>();
for (const i of items) {
  if (i.store === "steam" || i.steamApp === null) continue;
  const target = steamRoot(i.steamApp);
  if (!target) continue;
  const own = linked.get(key(i));
  if (!own) { linked.set(key(i), { igdb: target, method: "steam_link" }); continue; }
  if (own.igdb === target) continue;
  const sameTitle = norm(i.title) === norm(steamName.get(i.steamApp) ?? "");
  const remake = REMAKE_TYPES.has(meta.get(own.igdb)?.game_type ?? -1) || REMAKE_TYPES.has(meta.get(target)?.game_type ?? -1);
  if (sameTitle && !remake) alias.set(own.igdb, target);
}
const resolveAlias = (id: number) => { let cur = id; for (let n = 0; n < 5 && alias.has(cur); n++) cur = alias.get(cur)!; return cur; };
// Same-name IGDB twins of one game: a bundle (Assassin's Creed III Remastered + Liberation)
// or an undated duplicate (This War of Mine: Final Cut) merges into the one dated game.
const byName = new Map<string, number[]>();
for (const id of new Set([...linked.values()].map((l) => resolveAlias(l.igdb)))) {
  const name = meta.get(id)?.name;
  if (name) byName.set(norm(name), [...(byName.get(norm(name)) ?? []), id]);
}
let bundleTwins = 0;
for (const ids of byName.values()) {
  const games = ids.filter((id) => meta.get(id)?.game_type !== BUNDLE && !!meta.get(id)?.first_release_date);
  if (games.length !== 1) continue;
  for (const id of ids) if (id !== games[0]) { alias.set(id, games[0]); bundleTwins++; }
}
for (const l of linked.values()) {
  const to = resolveAlias(l.igdb);
  if (to !== l.igdb) { l.igdb = to; if (l.method === "store_link" || l.method === "title") l.method = "same_title"; }
}

// 4. Manual overrides.
const overrides = await all<{ store: Store; store_id: string; title_id: number | null }>("title_overrides", "store, store_id, title_id", "store_id");
for (const o of overrides) {
  if (o.title_id === null) linked.delete(`${o.store}:${o.store_id}`);
  else linked.set(`${o.store}:${o.store_id}`, { igdb: o.title_id, method: "override" });
}

// ─── Report ──────────────────────────────────────────────────────────────────

const methods = new Map<string, number>();
for (const l of linked.values()) methods.set(l.method, (methods.get(l.method) ?? 0) + 1);
for (const s of ["steam", "xbox", "playstation", "nintendo"] as Store[]) {
  const n = [...linked.keys()].filter((k) => k.startsWith(`${s}:`)).length;
  console.log(`  ${s.padEnd(12)} ${n} / ${count(s)} linked (${Math.round((n / Math.max(1, count(s))) * 100)}%)`);
}
console.log(`  by: ${[...methods].map(([m, n]) => `${m} ${n}`).join(" · ")} · ${ambiguous} ambiguous titles left out · ${alias.size} IGDB splits merged (${bundleTwins} same-name twins)`);
const storesPerTitle = new Map<number, Set<string>>();
for (const [k, l] of linked) storesPerTitle.set(l.igdb, (storesPerTitle.get(l.igdb) ?? new Set()).add(k.split(":")[0]));
const multi = [...storesPerTitle.values()].filter((s) => s.size > 1).length;
console.log(`  ${storesPerTitle.size} titles, ${multi} on 2+ stores`);

// ─── Titles ──────────────────────────────────────────────────────────────────

interface TitleRow { id: number; slug: string; name: string; game_type: number | null; first_release: string | null; summary: string | null; genres: string[]; cover_id: string | null; art_id: string | null; content_hash?: string }
const titleIds = [...storesPerTitle.keys()];
const titles: TitleRow[] = [];
for (const batch of chunks(titleIds, BATCH)) {
  const rows = await igdb<any[]>("games",
    `fields id,slug,name,game_type,first_release_date,summary,genres.name,cover.image_id,artworks.image_id; where id = (${batch.join(",")}); limit ${BATCH};`);
  for (const g of rows) {
    if (!g.name) continue;
    titles.push({
      id: g.id, slug: g.slug || String(g.id), name: String(g.name).trim(), game_type: g.game_type ?? null,
      first_release: dayOf(g.first_release_date), summary: g.summary?.trim() || null,
      genres: (g.genres ?? []).map((x: any) => x.name).filter(Boolean).sort(),
      cover_id: g.cover?.image_id ?? null, art_id: g.artworks?.[0]?.image_id ?? null,
    });
  }
}
// Our slugs: IGDB's without its "--1" dedup suffix; namesakes get their release year.
const baseSlug = (slug: string) => slug.replace(/--\d+$/, "");
const slugGroups = new Map<string, TitleRow[]>();
for (const t of titles) slugGroups.set(baseSlug(t.slug), [...(slugGroups.get(baseSlug(t.slug)) ?? []), t]);
const taken = new Set<string>();
for (const [base, ts] of slugGroups) if (ts.length === 1) { ts[0].slug = base; taken.add(base); }
for (const [base, ts] of slugGroups) {
  if (ts.length === 1) continue;
  for (const t of ts.sort((a, b) => a.id - b.id)) {
    const year = t.first_release?.slice(0, 4);
    t.slug = year && !taken.has(`${base}-${year}`) ? `${base}-${year}` : `${base}-${t.id}`;
    taken.add(t.slug);
  }
}
for (const t of titles) t.content_hash = createHash("sha1").update(JSON.stringify({ ...t, content_hash: undefined })).digest("hex");
const known = new Set(titles.map((t) => t.id));
for (const [k, l] of linked) if (!known.has(l.igdb)) linked.delete(k);   // IGDB id gone / renamed: drop the link

const namesakes = [...slugGroups.values()].filter((ts) => ts.length > 1);
console.log(`  slugs: ${namesakes.length} namesake groups, e.g. ${namesakes.slice(0, 5).map((ts) => ts.map((t) => t.slug).join(" / ")).join(" · ")}`);
if (dry) { console.log(`Dry run: ${titles.length} titles, ${linked.size} links; nothing written.`); process.exit(0); }
if (linked.size < MIN_LINKS) throw new Error(`Only ${linked.size} links (expected ${MIN_LINKS}+); not writing.`);

const storedRows = await all<{ id: number; slug: string; content_hash: string | null }>("titles", "id, slug, content_hash", "id");
const stored = new Map(storedRows.map((t) => [t.id, t.content_hash]));
const newSlug = new Map(titles.map((t) => [t.id, t.slug]));
const liveSlugs = new Set(newSlug.values());

// Old slugs → where they now go: a renamed title, or a title merged into another.
const slugAliases = storedRows.flatMap((o) => {
  const to = newSlug.has(o.id) ? o.id : resolveAlias(o.id);
  return newSlug.has(to) && newSlug.get(to) !== o.slug && !liveSlugs.has(o.slug) ? [{ slug: o.slug, title_id: to }] : [];
});

// Titles nothing links to any more (first, so their slugs are free).
const unused = [...stored.keys()].filter((id) => !storesPerTitle.has(id));
for (const batch of chunks(unused, BATCH)) {
  const { error } = await db.from("titles").delete().in("id", batch);
  if (error) throw new Error(`titles delete: ${error.message}`);
}

const changedTitles = titles.filter((t) => stored.get(t.id) !== t.content_hash);
// Slugs are unique: park renamed titles on a temporary slug first, so two titles can swap.
const storedSlug = new Map(storedRows.map((t) => [t.id, t.slug]));
const renamed = changedTitles.filter((t) => storedSlug.has(t.id) && storedSlug.get(t.id) !== t.slug);
for (const batch of chunks(renamed.map((t) => ({ ...t, slug: `~${t.id}` })), BATCH)) {
  const { error } = await db.from("titles").upsert(batch, { onConflict: "id" });
  if (error) throw new Error(`titles rename: ${error.message}`);
}
for (const batch of chunks(changedTitles, BATCH)) {
  const { error } = await db.from("titles").upsert(batch, { onConflict: "id" });
  if (error) throw new Error(`titles upsert: ${error.message}`);
}

const oldLinks = new Map((await all<{ store: Store; store_id: string; title_id: number; method: string }>("title_links", "store, store_id, title_id, method", "store_id"))
  .map((l) => [`${l.store}:${l.store_id}`, l]));
const now = new Date().toISOString();
const changedLinks = [...linked].filter(([k, l]) => { const o = oldLinks.get(k); return !o || o.title_id !== l.igdb || o.method !== l.method; })
  .map(([k, l]) => { const [store, ...rest] = k.split(":"); return { store, store_id: rest.join(":"), title_id: l.igdb, method: l.method, updated_at: now }; });
for (const batch of chunks(changedLinks, BATCH)) {
  const { error } = await db.from("title_links").upsert(batch, { onConflict: "store,store_id" });
  if (error) throw new Error(`title_links upsert: ${error.message}`);
}
const goneLinks = [...oldLinks.keys()].filter((k) => !linked.has(k));
for (const store of ["steam", "xbox", "playstation", "nintendo"] as Store[]) {
  const ids = goneLinks.filter((k) => k.startsWith(`${store}:`)).map((k) => k.slice(store.length + 1));
  for (const batch of chunks(ids, BATCH)) {
    const { error } = await db.from("title_links").delete().eq("store", store).in("store_id", batch);
    if (error) throw new Error(`title_links delete: ${error.message}`);
  }
}
for (const batch of chunks(slugAliases, BATCH)) {
  const { error } = await db.from("title_slug_aliases").upsert(batch, { onConflict: "slug" });
  if (error) throw new Error(`title_slug_aliases upsert: ${error.message}`);
}
// A slug that is a live page again isn't an alias.
const staleAliases = (await all<{ slug: string }>("title_slug_aliases", "slug", "slug")).map((a) => a.slug).filter((sl) => liveSlugs.has(sl));
for (const batch of chunks(staleAliases, BATCH)) {
  const { error } = await db.from("title_slug_aliases").delete().in("slug", batch);
  if (error) throw new Error(`title_slug_aliases delete: ${error.message}`);
}
console.log(`Written: ${changedTitles.length} titles (${renamed.length} new slugs), ${changedLinks.length} links, ${slugAliases.length} slug redirects · removed ${goneLinks.length} links, ${unused.length} titles.`);
