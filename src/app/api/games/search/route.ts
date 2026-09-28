import { NextResponse } from "next/server";
import { getListing, normalizeQuery } from "@/lib/catalog";
import { searchTitles } from "@/lib/titles";

// Search box results: games on any store (the shared titles: PC, PlayStation, Xbox,
// Switch), with Steam games that aren't linked to a title yet as a fallback.
// Empty query → the most popular games.

export interface SearchResult {
  href: string;
  name: string;
  image: string | null;
  platforms: string[];
  price: number | null;
  regularPrice: number | null;
  discountPct: number | null;
  isFree: boolean;
  genres: string[];
}

const LIMIT = 8;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const text = normalizeQuery(q);

  const [titles, { games }] = await Promise.all([
    text ? searchTitles(text, LIMIT) : Promise.resolve([]),
    getListing({ query: text || undefined, limit: text ? 10 : 5 }),
  ]);

  const results: SearchResult[] = titles.map((t) => ({
    href: `/game/${t.slug}`, name: t.name, image: t.image, platforms: t.platforms,
    price: t.price, regularPrice: t.regularPrice, discountPct: t.discountPct, isFree: t.isFree, genres: t.genres,
  }));
  // Steam games: the whole list for an empty query, else those not already shown by name.
  const shown = new Set(results.map((r) => normalizeQuery(r.name)));
  for (const g of games) {
    if (results.length >= (text ? LIMIT : 5)) break;
    if (shown.has(normalizeQuery(g.name))) continue;
    results.push({
      href: `/game/${g.slug}`, name: g.name, image: g.header_image, platforms: ["PC"],
      price: g.price, regularPrice: g.regular_price, discountPct: g.discount_pct, isFree: g.is_free, genres: g.genres.slice(0, 2),
    });
  }

  return NextResponse.json(
    { query: q, results },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
