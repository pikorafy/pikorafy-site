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
  current_players: number | null;       // Steam concurrent players, refreshed hourly
  current_players_at: string | null;
  peak_players_24h: number | null;
  peak_players_30d: number | null;
  steam_description: string | null;     // Steam's short description, shown with attribution
  screenshots: SteamScreenshot[];
  trailers: SteamTrailer[];
  /** Title key art for the first media slide, sharpest source first (see keyArtFor). */
  key_art: KeyArt | null;
}

/**
 * Key art with the game's title on it. `src` is tried first, then each fallback.
 * With `logo`, `src` is textless background art (library hero) and the logo is laid over it.
 */
export interface KeyArt {
  src: string;
  logo?: string;
  fallbacks: string[];
}

export interface SteamScreenshot {
  thumb: string;   // 600x338
  full: string;    // 1920x1080
}

export interface SteamTrailer {
  id: number;
  name: string;
  thumb: string;
  hls: string | null;   // Steam only serves adaptive streams (HLS/DASH), no MP4
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
  "steam_app_id, slug, name, is_free, release_date, coming_soon, developers, publishers, genres, categories, platforms, metacritic, review_score_pct, review_count, review_label, header_image, popularity_rank, steam_fetched_at, history_low_price, history_low_currency, history_low_shop, history_low_at, current_players, current_players_at, peak_players_24h, peak_players_30d, steam_description:raw->>short_description, raw_screenshots:raw->screenshots, raw_movies:raw->movies, trailers_en, art";

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
  const { raw_screenshots, raw_movies, trailers_en, art, ...game } =
    data as Game & { raw_screenshots: unknown; raw_movies: unknown; trailers_en: unknown; art: unknown };
  return {
    ...game,
    key_art: keyArtFor(art as Record<string, string> | null, game.header_image),
    screenshots: parseScreenshots(raw_screenshots),
    // English-region trailers when we have them; the import's own (Spanish-region) list otherwise.
    trailers: parseTrailers(Array.isArray(trailers_en) && trailers_en.length > 0 ? trailers_en : raw_movies),
    history_low_price: game.history_low_price === null ? null : Number(game.history_low_price),
    steam_description: game.steam_description ? decodeEntities(game.steam_description).trim() || null : null,
  };
}

const STEAM_ASSETS = "https://shared.akamai.steamstatic.com/store_item_assets/";

/**
 * Pick the sharpest title art Steam lists for a game. Asset file names are
 * hash-versioned, so they come from the stored IStoreBrowseService "assets".
 * Order: 2x landscape capsule/header → library hero with its logo laid over it →
 * main capsule (616x353) → header (460x215).
 */
export function keyArtFor(assets: Record<string, string> | null, header: string | null): KeyArt | null {
  const format = assets?.asset_url_format;
  const url = (key: string) => (format && assets?.[key] ? STEAM_ASSETS + format.replace("${FILENAME}", assets[key]) : null);
  const flat = [url("main_capsule_2x"), url("header_2x"), url("main_capsule"), header ?? url("header")]
    .filter((u): u is string => !!u);
  const logoKey = assets ? Object.keys(assets).find((k) => /logo/i.test(k) && !/small|icon/i.test(k)) : undefined;
  const hero = url("library_hero_2x") ?? url("library_hero");
  const logo = logoKey ? url(logoKey) : null;

  if (url("main_capsule_2x") || url("header_2x") || !(hero && logo)) {
    return flat.length ? { src: flat[0], fallbacks: flat.slice(1) } : null;
  }
  return { src: hero!, logo: logo!, fallbacks: flat };
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
    .select("day, price, store")
    .eq("steam_app_id", appId)
    .eq("currency", currency)
    .order("day", { ascending: true })
    .limit(1000);

  // Rows are change points per store (unchanged prices aren't stored), so each day's
  // value is the cheapest of every store's latest known price, not just that day's rows.
  const current = new Map<string, number>();
  const points: PricePoint[] = [];
  const rows = data ?? [];
  for (let i = 0; i < rows.length; i++) {
    current.set(rows[i].store as string, Number(rows[i].price));
    if (i === rows.length - 1 || rows[i + 1].day !== rows[i].day) {
      const price = Math.min(...current.values());
      if (points.at(-1)?.price !== price) points.push({ day: rows[i].day as string, price });
    }
  }
  // Carry the line to today.
  const today = new Date().toISOString().slice(0, 10);
  const last = points.at(-1);
  if (last && last.day < today) points.push({ day: today, price: last.price });
  return points;
}

export interface PlayerPoint {
  day: string;
  peak: number;
}

/** Daily peak concurrent players over the last 30 days, oldest first. */
export async function getPlayerHistory(appId: number): Promise<PlayerPoint[]> {
  const client = db();
  if (!client) return [];
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await client
    .from("player_counts")
    .select("at, players")
    .eq("steam_app_id", appId)
    .gte("at", since)
    .order("at", { ascending: true })
    .limit(800);

  const byDay = new Map<string, number>();
  for (const row of data ?? []) {
    const day = (row.at as string).slice(0, 10);
    byDay.set(day, Math.max(byDay.get(day) ?? 0, row.players as number));
  }
  return [...byDay].map(([day, peak]) => ({ day, peak }));
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
  current_players?: number | null;
  release_date?: string | null;
}

/**
 * Search text in the form of games.title_key / xbox_games.group_key (lowercase,
 * no ™/®/accents/punctuation), so "assassins creed" finds "Assassin's Creed®".
 */
export function normalizeQuery(q: string): string {
  return q
    .replace(/[™®©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 80);
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

export const PLATFORMS = [
  { key: "windows", label: "Windows" },
  { key: "mac", label: "macOS" },
  { key: "linux", label: "Linux" },
  { key: "xbox", label: "Also on Xbox" },
] as const;
export type PlatformKey = (typeof PLATFORMS)[number]["key"];

/** Filters from the /games filter panel. Empty object = everything. */
export interface ListingFilters {
  /** Genre names (any of them). */
  genres?: string[];
  priceMin?: number;
  priceMax?: number;
  hideFree?: boolean;
  /** Any of these platforms. */
  platforms?: PlatformKey[];
  onSale?: boolean;
  /** Minimum % positive reviews. */
  minScore?: number;
}

export function hasFilters(f: ListingFilters): boolean {
  return !!(f.genres?.length || f.priceMin !== undefined || f.priceMax !== undefined || f.hideFree ||
    f.platforms?.length || f.onSale || f.minScore);
}

const LISTING_COLUMNS =
  "steam_app_id, slug, name, header_image, genres, is_free, review_score_pct, metacritic, popularity_rank, price, regular_price, discount_pct, store";

export async function getListing(opts: {
  genre?: string;
  /** Free-text search on the (normalized) title. */
  query?: string;
  sort?: ListingSort;
  filters?: ListingFilters;
  limit: number;
  offset?: number;
}): Promise<{ games: ListingGame[]; total: number }> {
  const client = db();
  if (!client) return { games: [], total: 0 };

  const text = opts.query ? normalizeQuery(opts.query) : "";
  // An exact count scans the whole (joined) listing on every request, which gets slow
  // as the catalog grows. Plain browsing only needs Postgres's estimate for page numbers;
  // searches and filters keep the exact count (the planner's guess can be far off there).
  const f = opts.filters ?? {};
  const filtered = !!text || hasFilters(f);
  let q = client.from("game_listing").select(LISTING_COLUMNS, { count: filtered ? "exact" : "estimated" });
  if (opts.genre) q = q.contains("genres", [opts.genre]);
  if (f.genres?.length) q = q.overlaps("genres", f.genres);
  if (f.priceMin !== undefined) q = q.gte("price", f.priceMin);
  if (f.priceMax !== undefined) q = q.lte("price", f.priceMax);
  if (f.hideFree) q = q.eq("is_free", false);
  if (f.onSale) q = q.gt("discount_pct", 0);
  if (f.minScore) q = q.gte("review_score_pct", f.minScore);
  if (f.platforms?.length) {
    const pc = f.platforms.filter((p) => p !== "xbox");
    const any = [
      ...(pc.length ? [`platforms.ov.{${pc.join(",")}}`] : []),
      ...(f.platforms.includes("xbox") ? ["on_xbox.is.true"] : []),
    ];
    q = q.or(any.join(","));
  }
  if (text) q = q.ilike("title_key", `%${text}%`);

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
  const { data, count, error } = await q.range(from, from + opts.limit - 1);
  // Throw instead of returning an empty list: a timeout must not read as "no games".
  // (The error boundary offers a retry.)
  if (error) throw new Error(`game listing: ${error.message}`);
  const games = (data ?? []).map((g) => ({
    ...g,
    price: g.price === null ? null : Number(g.price),
    regular_price: g.regular_price === null ? null : Number(g.regular_price),
  })) as ListingGame[];
  return { games, total: count ?? games.length };
}

// ─── Home page blocks ────────────────────────────────────────────────────────

const HOME_COLUMNS = `${LISTING_COLUMNS}, current_players, release_date`;

function toListing(rows: Record<string, unknown>[] | null): ListingGame[] {
  return (rows ?? []).map((g) => ({
    ...g,
    price: g.price === null ? null : Number(g.price),
    regular_price: g.regular_price === null ? null : Number(g.regular_price),
  })) as unknown as ListingGame[];
}

/** Games with the most concurrent Steam players right now. */
export async function getMostPlayed(limit: number): Promise<ListingGame[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client.from("game_listing").select(HOME_COLUMNS)
    .not("current_players", "is", null)
    .order("current_players", { ascending: false })
    .limit(limit);
  return toListing(data);
}

/**
 * Latest releases (including 1.0 launches out of Early Access), limited to games
 * with some traction so the list isn't filled with obscure titles.
 */
export async function getRecentReleases(limit: number): Promise<ListingGame[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client.from("game_listing").select(HOME_COLUMNS)
    .lte("release_date", new Date().toISOString().slice(0, 10))
    .eq("coming_soon", false)
    .gte("review_count", 500)
    .order("release_date", { ascending: false })
    .limit(limit);
  return toListing(data);
}

/** Most popular games in a genre. */
export async function getGenreTop(genre: string, limit: number): Promise<ListingGame[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client.from("game_listing").select(HOME_COLUMNS)
    .contains("genres", [genre])
    .order("popularity_rank", { ascending: true })
    .limit(limit);
  return toListing(data);
}

/** Catalog slug for a Steam app, used to route old deal links to the new pages. */
export async function getSlugForSteamApp(appId: number): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("games").select("slug").eq("steam_app_id", appId).eq("type", "game").maybeSingle();
  return (data?.slug as string | undefined) ?? null;
}

/** Steam text is HTML-escaped ("&quot;", "&amp;"); tags are stripped defensively. */
function decodeEntities(text: string): string {
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
      if (code[0] !== "#") return named[code.toLowerCase()] ?? m;
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    });
}

const MAX_SCREENSHOTS = 12;
const MAX_TRAILERS = 4;

function parseScreenshots(raw: unknown): SteamScreenshot[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => typeof s?.path_thumbnail === "string" && typeof s?.path_full === "string")
    .slice(0, MAX_SCREENSHOTS)
    .map((s) => ({ thumb: s.path_thumbnail, full: s.path_full }));
}

/** Highlighted trailers first (Steam marks the main ones), capped. */
function parseTrailers(raw: unknown): SteamTrailer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => typeof m?.id === "number" && typeof m?.thumbnail === "string")
    .sort((a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)))
    .slice(0, MAX_TRAILERS)
    .map((m) => ({
      id: m.id,
      name: typeof m.name === "string" ? decodeEntities(m.name) : "Trailer",
      thumb: m.thumbnail,
      hls: typeof m.hls_h264 === "string" ? m.hls_h264 : null,
    }));
}
