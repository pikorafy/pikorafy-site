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
// 3. The Microsoft Store recommendation lists the importer already supports (switched off
//    because they didn't answer from GitHub).

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const PRODUCT_ID = /\b(9[A-Z0-9]{11}|BT[A-Z0-9]{10}|C[A-Z0-9]{11})\b/g;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (s: string, n = 400) => s.replace(/\s+/g, " ").slice(0, n);

async function get(url: string, init: RequestInit = {}) {
  try {
    const res = await fetch(url, { ...init, headers: { "User-Agent": UA, Accept: "application/json, text/xml, */*", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(30_000) });
    return { status: res.status, type: res.headers.get("content-type") ?? "-", text: await res.text() };
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
    headers: { "Content-Type": "application/json", "x-ms-api-version": "1.1", Origin: "https://www.xbox.com", Referer: "https://www.xbox.com/" },
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

console.log("\n══ 2. xbox.com sitemap ══");
const locs = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
for (const root of ["https://www.xbox.com/sitemap.xml", "https://www.xbox.com/robots.txt"]) {
  const r = await get(root);
  console.log(`\n── ${root}\n  HTTP ${r.status} · ${r.type} · ${r.text.length} chars`);
  if (root.endsWith("robots.txt")) {
    const maps = r.text.split("\n").filter((l) => /^sitemap:/i.test(l)).map((l) => l.replace(/^sitemap:\s*/i, "").trim());
    console.log(`  sitemaps listed: ${maps.length}\n  ${maps.slice(0, 15).join("\n  ")}`);
    continue;
  }
  const children = locs(r.text);
  console.log(`  entries: ${children.length}\n  ${children.slice(0, 15).join("\n  ")}`);
  // Open the child sitemaps that look like game / store pages and count product ids.
  const gameMaps = children.filter((u) => /game|store|product/i.test(u)).slice(0, 8);
  const ids = new Set<string>();
  for (const u of gameMaps) {
    await sleep(500);
    const c = await get(u);
    const urls = locs(c.text);
    const found = urls.flatMap((x) => x.toUpperCase().match(PRODUCT_ID) ?? []);
    found.forEach((id) => ids.add(id));
    console.log(`  ${u}: HTTP ${c.status}, ${urls.length} URLs, ${new Set(found).size} product ids · e.g. ${urls.slice(0, 2).join(" ")}`);
  }
  if (gameMaps.length) console.log(`  distinct product ids across those sitemaps: ${ids.size}`);
}

// ─── 3. Microsoft Store recommendation lists ─────────────────────────────────

console.log("\n══ 3. Microsoft Store lists (reco-public) ══");
for (const list of ["MostPlayed", "New", "TopPaid"]) {
  const r = await get(`https://reco-public.rec.mp.microsoft.com/channels/Reco/V8.0/Lists/Computed/${list}?Market=ES&Language=EN&ItemTypes=Game&deviceFamily=Windows.Xbox&count=200&skipitems=0`);
  let body: any = null;
  try { body = JSON.parse(r.text); } catch { /* not JSON */ }
  console.log(`  ${list}: HTTP ${r.status} · ${body ? `${body.Items?.length ?? 0} items, total ${body.PagingInfo?.TotalItems ?? "?"}` : short(r.text, 200)}`);
  await sleep(500);
}
