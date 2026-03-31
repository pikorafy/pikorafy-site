import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDeals, getStoreName, getDealUrl, getSteamCoverUrl } from "@/lib/cheapshark";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";

export const metadata: Metadata = {
  title: "Today's Best Game Deals — Up to 95% Off",
  description:
    "Find the best PC game deals right now. Compare prices across Steam, GOG, Epic, Humble, Fanatical and more. Updated hourly.",
  openGraph: {
    title: "Today's Best Game Deals | Pikorafy",
    description: "Compare PC game prices across 30+ stores. Find deals up to 95% off.",
  },
};

function getDealBadge(savings: number) {
  if (savings >= 80) return { label: "INSANE", color: "bg-red-500/15 text-red-400 border-red-500/20" };
  if (savings >= 60) return { label: "HOT", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" };
  if (savings >= 40) return { label: "GREAT", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
  return { label: "GOOD", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" };
}

export default async function DealsPage() {
  const deals = await getDeals({
    sortBy: "Deal Rating",
    pageSize: 60,
    onSale: true,
    metacritic: 50,
  });

  return (
    <div className="bg-[#0f1117] min-h-screen">
      {/* Header */}
      <section className="border-b border-[#2a2e3a]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Best Game Deals</h1>
            <span className="rounded-full bg-red-500/15 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold uppercase text-red-400 animate-pulse">
              Live
            </span>
          </div>
          <p className="text-[#8b8fa3] max-w-2xl">
            Compare prices across 30+ stores. Sorted by deal quality — best value first. Updated hourly.
          </p>
          <p className="mt-2 text-xs text-[#8b8fa3]/60">{AFFILIATE_DISCLOSURE_SHORT}</p>
        </div>
      </section>

      {/* Deals grid */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {deals.map((deal) => {
            const savings = parseFloat(deal.savings);
            const badge = getDealBadge(savings);
            const coverUrl = getSteamCoverUrl(deal.steamAppID);

            return (
              <div
                key={deal.dealID}
                className="group relative flex flex-col rounded-lg border border-[#2a2e3a] bg-[#1a1d27] overflow-hidden transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
              >
                {/* Cover */}
                <Link href={`/game/${deal.gameID}`} className="relative aspect-[460/215] w-full bg-[#0f1117] overflow-hidden block">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={deal.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#8b8fa3] text-xs">No image</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                    -{savings.toFixed(0)}%
                  </span>
                  <span className={`absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border backdrop-blur-sm ${badge.color}`}>
                    {badge.label}
                  </span>
                </Link>

                <div className="flex flex-col flex-1 p-3">
                  {/* Store */}
                  <span className="self-start inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#8b8fa3] border border-[#2a2e3a] bg-[#0f1117]">
                    {getStoreName(deal.storeID)}
                  </span>

                  {/* Title */}
                  <Link
                    href={`/game/${deal.gameID}`}
                    className="mt-1.5 text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2"
                  >
                    {deal.title}
                  </Link>

                  {/* Metacritic */}
                  {parseInt(deal.metacriticScore) > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`rounded px-1 py-0.5 text-[10px] font-bold ${
                        parseInt(deal.metacriticScore) >= 75
                          ? "bg-emerald-500/15 text-emerald-400"
                          : parseInt(deal.metacriticScore) >= 50
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-red-500/15 text-red-400"
                      }`}>
                        {deal.metacriticScore}
                      </span>
                      {deal.steamRatingText && (
                        <span className="text-[10px] text-[#8b8fa3] truncate">{deal.steamRatingText}</span>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-emerald-400">${deal.salePrice}</span>
                      <span className="text-xs text-[#8b8fa3] line-through">${deal.normalPrice}</span>
                    </div>
                    <a
                      href={getDealUrl(deal.dealID)}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="rounded-md bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 transition-colors"
                      title="Get this deal"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
