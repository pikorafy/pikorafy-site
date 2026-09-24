// Xbox / Microsoft Store → Supabase (`xbox_games`), listed on /xbox.
//
// Usage (Node ≥ 23.6 runs .mts directly):
//   node scripts/import-xbox.mts run [openXblPages] [perStoreList]   (defaults 2, 0 = skip Store lists)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENXBL_API_KEY
//
// Two sources:
//  - OpenXBL marketplace lists (most-played, top-paid, deals, …) to discover which
//    games to track. Free key = 150 requests/hour; a run uses ~6 lists × pages.
//  - Microsoft's public Store catalog (displaycatalog) for details and EUR prices,
//    20 products per request. OpenXBL ignores market params (always US/USD), so
//    prices must come from here with market=ES.

import { createClient } from "@supabase/supabase-js";

const MARKET = "ES";
const LANGUAGE = "en-us";            // English text for the English site
const LISTS = ["most-played", "top-paid", "best-rated", "deals", "new", "coming-soon"] as const;
const DETAILS_BATCH = 20;

const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
const XBL_KEY = required("OPENXBL_API_KEY");

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

// ─── Microsoft Store lists + Game Pass (primary discovery) ────────────────────
//
// OpenXBL's list endpoints all return the same 25 products and ignore paging, so
// the main source is the Store's own public recommendation lists (as used by
// xbox.com), which page up to 200 items. Game Pass comes from the public catalog.

const RECO_LISTS = ["MostPlayed", "TopPaid", "TopFree", "BestRated", "New", "Deal"] as const;
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

async function discoverStoreLists(d: Discovery, perList: number) {
  for (const list of RECO_LISTS) {
    let added = 0, seen = 0;
    try {
      for (let skip = 0; skip < perList; skip += 200) {
        const count = Math.min(200, perList - skip);
        const url = `https://reco-public.rec.mp.microsoft.com/channels/Reco/V8.0/Lists/Computed/${list}?Market=${MARKET}&Language=EN&ItemTypes=Game&deviceFamily=Windows.Xbox&count=${count}&skipitems=${skip}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { Items?: { Id?: string }[]; PagingInfo?: { TotalItems?: number } };
        const items = (body.Items ?? []).map((i) => i.Id).filter((id): id is string => !!id);
        seen += items.length;
        for (const id of items) if (d.add(id, list.toLowerCase())) added++;
        if (items.length < count || skip + count >= (body.PagingInfo?.TotalItems ?? Infinity)) break;
      }
      console.log(`Store ${list}: ${seen} products, ${added} new`);
    } catch (err) {
      console.warn(`Store ${list}: failed (${String(err)})`);
    }
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

  // Cheapest purchasable availability of the first non-trial SKU.
  const sku = p.DisplaySkuAvailabilities?.find((s) => !s.Sku?.Properties?.IsTrial) ?? p.DisplaySkuAvailabilities?.[0];
  const purchasable = (sku?.Availabilities ?? []).filter((a) => a.Actions?.includes("Purchase") && a.OrderManagementData?.Price);
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
    raw: p,
    fetched_at: new Date().toISOString(),
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

async function run(pagesPerList: number, perStoreList: number) {
  // Order matters: popularity_rank = discovery order. OpenXBL's lists are the only
  // real popularity signal, so they go first; Game Pass adds breadth after them.
  // (The Store reco lists are unreachable from GitHub runners, so they're opt-in.)
  const d = new Discovery();
  const found = await discover(pagesPerList, d);
  if (perStoreList > 0) await discoverStoreLists(d, perStoreList);
  await discoverGamePass(d);
  const ids = [...found.keys()];

  const { data: existing } = await supabase.from("xbox_games").select("product_id, slug");
  const slugOf = new Map((existing ?? []).map((r) => [r.product_id as string, r.slug as string]));
  const taken = new Set(slugOf.values());

  let saved = 0, withPrice = 0, failedBatches = 0;
  for (let i = 0; i < ids.length; i += DETAILS_BATCH) {
    const batch = ids.slice(i, i + DETAILS_BATCH);
    let products: CatalogProduct[];
    try {
      products = await catalog(batch);
    } catch (err) {
      failedBatches++;
      console.warn(`catalog batch ${i / DETAILS_BATCH + 1}: ${String(err)}`);
      continue;
    }

    const rows = products
      .filter((p) => !p.ProductKind || p.ProductKind === "Game")
      .map((p) => {
        const d = found.get(p.ProductId);
        const row = mapProduct(p, d);
        let slug = slugOf.get(p.ProductId);                   // keep existing slugs stable
        if (!slug) {
          slug = slugify(row.title) || p.ProductId.toLowerCase();
          if (taken.has(slug)) slug = `${slug}-${p.ProductId.toLowerCase()}`;
          taken.add(slug);
          slugOf.set(p.ProductId, slug);
        }
        if (row.price !== null) withPrice++;
        return {
          ...row,
          slug,
          popularity_rank: d ? d.firstSeen + 1 : null,
          lists: d ? [...d.lists] : [],
          store_url: `https://www.xbox.com/es-ES/games/store/${slug}/${p.ProductId}`,
        };
      });

    if (rows.length) {
      const { error } = await supabase.from("xbox_games").upsert(rows, { onConflict: "product_id" });
      if (error) throw new Error(`xbox_games upsert: ${error.message}`);
      saved += rows.length;
    }
  }

  console.log(`Saved ${saved} Xbox games (${withPrice} with a price), ${failedBatches} catalog batches failed, ${xblSpent} OpenXBL requests used.`);
  if (saved === 0) process.exit(1);
}

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case "run": await run(Number(arg ?? 2), Number(process.argv[4] ?? 0)); break;
  default:
    console.error("Usage: import-xbox.mts run [openXblPages] [perStoreList]");
    process.exit(1);
}
