import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeQuery, type KeyArt } from "@/lib/catalog";

// Read-side access to the Nintendo eShop catalog (supabase/migrations/*_nintendo_games.sql).

export interface NintendoGame {
  nsuid: string;
  slug: string;
  title: string;
  genres: string[];
  platforms: string[];
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
  popularity: number | null;
}

export interface NintendoGameDetail extends NintendoGame {
  developer: string | null;
  publisher: string | null;
  excerpt: string | null;
  url_path: string | null;
  key_art: KeyArt | null;
}

export type NintendoSort = "popular" | "discount" | "price" | "newest";

/** Genres offered in the filter panel (the catalog has ~30, many tiny or vague). */
export const NINTENDO_GENRES = [
  "Action", "Adventure", "RPG", "Platformer", "Puzzle", "Strategy", "Simulation", "Shooter",
  "Racing", "Sports", "Fighting", "Party", "Arcade", "Board Game", "Music", "Education", "Lifestyle",
].map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }));

export const NINTENDO_PLATFORMS = [
  { key: "switch2", label: "Switch 2", name: "Nintendo Switch 2" },
  { key: "switch", label: "Switch", name: "Nintendo Switch" },
] as const;

export interface NintendoFilters {
  genres?: string[];           // genre names
  platforms?: string[];        // platform names ("Nintendo Switch 2")
  priceMin?: number;
  priceMax?: number;
  free?: "hide" | "only";
  onSale?: boolean;
}

const COLUMNS =
  "nsuid, slug, title, genres, platforms, release_date, image_wide, image_square, sales_status, price, regular_price, discount_pct, discount_ends_at, currency, is_free, popularity";
const DETAIL_COLUMNS = `${COLUMNS}, developer, publisher, excerpt, url_path`;
/** Games you can buy (or pre-order / wishlist) on the Spanish eShop. */
const LISTED = ["onsale", "preorder", "unreleased"];

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return getSupabaseAdmin();
}

function normalize<T extends NintendoGame>(g: Record<string, unknown>): T {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return { ...g, price: num(g.price), regular_price: num(g.regular_price) } as T;
}

export async function getNintendoListing(opts: {
  query?: string;
  filters?: NintendoFilters;
  sort?: NintendoSort;
  limit: number;
  offset?: number;
}): Promise<{ games: NintendoGame[]; total: number }> {
  const client = db();
  if (!client) return { games: [], total: 0 };
  const f = opts.filters ?? {};
  const text = opts.query ? normalizeQuery(opts.query) : "";
  const filtered = !!text || !!(f.genres?.length || f.platforms?.length || f.priceMin !== undefined ||
    f.priceMax !== undefined || f.free || f.onSale);

  let q = client.from("nintendo_games").select(COLUMNS, { count: filtered ? "exact" : "estimated" }).in("sales_status", LISTED);
  if (text) q = q.ilike("title_key", `%${text}%`);
  if (f.genres?.length) q = q.overlaps("genres", f.genres);
  if (f.platforms?.length) q = q.overlaps("platforms", f.platforms);
  if (f.priceMin !== undefined) q = q.gte("price", f.priceMin);
  if (f.priceMax !== undefined) q = q.lte("price", f.priceMax);
  if (f.free) q = q.eq("is_free", f.free === "only");
  if (f.onSale) q = q.gt("discount_pct", 0);

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
  if (error) throw new Error(`nintendo listing: ${error.message}`);
  return { games: (data ?? []).map((g) => normalize<NintendoGame>(g)), total: count ?? 0 };
}

export async function getNintendoBySlug(slug: string): Promise<NintendoGameDetail | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("nintendo_games").select(DETAIL_COLUMNS).eq("slug", slug).maybeSingle();
  if (!data) return null;
  const g = normalize<NintendoGameDetail>(data);
  return { ...g, key_art: nintendoKeyArt(g.image_wide ?? g.image_square) };
}

export async function getRelatedNintendo(game: NintendoGame, limit: number): Promise<NintendoGame[]> {
  const client = db();
  if (!client || !game.genres.length) return [];
  const { data } = await client.from("nintendo_games").select(COLUMNS)
    .in("sales_status", LISTED).contains("genres", [game.genres[0]]).neq("nsuid", game.nsuid)
    .order("popularity").limit(limit);
  return (data ?? []).map((g) => normalize<NintendoGame>(g));
}

/**
 * The catalog links 500px-wide art; Nintendo's media server usually has larger
 * renditions of the same file. Try those first, fall back to what the catalog gave.
 */
function nintendoKeyArt(url: string | null): KeyArt | null {
  if (!url) return null;
  if (!/image500w/.test(url)) return { src: url, fallbacks: [] };
  return { src: url.replace("image500w", "image1600w"), fallbacks: [url.replace("image500w", "image1280w"), url] };
}

/** Nintendo's product page (English, UK site: the catalog we read). */
export function nintendoStoreUrl(g: Pick<NintendoGameDetail, "url_path">): string | null {
  return g.url_path ? `https://www.nintendo.com${g.url_path.startsWith("/") ? "" : "/"}${g.url_path}` : null;
}

export function nintendoPlatformLabel(name: string): string {
  return NINTENDO_PLATFORMS.find((p) => p.name === name)?.label ?? name.replace(/^Nintendo /, "");
}
