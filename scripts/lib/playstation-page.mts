// Parses a PlayStation Store concept page (store.playstation.com/<locale>/concept/<id>).
//
// The page is server-rendered with Apollo cache snapshots embedded as
// <script type="application/json" id="env:…"> blobs. Each blob holds a normalized cache
// ({"Product:<id>": {...}, "GameCTA:<id>": {...}, "Concept:<id>": {...}}) for one widget; the
// same record appears in several blobs with different fields, so they are merged by key.
//
// What we read, for the concept's default product (the edition its main Buy button sells):
//  - GameCTA records whose id contains the product id carry a `price`:
//      ADD_TO_CART / PREORDER, serviceBranding NONE      → the price anyone pays (maybe discounted)
//      serviceBranding PS_PLUS, value 0, tied to a sub   → included in a PS Plus tier (tierLabel)
//      serviceBranding PS_PLUS, value > 0                → PS Plus member price
//    Values are in cents; endTime is epoch ms; history.lowestRecentPrice is the EU "lowest
//    price in the last 30 days" text.
//  - Media (role + url) on the concept and the product: key art, background, square cover…

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };
const isObj = (v: Json | undefined): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const s = (v: Json | undefined): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const n = (v: Json | undefined): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const ref = (v: Json | undefined): string | null => (isObj(v) ? s(v.__ref) : null);

export interface PsStoreData {
  productId: string;
  npTitleId: string | null;
  storeName: string | null;
  classification: string | null;       // FULL_GAME, PREMIUM_EDITION, BUNDLE…
  platforms: string[];                 // PS4, PS5
  releaseDate: string | null;          // YYYY-MM-DD
  publisher: string | null;
  isAnnounce: boolean;
  salesStatus: "onsale" | "preorder" | "plus_only" | "free" | "unavailable";
  price: number | null;                // EUR
  regularPrice: number | null;
  discountPct: number;
  discountEndsAt: string | null;
  lowest30d: number | null;
  currency: string | null;
  isFree: boolean;
  plusPrice: number | null;
  plusTier: string | null;             // essential | extra | premium
  starRating: number | null;
  ratingCount: number | null;
  images: { wide: string | null; hero: string | null; square: string | null; portrait: string | null; logo: string | null };
  screenshots: string[];
}

/** Merged Apollo cache of every env:* blob in the page. */
export function pageCache(html: string): Map<string, Obj> {
  const cache = new Map<string, Obj>();
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bid\s*=\s*["']env:/.test(m[1])) continue;
    let blob: Json;
    try {
      blob = JSON.parse(m[2]) as Json;
    } catch {
      continue;
    }
    const c = isObj(blob) ? blob.cache : null;
    if (!isObj(c)) continue;
    for (const [k, v] of Object.entries(c)) if (isObj(v)) cache.set(k, { ...(cache.get(k) ?? {}), ...v });
  }
  return cache;
}

const cents = (v: Json | undefined) => (n(v) === null ? null : Math.round(n(v)!) / 100);
/** "Precio más bajo en los últimos 30 días: 49,99 €" → 49.99 */
function euros(text: string | null): number | null {
  const m = text?.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})|\d+(?:[.,]\d{1,2})?)\s*€/);
  if (!m) return null;
  const v = Number(m[1].replace(/[.\s](?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
}
const PLUS_TIERS: Record<string, string> = { TIER_10: "essential", TIER_20: "extra", TIER_30: "premium" };

/** Store image URLs accept ?w= for a smaller rendition. */
const sized = (url: string | null, w: number) =>
  url && /^https:\/\/image\.api\.playstation\.com\//.test(url) && !url.includes("?") ? `${url}?w=${w}` : url;

const TRIAL = /\b(trial|demo|prueba|versi[oó]n de prueba|free trial)\b/i;

/** Buttons for a trial or demo SKU: by button type, offer label, SKU name or SKU id. */
function isTrial(cache: Map<string, Obj>, key: string, cta: Obj): boolean {
  if (/TRIAL|DEMO/i.test(s(cta.type) ?? "")) return true;
  const local = isObj(cta.local) ? cta.local : null;
  if (local && TRIAL.test(s(local.offerLabel) ?? "")) return true;
  const params = isObj(cta.action) && Array.isArray(cta.action.param) ? cta.action.param.filter(isObj) : [];
  const skuId = s(params.find((p) => s(p.name) === "skuId")?.value) ?? key.match(/[A-Z]{2}\d{4}-[A-Z]{4}\d{5}_00-[A-Z0-9]{16}-[A-Z]\d{3}/)?.[0] ?? null;
  if (!skuId) return false;
  const sku = cache.get(`Sku:${skuId}`);
  return TRIAL.test(s(sku?.name) ?? "") || /TRIAL|DEMO/.test(skuId.split("-")[2] ?? "");
}

/** Every price button on the page, for debugging (import-playstation.mts inspect). */
export function describeCtas(html: string): string[] {
  const cache = pageCache(html);
  const out: string[] = [];
  for (const [k, cta] of cache) {
    if (!k.startsWith("GameCTA:")) continue;
    const price = isObj(cta.price) ? cta.price : null;
    const local = isObj(cta.local) ? cta.local : null;
    const params = isObj(cta.action) && Array.isArray(cta.action.param) ? cta.action.param.filter(isObj) : [];
    const skuId = s(params.find((p) => s(p.name) === "skuId")?.value) ?? "";
    out.push([
      `type=${s(cta.type)}`, `sku=${skuId}`, `skuName=${s(cache.get(`Sku:${skuId}`)?.name) ?? "-"}`,
      `offerLabel=${local ? s(local.offerLabel) : "-"}`, `trial=${isTrial(cache, k, cta)}`,
      price ? `price=${n(price.discountedValue)}/${n(price.basePriceValue)} free=${price.isFree} branding=${JSON.stringify(price.serviceBranding)} tier=${s(price.tierLabel)} tied=${price.isTiedToSubscription}` : "no price",
    ].join(" "));
  }
  return out;
}

export function parseConceptPage(html: string, conceptId: string): PsStoreData | null {
  const cache = pageCache(html);
  const concept = cache.get(`Concept:${conceptId}`) ?? [...cache.entries()].find(([k]) => k.startsWith("Concept:"))?.[1];
  if (!concept) return null;
  const productKey = ref(concept.defaultProduct);
  const product = productKey ? cache.get(productKey) : undefined;
  if (!product) return null;
  const productId = s(product.id) ?? productKey!.replace(/^Product:/, "");

  // Prices from the product's call-to-action buttons. A product can have several SKUs
  // (the game, a free trial, a demo), each with its own buttons: trials and demos are skipped,
  // and a paid price beats a free one (a real free-to-play game has no paid SKU).
  let buy: Obj | null = null, preorder = false, plusTier: string | null = null, plusPrice: number | null = null;
  for (const [k, cta] of cache) {
    if (!k.startsWith("GameCTA:") || !k.includes(productId)) continue;
    const price = cta.price;
    if (!isObj(price) || isTrial(cache, k, cta)) continue;
    const branding = Array.isArray(price.serviceBranding) ? price.serviceBranding.map(String) : [];
    const value = n(price.discountedValue);
    if (branding.includes("PS_PLUS")) {
      if (price.isTiedToSubscription === true && value === 0) plusTier = PLUS_TIERS[s(price.tierLabel) ?? ""] ?? "extra";
      else if (value !== null && value > 0) plusPrice = plusPrice === null ? value / 100 : Math.min(plusPrice, value / 100);
      continue;
    }
    if (branding.some((b) => b !== "NONE") || price.isTiedToSubscription === true) continue;   // EA Play, Ubisoft+…
    const current = buy ? n(buy.discountedValue) : null;
    const better = !buy
      || (current === 0 && (value ?? 0) > 0)                                         // paid beats free
      || ((value ?? 0) > 0 && (value ?? Infinity) < (current ?? Infinity));          // else the cheapest paid
    if (better) {
      buy = price;
      preorder = s(cta.type) === "PREORDER" || (isObj(cta.meta) && cta.meta.preOrder === true);
    }
  }

  const regular = buy ? cents(buy.basePriceValue) : null;
  const price = buy ? cents(buy.discountedValue) : null;
  const isFree = !!buy && (buy.isFree === true || regular === 0);
  const ends = buy ? n(Number(s(buy.endTime) ?? NaN)) : null;
  const history = buy && isObj(buy.history) ? buy.history : null;
  const releaseRaw = s(product.releaseDate) ?? (isObj(concept.releaseDate) ? s(concept.releaseDate.value) : null);

  // Media: product first (edition art), then the concept's.
  const media = [product.media, concept.media].flatMap((m) => (Array.isArray(m) ? m.filter(isObj) : []))
    .filter((m) => s(m.type) === "IMAGE" && s(m.url));
  const byRole = (...roles: string[]) => {
    for (const r of roles) {
      const hit = media.find((m) => s(m.role) === r);
      if (hit) return s(hit.url);
    }
    return null;
  };

  return {
    productId,
    npTitleId: s(product.npTitleId),
    storeName: s(product.name) ?? s(concept.name),
    classification: s(product.storeDisplayClassification),
    platforms: (Array.isArray(product.platforms) ? product.platforms : Array.isArray(concept.platforms) ? concept.platforms : [])
      .map(String).filter((p) => /^PS\d$/.test(p)),
    releaseDate: releaseRaw && /^\d{4}-\d{2}-\d{2}/.test(releaseRaw) ? new Date(releaseRaw).toISOString().slice(0, 10) : null,
    publisher: s(product.publisherName) ?? s(concept.publisherName),
    isAnnounce: concept.isAnnounce === true,
    salesStatus: buy ? (preorder ? "preorder" : isFree ? "free" : "onsale") : plusTier ? "plus_only" : "unavailable",
    price,
    regularPrice: regular,
    discountPct: price !== null && regular ? Math.max(0, Math.round((1 - price / regular) * 100)) : 0,
    discountEndsAt: ends && price !== null && regular !== null && price < regular ? new Date(ends).toISOString() : null,
    lowest30d: euros(history ? s(history.lowestRecentPrice) : null),
    currency: buy ? s(buy.currencyCode) : null,
    isFree,
    plusPrice,
    plusTier,
    starRating: isObj(product.starRating) ? n(product.starRating.averageRating) : null,
    ratingCount: isObj(product.starRating) ? n(product.starRating.totalRatingsCount) : null,
    images: {
      wide: sized(byRole("GAMEHUB_COVER_ART", "BACKGROUND", "FOUR_BY_THREE_BANNER"), 960),
      hero: sized(byRole("BACKGROUND", "GAMEHUB_COVER_ART"), 1920),
      square: sized(byRole("MASTER", "EDITION_KEY_ART"), 440),
      portrait: sized(byRole("PORTRAIT_BANNER"), 600),
      logo: sized(byRole("LOGO"), 600),
    },
    screenshots: [...new Set(media.filter((m) => s(m.role) === "SCREENSHOT").map((m) => s(m.url)!))].slice(0, 8)
      .map((u) => sized(u, 1280)!),
  };
}
