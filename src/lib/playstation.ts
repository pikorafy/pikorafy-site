import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeQuery, type KeyArt, type SteamScreenshot } from "@/lib/catalog";

// Read-side access to the PlayStation Store catalog (supabase/migrations/*_playstation_games.sql).

export interface PsGame {
  igdb_id: number;
  slug: string;
  title: string;
  genres: string[];
  platforms: string[];            // PS4 / PS5 from the store (IGDB's until the page was read)
  release_date: string | null;
  image_wide: string | null;
  image_square: string | null;
  sales_status: string | null;
  price: number | null;
  regular_price: number | null;
  discount_pct: number | null;
  discount_ends_at: string | null;
  currency: string | null;
  is_free: boolean;
  plus_price: number | null;
  plus_tier: string | null;
  popularity: number | null;
}

export interface PsGameDetail extends PsGame {
  concept_id: string;
  summary: string | null;
  publisher: string | null;
  store_name: string | null;
  lowest_30d: number | null;
  star_rating: number | null;
  rating_count: number | null;
  image_hero: string | null;
  image_logo: string | null;
  steam_app_id: number | null;
  /** /game/<slug> when the Steam version is in our catalog. */
  steam_slug: string | null;
  key_art: KeyArt | null;
  screenshots: SteamScreenshot[];
}

export type PsSort = "popular" | "discount" | "price" | "newest";

/** Genres offered in the filter panel (IGDB genres, shortened by the importer). */
export const PS_GENRES = [
  "Adventure", "RPG", "Shooter", "Platformer", "Indie", "Puzzle", "Strategy", "Simulation", "Racing",
  "Sports", "Fighting", "Hack and Slash", "Arcade", "Music", "Tactical", "Board Game", "Visual Novel",
].map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }));

export const PS_PLATFORMS = [
  { key: "ps5", label: "PS5", name: "PS5" },
  { key: "ps4", label: "PS4", name: "PS4" },
] as const;

/** PS Plus tiers, lowest first. */
export const PLUS_TIERS = ["essential", "extra", "premium"] as const;
export type PlusTier = (typeof PLUS_TIERS)[number];

export const PLUS_TIER_LABEL: Record<string, string> = { essential: "PS Plus Essential", extra: "PS Plus Extra", premium: "PS Plus Premium" };

export interface PsFilters {
  genres?: string[];           // genre names
  platforms?: string[];        // PS5 / PS4
  priceMin?: number;
  priceMax?: number;
  free?: "hide" | "only";
  onSale?: boolean;
  /** Games included with this PS Plus tier; higher tiers include the lower ones' games. */
  plusTier?: PlusTier;
}

const COLUMNS =
  "igdb_id, slug, title, genres, platforms, igdb_platforms, release_date, first_release, image_wide, image_square, sales_status, price, regular_price, discount_pct, discount_ends_at, currency, is_free, plus_price, plus_tier, popularity";
const DETAIL_COLUMNS = `${COLUMNS}, concept_id, summary, publisher, store_name, lowest_30d, star_rating, rating_count, image_hero, image_logo, screenshots, steam_app_id`;
/** Games the Spanish store sells (or has in PS Plus). Unchecked, missing and unpriced games stay out. */
const LISTED = ["onsale", "preorder", "free", "plus_only"];

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return getSupabaseAdmin();
}

function normalize<T extends PsGame>(g: Record<string, unknown>): T {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const store = (g.platforms as string[] | null) ?? [];
  return {
    ...g,
    platforms: store.length ? store : ((g.igdb_platforms as string[] | null) ?? []),
    release_date: (g.release_date ?? g.first_release ?? null) as string | null,
    price: num(g.price),
    regular_price: num(g.regular_price),
    plus_price: num(g.plus_price),
    ...("lowest_30d" in g ? { lowest_30d: num(g.lowest_30d), star_rating: num(g.star_rating) } : {}),
  } as T;
}

export async function getPsListing(opts: {
  query?: string;
  filters?: PsFilters;
  sort?: PsSort;
  limit: number;
  offset?: number;
}): Promise<{ games: PsGame[]; total: number }> {
  const client = db();
  if (!client) return { games: [], total: 0 };
  const f = opts.filters ?? {};
  const text = opts.query ? normalizeQuery(opts.query) : "";
  const filtered = !!text || !!(f.genres?.length || f.platforms?.length || f.priceMin !== undefined ||
    f.priceMax !== undefined || f.free || f.onSale || f.plusTier);

  let q = client.from("playstation_games").select(COLUMNS, { count: filtered ? "exact" : "estimated" }).in("sales_status", LISTED);
  if (text) q = q.ilike("title_key", `%${text}%`);
  if (f.genres?.length) q = q.overlaps("genres", f.genres);
  if (f.platforms?.length) q = q.overlaps("platforms", f.platforms);
  if (f.priceMin !== undefined) q = q.gte("price", f.priceMin);
  if (f.priceMax !== undefined) q = q.lte("price", f.priceMax);
  if (f.free) q = q.eq("is_free", f.free === "only");
  if (f.onSale) q = q.gt("discount_pct", 0);
  if (f.plusTier) q = q.in("plus_tier", PLUS_TIERS.slice(0, PLUS_TIERS.indexOf(f.plusTier) + 1));

  switch (opts.sort ?? "popular") {
    case "discount":
      q = q.order("discount_pct", { ascending: false, nullsFirst: false }).order("popularity");
      break;
    case "price":
      q = q.not("price", "is", null).order("price").order("popularity");
      break;
    case "newest":
      q = q.not("release_date", "is", null).lte("release_date", new Date().toISOString().slice(0, 10))
        .order("release_date", { ascending: false }).order("popularity");
      break;
    default:
      q = q.order("popularity");
  }

  const from = opts.offset ?? 0;
  const { data, count, error } = await q.range(from, from + opts.limit - 1);
  // A timeout must not read as "no games": the error boundary offers a retry.
  if (error) throw new Error(`playstation listing: ${error.message}`);
  return { games: (data ?? []).map((g) => normalize<PsGame>(g)), total: count ?? 0 };
}

export async function getPsBySlug(slug: string): Promise<PsGameDetail | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("playstation_games").select(DETAIL_COLUMNS).eq("slug", slug).maybeSingle();
  if (!data || !LISTED.includes(data.sales_status as string)) return null;
  const g = normalize<PsGameDetail>(data);

  let steamSlug: string | null = null;
  if (g.steam_app_id) {
    const { data: steam } = await client.from("games").select("slug").eq("steam_app_id", g.steam_app_id).maybeSingle();
    steamSlug = (steam?.slug as string | undefined) ?? null;
  }
  const shots = ((data.screenshots as string[] | null) ?? []).map((u) => ({ thumb: resized(u, 600), full: resized(u, 1920) }));
  const art = g.image_wide ?? g.image_hero;
  return {
    ...g,
    steam_slug: steamSlug,
    screenshots: shots,
    key_art: art ? { src: resized(art, 1920), fallbacks: [art, ...(g.image_square ? [g.image_square] : [])] } : null,
  };
}

export async function getRelatedPs(game: PsGame, limit: number): Promise<PsGame[]> {
  const client = db();
  if (!client || !game.genres.length) return [];
  const { data } = await client.from("playstation_games").select(COLUMNS)
    .in("sales_status", LISTED).contains("genres", [game.genres[0]]).neq("igdb_id", game.igdb_id)
    .order("popularity").limit(limit);
  return (data ?? []).map((g) => normalize<PsGame>(g));
}

/** Store images take ?w= for their width. */
function resized(url: string, w: number): string {
  return /^https:\/\/image\.api\.playstation\.com\//.test(url) ? `${url.replace(/\?.*$/, "")}?w=${w}` : url;
}

/** The game's page on the Spanish PlayStation Store. */
export const psStoreUrl = (g: Pick<PsGameDetail, "concept_id">) => `https://store.playstation.com/es-es/concept/${g.concept_id}`;
