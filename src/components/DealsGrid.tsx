"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CheapSharkDeal } from "@/lib/cheapshark";
import { getStoreName, getSteamCoverUrl } from "@/lib/cheapshark";

interface DealsGridProps {
  sortBy?: string;
  pageSize?: number;
  metacritic?: number;
  columns?: "4" | "5";
  showMetacritic?: boolean;
  showGetDeal?: boolean;
}

function getDealBadge(savings: number) {
  if (savings >= 80) return { label: "INSANE", color: "bg-red-500/15 text-red-400 border-red-500/20" };
  if (savings >= 60) return { label: "HOT", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" };
  if (savings >= 40) return { label: "GREAT", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
  return { label: "GOOD", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" };
}

export default function DealsGrid({
  sortBy = "Deal Rating",
  pageSize = 60,
  metacritic = 50,
  columns = "5",
  showMetacritic = true,
  showGetDeal = true,
}: DealsGridProps) {
  const [deals, setDeals] = useState<CheapSharkDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      sortBy,
      pageSize: String(pageSize),
      onSale: "1",
      metacritic: String(metacritic),
    });

    fetch(`https://www.cheapshark.com/api/1.0/deals?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setDeals(data))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, [sortBy, pageSize, metacritic]);

  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${columns === "5" ? "xl:grid-cols-5" : ""}`}>
        {Array.from({ length: pageSize > 12 ? 12 : pageSize }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-lg border border-[#2a2e3a] bg-[#1a1d27] overflow-hidden animate-pulse">
            <div className="aspect-[460/215] w-full bg-[#0f1117]" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-16 bg-[#2a2e3a] rounded" />
              <div className="h-4 w-3/4 bg-[#2a2e3a] rounded" />
              <div className="h-5 w-1/3 bg-[#2a2e3a] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-8 text-center">
        <p className="text-[#8b8fa3]">Unable to load deals right now. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${columns === "5" ? "xl:grid-cols-5" : ""}`}>
      {deals.map((deal) => {
        const savings = parseFloat(deal.savings);
        const badge = getDealBadge(savings);
        const coverUrl = getSteamCoverUrl(deal.steamAppID);

        return (
          <div
            key={deal.dealID}
            className="group relative flex flex-col rounded-lg border border-[#2a2e3a] bg-[#1a1d27] overflow-hidden transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
          >
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
              <span className="self-start inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#8b8fa3] border border-[#2a2e3a] bg-[#0f1117]">
                {getStoreName(deal.storeID)}
              </span>

              <Link
                href={`/game/${deal.gameID}`}
                className="mt-1.5 text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2"
              >
                {deal.title}
              </Link>

              {showMetacritic && parseInt(deal.metacriticScore) > 0 && (
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

              <div className="mt-auto pt-2 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-emerald-400">${deal.salePrice}</span>
                  <span className="text-xs text-[#8b8fa3] line-through">${deal.normalPrice}</span>
                </div>
                {showGetDeal && (
                  <a
                    href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="rounded-md bg-emerald-500 p-1.5 text-white hover:bg-emerald-600 transition-colors"
                    title="Get this deal"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
