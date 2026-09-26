import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeQuery, type KeyArt } from "@/lib/catalog";

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
  group_key: string | null;
  is_primary: boolean;
  /** Number of Store products (editions / platform versions) in this title's group. */
  edition_count: number;
  group_min_price: number | null;
  /** Store ids of subscriptions that include this product (see getSubscriptionNames). */
  subscriptions: string[];
  /** Slug of the merged /game page when this product is linked to a Steam game. */
  game_slug?: string | null;
}

export interface XboxTrailer { name: string; hls: string | null; thumb: string | null }

export interface XboxGameDetail extends XboxGame {
  /** Title key art (TitledHeroArt → box art), for the first media slide. */
  key_art: KeyArt | null;
  developer: string | null;
  publisher: string | null;
  short_description: string | null;
  release_date: string | null;
  screenshots: string[];
  trailers: XboxTrailer[];
}

export type XboxSort = "popular" | "discount" | "price" | "rating";

const COLUMNS =
  "product_id, slug, title, categories, platforms, rating, rating_count, box_art, hero_art, price, regular_price, discount_pct, currency, is_free, popularity_rank, store_url, lists, steam_app_id, group_key, is_primary, edition_count, group_min_price, subscriptions";
const DETAIL_COLUMNS = `${COLUMNS}, developer, publisher, short_description, release_date, screenshots, trailers, images:raw->LocalizedProperties->0->Images`;

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return getSupabaseAdmin();
}

/** Store platform codes offered in the /xbox filter panel. */
export const XBOX_PLATFORMS = [
  { key: "series", label: "Series X|S", code: "XboxSeriesX" },
  { key: "one", label: "Xbox One", code: "XboxOne" },
  { key: "pc", label: "PC", code: "PC" },
] as const;

export async function getXboxListing(opts: {
  /** Any of these Store categories. */
  categories?: string[];
  /** Store platform codes (any of them). */
  platforms?: string[];
  query?: string;
  priceMin?: number;
  priceMax?: number;
  free?: "hide" | "only";
  onSale?: boolean;
  sort?: XboxSort;
  /** Only games included with a Game Pass tier. */
  gamePass?: boolean;
  limit: number;
  offset?: number;
}): Promise<{ games: XboxGame[]; total: number }> {
  const client = db();
  if (!client) return { games: [], total: 0 };

  // One card per title: the group's primary product stands in for its other editions.
  let q = client.from("xbox_games").select(COLUMNS, { count: "exact" }).eq("is_primary", true);
  if (opts.categories?.length) q = q.overlaps("categories", opts.categories);
  if (opts.platforms?.length) q = q.overlaps("platforms", opts.platforms);
  const text = opts.query ? normalizeQuery(opts.query) : "";
  if (text) q = q.ilike("group_key", `%${text}%`);
  if (opts.priceMin !== undefined) q = q.gte("price", opts.priceMin);
  if (opts.priceMax !== undefined) q = q.lte("price", opts.priceMax);
  if (opts.free) q = q.eq("is_free", opts.free === "only");
  if (opts.onSale) q = q.gt("discount_pct", 0);
  if (opts.gamePass) {
    const ids = await getGamePassIds();
    if (!ids.length) return { games: [], total: 0 };
    q = q.overlaps("subscriptions", ids);
  }

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
      q = q.order("group_rank", { ascending: true, nullsFirst: false });
  }

  const from = opts.offset ?? 0;
  const { data, count } = await q.range(from, from + opts.limit - 1);
  const games = await withGameSlugs((data ?? []).map(normalize<XboxGame>));
  return { games, total: count ?? games.length };
}

/** Postgres numerics arrive as strings. */
function normalize<T extends XboxGame>(g: Record<string, unknown>): T {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    ...g,
    price: num(g.price),
    regular_price: num(g.regular_price),
    rating: num(g.rating),
    group_min_price: num(g.group_min_price),
    subscriptions: (g.subscriptions as string[] | null) ?? [],
  } as T;
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
  const { images, ...row } = data as Record<string, unknown> & { images?: { ImagePurpose?: string; Uri?: string }[] | null };
  const [game] = await withGameSlugs([normalize<XboxGameDetail>(row)]);
  return {
    ...game,
    key_art: xboxKeyArt(images ?? [], game),
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

/** Store art with the title on it: TitledHeroArt (16:9), else the box art. */
function xboxKeyArt(images: { ImagePurpose?: string; Uri?: string }[], game: XboxGame): KeyArt | null {
  const uri = (purpose: string) => {
    const u = images.find((i) => i.ImagePurpose === purpose && i.Uri)?.Uri;
    return u ? (u.startsWith("//") ? `https:${u}` : u) : null;
  };
  const chain = [uri("TitledHeroArt"), game.box_art ?? uri("BoxArt"), uri("Poster")]
    .filter((u): u is string => !!u)
    .map((u, i) => `${u}?w=${i === 0 ? 1920 : 1080}`);
  return chain.length ? { src: chain[0], fallbacks: chain.slice(1) } : null;
}

/** Every Store product in a title's group (editions, Xbox One / Series X|S / PC versions). */
export async function getXboxEditions(groupKey: string): Promise<XboxGame[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client.from("xbox_games").select(COLUMNS).eq("group_key", groupKey).limit(20);
  return (data ?? []).map(normalize<XboxGame>).sort((a, b) =>
    Number(b.is_primary) - Number(a.is_primary) || (a.price === null ? 1 : 0) - (b.price === null ? 1 : 0) || (a.price ?? 0) - (b.price ?? 0));
}

/** Subscription Store id → name ("Xbox Game Pass Ultimate", "EA Play"…), as resolved by the importer. */
export async function getSubscriptionNames(): Promise<Map<string, string>> {
  const client = db();
  if (!client) return new Map();
  const { data } = await client.from("xbox_subscriptions").select("big_id, name");
  return new Map((data ?? []).map((r) => [r.big_id as string, r.name as string]));
}

async function getGamePassIds(): Promise<string[]> {
  return [...(await getSubscriptionNames())].filter(([, name]) => /game pass/i.test(name)).map(([id]) => id);
}

export async function hasGamePassData(): Promise<boolean> {
  return (await getGamePassIds()).length > 0;
}

/** Names of the subscriptions (across all given products) that include the game, Game Pass first. */
export function subscriptionLabels(products: XboxGame[], names: Map<string, string>): string[] {
  const labels = new Set(products.flatMap((p) => p.subscriptions.map((id) => names.get(id)).filter((n): n is string => !!n)));
  return [...labels].sort((a, b) => Number(/game pass/i.test(b)) - Number(/game pass/i.test(a)) || a.localeCompare(b));
}

/** Drop platform tags from a Store title: "GTA V (Xbox One & Xbox Series X|S)" → "GTA V". */
export function cleanXboxTitle(title: string): string {
  const cleaned = title
    .replace(/\s*\((?:pc|windows[^)]*|xbox[^)]*)\)/gi, "")
    .replace(/\s*[-–]?\s*(?:for\s+)?(?:xbox series x\|s|xbox series x|xbox one|windows 10|windows|pc)\s*$/i, "")
    .trim();
  return cleaned || title;
}

/** Xbox-only titles (not on Steam) whose normalized title contains `text` (see normalizeQuery). */
export async function searchXboxOnly(text: string, limit: number): Promise<XboxGame[]> {
  const client = db();
  if (!client || !text) return [];
  const { data } = await client.from("xbox_games").select(COLUMNS)
    .eq("is_primary", true)
    .is("steam_app_id", null)
    .ilike("group_key", `%${text}%`)
    .order("group_rank", { ascending: true, nullsFirst: false })
    .limit(limit);
  return (data ?? []).map(normalize<XboxGame>);
}

/** Popular Xbox games in the same Store category, for the sidebar. */
export async function getRelatedXbox(game: XboxGame, limit: number): Promise<XboxGame[]> {
  const client = db();
  const category = game.categories[0];
  if (!client || !category) return [];
  const { data } = await client.from("xbox_games").select(COLUMNS)
    .contains("categories", [category]).eq("is_primary", true).neq("group_key", game.group_key ?? "")
    .order("group_rank", { ascending: true, nullsFirst: false }).limit(limit);
  return withGameSlugs((data ?? []).map(normalize<XboxGame>));
}

export const xboxHref = (g: Pick<XboxGame, "slug" | "game_slug">) => (g.game_slug ? `/game/${g.game_slug}` : `/xbox/${g.slug}`);

/** Most common Store categories, for the filter chips. */
export async function getXboxCategories(limit: number): Promise<{ name: string; count: number }[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client.from("xbox_games").select("categories").eq("is_primary", true).limit(5000);
  const counts = new Map<string, number>();
  for (const row of data ?? []) for (const c of (row.categories as string[]) ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}
