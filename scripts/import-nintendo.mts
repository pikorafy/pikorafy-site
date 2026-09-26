// Nintendo eShop (Switch, Europe) → Supabase (`nintendo_games`).
//
// Usage (Node ≥ 23.6 runs .mts directly):
//   node scripts/import-nintendo.mts run          catalog + prices (default)
//   node scripts/import-nintendo.mts prices       prices only (faster refresh)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. No Nintendo key: both sources are public.
//
// Two sources:
//  - Nintendo Europe's search index (Solr, the one nintendo.com's own game search uses)
//    for the catalog, in English: titles, art, genres, release dates, NSUIDs.
//  - The eShop price endpoint for Spain (EUR), 50 NSUIDs per request.
// Both are unofficial: they can change without notice, so the run logs what it sees
// (field names, platform values, sales statuses) and fails loudly on empty results.

import { createClient } from "@supabase/supabase-js";

const CATALOG_URL = "https://searching.nintendo-europe.com/en/select";
const CATALOG_PAGE = 1000;
const PRICE_URL = "https://api.ec.nintendo.com/v1/price";
const PRICE_BATCH = 50;
const COUNTRY = "ES";
const MIN_CATALOG = 1000;
const MAX_RELEASE_DATE = `${new Date().getUTCFullYear() + 3}-12-31`;            // fewer Switch games than this = something broke; don't write

const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

// ─── Catalog ─────────────────────────────────────────────────────────────────

type SolrValue = string | number | boolean | string[] | number[] | undefined;
type SolrDoc = Record<string, SolrValue>;

const str = (v: SolrValue): string | null =>
  v === undefined || v === null ? null : Array.isArray(v) ? (v.length ? String(v[0]) : null) : String(v);
const strs = (v: SolrValue): string[] => (Array.isArray(v) ? v.map(String) : v === undefined ? [] : [String(v)]);
const https = (u: string | null) => (u ? (u.startsWith("//") ? `https:${u}` : u) : null);

async function fetchJson<T>(url: string, what: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) return (await res.json()) as T;
    if (attempt >= 3) throw new Error(`${what} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    await sleep(5_000 * 2 ** attempt);
  }
}

async function fetchCatalog(): Promise<SolrDoc[]> {
  const docs: SolrDoc[] = [];
  for (let start = 0; ; start += CATALOG_PAGE) {
    const qs = new URLSearchParams({ q: "*", fq: "type:GAME", rows: String(CATALOG_PAGE), start: String(start), wt: "json" });
    const body = await fetchJson<{ response?: { numFound?: number; docs?: SolrDoc[] } }>(`${CATALOG_URL}?${qs}`, "Catalog");
    const page = body.response?.docs ?? [];
    if (start === 0) {
      console.log(`Catalog: ${body.response?.numFound ?? "?"} GAME documents.`);
      if (page[0]) console.log(`Catalog fields: ${Object.keys(page[0]).sort().join(", ")}`);
    }
    docs.push(...page);
    if (page.length < CATALOG_PAGE) break;
    await sleep(300);
  }
  return docs;
}

/** Switch / Switch 2 games sold on the eShop (have an NSUID). */
function isSwitch(d: SolrDoc): boolean {
  const hay = [...strs(d.system_type), ...strs(d.system_names_txt), ...strs(d.playable_on_txt)].join(" ").toLowerCase();
  return /switch|\bhac\b|\bbee\b/.test(hay) && strs(d.nsuid_txt).some((n) => /^7001\d{10}$/.test(n));
}

function platformsOf(d: SolrDoc): string[] {
  const names = strs(d.system_names_txt).filter((n) => /switch/i.test(n));
  return names.length ? [...new Set(names)] : ["Nintendo Switch"];
}

function releaseDate(d: SolrDoc): string | null {
  const raw = str(d.dates_released_dts) ?? str(d.date_from);
  if (!raw) return null;
  const date = raw.slice(0, 10);
  // Placeholder far-future dates ("TBA" is stored as e.g. 2050-12-31) aren't release dates.
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= MAX_RELEASE_DATE ? date : null;
}

function slugify(name: string): string {
  return name
    .replace(/[™®©]/g, "")
    .replace(/['’]/g, "")
    .replace(/(\d)[.,](?=\d)/g, "$1")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function existingSlugs(): Promise<Map<string, string>> {
  const slugs = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("nintendo_games").select("nsuid, slug").order("nsuid").range(from, from + 999);
    if (error) throw new Error(`nintendo_games read: ${error.message}`);
    for (const r of data ?? []) slugs.set(r.nsuid as string, r.slug as string);
    if (!data || data.length < 1000) break;
  }
  return slugs;
}

async function importCatalog(): Promise<number> {
  const all = await fetchCatalog();
  const games = all.filter(isSwitch);

  // What the index calls platforms, so the Switch filter can be checked in the log.
  const systems = new Map<string, number>();
  for (const d of all) for (const s of strs(d.system_type)) systems.set(s, (systems.get(s) ?? 0) + 1);
  console.log(`System types: ${[...systems].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([s, n]) => `${s}(${n})`).join(", ")}`);
  console.log(`Switch games with an NSUID: ${games.length} of ${all.length}.`);
  if (games.length < MIN_CATALOG) throw new Error(`Only ${games.length} Switch games found; not writing. Check the fields above.`);

  // Popularity: the index's hit counter (hits_i), then newest first.
  const hits = (d: SolrDoc) => (typeof d.hits_i === "number" ? d.hits_i : 0);
  const ordered = [...games].sort((a, b) =>
    hits(b) - hits(a) || (releaseDate(b) ?? "").localeCompare(releaseDate(a) ?? ""));

  const slugs = await existingSlugs();
  const taken = new Set(slugs.values());
  const now = new Date().toISOString();
  const rows = new Map<string, Record<string, unknown>>();
  ordered.forEach((d, i) => {
    const nsuid = strs(d.nsuid_txt).find((n) => /^7001\d{10}$/.test(n))!;
    if (rows.has(nsuid)) return;                   // bundles / re-listings sharing an NSUID
    const title = (str(d.title) ?? "").trim();
    if (!title) return;
    let slug = slugs.get(nsuid);
    if (!slug) {
      const base = slugify(title) || nsuid;
      slug = taken.has(base) ? `${base}-${nsuid.slice(-6)}` : base;
      taken.add(slug);
    }
    rows.set(nsuid, {
      nsuid,
      fs_id: str(d.fs_id),
      slug,
      title,
      developer: str(d.developer),
      publisher: str(d.publisher),
      excerpt: str(d.excerpt),
      genres: strs(d.pretty_game_categories_txt),
      platforms: platformsOf(d),
      release_date: releaseDate(d),
      image_wide: https(str(d.image_url_h2x1_s) ?? str(d.image_url)),
      image_square: https(str(d.image_url_sq_s)),
      url_path: str(d.url),
      popularity: i + 1,
      catalog_at: now,
    });
  });

  const list = [...rows.values()];
  for (let i = 0; i < list.length; i += 500) {
    const { error } = await supabase.from("nintendo_games").upsert(list.slice(i, i + 500), { onConflict: "nsuid" });
    if (error) throw new Error(`nintendo_games upsert: ${error.message}`);
  }
  const sample = list[0];
  console.log(`Catalog saved: ${list.length} games. #1: ${sample?.title} (${sample?.nsuid}), ${sample?.genres}, ${sample?.release_date}, ${sample?.url_path}`);
  console.log(`Top 10 by hits: ${list.slice(0, 10).map((r) => r.title).join(" · ")}`);
  return list.length;
}

// ─── Prices ──────────────────────────────────────────────────────────────────

interface PriceAmount { raw_value?: string; currency?: string }
interface PriceEntry {
  title_id?: number;
  sales_status?: string;
  regular_price?: PriceAmount;
  discount_price?: PriceAmount & { end_datetime?: string };
}

async function importPrices(): Promise<void> {
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("nintendo_games").select("nsuid").order("popularity").range(from, from + 999);
    if (error) throw new Error(`nintendo_games read: ${error.message}`);
    ids.push(...(data ?? []).map((r) => r.nsuid as string));
    if (!data || data.length < 1000) break;
  }

  const statuses = new Map<string, number>();
  const now = new Date().toISOString();
  let priced = 0;
  for (let i = 0; i < ids.length; i += PRICE_BATCH) {
    const batch = ids.slice(i, i + PRICE_BATCH);
    const qs = new URLSearchParams({ country: COUNTRY, lang: "en", ids: batch.join(",") });
    const body = await fetchJson<{ prices?: PriceEntry[] }>(`${PRICE_URL}?${qs}`, "Price");
    const updates = (body.prices ?? []).filter((p) => p.title_id).map((p) => {
      const status = p.sales_status ?? "unknown";
      statuses.set(status, (statuses.get(status) ?? 0) + 1);
      const regular = p.regular_price?.raw_value !== undefined ? Number(p.regular_price.raw_value) : null;
      const sale = p.discount_price?.raw_value !== undefined ? Number(p.discount_price.raw_value) : null;
      const price = sale ?? regular;
      if (price !== null) priced++;
      return {
        nsuid: String(p.title_id),
        sales_status: status,
        price,
        regular_price: regular,
        discount_pct: sale !== null && regular ? Math.round((1 - sale / regular) * 100) : 0,
        discount_ends_at: p.discount_price?.end_datetime ?? null,
        currency: p.regular_price?.currency ?? null,
        is_free: regular === 0,
        price_at: now,
      };
    });
    // Update only (rows the catalog created), one call per batch.
    const { error } = await supabase.rpc("apply_nintendo_prices", { rows: updates });
    if (error) throw new Error(`apply_nintendo_prices: ${error.message}`);
    if ((i / PRICE_BATCH) % 40 === 39) console.log(`Prices: ${Math.min(i + PRICE_BATCH, ids.length)}/${ids.length}`);
    await sleep(250);
  }
  console.log(`Prices: ${priced} priced of ${ids.length}. Sales status: ${[...statuses].map(([s, n]) => `${s}(${n})`).join(", ")}`);
  if (ids.length && !statuses.size) throw new Error("The price endpoint returned nothing.");
}

// ─── Entry ───────────────────────────────────────────────────────────────────

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const [cmd = "run"] = process.argv.slice(2);
switch (cmd) {
  case "run":
    await importCatalog();
    await importPrices();
    break;
  case "prices":
    await importPrices();
    break;
  default:
    console.error("Usage: import-nintendo.mts run | prices");
    process.exit(1);
}
// Linking to Steam games (link_nintendo_games) comes later, once /nintendo is live.
const { data: sizeMb } = await supabase.rpc("db_size_mb");
console.log(`Database: ${sizeMb} MB.`);
