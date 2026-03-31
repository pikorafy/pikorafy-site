import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getGameById, getStoreName, getDealUrl, getSteamCoverUrl } from "@/lib/cheapshark";
import { AFFILIATE_DISCLOSURE } from "@/lib/affiliate";

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { gameId } = await params;
  try {
    const game = await getGameById(gameId);
    const title = game.info.title;
    const cheapest = game.cheapestPriceEver;
    const currentBest = game.deals.length > 0
      ? Math.min(...game.deals.map((d) => parseFloat(d.price)))
      : null;

    return {
      title: `${title} — Best Price & Value Analysis`,
      description: `Is ${title} worth buying? Current best price: $${currentBest?.toFixed(2) ?? "N/A"}. All-time low: $${cheapest.price}. Compare prices across ${game.deals.length} stores.`,
      openGraph: {
        title: `${title} — Best Price & Value Analysis | Pikorafy`,
        description: `Compare ${title} prices across ${game.deals.length} stores. Current best: $${currentBest?.toFixed(2) ?? "N/A"}.`,
        images: getSteamCoverUrl(game.info.steamAppID) ? [{ url: getSteamCoverUrl(game.info.steamAppID)! }] : [],
      },
    };
  } catch {
    return { title: "Game Not Found" };
  }
}

function getValueVerdict(
  currentPrice: number,
  retailPrice: number,
  allTimeLow: number,
  metacriticScore: number | null
): { label: string; color: string; description: string } {
  const savingsPercent = ((retailPrice - currentPrice) / retailPrice) * 100;
  const nearAllTimeLow = currentPrice <= allTimeLow * 1.1;

  if (nearAllTimeLow && savingsPercent >= 50) {
    return {
      label: "Excellent Deal",
      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20",
      description: `Near all-time low price with ${savingsPercent.toFixed(0)}% off. This is one of the best prices we've seen.`,
    };
  }
  if (savingsPercent >= 60) {
    return {
      label: "Great Deal",
      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20",
      description: `${savingsPercent.toFixed(0)}% off retail — a significant discount worth considering.`,
    };
  }
  if (savingsPercent >= 40) {
    return {
      label: "Good Deal",
      color: "text-blue-400 bg-blue-500/15 border-blue-500/20",
      description: `${savingsPercent.toFixed(0)}% off retail. Decent savings, but it has been cheaper before.`,
    };
  }
  if (savingsPercent >= 20) {
    return {
      label: "Fair Price",
      color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/20",
      description: `${savingsPercent.toFixed(0)}% off. Consider waiting for a bigger sale if you're not in a hurry.`,
    };
  }
  if (savingsPercent > 0) {
    return {
      label: "Wait for Sale",
      color: "text-orange-400 bg-orange-500/15 border-orange-500/20",
      description: `Only ${savingsPercent.toFixed(0)}% off. This game has seen much better discounts — patience will pay off.`,
    };
  }
  return {
    label: "Full Price",
    color: "text-red-400 bg-red-500/15 border-red-500/20",
    description: "Currently at full retail price. Check back during seasonal sales for better deals.",
  };
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;

  let game;
  try {
    game = await getGameById(gameId);
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#0f1117] text-white">
        <h1 className="text-2xl font-bold mb-2">Game Not Found</h1>
        <p className="text-[#8b8fa3] mb-6">We couldn&apos;t find pricing data for this game.</p>
        <Link href="/deals" className="text-emerald-400 hover:text-emerald-300">
          &larr; Browse deals
        </Link>
      </div>
    );
  }

  const { info, deals, cheapestPriceEver } = game;
  const coverUrl = getSteamCoverUrl(info.steamAppID);
  const sortedDeals = [...deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  const bestDeal = sortedDeals[0];
  const bestPrice = bestDeal ? parseFloat(bestDeal.price) : null;
  const retailPrice = bestDeal ? parseFloat(bestDeal.retailPrice) : null;
  const allTimeLow = parseFloat(cheapestPriceEver.price);

  const verdict =
    bestPrice !== null && retailPrice !== null
      ? getValueVerdict(bestPrice, retailPrice, allTimeLow, null)
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: info.title,
    description: `Price comparison and value analysis for ${info.title}`,
    image: coverUrl || undefined,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: bestPrice?.toFixed(2),
      highPrice: retailPrice?.toFixed(2),
      priceCurrency: "USD",
      offerCount: deals.length,
    },
  };

  return (
    <div className="bg-[#0f1117] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative border-b border-[#2a2e3a]">
        {coverUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={coverUrl}
              alt=""
              fill
              className="object-cover blur-2xl opacity-20 scale-110"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f1117]/60 to-[#0f1117]" />
          </div>
        )}
        <div className="relative mx-auto max-w-5xl px-6 py-12 lg:py-16">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover */}
            {coverUrl && (
              <div className="shrink-0 w-full md:w-[300px]">
                <div className="relative aspect-[460/215] rounded-lg overflow-hidden border border-[#2a2e3a] shadow-2xl">
                  <Image
                    src={coverUrl}
                    alt={info.title}
                    fill
                    className="object-cover"
                    sizes="300px"
                    priority
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{info.title}</h1>

              {verdict && (
                <div className="mt-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold border ${verdict.color}`}>
                    {verdict.label}
                  </span>
                  <p className="mt-2 text-sm text-[#8b8fa3] max-w-lg">{verdict.description}</p>
                </div>
              )}

              {/* Key stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8b8fa3]">Best Price</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {bestPrice !== null ? `$${bestPrice.toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8b8fa3]">Retail</p>
                  <p className="text-xl font-bold text-white">
                    {retailPrice !== null ? `$${retailPrice.toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[#8b8fa3]">All-Time Low</p>
                  <p className="text-xl font-bold text-blue-400">${allTimeLow.toFixed(2)}</p>
                  <p className="text-[10px] text-[#8b8fa3]">{formatDate(cheapestPriceEver.date)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price Comparison Table */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="text-xl font-bold text-white mb-4">
          Price Comparison — {deals.length} Store{deals.length !== 1 ? "s" : ""}
        </h2>

        <div className="rounded-lg border border-[#2a2e3a] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2e3a] bg-[#1a1d27]">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8b8fa3]">Store</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8b8fa3]">Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8b8fa3]">Savings</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#8b8fa3]"></th>
              </tr>
            </thead>
            <tbody>
              {sortedDeals.map((deal, i) => {
                const price = parseFloat(deal.price);
                const savings = parseFloat(deal.savings);
                const isBest = i === 0;
                return (
                  <tr
                    key={deal.dealID}
                    className={`border-b border-[#2a2e3a]/50 ${isBest ? "bg-emerald-500/5" : "bg-[#0f1117] hover:bg-[#1a1d27]"} transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isBest && (
                          <span className="rounded bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            BEST
                          </span>
                        )}
                        <span className="text-sm font-medium text-white">{getStoreName(deal.storeID)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${isBest ? "text-emerald-400" : "text-white"}`}>
                        ${price.toFixed(2)}
                      </span>
                      {savings > 0 && (
                        <span className="ml-2 text-xs text-[#8b8fa3] line-through">${parseFloat(deal.retailPrice).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {savings > 0 ? (
                        <span className="text-xs font-semibold text-emerald-400">-{savings.toFixed(0)}%</span>
                      ) : (
                        <span className="text-xs text-[#8b8fa3]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={getDealUrl(deal.dealID)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
                      >
                        Get Deal
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Affiliate disclosure */}
        <p className="mt-4 text-xs text-[#8b8fa3]/70 leading-relaxed">
          {AFFILIATE_DISCLOSURE}
        </p>
      </section>

      {/* Price History Summary */}
      <section className="mx-auto max-w-5xl px-6 pb-10">
        <h2 className="text-xl font-bold text-white mb-4">Price History</h2>
        <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8b8fa3] mb-1">Current Best</p>
              <p className="text-2xl font-bold text-emerald-400">
                {bestPrice !== null ? `$${bestPrice.toFixed(2)}` : "N/A"}
              </p>
              {bestDeal && <p className="text-xs text-[#8b8fa3]">at {getStoreName(bestDeal.storeID)}</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8b8fa3] mb-1">All-Time Lowest</p>
              <p className="text-2xl font-bold text-blue-400">${allTimeLow.toFixed(2)}</p>
              <p className="text-xs text-[#8b8fa3]">{formatDate(cheapestPriceEver.date)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8b8fa3] mb-1">Current vs All-Time Low</p>
              {bestPrice !== null ? (
                <>
                  <p className={`text-2xl font-bold ${bestPrice <= allTimeLow * 1.1 ? "text-emerald-400" : "text-orange-400"}`}>
                    {bestPrice <= allTimeLow
                      ? "At lowest!"
                      : `+$${(bestPrice - allTimeLow).toFixed(2)}`}
                  </p>
                  {bestPrice > allTimeLow && (
                    <p className="text-xs text-[#8b8fa3]">
                      {((bestPrice - allTimeLow) / allTimeLow * 100).toFixed(0)}% above all-time low
                    </p>
                  )}
                </>
              ) : (
                <p className="text-2xl font-bold text-[#8b8fa3]">N/A</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Browse more */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="flex items-center gap-4">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-4 py-2 text-sm font-medium text-white hover:border-emerald-500/30 hover:bg-[#1e2231] transition-colors"
          >
            &larr; Browse all deals
          </Link>
          <Link
            href="/stores"
            className="inline-flex items-center gap-2 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-4 py-2 text-sm font-medium text-white hover:border-emerald-500/30 hover:bg-[#1e2231] transition-colors"
          >
            View stores
          </Link>
        </div>
      </section>
    </div>
  );
}
