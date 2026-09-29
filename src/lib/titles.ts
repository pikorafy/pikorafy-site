import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getGameBySlug, type Game } from "@/lib/catalog";
import { getXboxBySlug, getXboxEditions, getXboxProducts, type XboxGame, type XboxGameDetail } from "@/lib/xbox";
import { getPsBySlug, type PsGameDetail } from "@/lib/playstation";
import { getNintendoBySlug, type NintendoGameDetail } from "@/lib/nintendo";

// One game across stores (supabase/migrations/*_titles.sql, filled by scripts/link-titles.mts):
// a title and the Steam, Xbox, PlayStation and Nintendo items linked to it.

export type Store = "steam" | "xbox" | "playstation" | "nintendo";

export interface Title {
  id: number;
  slug: string;
  name: string;
  game_type: number | null;
  first_release: string | null;
  summary: string | null;
  genres: string[];
  cover_id: string | null;
  art_id: string | null;
}

export interface TitleBundle {
  title: Title;
  steam: Game | null;
  /** The Xbox product whose page data (media, description) we show, and all its editions. */
  xbox: XboxGameDetail | null;
  xboxEditions: XboxGame[];
  playstation: PsGameDetail[];
  nintendo: NintendoGameDetail[];
}

const TITLE_COLUMNS = "id, slug, name, game_type, first_release, summary, genres, cover_id, art_id";

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return getSupabaseAdmin();
}

export async function getTitleBySlug(slug: string): Promise<Title | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("titles").select(TITLE_COLUMNS).eq("slug", slug).maybeSingle();
  return (data as Title | null) ?? null;
}

/** Current slug of a title that used to be at `slug` (renamed, or merged into another). */
export async function getSlugAlias(slug: string): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("title_slug_aliases").select("titles(slug)").eq("slug", slug).maybeSingle();
  return (data as { titles: { slug: string } | null } | null)?.titles?.slug ?? null;
}

/** The shared title a store item belongs to, if it's linked. */
export async function getTitleForStore(store: Store, storeId: string | number): Promise<Pick<Title, "id" | "slug"> | null> {
  const client = db();
  if (!client) return null;
  const { data } = await client.from("title_links").select("titles(id, slug)")
    .eq("store", store).eq("store_id", String(storeId)).maybeSingle();
  const t = (data as { titles: Pick<Title, "id" | "slug"> | null } | null)?.titles;
  return t ?? null;
}

/** Everything the shared game page shows, loaded through each store's own helpers. */
export async function getTitleBundle(title: Title): Promise<TitleBundle> {
  const client = db()!;
  const { data: links } = await client.from("title_links").select("store, store_id").eq("title_id", title.id);
  const ids = (store: Store) => (links ?? []).filter((l) => l.store === store).map((l) => l.store_id as string);

  const slugs = async (table: string, key: string, values: (string | number)[], order: string) => {
    if (!values.length) return [] as string[];
    const { data } = await client.from(table).select(`slug, ${order}`).in(key, values).order(order, { ascending: true, nullsFirst: false });
    return (data ?? []).map((r) => (r as unknown as { slug: string }).slug);
  };

  const [steamSlugs, xboxSlugs, psSlugs, ninSlugs] = await Promise.all([
    slugs("games", "steam_app_id", ids("steam").map(Number), "popularity_rank"),
    slugs("xbox_games", "product_id", ids("xbox"), "popularity_rank"),
    slugs("playstation_games", "igdb_id", ids("playstation").map(Number), "popularity"),
    slugs("nintendo_games", "nsuid", ids("nintendo"), "popularity"),
  ]);

  // Steam: the most popular linked app (a title rarely has more than one).
  // Xbox: the primary product of the most popular edition group, and all its editions.
  const [steam, xbox, playstation, nintendo] = await Promise.all([
    steamSlugs[0] ? getGameBySlug(steamSlugs[0]) : Promise.resolve(null),
    xboxSlugs[0] ? getXboxBySlug(xboxSlugs[0]) : Promise.resolve(null),
    Promise.all(psSlugs.map(getPsBySlug)),
    Promise.all(ninSlugs.map(getNintendoBySlug)),
  ]);
  // All linked Xbox products plus the rest of the main product's edition group, priced first.
  let xboxEditions: XboxGame[] = [];
  if (xbox) {
    const [group, linked] = await Promise.all([
      xbox.group_key ? getXboxEditions(xbox.group_key) : Promise.resolve([] as XboxGame[]),
      getXboxProducts(ids("xbox")),
    ]);
    const seen = new Set<string>();
    xboxEditions = [...group, ...linked].filter((x) => !seen.has(x.product_id) && !!seen.add(x.product_id));
    if (!xboxEditions.length) xboxEditions = [xbox];
  }
  return {
    title,
    steam,
    xbox,
    xboxEditions,
    playstation: playstation.filter((g): g is PsGameDetail => !!g),
    nintendo: nintendo.filter((g): g is NintendoGameDetail => !!g),
  };
}

/** IGDB image URL for an image id (t_cover_big, t_1080p, t_screenshot_big…). */
export const igdbImage = (id: string, size: string) => `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg`;

// ─── Search ──────────────────────────────────────────────────────────────────

export interface TitleHit {
  slug: string;
  name: string;
  image: string | null;
  platforms: string[];              // PC · PlayStation · Xbox · Switch, in that order
  price: number | null;             // lowest current price across the linked stores
  regularPrice: number | null;
  discountPct: number | null;
  isFree: boolean;
  genres: string[];
}

const STORE_LABEL: Record<Store, string> = { steam: "PC", playstation: "PlayStation", xbox: "Xbox", nintendo: "Switch" };
const STORE_ORDER: Store[] = ["steam", "playstation", "xbox", "nintendo"];

/**
 * Games on any store whose name contains `text` (already normalized): titles starting with
 * it first, then games on more stores (a rough popularity signal), then shorter names.
 */
export async function searchTitles(text: string, limit: number): Promise<TitleHit[]> {
  const client = db();
  if (!client || !text) return [];
  const pattern = `%${text.replace(/[%_,()*\\]/g, " ").trim().replace(/\s+/g, "%")}%`;
  const { data: rows } = await client.from("titles").select("id, slug, name, genres, cover_id, art_id")
    .ilike("title_key", pattern).limit(60);
  if (!rows?.length) return [];

  const ids = rows.map((r) => r.id as number);
  const { data: links } = await client.from("title_links").select("title_id, store, store_id").in("title_id", ids);
  const byTitle = new Map<number, { store: Store; id: string }[]>();
  for (const l of links ?? []) byTitle.set(l.title_id as number, [...(byTitle.get(l.title_id as number) ?? []), { store: l.store as Store, id: l.store_id as string }]);

  const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const ranked = rows
    .map((r) => ({ r, stores: new Set((byTitle.get(r.id as number) ?? []).map((l) => l.store)) }))
    .sort((a, b) =>
      Number(!key(a.r.name as string).startsWith(text)) - Number(!key(b.r.name as string).startsWith(text)) ||
      b.stores.size - a.stores.size || (a.r.name as string).length - (b.r.name as string).length)
    .slice(0, limit);

  // Current prices and Steam art for the shown games, one query per store.
  const wanted = (store: Store) => ranked.flatMap(({ r }) => (byTitle.get(r.id as number) ?? []).filter((l) => l.store === store).map((l) => l.id));
  interface Priced { price: number | null; regular_price: number | null; discount_pct: number | null; is_free: boolean | null }
  const fetchPrices = async (table: string, idCol: string, extra: string, ids: (string | number)[]) =>
    ids.length ? ((await client.from(table).select(`${idCol}, price, regular_price, discount_pct, is_free${extra}`).in(idCol, ids)).data ?? []) as unknown as (Priced & Record<string, unknown>)[] : [];
  const [steam, xbox, ps, nin] = await Promise.all([
    fetchPrices("game_listing", "steam_app_id", ", header_image", wanted("steam").map(Number)),
    fetchPrices("xbox_games", "product_id", "", wanted("xbox")),
    fetchPrices("playstation_games", "igdb_id", "", wanted("playstation").map(Number)),
    fetchPrices("nintendo_games", "nsuid", "", wanted("nintendo")),
  ]);
  const priceOf = new Map<string, Priced & { header_image?: string | null }>();
  for (const p of steam) priceOf.set(`steam:${p.steam_app_id}`, p);
  for (const p of xbox) priceOf.set(`xbox:${p.product_id}`, p);
  for (const p of ps) priceOf.set(`playstation:${p.igdb_id}`, p);
  for (const p of nin) priceOf.set(`nintendo:${p.nsuid}`, p);
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

  return ranked.map(({ r, stores }) => {
    const offers = (byTitle.get(r.id as number) ?? []).map((l) => priceOf.get(`${l.store}:${l.id}`)).filter((p): p is Priced => !!p);
    const priced = offers.filter((p) => num(p.price) !== null).sort((a, b) => num(a.price)! - num(b.price)!);
    const best = priced[0];
    const steamArt = (byTitle.get(r.id as number) ?? []).filter((l) => l.store === "steam")
      .map((l) => priceOf.get(`steam:${l.id}`)?.header_image).find(Boolean);
    return {
      slug: r.slug as string,
      name: r.name as string,
      image: steamArt ?? (r.art_id ? igdbImage(r.art_id as string, "t_screenshot_med") : r.cover_id ? igdbImage(r.cover_id as string, "t_cover_small") : null),
      platforms: STORE_ORDER.filter((s) => stores.has(s)).map((s) => STORE_LABEL[s]),
      price: best ? num(best.price) : null,
      regularPrice: best ? num(best.regular_price) : null,
      discountPct: best ? num(best.discount_pct) : null,
      isFree: !best && offers.some((p) => p.is_free),
      genres: ((r.genres as string[] | null) ?? []).slice(0, 2),
    };
  });
}
