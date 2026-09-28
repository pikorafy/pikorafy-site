/* eslint-disable @typescript-eslint/no-explicit-any -- probe script: raw, unknown Microsoft response shapes */
// Read-only probe: which official Microsoft source could list the whole Xbox games catalog
// (today we only find ~700 games through OpenXBL's lists and Game Pass)? For each source it
// prints the HTTP status, how many games it reports and a few titles or ids. Writes nothing,
// needs no key (the IGDB part uses IGDB_CLIENT_ID / IGDB_CLIENT_SECRET when set).
//
//   node scripts/probe-xbox-catalog.mts [browse|sitemap|igdb]   (default: all three)
//
// 1. xbox.com's "browse all games" service (emerald.xboxservices.com), paged with a token.
// 2. xbox.com's sitemap: every store product page, product id in the URL.
// 3. IGDB: how many Xbox One / Series games exist, and how many carry a Microsoft Store id.

import { gunzipSync } from "node:zlib";
import { randomBytes } from "node:crypto";

const ONLY = process.argv[2]?.trim() || "";
const run = (section: string) => !ONLY || ONLY === section;

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const PRODUCT_ID = /\b(9[A-Z0-9]{11}|BT[A-Z0-9]{10}|C[A-Z0-9]{11})\b/g;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (s: string, n = 400) => s.replace(/\s+/g, " ").slice(0, n);

async function get(url: string, init: RequestInit = {}) {
  try {
    const res = await fetch(url, { ...init, headers: { "User-Agent": UA, Accept: "application/json, text/xml, */*", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(30_000) });
    const buf = Buffer.from(await res.arrayBuffer());
    // Sitemap files are .xml.gz; gunzip them unless the server already did.
    const text = buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
    return { status: res.status, type: res.headers.get("content-type") ?? "-", text };
  } catch (err) {
    return { status: 0, type: "-", text: `failed: ${String(err).slice(0, 200)}` };
  }
}

// ─── 1. xbox.com browse ──────────────────────────────────────────────────────

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64");
const BROWSE_VARIANTS: { name: string; locale: string; filters: unknown }[] = [
  { name: "all games, no filter", locale: "en-US", filters: {} },
  { name: "all games, Spain", locale: "es-ES", filters: {} },
  { name: "console games (Xbox Series X|S + One)", locale: "en-US", filters: { PlayWith: { id: "PlayWith", choices: [{ id: "XboxSeriesX|S" }, { id: "XboxOne" }] } } },
  { name: "PC games", locale: "en-US", filters: { PlayWith: { id: "PlayWith", choices: [{ id: "PC" }] } } },
];

/** Request field the next-page token goes in; the probe tries each until the page moves on. */
let TOKEN_FIELD = "EncodedCT";

async function browse(locale: string, filters: unknown, token: string | null, field = TOKEN_FIELD) {
  const channel = `BROWSE_CHANNELID=_FILTERS=${b64(filters)}`;
  const r = await get(`https://emerald.xboxservices.com/xboxcomfd/browse?locale=${locale}`, {
    method: "POST",
    // MS-CV: a correlation id xbox.com sends with every request ("<16 base64 chars>.0").
    headers: { "Content-Type": "application/json", "x-ms-api-version": "1.1", "MS-CV": `${randomBytes(12).toString("base64url").slice(0, 16)}.0`, Origin: "https://www.xbox.com", Referer: "https://www.xbox.com/" },
    body: JSON.stringify({ Filters: b64(filters), ReturnFilters: false, ChannelKeyToBeUsedInResponse: channel, ChannelId: "", ...(token ? { [field]: token } : {}) }),
  });
  let body: any = null;
  try { body = JSON.parse(r.text); } catch { /* not JSON */ }
  const ch: any = body ? Object.values(body.channels ?? {})[0] : null;
  const ids: string[] = (ch?.products ?? []).map((p: any) => p.productId).filter(Boolean);
  const titles = new Map<string, string>((body?.productSummaries ?? []).map((s: any) => [s.productId, s.title]));
  const tokens = findTokens(body);
  // The next-page token is channel.encodedCT: base64 JSON {"HasMore":true,"SkipCount":25,"TotalCount":…}.
  const next = (ch?.encodedCT as string | undefined) ?? tokens[0]?.value ?? null;
  return { ...r, body, ch, ids, titles, total: ch?.totalItems as number | undefined, tokens, next };
}

/** Every string field anywhere in the response whose name looks like a paging token. */
function findTokens(o: any, path = "", out: { path: string; value: string }[] = []) {
  if (!o || typeof o !== "object") return out;
  for (const [k, v] of Object.entries(o)) {
    const p = path ? `${path}.${k}` : k;
    if (typeof v === "string" && v && /token|continuation|cursor|next|skip|CT$/i.test(k)) out.push({ path: p, value: v });
    else if (v && typeof v === "object" && !Array.isArray(v)) findTokens(v, p, out);
  }
  return out;
}

/** The response's shape: keys, with array lengths, two levels deep (product lists left out). */
function shape(o: any, depth = 0): string {
  if (!o || typeof o !== "object") return typeof o;
  if (Array.isArray(o)) return `[${o.length}]`;
  if (depth >= 2) return "{…}";
  return `{ ${Object.entries(o).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.length}]` : v && typeof v === "object" ? shape(v, depth + 1) : JSON.stringify(v)?.slice(0, 60)}`).join(", ")} }`;
}

if (run("browse")) {
console.log("══ 1. xbox.com browse (emerald.xboxservices.com) ══");
// Which request field takes the next-page token? The right one returns page 2, not page 1 again.
{
  const first = await browse("en-US", {}, null);
  const firstIds = new Set(first.ids);
  console.log(`\n── token field test (page 1: ${first.ids.length} products)`);
  let picked = false;
  for (const field of ["EncodedCT", "encodedCT", "EncodedContinuationToken", "ContinuationToken", "ct"]) {
    await sleep(700);
    const p2 = await browse("en-US", {}, first.next, field);
    const fresh = p2.ids.filter((id) => !firstIds.has(id)).length;
    const skip = p2.next ? JSON.parse(Buffer.from(p2.next, "base64").toString("utf8")).SkipCount : "?";
    console.log(`  ${field.padEnd(26)} HTTP ${p2.status} · ${p2.ids.length} products, ${fresh} new · next SkipCount ${skip}${p2.status !== 200 ? ` · ${short(p2.text, 150)}` : ""}`);
    if (fresh > 0 && !picked) { TOKEN_FIELD = field; picked = true; }
  }
  console.log(picked ? `  → using ${TOKEN_FIELD}` : "  → no field moved to page 2");
}
for (const v of BROWSE_VARIANTS) {
  const first = await browse(v.locale, v.filters, null);
  console.log(`\n── ${v.name} (${v.locale})\n  HTTP ${first.status} · ${first.type}`);
  if (!first.ids.length) {
    console.log(`  no products. ${first.body ? `keys: ${Object.keys(first.body).join(", ")}` : ""}\n  ${short(first.text)}`);
    continue;
  }
  console.log(`  totalItems: ${first.total ?? "?"} · first page: ${first.ids.length} · token-like fields: ${first.tokens.map((t) => `${t.path} (${t.value.length} chars)`).join(", ") || "none"}`);
  if (v === BROWSE_VARIANTS[0]) {
    const { channels, productSummaries, ...rest } = first.body ?? {};
    console.log(`  response: ${shape({ ...rest, productSummaries })}`);
    console.log(`  channel: ${shape(first.ch)}`);
    console.log(`  channels keys: ${Object.keys(channels ?? {}).join(" | ")}`);
  }
  console.log(`  e.g. ${first.ids.slice(0, 6).map((id) => `${first.titles.get(id) ?? "?"} (${id})`).join(" · ")}`);
  // Follow a few pages to check the paging really moves on.
  const seen = new Set(first.ids);
  let token = first.next, pages = 1;
  while (token && pages < 6) {
    await sleep(800);
    const page = await browse(v.locale, v.filters, token);
    if (page.status !== 200 || !page.ids.length) { console.log(`  page ${pages + 1}: HTTP ${page.status}, ${page.ids.length} products`); break; }
    const fresh = page.ids.filter((id) => !seen.has(id)).length;
    page.ids.forEach((id) => seen.add(id));
    pages++;
    token = page.next;
    console.log(`  page ${pages}: ${page.ids.length} products, ${fresh} new`);
  }
  console.log(`  ${seen.size} distinct products over ${pages} pages`);
  if (first.next) {
    const decoded = Buffer.from(first.next, "base64").toString("utf8");
    console.log(`  token decoded: ${short(decoded, 200)}`);
    // Jump deep by building the token ourselves: does the list really reach the end?
    for (const skip of [5000, (first.total ?? 100) - 30]) {
      await sleep(800);
      let tok: any;
      try { tok = JSON.parse(decoded); } catch { tok = {}; }
      const built = Buffer.from(JSON.stringify({ ...tok, HasMore: true, SkipCount: skip })).toString("base64");
      const deep = await browse(v.locale, v.filters, built);
      console.log(`  jump to ${skip}: HTTP ${deep.status}, ${deep.ids.length} products, more after: ${deep.next ? Buffer.from(deep.next, "base64").toString("utf8").slice(0, 60) : "no"} · e.g. ${deep.ids.slice(0, 3).map((id) => deep.titles.get(id) ?? id).join(" · ")}`);
    }
  }
  await sleep(1000);
}

}

// ─── 2. xbox.com sitemap ─────────────────────────────────────────────────────

// Product pages are in pdp-<locale>-sitemap-N.xml.gz; count them for Spain and the US.
if (run("sitemap")) {
console.log("\n══ 2. xbox.com sitemap ══");
const locs = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
const index = await get("https://www.xbox.com/sitemap.xml");
const files = locs(index.text);
const kinds = new Map<string, number>();
for (const f of files) {
  const kind = f.match(/sitemap\/([a-z]+)-/)?.[1] ?? "other";
  kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
}
console.log(`  HTTP ${index.status} · ${files.length} sitemap files · by kind: ${[...kinds].map(([k, n]) => `${k} ${n}`).join(", ")}`);

for (const locale of ["es-ES", "en-US"]) {
  const mine = files.filter((f) => f.includes(`/pdp-${locale}-sitemap-`));
  const ids = new Set<string>();
  const paths = new Map<string, number>();       // URL shape → count, e.g. /es-ES/games/store/…
  let urls = 0;
  for (const f of mine) {
    await sleep(400);
    const r = await get(f);
    const list = locs(r.text);
    urls += list.length;
    for (const u of list) {
      const shape = u.replace(/^https:\/\/www\.xbox\.com/, "").split("/").slice(0, 3).join("/");
      paths.set(shape, (paths.get(shape) ?? 0) + 1);
      for (const id of u.toUpperCase().match(PRODUCT_ID) ?? []) ids.add(id);
    }
    if (f === mine[0]) console.log(`\n── ${locale}: ${mine.length} files · first file HTTP ${r.status}, ${list.length} URLs\n  e.g. ${list.slice(0, 4).join("\n       ")}`);
  }
  console.log(`  ${locale}: ${urls} URLs, ${ids.size} distinct product ids`);
  console.log(`  URL shapes: ${[...paths].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([p, n]) => `${p} ${n}`).join(" · ")}`);
}

}

// ─── 3. IGDB: how many Xbox games exist, and which carry a Microsoft Store id ──

if (run("igdb")) {
console.log("\n══ 3. IGDB ══");
const IGDB_ID = process.env.IGDB_CLIENT_ID?.trim();
const IGDB_SECRET = process.env.IGDB_CLIENT_SECRET?.trim();
if (!IGDB_ID || !IGDB_SECRET) {
  console.log("  skipped: IGDB_CLIENT_ID / IGDB_CLIENT_SECRET not set");
} else {
  const tok = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${IGDB_ID}&client_secret=${IGDB_SECRET}&grant_type=client_credentials`, { method: "POST" });
  const token = ((await tok.json()) as { access_token?: string }).access_token;
  const igdb = async (endpoint: string, query: string): Promise<any> => {
    await sleep(300);
    const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST", headers: { "Client-ID": IGDB_ID, Authorization: `Bearer ${token}`, Accept: "application/json" }, body: query,
    });
    return res.ok ? res.json() : { error: `HTTP ${res.status} ${short(await res.text(), 200)}` };
  };
  if (!token) console.log(`  IGDB token: HTTP ${tok.status}`);
  else {
    const platforms = await igdb("platforms", `fields id,name; where name = ("Xbox Series X|S","Xbox One","Xbox 360"); limit 5;`);
    console.log(`  platforms: ${JSON.stringify(platforms)}`);
    const ids = Array.isArray(platforms) ? platforms.map((p: any) => p.id as number) : [];
    // Main games, standalone expansions, remakes, remasters, expanded games, ports.
    const mainTypes = "(0,4,8,9,10,11)";
    for (const p of Array.isArray(platforms) ? platforms : []) {
      const all = await igdb("games/count", `where platforms = (${p.id}) & game_type = ${mainTypes};`);
      const released = await igdb("games/count", `where platforms = (${p.id}) & game_type = ${mainTypes} & first_release_date < ${Math.floor(new Date().getTime() / 1000)};`);
      console.log(`  ${p.name}: ${all.count ?? JSON.stringify(all)} games (${released.count ?? "?"} released)`);
    }
    if (ids.length) {
      const modern = ids.filter((_, i) => !/360/.test(platforms[i].name)).join(",");
      const either = await igdb("games/count", `where platforms = (${modern}) & game_type = ${mainTypes};`);
      console.log(`  Xbox One or Series (either): ${either.count ?? JSON.stringify(either)} games`);
    }
    // Store links: which external_game_sources look like Microsoft / Xbox, and how many links each has.
    const sources = await igdb("external_game_sources", "fields id,name; limit 100;");
    const ms = Array.isArray(sources) ? sources.filter((s: any) => /microsoft|xbox/i.test(s.name)) : [];
    console.log(`  Microsoft / Xbox link sources: ${JSON.stringify(ms)}`);
    for (const s of ms) {
      const n = await igdb("external_games/count", `where external_game_source = ${s.id};`);
      const sample = await igdb("external_games", `fields uid,url,game.name; where external_game_source = ${s.id}; sort id desc; limit 4;`);
      console.log(`  ${s.name} (${s.id}): ${n.count ?? JSON.stringify(n)} links · e.g. ${Array.isArray(sample) ? sample.map((x: any) => `${x.game?.name ?? "?"} → ${x.uid}`).join(" · ") : JSON.stringify(sample)}`);
    }
  }
}
}
