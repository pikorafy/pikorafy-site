import type { Metadata } from "next";
import GameListing, { parsePage, parseSort } from "@/components/GameListing";
import { getListing } from "@/lib/catalog";

const PAGE_SIZE = 48;

export const metadata: Metadata = {
  title: "PC Game Prices & Deals — Compare Every Store",
  description:
    "Current prices for the most popular PC games across Steam, GOG, Fanatical, Humble and more. Sort by discount, price or reviews and find the cheapest store.",
  alternates: { canonical: "/games" },
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const page = parsePage(params.page);
  const { games, total } = await getListing({ sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const onSale = games.filter((g) => (g.discount_pct ?? 0) > 0).length;

  return (
    <GameListing
      basePath="/games"
      eyebrow={`${total.toLocaleString("en")} games tracked`}
      title={<>Every game. <em>Every store.</em></>}
      intro={
        `Prices for the ${total.toLocaleString("en")} most popular PC games, refreshed several times a day from official stores. ` +
        (onSale ? `${onSale} of the games on this page are discounted right now.` : "Pick a genre or sort by discount to find the best deals.")
      }
      sort={sort}
      page={page}
      pageSize={PAGE_SIZE}
      games={games}
      total={total}
    />
  );
}
