import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Read-side access to the Xbox catalog (supabase/migrations/*_xbox_games.sql).

export interface XboxGame {
  product_id: string;
  slug: string;
  title: string;
  categories: string[];
  platforms: string[];
  rating: number | null;
  rating_count: number | null;
  box_art: string | null;
  hero_art: string | null;
  price: number | null;
  regular_price: number | null;
  discount_pct: number | null;
  currency: string | null;
  is_free: boolean;
  popularity_rank: number | null;
  store_url: string | null;
  lists: string[];
  steam_app_id: number | null;
  /** Slug of the merged /game page when this product is linked to a Steam game. */
  game_slug?: string | null;
}

export interface XboxTrailer { name: string; hls: string | null; thumb: string | null }

export interface XboxGameDetail extends XboxGame {
  developer: string | null;
  publisher: string | null;
  short_description: string | null;
  release_date: string | null;
  screenshots: string[];
  trailers: XboxTrailer[];
}

export type XboxSort = "popular" | "discount" | "price" | "rating";

const COLUMNS =
  "product_id, slug, title, categories, platforms, rating, rating_count, box_art, hero_art, price, regular_price, discount_pct, currency, is_free, popularity_rank, store_url, lists, steam_app_id";
const DETAIL_COLUMNS = `${COLUMNS}, developer, publisher, short_description, release_date, screenshots, trailers`;

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return getSupabaseAdmin();
}

export async function getXboxListing(opts: {
  category?: string;
  sort?: XboxSort;
  limit: number;
  offset?: number;
}): Promise<{ games: XboxGame[]; total: number }> {
  const client = db();
  if (!client) return { games: [], total: 0 };

  let q = client.from("xbox_games").select(COLUMNS, { count: "exact" });
  if (opts.category) q = q.contains("categories", [opts.category]);

  switch (opts.sort ?? "popular") {
    case "discount":
      q = q.gt("discount_pct", 0).order("discount_pct", { ascending: false }).order("popularity_rank", { nullsFirst: false });
      break;
    case "price":
      q = q.not("price", "is", null).gt("price", 0).order("price", { ascending: true });
      break;
    case "rating":
      q = q.gte("rating_count", 50).order("rating", { ascending: false, nullsFirst: false });
      break;
    default:
      q = q.order("popularity_rank", { ascending: true, nullsFirst: false });
  }

  const from = opts.offset ?? 0;
  const { data, count } = await q.range(from, from + opts.limit - 1);
  const games = await withGameSlugs((data ?? []).map(normalize<XboxGame>));
  return { games, total: count ?? games.length };
}

/** Postgres numerics arrive as strings. */
function normalize<T extends XboxGame>(g: Record<string, unknown>): T {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return { ...g, price: num(g.price), regular_price: num(g.regular_price), rating: num(g.rating) } as T;
}

/** Fill game_slug for products linked to a Steam game, so cards can link to the merged page. */
async function withGameSlugs<T extends XboxGame>(games: T[]): Promise<T[]> {
  const ids = [...new Set(games.map((g) => g.steam_app_id).filter((id): id is number => id !== null))];
  if (!ids.length) return games;
  const { data } = await db()!.from("games").select("steam_app_id, slug").in("steam_app_id", ids);
  const slugs = new Map((data ?? []).map((r) => [r.steam_app_id as number, r.slug as string]));
  return games.map((g) => ({ ...g, game_slug: g.steam_app_id === null ? null : slugs.get(g.steam_app_id) ?? null }));
}

export async function getXboxBySlug(slug: string): Promise<XboxGameDetail | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("xbox_games").select(DETAIL_COLUMNS).eq("slug", slug).maybeSingle();
  if (!data) return null;
  const [game] = await withGameSlugs([normalize<XboxGameDetail>(data)]);
  return {
    ...game,
    screenshots: Array.isArray(game.screenshots) ? game.screenshots.filter(Boolean) : [],
    trailers: Array.isArray(game.trailers) ? game.trailers.filter((t) => t?.hls) : [],
  };
}

/**
 * Xbox Store products linked to a Steam game (a game can have several: e.g. an
 * Xbox One and a Series X|S edition). Priced products first, cheapest first.
 */
export async function getXboxForSteamApp(appId: number): Promise<XboxGame[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client.from("xbox_games").select(COLUMNS).eq("steam_app_id", appId).limit(10);
  return (data ?? []).map(normalize<XboxGame>).sort((a, b) =>
    (a.price === null ? 1 : 0) - (b.price === null ? 1 : 0) || (a.price ?? 0) - (b.price ?? 0) || a.title.length - b.title.length);
}

/** Popular Xbox games in the same Store category, for the sidebar. */
export async function getRelatedXbox(game: XboxGame, limit: number): Promise<XboxGame[]> {
  const client = db();
  const category = game.categories[0];
  if (!client || !category) return [];
  const { data } = await client.from("xbox_games").select(COLUMNS)
    .contains("categories", [category]).neq("product_id", game.product_id)
    .order("popularity_rank", { ascending: true, nullsFirst: false }).limit(limit);
  return withGameSlugs((data ?? []).map(normalize<XboxGame>));
}

export const xboxHref = (g: Pick<XboxGame, "slug" | "game_slug">) => (g.game_slug ? `/game/${g.game_slug}` : `/xbox/${g.slug}`);

/** Most common Store categories, for the filter chips. */
export async function getXboxCategories(limit: number): Promise<{ name: string; count: number }[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client.from("xbox_games").select("categories").limit(5000);
  const counts = new Map<string, number>();
  for (const row of data ?? []) for (const c of (row.categories as string[]) ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}
