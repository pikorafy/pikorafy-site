// One-off probe of OpenXBL's marketplace endpoints: prints status, rate-limit
// headers and the shape of each response so we can design the Xbox import.
// Writes nothing. Never prints the API key.
//
// Usage: node scripts/probe-openxbl.mts          (env: OPENXBL_API_KEY)

const KEY = process.env.OPENXBL_API_KEY?.trim();
if (!KEY) throw new Error("Missing env var OPENXBL_API_KEY");

const BASE = "https://api.xbl.io/v2";

async function probe(label: string, path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "X-Authorization": KEY!, Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
  });
  const text = await res.text();
  const limit = ["x-ratelimit-limit", "x-ratelimit-spent", "x-ratelimit-remaining", "x-ratelimit-reset"]
    .map((h) => `${h.replace("x-ratelimit-", "")}=${res.headers.get(h) ?? "-"}`).join(" ");
  console.log(`\n=== ${label}  ${init?.method ?? "GET"} ${path}\nHTTP ${res.status}  rate: ${limit}`);
  let json: unknown;
  try { json = JSON.parse(text); } catch { console.log(text.slice(0, 400)); return null; }
  console.log("shape:", describe(json));
  console.log("sample:", JSON.stringify(firstItem(json), null, 1).slice(0, 2500));
  return json;
}

/** Compact structural summary: keys and array lengths, two levels deep. */
function describe(v: unknown, depth = 0): string {
  if (Array.isArray(v)) return `array[${v.length}]${v.length && depth < 2 ? ` of ${describe(v[0], depth + 1)}` : ""}`;
  if (v && typeof v === "object") {
    const keys = Object.keys(v as object);
    if (depth >= 2) return `{${keys.slice(0, 12).join(", ")}${keys.length > 12 ? ", …" : ""}}`;
    return `{ ${keys.slice(0, 15).map((k) => `${k}: ${describe((v as Record<string, unknown>)[k], depth + 1)}`).join("; ")} }`;
  }
  return typeof v;
}

function firstItem(v: unknown): unknown {
  if (Array.isArray(v)) return v[0];
  if (v && typeof v === "object") {
    for (const val of Object.values(v as object)) if (Array.isArray(val) && val.length) return val[0];
  }
  return v;
}

/** Find the first price-looking object anywhere in a response, to see currency/market. */
function findPrice(v: unknown, path = "$"): string | null {
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as object)) {
      if (/price/i.test(k) && val && typeof val === "object") return `${path}.${k} = ${JSON.stringify(val).slice(0, 300)}`;
      const found = findPrice(val, `${path}.${k}`);
      if (found) return found;
    }
  }
  return null;
}

const deals = await probe("deals (default)", "/marketplace/deals");
console.log("price found:", findPrice(deals));

for (const q of ["?market=ES", "?market=ES&language=es-ES", "?locale=es-ES", "?country=ES"]) {
  const r = await probe(`deals ${q}`, `/marketplace/deals${q}`);
  console.log("price found:", findPrice(r));
}

await probe("most-played", "/marketplace/most-played");
await probe("search (q)", `/marketplace/search?q=${encodeURIComponent("Elden Ring")}`);
await probe("search (query)", `/marketplace/search?query=${encodeURIComponent("Elden Ring")}`);
await probe("autosuggest", `/marketplace/autosuggest?q=${encodeURIComponent("Elden Ring")}`);

// Elden Ring's Microsoft Store product id, to test the details endpoint.
const details = await probe("details (POST)", "/marketplace/details", {
  method: "POST",
  body: JSON.stringify({ products: "9P3J32CTXLRZ" }),
});
console.log("price found:", findPrice(details));
