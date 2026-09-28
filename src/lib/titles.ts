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
