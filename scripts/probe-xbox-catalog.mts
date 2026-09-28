/* eslint-disable @typescript-eslint/no-explicit-any -- probe script: raw, unknown Microsoft response shapes */
// Read-only probe: which official Microsoft source could list the whole Xbox games catalog
// (today we only find ~700 games through OpenXBL's lists and Game Pass)? For each source it
// prints the HTTP status, how many games it reports and a few titles or ids. Writes nothing,
// needs no key.
//
//   node scripts/probe-xbox-catalog.mts
//
// 1. xbox.com's "browse all games" service (emerald.xboxservices.com), paged with a token.
// 2. xbox.com's sitemap: every store product page, product id in the URL.

import { gunzipSync } from "node:zlib";
import { randomBytes } from "node:crypto";

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

async function browse(locale: string, filters: unknown, token: string | null) {
  const channel = `BROWSE_CHANNELID=_FILTERS=${b64(filters)}`;
  const r = await get(`https://emerald.xboxservices.com/xboxcomfd/browse?locale=${locale}`, {
    method: "POST",
    // MS-CV: a correlation id xbox.com sends with every request ("<16 base64 chars>.0").
    headers: { "Content-Type": "application/json", "x-ms-api-version": "1.1", "MS-CV": `${randomBytes(12).toString("base64url").slice(0, 16)}.0`, Origin: "https://www.xbox.com", Referer: "https://www.xbox.com/" },
    body: JSON.stringify({ Filters: b64(filters), ReturnFilters: false, ChannelKeyToBeUsedInResponse: channel, EncodedContinuationToken: token, ChannelId: "" }),
  });
  let body: any = null;
  try { body = JSON.parse(r.text); } catch { /* not JSON */ }
  const ch: any = body ? Object.values(body.channels ?? {})[0] : null;
  const ids: string[] = (ch?.products ?? []).map((p: any) => p.productId).filter(Boolean);
  const titles = new Map<string, string>((body?.productSummaries ?? []).map((s: any) => [s.productId, s.title]));
  return { ...r, body, ids, titles, total: ch?.totalItems as number | undefined, next: (ch?.encodedContinuationToken as string | undefined) ?? null };
}

console.log("══ 1. xbox.com browse (emerald.xboxservices.com) ══");
for (const v of BROWSE_VARIANTS) {
  const first = await browse(v.locale, v.filters, null);
  console.log(`\n── ${v.name} (${v.locale})\n  HTTP ${first.status} · ${first.type}`);
  if (!first.ids.length) {
    console.log(`  no products. ${first.body ? `keys: ${Object.keys(first.body).join(", ")}` : ""}\n  ${short(first.text)}`);
    continue;
  }
  console.log(`  totalItems: ${first.total ?? "?"} · first page: ${first.ids.length} · next page token: ${first.next ? "yes" : "no"}`);
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
  await sleep(1000);
}

// ─── 2. xbox.com sitemap ─────────────────────────────────────────────────────

// Product pages are in pdp-<locale>-sitemap-N.xml.gz; count them for Spain and the US.
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
