import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GameListing, { parsePage, parseSort } from "@/components/GameListing";
import { GENRES, getListing } from "@/lib/catalog";

const PAGE_SIZE = 48;

interface GenrePageProps {
  params: Promise<{ genre: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const genreFor = (slug: string) => GENRES.find((g) => g.slug === slug);
const label = (name: string) => (name === "Massively Multiplayer" ? "MMO" : name);

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const { genre: slug } = await params;
  const genre = genreFor(slug);
  if (!genre) return {};
  const name = label(genre.name);
  return {
    title: `${name} Games: Best Prices & Deals on PC`,
    description: `Compare prices for the most popular ${name} games on PC. See which store is cheapest right now, current discounts and all-time lows.`,
    alternates: { canonical: `/games/${genre.slug}` },
  };
}

export default async function GenrePage({ params, searchParams }: GenrePageProps) {
  const { genre: slug } = await params;
  const genre = genreFor(slug);
  if (!genre) notFound();

  const query = await searchParams;
  const sort = parseSort(query.sort);
  const page = parsePage(query.page);
  const { games, total } = await getListing({ genre: genre.name, sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });

  const name = label(genre.name);
  const top = games.slice(0, 3).map((g) => g.name);
  const deals = games.filter((g) => (g.discount_pct ?? 0) > 0);
  const biggest = deals.reduce<(typeof deals)[number] | null>((a, b) => (!a || (b.discount_pct ?? 0) > (a.discount_pct ?? 0) ? b : a), null);

  const intro = [
    `We track prices for ${total.toLocaleString("en")} popular ${/^[A-Z]{2,}$/.test(name) ? name : name.toLowerCase()} games on PC`,
    top.length ? `, led by ${listJoin(top)}.` : ".",
    deals.length ? ` ${deals.length} of the games below are on sale right now` : "",
    biggest ? ` — the biggest cut is ${biggest.discount_pct}% off ${biggest.name}.` : deals.length ? "." : "",
  ].join("");

  return (
    <GameListing
      basePath={`/games/${genre.slug}`}
      eyebrow={`${name} · ${total.toLocaleString("en")} games`}
      title={<>{name} games. <em>Cheapest store first.</em></>}
      intro={intro}
      activeGenre={genre.slug}
      sort={sort}
      page={page}
      pageSize={PAGE_SIZE}
      games={games}
      total={total}
    />
  );
}

function listJoin(items: string[]) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
