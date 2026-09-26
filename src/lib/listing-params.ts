import { GENRES, PLATFORMS, type ListingFilters, type PlatformKey } from "@/lib/catalog";

// URL <-> filters for /games. Short, readable params:
//   ?genre=rpg,indie&min=5&max=20&f2p=hide|only&platform=mac,xbox&sale=1&score=80

type Params = { [key: string]: string | string[] | undefined };

export const SCORE_STEPS = [70, 80, 90] as const;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);

const price = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return v !== undefined && v !== "" && Number.isFinite(n) && n >= 0 ? Math.min(n, 1000) : undefined;
};

export function parseFilters(params: Params): ListingFilters {
  const genres = list(params.genre)
    .map((slug) => GENRES.find((g) => g.slug === slug)?.name)
    .filter((n): n is string => !!n);
  const platforms = list(params.platform).filter((p): p is PlatformKey => PLATFORMS.some((x) => x.key === p));
  const score = Number(Array.isArray(params.score) ? params.score[0] : params.score);
  return {
    genres: genres.length ? [...new Set(genres)] : undefined,
    priceMin: price(params.min),
    priceMax: price(params.max),
    free: params.f2p === "hide" || params.f2p === "only" ? params.f2p : undefined,
    platforms: platforms.length ? [...new Set(platforms)] : undefined,
    onSale: params.sale === "1" || undefined,
    minScore: (SCORE_STEPS as readonly number[]).includes(score) ? score : undefined,
  };
}

export function filterParams(f: ListingFilters, into = new URLSearchParams()): URLSearchParams {
  const slugs = (f.genres ?? []).map((n) => GENRES.find((g) => g.name === n)?.slug).filter(Boolean);
  if (slugs.length) into.set("genre", slugs.join(","));
  if (f.priceMin !== undefined) into.set("min", String(f.priceMin));
  if (f.priceMax !== undefined) into.set("max", String(f.priceMax));
  if (f.free) into.set("f2p", f.free);
  if (f.platforms?.length) into.set("platform", f.platforms.join(","));
  if (f.onSale) into.set("sale", "1");
  if (f.minScore) into.set("score", String(f.minScore));
  return into;
}

/** One removable chip per active filter: label + the filters without it. */
export function activeFilterChips(f: ListingFilters): { label: string; without: ListingFilters }[] {
  const chips: { label: string; without: ListingFilters }[] = [];
  for (const g of f.genres ?? []) {
    chips.push({ label: g === "Massively Multiplayer" ? "MMO" : g, without: { ...f, genres: f.genres!.filter((x) => x !== g) } });
  }
  if (f.priceMin !== undefined || f.priceMax !== undefined) {
    const eur = (n: number) => `€${n}`;
    const label = f.priceMin !== undefined && f.priceMax !== undefined ? `${eur(f.priceMin)}–${eur(f.priceMax)}`
      : f.priceMin !== undefined ? `From ${eur(f.priceMin)}` : `Up to ${eur(f.priceMax!)}`;
    chips.push({ label, without: { ...f, priceMin: undefined, priceMax: undefined } });
  }
  if (f.free) chips.push({ label: f.free === "only" ? "Free-to-play only" : "No free-to-play", without: { ...f, free: undefined } });
  for (const p of f.platforms ?? []) {
    chips.push({ label: PLATFORMS.find((x) => x.key === p)!.label, without: { ...f, platforms: f.platforms!.filter((x) => x !== p) } });
  }
  if (f.onSale) chips.push({ label: "On sale", without: { ...f, onSale: undefined } });
  if (f.minScore) chips.push({ label: `${f.minScore}%+ positive`, without: { ...f, minScore: undefined } });
  return chips;
}
