import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Read-side access to the Steam game catalog (see supabase/migrations/*_game_catalog.sql).
// Every function degrades to "no data" when Supabase isn't configured, so builds
// without env vars still succeed and pages are generated on demand later.

export interface Game {
  steam_app_id: number;
  slug: string;
  name: string;
  is_free: boolean;
  release_date: string | null;
  coming_soon: boolean;
  developers: string[];
  publishers: string[];
  genres: string[];
  categories: string[];
  platforms: string[];
  metacritic: number | null;
  review_score_pct: number | null;
  review_count: number | null;
  review_label: string | null;
  header_image: string | null;
  popularity_rank: number | null;
  steam_fetched_at: string | null;
  history_low_price: number | null;     // all-time low from IsThereAnyDeal
  history_low_currency: string | null;
  history_low_shop: string | null;
  history_low_at: string | null;
}

export interface GamePrice {
  source: string;
  store: string;
  currency: string;
  price: number;
  regular_price: number | null;
  discount_pct: number | null;
  url: string | null;
  fetched_at: string;
}

export interface PricePoint {
  day: string;
  price: number;
}

export interface GameContent {
  summary: string | null;
  verdict: string | null;
  verdict_label: "buy_now" | "good_deal" | "wait" | null;
  pros: string[];
  cons: string[];
  updated_at: string;
}

export interface GameCard {
  slug: string;
  name: string;
  header_image: string | null;
  review_score_pct: number | null;
}

const GAME_COLUMNS =
  "steam_app_id, slug, name, is_free, release_date, coming_soon, developers, publishers, genres, categories, platforms, metacritic, review_score_pct, review_count, review_label, header_image, popularity_rank, steam_fetched_at, history_low_price, history_low_currency, history_low_shop, history_low_at";

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return getSupabaseAdmin();
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client
    .from("games")
    .select(GAME_COLUMNS)
    .eq("slug", slug)
    .eq("type", "game")
    .maybeSingle();
  if (!data) return null;
  const game = data as Game;
  return { ...game, history_low_price: game.history_low_price === null ? null : Number(game.history_low_price) };
}

/** Slugs of the most popular games, for generateStaticParams. */
export async function getTopGameSlugs(limit: number): Promise<string[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client
    .from("games")
    .select("slug")
    .eq("type", "game")
    .not("popularity_rank", "is", null)
    .order("popularity_rank", { ascending: true })
    .limit(limit);
  return (data ?? []).map((r) => r.slug as string);
}

/** Current offers, cheapest first. */
export async function getGamePrices(appId: number): Promise<GamePrice[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client
    .from("game_prices")
    .select("source, store, currency, price, regular_price, discount_pct, url, fetched_at")
    .eq("steam_app_id", appId)
    .order("price", { ascending: true });
  return (data ?? []).map((p) => ({
    ...p,
    price: Number(p.price),
    regular_price: p.regular_price === null ? null : Number(p.regular_price),
  })) as GamePrice[];
}

/** Daily lowest price across stores, oldest first. */
export async function getPriceHistory(appId: number, currency: string): Promise<PricePoint[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client
    .from("price_history")
    .select("day, price")
    .eq("steam_app_id", appId)
    .eq("currency", currency)
    .order("day", { ascending: true })
    .limit(1000);

  const byDay = new Map<string, number>();
  for (const row of data ?? []) {
    const price = Number(row.price);
    const prev = byDay.get(row.day);
    if (prev === undefined || price < prev) byDay.set(row.day, price);
  }
  return [...byDay].map(([day, price]) => ({ day, price }));
}

/** Published editorial/LLM copy. Drafts are never shown. */
export async function getGameContent(appId: number, locale: "en" | "es"): Promise<GameContent | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client
    .from("game_content")
    .select("summary, verdict, verdict_label, pros, cons, updated_at")
    .eq("steam_app_id", appId)
    .eq("locale", locale)
    .eq("status", "published")
    .maybeSingle();
  return (data as GameContent | null) ?? null;
}

/** Popular games sharing the primary genre, for internal linking. */
export async function getRelatedGames(game: Game, limit: number): Promise<GameCard[]> {
  const client = db();
  const genre = game.genres.find((g) => g !== "Free To Play" && g !== "Early Access");
  if (!client || !genre) return [];
  const { data } = await client
    .from("games")
    .select("slug, name, header_image, review_score_pct")
    .eq("type", "game")
    .contains("genres", [genre])
    .neq("steam_app_id", game.steam_app_id)
    .not("popularity_rank", "is", null)
    .order("popularity_rank", { ascending: true })
    .limit(limit);
  return (data ?? []) as GameCard[];
}

/** Slugs with published copy — the only game pages we ask Google to index. */
export async function getIndexableGames(): Promise<{ slug: string; updated_at: string }[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client
    .from("game_content")
    .select("updated_at, games!inner(slug)")
    .eq("locale", "en")
    .eq("status", "published");
  return (data ?? []).map((r) => ({
    slug: (r.games as unknown as { slug: string }).slug,
    updated_at: r.updated_at as string,
  }));
}

// ─── Listings (/games, /games/[genre]) ───────────────────────────────────────

export interface ListingGame {
  steam_app_id: number;
  slug: string;
  name: string;
  header_image: string | null;
  genres: string[];
  is_free: boolean;
  review_score_pct: number | null;
  metacritic: number | null;
  popularity_rank: number;
  price: number | null;
  regular_price: number | null;
  discount_pct: number | null;
  store: string | null;
}

/** Steam genre name ↔ URL segment. Only these get /games/<genre> pages. */
export const GENRES: { slug: string; name: string }[] = [
  { slug: "action", name: "Action" },
  { slug: "adventure", name: "Adventure" },
  { slug: "rpg", name: "RPG" },
  { slug: "strategy", name: "Strategy" },
  { slug: "simulation", name: "Simulation" },
  { slug: "indie", name: "Indie" },
  { slug: "casual", name: "Casual" },
  { slug: "racing", name: "Racing" },
  { slug: "sports", name: "Sports" },
  { slug: "mmo", name: "Massively Multiplayer" },
  { slug: "free-to-play", name: "Free To Play" },
  { slug: "early-access", name: "Early Access" },
];

export type ListingSort = "popular" | "discount" | "price" | "reviews";

const LISTING_COLUMNS =
  "steam_app_id, slug, name, header_image, genres, is_free, review_score_pct, metacritic, popularity_rank, price, regular_price, discount_pct, store";

export async function getListing(opts: {
  genre?: string;
  sort?: ListingSort;
  onSale?: boolean;
  limit: number;
  offset?: number;
}): Promise<{ games: ListingGame[]; total: number }> {
  const client = db();
  if (!client) return { games: [], total: 0 };

  let q = client.from("game_listing").select(LISTING_COLUMNS, { count: "exact" });
  if (opts.genre) q = q.contains("genres", [opts.genre]);
  if (opts.onSale) q = q.gt("discount_pct", 0);

  switch (opts.sort ?? "popular") {
    case "discount":
      q = q.order("discount_pct", { ascending: false, nullsFirst: false }).order("popularity_rank");
      break;
    case "price":
      q = q.not("price", "is", null).order("price", { ascending: true }).order("popularity_rank");
      break;
    case "reviews":
      q = q.order("review_score_pct", { ascending: false, nullsFirst: false }).order("popularity_rank");
      break;
    default:
      q = q.order("popularity_rank", { ascending: true });
  }

  const from = opts.offset ?? 0;
  const { data, count } = await q.range(from, from + opts.limit - 1);
  const games = (data ?? []).map((g) => ({
    ...g,
    price: g.price === null ? null : Number(g.price),
    regular_price: g.regular_price === null ? null : Number(g.regular_price),
  })) as ListingGame[];
  return { games, total: count ?? games.length };
}

/** Catalog slug for a Steam app, used to route old deal links to the new pages. */
export async function getSlugForSteamApp(appId: number): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("games").select("slug").eq("steam_app_id", appId).eq("type", "game").maybeSingle();
  return (data?.slug as string | undefined) ?? null;
}
