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
  "steam_app_id, slug, name, is_free, release_date, coming_soon, developers, publishers, genres, categories, platforms, metacritic, review_score_pct, review_count, review_label, header_image, popularity_rank, steam_fetched_at";

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
  return (data as Game | null) ?? null;
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
