// Read-only probe: can we read the PlayStation Store (Spain) straight from store.playstation.com?
// Loads two browse pages and one product page, and logs whether they load (or get blocked)
// and what data is embedded in them. Writes nothing.
//
//   node scripts/probe-playstation.mts

const BASE = "https://store.playstation.com/es-es";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
const isObj = (v: Json): v is { [k: string]: Json } => !!v && typeof v === "object" && !Array.isArray(v);

/** Every object in the tree (the page's embedded data is one big nested JSON). */
function* walk(v: Json): Generator<{ [k: string]: Json }> {
  if (Array.isArray(v)) for (const x of v) yield* walk(x);
  else if (isObj(v)) {
    yield v;
    for (const x of Object.values(v)) yield* walk(x);
  }
}

/** JSON blobs embedded in the page: Next.js data and any application/json scripts. */
function embeddedJson(html: string): { id: string; data: Json }[] {
  const out: { id: string; data: Json }[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    const attrs = m[1];
    if (!/application\/(ld\+)?json/i.test(attrs) && !/__NEXT_DATA__/.test(attrs)) continue;
    const id = attrs.match(/id=["']([^"']+)["']/)?.[1] ?? attrs.match(/type=["']([^"']+)["']/)?.[1] ?? "script";
    try {
      out.push({ id, data: JSON.parse(m[2]) as Json });
    } catch {
      out.push({ id: `${id} (unparsable, ${m[2].length} chars)`, data: null });
    }
  }
  return out;
}

async function probe(label: string, url: string): Promise<string | null> {
  console.log(`\n=== ${label}: ${url}`);
  let res: Response;
  try {
    res = await fetch(url, { headers: HEADERS, redirect: "follow" });
  } catch (err) {
    console.log(`  failed: ${String(err)}`);
    return null;
  }
  const html = await res.text();
  console.log(`  HTTP ${res.status}, ${html.length} chars, final URL ${res.url}`);
  const blocked = /access denied|request blocked|captcha|akamai|incapsula|cf-chl|are you a robot/i.exec(html);
  if (blocked) console.log(`  possible block page: matched "${blocked[0]}"`);
  console.log(`  <title>: ${html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "-"}`);

  const ids = [...new Set(html.match(/[A-Z]{2}\d{4}-[A-Z]{4}\d{5}_00-[A-Z0-9]{16}/g) ?? [])];
  console.log(`  product ids in page: ${ids.length}${ids.length ? ` e.g. ${ids.slice(0, 3).join(", ")}` : ""}`);
  console.log(`  "€" occurrences: ${(html.match(/€/g) ?? []).length}`);

  const blobs = embeddedJson(html);
  console.log(`  embedded JSON blobs: ${blobs.map((b) => b.id).join(", ") || "none"}`);
  for (const b of blobs) {
    if (!b.data) continue;
    const types = new Map<string, number>();
    const priced: { [k: string]: Json }[] = [];
    for (const o of walk(b.data)) {
      const t = typeof o.__typename === "string" ? o.__typename : null;
      if (t) types.set(t, (types.get(t) ?? 0) + 1);
      if (typeof o.name === "string" && (isObj(o.price ?? null) || "basePrice" in o || "discountedPrice" in o)) priced.push(o);
    }
    if (types.size) console.log(`  [${b.id}] __typename counts: ${[...types].sort((a, c) => c[1] - a[1]).slice(0, 15).map(([t, n]) => `${t}(${n})`).join(", ")}`);
    console.log(`  [${b.id}] objects with a name and a price: ${priced.length}`);
    for (const o of priced.slice(0, 3)) console.log(`    sample: ${JSON.stringify(o).slice(0, 700)}`);
    const product = [...walk(b.data)].find((o) => o.__typename === "Product");
    if (product) console.log(`  [${b.id}] first Product keys: ${Object.keys(product).join(", ")}`);
  }
  return html;
}

const browse1 = await probe("Browse page 1", `${BASE}/pages/browse/1`);
await new Promise((r) => setTimeout(r, 2000));
await probe("Browse page 2", `${BASE}/pages/browse/2`);
await new Promise((r) => setTimeout(r, 2000));

const productId = browse1?.match(/[A-Z]{2}\d{4}-[A-Z]{4}\d{5}_00-[A-Z0-9]{16}/)?.[0];
if (productId) await probe("Product page", `${BASE}/product/${productId}`);
else console.log("\nNo product id found on browse page 1; skipping the product page.");
