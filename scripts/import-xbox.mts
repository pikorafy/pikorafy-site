// Xbox / Microsoft Store → Supabase (`xbox_games`), listed on /xbox.
//
// Usage (Node ≥ 23.6 runs .mts directly):
//   node scripts/import-xbox.mts run [perPlatform] [openXblPages]   (defaults 500, 0)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENXBL_API_KEY (only with openXblPages > 0)
//
// Sources:
//  - xbox.com's "browse all games" service (emerald.xboxservices.com), Spanish store, most
//    popular first, 25 a page: the top N console games (Xbox Series X|S / One) and the top N
//    PC games (N = perPlatform, 500 for now: a limited sample while we're on the free
//    database plan; the store has ~12,800 console and ~5,500 PC games). Merged in list order,
//    that order is our popularity rank.
//  - The public Game Pass catalogs, to tag Game Pass games.
//  - Microsoft's public Store catalog (displaycatalog) for details and EUR prices,
//    20 products per request.
//  - OpenXBL marketplace lists: optional, off by default (the browse list covers them).
//
// Light on the database: the top games are checked every run, the rest once a day (a
// quarter of them per 6-hourly run); only products whose content changed are written, and
// ranks only when a game moved noticeably (apply_xbox_ranks).

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const MARKET = "ES";
const CURRENCY = "EUR";
const LANGUAGE = "en-us";            // English text for the English site
const LISTS = ["most-played", "top-paid", "best-rated", "deals", "new", "coming-soon"] as const;
const DETAILS_BATCH = 20;
const BROWSE_PAGE = 25;
const BROWSE_DELAY_MS = 350;
const HOT_RANKS = 1000;              // checked every run; the rest once a day
const SLICES = 4;                    // runs a day (every 6h): each one checks a quarter of the rest

const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
const XBL_KEY = process.env.OPENXBL_API_KEY?.trim() ?? "";

// ─── OpenXBL discovery ───────────────────────────────────────────────────────

interface Discovered {
  productId: string;
  title: string;
  lists: Set<string>;
  firstSeen: number;               // global order across lists → popularity rank
  availableOn: string[];
}

let xblSpent = 0;

async function xbl<T>(path: string): Promise<T> {
  if (!XBL_KEY) throw new Error("OPENXBL_API_KEY is not set");
  const res = await fetch(`https://api.xbl.io/v2${path}`, {
    headers: { "X-Authorization": XBL_KEY, Accept: "application/json" },
  });
  xblSpent++;
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (remaining !== null && Number(remaining) < 10) throw new Error(`OpenXBL quota nearly spent (${remaining} left)`);
  if (!res.ok) throw new Error(`OpenXBL ${path.split("?")[0]} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

interface XblListPage {
  content?: {
    channels?: Record<string, { products?: { productId: string }[]; encodedCT?: string }>;
    productSummaries?: { productId: string; title?: string; availableOn?: string[] }[];
  };
}

// ─── xbox.com browse (primary discovery) ─────────────────────────────────────
//
// The service behind xbox.com/games/all-games. POST with a base64 filter ("{}" = every
// game); the next page's token is channel.encodedCT, sent back as EncodedCT. It needs an
// MS-CV correlation header like the site sends.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PLATFORM_FILTERS = {
  console: { PlayWith: { id: "PlayWith", choices: [{ id: "XboxSeriesX|S" }, { id: "XboxOne" }] } },
  pc: { PlayWith: { id: "PlayWith", choices: [{ id: "PC" }] } },
} as const;

/** The top `max` product ids of one filtered browse list, in order. */
async function browseList(filter: object, max: number, label: string): Promise<{ ids: string[]; summaries: Map<string, { title?: string; availableOn?: string[] }> }> {
  const filters = Buffer.from(JSON.stringify(filter)).toString("base64");
  const ids: string[] = [];
  const summaries = new Map<string, { title?: string; availableOn?: string[] }>();
  let token: string | null = null, pages = 0, total = 0;
  while (ids.length < max) {
    const res = await fetch(`https://emerald.xboxservices.com/xboxcomfd/browse?locale=es-ES`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", Accept: "application/json", "x-ms-api-version": "1.1",
        "MS-CV": `${Math.random().toString(36).slice(2, 18).padEnd(16, "0")}.0`,
        Origin: "https://www.xbox.com", Referer: "https://www.xbox.com/",
      },
      body: JSON.stringify({ Filters: filters, ReturnFilters: false, ChannelKeyToBeUsedInResponse: `BROWSE_CHANNELID=_FILTERS=${filters}`, ChannelId: "", ...(token ? { EncodedCT: token } : {}) }),
    });
    if (!res.ok) throw new Error(`browse ${label} page ${pages + 1}: HTTP ${res.status}`);
    const body = (await res.json()) as {
      channels?: Record<string, { products?: { productId: string }[]; encodedCT?: string; totalItems?: number }>;
      productSummaries?: { productId: string; title?: string; availableOn?: string[] }[];
    };
    const channel = Object.values(body.channels ?? {})[0];
    for (const s of body.productSummaries ?? []) summaries.set(s.productId, s);
    const page = (channel?.products ?? []).map((p) => p.productId);
    ids.push(...page);
    pages++;
    total = channel?.totalItems ?? total;
    if (!channel?.encodedCT || page.length < BROWSE_PAGE) break;
    token = channel.encodedCT;
    await sleep(BROWSE_DELAY_MS);
  }
  console.log(`xbox.com browse, ${label}: ${pages} pages, ${Math.min(ids.length, max)} games (store total ${total}).`);
  if (ids.length < Math.min(max, 500)) throw new Error(`browse ${label} found only ${ids.length} games; not trusting it`);
  return { ids: ids.slice(0, max), summaries };
}

/** Top `perPlatform` console and PC games, interleaved so both lists' leaders rank first. */
async function discoverBrowse(d: Discovery, perPlatform: number) {
  const consoleList = await browseList(PLATFORM_FILTERS.console, perPlatform, "console");
  const pcList = await browseList(PLATFORM_FILTERS.pc, perPlatform, "PC");
  for (let i = 0; i < perPlatform; i++) {
    for (const [list, name] of [[consoleList, "console"], [pcList, "pc"]] as const) {
      const id = list.ids[i];
      if (!id) continue;
      const s = list.summaries.get(id);
      d.add(id, name, s?.title, s?.availableOn ?? []);
    }
  }
  console.log(`Discovered ${d.found.size} distinct games (console and PC lists overlap).`);
}

// ─── Game Pass (tags) ────────────────────────────────────────────────────────
//
// The public Game Pass catalogs, to tag which games are in Game Pass.

const GAME_PASS_LISTS = {
  "game-pass-console": "f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e",
  "game-pass-pc": "fdd9e2a7-0fee-49f6-ad69-4354098401ff",
} as const;

class Discovery {
  found = new Map<string, Discovered>();
  private order = 0;

  add(id: string, list: string, title?: string, availableOn: string[] = []) {
    const existing = this.found.get(id);
    if (existing) {
      existing.lists.add(list);
      if (!existing.availableOn.length && availableOn.length) existing.availableOn = availableOn;
      return false;
    }
    this.found.set(id, { productId: id, title: title ?? id, lists: new Set([list]), firstSeen: this.order++, availableOn });
    return true;
  }
}

async function discoverGamePass(d: Discovery) {
  for (const [list, sigl] of Object.entries(GAME_PASS_LISTS)) {
    try {
      const url = `https://catalog.gamepass.com/sigls/v2?id=${sigl}&language=en-us&market=${MARKET}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { id?: string; siglId?: string }[];
      const ids = body.map((e) => e.id).filter((id): id is string => !!id);    // first entry is the list header
      let added = 0;
      for (const id of ids) if (d.add(id, list)) added++;
      console.log(`${list}: ${ids.length} products, ${added} new`);
    } catch (err) {
      console.warn(`${list}: failed (${String(err)})`);
    }
  }
}

async function discover(pagesPerList: number, d = new Discovery()): Promise<Map<string, Discovered>> {
  const found = d.found;

  for (const list of LISTS) {
    let token: string | undefined;
    for (let page = 0; page < pagesPerList; page++) {
      const qs = token ? `?continuationToken=${encodeURIComponent(token)}` : "";
      const body = await xbl<XblListPage>(`/marketplace/${list}${qs}`);
      const channel = Object.values(body.content?.channels ?? {})[0];
      const ids = (channel?.products ?? []).map((p) => p.productId);
      const summaries = new Map((body.content?.productSummaries ?? []).map((s) => [s.productId, s]));

      let fresh = 0;
      for (const id of ids) {
        const s = summaries.get(id);
        if (d.add(id, list, s?.title, s?.availableOn ?? [])) fresh++;
      }
      console.log(`${list} page ${page + 1}: ${ids.length} products, ${fresh} new`);

      // Stop paging if the list ended or the token param isn't honoured (same page again).
      if (!channel?.encodedCT || channel.encodedCT === token || (page > 0 && fresh === 0)) break;
      token = channel.encodedCT;
    }
  }
  console.log(`OpenXBL lists done (${xblSpent} requests). Total discovered: ${found.size}.`);
  return found;
}

// ─── Microsoft Store catalog (details + EUR prices) ──────────────────────────

interface CatalogImage { ImagePurpose?: string; Uri?: string; Width?: number; Height?: number }
interface CatalogVideo { HLS?: string; Caption?: string; PreviewImage?: { Uri?: string } }
interface CatalogProduct {
  ProductId: string;
  ProductKind?: string;
  LocalizedProperties?: {
    ProductTitle?: string; ShortDescription?: string; DeveloperName?: string; PublisherName?: string;
    Images?: CatalogImage[]; CMSVideos?: CatalogVideo[];
  }[];
  MarketProperties?: { OriginalReleaseDate?: string; UsageData?: { AggregateTimeSpan?: string; AverageRating?: number; RatingCount?: number }[] }[];
  Properties?: { Category?: string; Categories?: string[] | null };
  DisplaySkuAvailabilities?: {
    Sku?: { Properties?: { IsTrial?: boolean } };
    Availabilities?: {
      Actions?: string[];
      Remediations?: { Type?: string; BigId?: string }[] | null;
      Properties?: { MerchandisingTags?: string[] };
      Conditions?: { ClientConditions?: { AllowedPlatforms?: { PlatformName?: string }[] } };
      OrderManagementData?: { Price?: { ListPrice?: number; MSRP?: number; CurrencyCode?: string } };
    }[];
  }[];
}

async function catalog(ids: string[]): Promise<CatalogProduct[]> {
  const url = `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${ids.join(",")}&market=${MARKET}&languages=${LANGUAGE}&MS-CV=pikorafy.1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`displaycatalog HTTP ${res.status}`);
  const body = (await res.json()) as { Products?: CatalogProduct[] };
  return body.Products ?? [];
}

const https = (u?: string) => (u ? (u.startsWith("//") ? `https:${u}` : u) : null);

function pickImage(images: CatalogImage[], purposes: string[]): string | null {
  for (const p of purposes) {
    const img = images.find((i) => i.ImagePurpose?.toLowerCase() === p.toLowerCase() && i.Uri);
    if (img) return https(img.Uri);
  }
  return null;
}

const PLATFORM_NAMES: Record<string, string> = {
  "Windows.Xbox": "Xbox",
  "Windows.Desktop": "PC",
  "Windows.Universal": "PC",
};

function mapProduct(p: CatalogProduct, d: Discovered | undefined) {
  const lp = p.LocalizedProperties?.[0] ?? {};
  const images = lp.Images ?? [];
  const mp = p.MarketProperties?.[0];
  const usage = mp?.UsageData?.find((u) => u.AggregateTimeSpan === "AllTime") ?? mp?.UsageData?.[0];

  // Cheapest public purchasable availability of the first non-trial SKU. Subscription
  // entitlements (Game Pass / EA Play: €0 with an "Upsell" remediation, or tagged
  // "LegacyVault" / "LegacyDiscount…") are member-only prices, not the store price.
  const sku = p.DisplaySkuAvailabilities?.find((s) => !s.Sku?.Properties?.IsTrial) ?? p.DisplaySkuAvailabilities?.[0];
  const purchasable = (sku?.Availabilities ?? []).filter((a) =>
    a.Actions?.includes("Purchase") &&
    a.OrderManagementData?.Price?.CurrencyCode === CURRENCY &&
    !a.Remediations?.length &&
    !a.Properties?.MerchandisingTags?.some((t) => t.startsWith("Legacy")));
  const offer = purchasable.sort((a, b) => (a.OrderManagementData!.Price!.ListPrice ?? 0) - (b.OrderManagementData!.Price!.ListPrice ?? 0))[0];
  const price = offer?.OrderManagementData?.Price;
  const list = price?.ListPrice ?? null;
  const msrp = price?.MSRP ?? null;

  const catalogPlatforms = new Set(
    (sku?.Availabilities ?? []).flatMap((a) => a.Conditions?.ClientConditions?.AllowedPlatforms ?? [])
      .map((pl) => PLATFORM_NAMES[pl.PlatformName ?? ""]).filter(Boolean),
  );
  // OpenXBL's summary distinguishes Series X|S from One; the catalog only says "Xbox".
  const platforms = d?.availableOn.length ? d.availableOn : [...catalogPlatforms];

  const title = (lp.ProductTitle ?? d?.title ?? p.ProductId).trim();
  const categories = [...new Set([...(p.Properties?.Categories ?? []), p.Properties?.Category].filter((c): c is string => !!c))];

  return {
    product_id: p.ProductId,
    title,
    developer: lp.DeveloperName || null,
    publisher: lp.PublisherName || null,
    short_description: lp.ShortDescription?.trim() || null,
    categories,
    platforms,
    release_date: mp?.OriginalReleaseDate ? mp.OriginalReleaseDate.slice(0, 10) : null,
    rating: usage?.AverageRating ?? null,
    rating_count: usage?.RatingCount ?? null,
    box_art: pickImage(images, ["BoxArt", "Poster"]),
    hero_art: pickImage(images, ["SuperHeroArt", "TitledHeroArt", "Screenshot"]),
    screenshots: images.filter((i) => i.ImagePurpose === "Screenshot" && i.Uri).slice(0, 12).map((i) => https(i.Uri)),
    trailers: (lp.CMSVideos ?? []).filter((v) => v.HLS).slice(0, 4).map((v) => ({
      name: v.Caption ?? "Trailer", hls: v.HLS, thumb: https(v.PreviewImage?.Uri),
    })),
    price: list,
    regular_price: msrp,
    discount_pct: list !== null && msrp && msrp > list ? Math.round((1 - list / msrp) * 100) : 0,
    currency: price?.CurrencyCode ?? null,
    is_free: list === 0,
    raw: slimRaw(p),
  };
}

// ─── Subscriptions (Game Pass tiers, EA Play…) ────────────────────────────────
//
// A product included with a subscription carries an "Upsell" remediation pointing
// at the subscription's own Store product. Resolve those ids to names.

async function resolveSubscriptions() {
  // refresh_xbox_catalog() has already copied each product's upsell ids into `subscriptions`.
  const { data: rows } = await supabase.from("xbox_games").select("subscriptions").neq("subscriptions", "{}").limit(5000);
  const ids = new Set((rows ?? []).flatMap((r) => (r.subscriptions as string[]) ?? []));
  const list = [...ids];
  const names: { big_id: string; name: string; updated_at: string }[] = [];
  for (let i = 0; i < list.length; i += DETAILS_BATCH) {
    try {
      for (const p of await catalog(list.slice(i, i + DETAILS_BATCH))) {
        const name = p.LocalizedProperties?.[0]?.ProductTitle?.trim();
        if (name) names.push({ big_id: p.ProductId, name, updated_at: new Date().toISOString() });
      }
    } catch (err) {
      console.warn(`subscription lookup: ${String(err)}`);
    }
  }
  if (names.length) {
    const { error } = await supabase.from("xbox_subscriptions").upsert(names, { onConflict: "big_id" });
    if (error) console.warn(`xbox_subscriptions upsert: ${error.message}`);
  }
  console.log(`Subscriptions: ${names.map((n) => `${n.big_id}=${n.name}`).join(", ") || "none"}`);
}

/**
 * Only what the site reads back from `raw`: images (key art) and SKU availabilities
 * (prices and Game Pass / EA Play entitlements, see refresh_xbox_catalog()). The full
 * Store response is ~20 KB per product and kept the table 10× larger than needed.
 */
function slimRaw(p: CatalogProduct) {
  return {
    ProductId: p.ProductId,
    LocalizedProperties: [{ Images: p.LocalizedProperties?.[0]?.Images ?? [] }],
    DisplaySkuAvailabilities: (p.DisplaySkuAvailabilities ?? []).map((s) => ({
      Sku: { Properties: { IsTrial: s.Sku?.Properties?.IsTrial } },
      Availabilities: (s.Availabilities ?? []).map((a) => ({
        Actions: a.Actions,
        Remediations: a.Remediations ?? undefined,
        Properties: { MerchandisingTags: a.Properties?.MerchandisingTags },
        OrderManagementData: { Price: a.OrderManagementData?.Price },
        Conditions: { ClientConditions: a.Conditions?.ClientConditions },
      })),
    })),
  };
}

// ─── Slugs ───────────────────────────────────────────────────────────────────

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

// ─── Run ─────────────────────────────────────────────────────────────────────

async function run(perPlatform: number, pagesPerList: number) {
  // Order matters: popularity_rank = discovery order. xbox.com's browse list is ranked
  // by popularity; Game Pass and the optional OpenXBL lists only add tags after it.
  const d = new Discovery();
  await discoverBrowse(d, perPlatform);
  await discoverGamePass(d);
  if (pagesPerList > 0) await discover(pagesPerList, d);
  const found = d.found;

  // What we already have: slugs stay stable, hashes tell what changed.
  const existing = new Map<string, { slug: string; hash: string | null; rank: number | null }>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("xbox_games")
      .select("product_id, slug, content_hash, popularity_rank").order("product_id").range(from, from + 999);
    if (error) throw new Error(`xbox_games read: ${error.message}`);
    for (const r of data ?? []) existing.set(r.product_id as string, { slug: r.slug as string, hash: r.content_hash as string | null, rank: r.popularity_rank as number | null });
    if ((data ?? []).length < 1000) break;
  }
  const taken = new Set([...existing.values()].map((e) => e.slug));

  // Which products to look up this run: new ones, the top HOT_RANKS, and this run's quarter
  // of the rest (so every game is checked once a day with four runs a day).
  const slice = Math.floor(new Date().getTime() / (6 * 3_600_000)) % SLICES;
  const sliceOf = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % SLICES;
  const ids = [...found.values()]
    .filter((g) => !existing.has(g.productId) || g.firstSeen < HOT_RANKS || sliceOf(g.productId) === slice)
    .map((g) => g.productId);
  console.log(`Checking ${ids.length} of ${found.size} products this run (slice ${slice + 1}/${SLICES}; ${[...found.keys()].filter((id) => !existing.has(id)).length} new).`);

  let written = 0, unchanged = 0, withPrice = 0, failedBatches = 0, skippedKinds = 0;
  const checked = new Set<string>();
  for (let i = 0; i < ids.length; i += DETAILS_BATCH) {
    const batch = ids.slice(i, i + DETAILS_BATCH);
    let products: CatalogProduct[];
    try {
      products = await catalog(batch);
    } catch (err) {
      failedBatches++;
      console.warn(`catalog batch ${i / DETAILS_BATCH + 1}: ${String(err)}`);
      if (failedBatches >= 15 && written + unchanged === 0) throw new Error("catalog keeps failing; stopping");
      continue;
    }

    const rows = [];
    for (const p of products) {
      if (p.ProductKind && p.ProductKind !== "Game") { skippedKinds++; continue; }
      checked.add(p.ProductId);
      const g = found.get(p.ProductId);
      const row = mapProduct(p, g);
      if (row.price !== null) withPrice++;
      const before = existing.get(p.ProductId);
      let slug = before?.slug;                                  // keep existing slugs stable
      if (!slug) {
        slug = slugify(row.title) || p.ProductId.toLowerCase();
        if (taken.has(slug)) slug = `${slug}-${p.ProductId.toLowerCase()}`;
        taken.add(slug);
      }
      const content = {
        ...row,
        slug,
        lists: g ? [...g.lists].sort() : [],
        store_url: `https://www.xbox.com/es-ES/games/store/${slug}/${p.ProductId}`,
      };
      const hash = createHash("sha1").update(JSON.stringify(content)).digest("hex");
      if (before?.hash === hash) { unchanged++; continue; }
      rows.push({ ...content, content_hash: hash, popularity_rank: g ? g.firstSeen + 1 : null, fetched_at: new Date().toISOString() });
    }

    if (rows.length) {
      const { error } = await supabase.from("xbox_games").upsert(rows, { onConflict: "product_id" });
      if (error) throw new Error(`xbox_games upsert: ${error.message}`);
      written += rows.length;
    }
  }

  // Ranks of everything we list, changed only when a game moved noticeably.
  const ranks = [...found.values()].filter((g) => existing.has(g.productId) || checked.has(g.productId))
    .map((g) => ({ product_id: g.productId, rank: g.firstSeen + 1 }));
  let rankMoves = 0;
  for (let i = 0; i < ranks.length; i += 2000) {
    const { data, error } = await supabase.rpc("apply_xbox_ranks", { rows: ranks.slice(i, i + 2000) });
    if (error) console.warn(`apply_xbox_ranks: ${error.message}`);
    else rankMoves += (data as number) ?? 0;
  }

  // Products no longer listed (fell out of the top N, left Game Pass) are dropped, unless
  // discovery came back suspiciously small (a failed browse must not empty the catalog).
  const gone = [...existing.keys()].filter((id) => !found.has(id));
  let removed = 0;
  if (gone.length && found.size >= Math.min(perPlatform, 200)) {
    for (let i = 0; i < gone.length; i += 200) {
      const { error } = await supabase.from("xbox_games").delete().in("product_id", gone.slice(i, i + 200));
      if (error) { console.warn(`xbox_games delete: ${error.message}`); break; }
      removed += Math.min(200, gone.length - i);
    }
  }
  console.log(`Removed ${removed} products no longer listed.`);

  // Group editions, pick each group's primary product, match groups to Steam games.
  const { data: linked, error: linkError } = await supabase.rpc("refresh_xbox_catalog");
  if (linkError) console.warn(`refresh_xbox_catalog: ${linkError.message}`);
  await resolveSubscriptions();

  console.log(`Checked ${checked.size} games (${withPrice} with a price, ${skippedKinds} non-games skipped): ${written} written, ${unchanged} unchanged, ${rankMoves} rank moves, ${failedBatches} catalog batches failed, ${xblSpent} OpenXBL requests, ${linked ?? "?"} linked to Steam.`);
  if (checked.size === 0) process.exit(1);
}

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case "run": await run(Number(arg) || 500, Number(process.argv[4] ?? 0)); break;
  default:
    console.error("Usage: import-xbox.mts run [perPlatform] [openXblPages]");
    process.exit(1);
}
