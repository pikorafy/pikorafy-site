import { NextResponse } from "next/server";
import { getListing, normalizeQuery } from "@/lib/catalog";
import { cleanXboxTitle, searchXboxOnly } from "@/lib/xbox";

// Catalog search for the hero search box: Steam games (the /games catalog) plus
// Xbox-only titles. Empty query → the most popular games.

export interface SearchResult {
  href: string;
  name: string;
  image: string | null;
  platform: "PC" | "Xbox";
  price: number | null;
  regularPrice: number | null;
  discountPct: number | null;
  isFree: boolean;
  genres: string[];
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const text = normalizeQuery(q);

  const [{ games }, xbox] = await Promise.all([
    getListing({ query: text || undefined, limit: text ? 20 : 5 }),
    text ? searchXboxOnly(text, 4) : Promise.resolve([]),
  ]);

  // Titles that start with the query first, then by popularity (the listing's order).
  const startsWith = (key: string) => (key.startsWith(text) ? 0 : 1);
  const steam: SearchResult[] = games
    .map((g, i) => ({ g, i }))
    .sort((a, b) => startsWith(normalizeQuery(a.g.name)) - startsWith(normalizeQuery(b.g.name)) || a.i - b.i)
    .slice(0, 6)
    .map(({ g }) => ({
      href: `/game/${g.slug}`,
      name: g.name,
      image: g.header_image,
      platform: "PC",
      price: g.price,
      regularPrice: g.regular_price,
      discountPct: g.discount_pct,
      isFree: g.is_free,
      genres: g.genres.slice(0, 2),
    }));
  const xboxOnly: SearchResult[] = xbox.slice(0, Math.max(2, 8 - steam.length)).map((x) => ({
    href: `/xbox/${x.slug}`,
    name: cleanXboxTitle(x.title),
    image: x.hero_art ? `${x.hero_art}?w=240` : x.box_art ? `${x.box_art}?w=240` : null,
    platform: "Xbox",
    price: x.price,
    regularPrice: x.regular_price,
    discountPct: x.discount_pct,
    isFree: x.is_free,
    genres: x.categories.slice(0, 2),
  }));

  return NextResponse.json(
    { query: q, results: [...steam, ...xboxOnly] },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
