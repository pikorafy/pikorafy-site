import type { Metadata } from "next";
import GameListing, { parsePage, parseSort } from "@/components/GameListing";
import { getListing } from "@/lib/catalog";

const PAGE_SIZE = 48;

type Params = { [key: string]: string | string[] | undefined };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: "PC Game Prices & Deals — Compare Every Store",
    description:
      "Current prices for the most popular PC games across Steam, GOG, Fanatical, Humble and more. Sort by discount, price or reviews and find the cheapest store.",
    alternates: { canonical: "/games" },
    // Search result pages shouldn't be indexed.
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const page = parsePage(params.page);
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim().slice(0, 80) ?? "";
  const { games, total } = await getListing({ sort, query: query || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const onSale = games.filter((g) => (g.discount_pct ?? 0) > 0).length;

  return (
    <GameListing
      basePath="/games"
      eyebrow={query ? `${total.toLocaleString("en")} ${total === 1 ? "match" : "matches"}` : `${total.toLocaleString("en")} games tracked`}
      title={query ? <>Results for <em>“{query}”</em></> : <>Every game. <em>Every store.</em></>}
      intro={
        query
          ? (total ? `Games whose title matches “${query}”, most popular first.` : `No games match “${query}”. Try a shorter or different title.`)
          : `Prices for the ${total.toLocaleString("en")} most popular PC games, refreshed several times a day from official stores. ` +
            (onSale ? `${onSale} of the games on this page are discounted right now.` : "Pick a genre or sort by discount to find the best deals.")
      }
      query={query}
      sort={sort}
      page={page}
      pageSize={PAGE_SIZE}
      games={games}
      total={total}
    />
  );
}
