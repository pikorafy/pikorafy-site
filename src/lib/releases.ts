import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Read side of the release calendar (supabase/migrations/*_releases.sql, scripts/import-releases.mts).

export type Precision = "day" | "month" | "quarter" | "year";

export interface Release {
  igdb_id: number;
  title: string;
  release_date: string;          // YYYY-MM-DD (period start when not a day)
  precision: Precision;
  platforms: string[];
  score: number;
  /** Wide art to try in order: our catalogs first, then IGDB artwork. */
  art: string[];
  /** Portrait cover, shown fitted when no wide art loads. */
  cover: string | null;
  /** Our price page, when we track the game. */
  href: string | null;
}

export const PLATFORM_GROUPS = [
  { key: "pc", label: "PC", platforms: ["PC"] },
  { key: "playstation", label: "PlayStation", platforms: ["PS5", "PS4"] },
  { key: "xbox", label: "Xbox", platforms: ["Xbox Series", "Xbox One"] },
  { key: "switch", label: "Switch", platforms: ["Switch 2", "Switch"] },
] as const;
export type PlatformGroup = (typeof PLATFORM_GROUPS)[number]["key"];

const igdbImage = (id: string, size: string) => `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg`;

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return getSupabaseAdmin();
}

/**
 * Releases dated from `from` to `to` (inclusive, YYYY-MM-DD), any precision, most
 * anticipated first. Links and wide art come from our Steam, PlayStation and Nintendo pages.
 */
export async function getReleases(from: string, to: string, group?: PlatformGroup): Promise<Release[]> {
  const client = db();
  if (!client) return [];
  let q = client.from("releases")
    .select("igdb_id, title, title_key, release_date, precision, platforms, score, cover_id, art_id, steam_app_id")
    .gte("release_date", from).lte("release_date", to)
    .order("score", { ascending: false }).limit(3000);
  const platforms = PLATFORM_GROUPS.find((g) => g.key === group)?.platforms;
  if (platforms) q = q.overlaps("platforms", [...platforms]);
  const { data, error } = await q;
  if (error) throw new Error(`releases: ${error.message}`);
  const rows = data ?? [];
  if (!rows.length) return [];

  // Our pages for these games: Steam by app id, PlayStation by IGDB id, Nintendo by title.
  const steamIds = [...new Set(rows.map((r) => r.steam_app_id as number | null).filter((v): v is number => v !== null))];
  const igdbIds = rows.map((r) => r.igdb_id as number);
  const titleKeys = [...new Set(rows.map((r) => r.title_key as string).filter(Boolean))];
  const [steam, ps, nintendo] = await Promise.all([
    inChunks(steamIds, (ids) => client.from("games").select("steam_app_id, slug, header_image").in("steam_app_id", ids)),
    inChunks(igdbIds, (ids) => client.from("playstation_games").select("igdb_id, slug, image_wide, sales_status")
      .in("igdb_id", ids).in("sales_status", ["onsale", "preorder", "free", "plus_only"])),
    inChunks(titleKeys, (keys) => client.from("nintendo_games").select("title_key, slug, image_wide, image_page, popularity")
      .in("title_key", keys).in("sales_status", ["onsale", "preorder", "unreleased"]).order("popularity")),
  ]);
  const steamBy = new Map(steam.map((r) => [r.steam_app_id as number, r]));
  const psBy = new Map(ps.map((r) => [r.igdb_id as number, r]));
  const nintendoBy = new Map<string, Record<string, unknown>>();
  for (const r of nintendo) if (!nintendoBy.has(r.title_key as string)) nintendoBy.set(r.title_key as string, r);

  return rows.map((r) => {
    const s = r.steam_app_id ? steamBy.get(r.steam_app_id as number) : undefined;
    const p = psBy.get(r.igdb_id as number);
    const n = nintendoBy.get(r.title_key as string);
    const art = [
      s?.header_image, p?.image_wide, n?.image_wide ?? n?.image_page,
      r.art_id ? igdbImage(r.art_id as string, "t_screenshot_big") : null,
    ].filter((u): u is string => typeof u === "string" && !!u);
    return {
      igdb_id: r.igdb_id as number,
      title: r.title as string,
      release_date: r.release_date as string,
      precision: r.precision as Precision,
      platforms: (r.platforms as string[]) ?? [],
      score: r.score as number,
      art,
      cover: r.cover_id ? igdbImage(r.cover_id as string, "t_cover_big") : null,
      href: s ? `/game/${s.slug}` : p ? `/playstation/${p.slug}` : n ? `/nintendo/${n.slug}` : null,
    };
  });
}

async function inChunks<T>(
  values: T[],
  query: (chunk: T[]) => PromiseLike<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>,
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < values.length; i += 300) {
    const { data, error } = await query(values.slice(i, i + 300));
    if (error) throw new Error(`releases links: ${error.message}`);
    out.push(...(data ?? []));
  }
  return out;
}
