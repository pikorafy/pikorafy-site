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
}

export type XboxSort = "popular" | "discount" | "price" | "rating";

const COLUMNS =
  "product_id, slug, title, categories, platforms, rating, rating_count, box_art, hero_art, price, regular_price, discount_pct, currency, is_free, popularity_rank, store_url, lists";

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
  const games = (data ?? []).map((g) => ({
    ...g,
    price: g.price === null ? null : Number(g.price),
    regular_price: g.regular_price === null ? null : Number(g.regular_price),
    rating: g.rating === null ? null : Number(g.rating),
  })) as XboxGame[];
  return { games, total: count ?? games.length };
}

/** Most common Store categories, for the filter chips. */
export async function getXboxCategories(limit: number): Promise<{ name: string; count: number }[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client.from("xbox_games").select("categories").limit(5000);
  const counts = new Map<string, number>();
  for (const row of data ?? []) for (const c of (row.categories as string[]) ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}
