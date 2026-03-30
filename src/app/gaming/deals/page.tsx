import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import InstantGamingBanner from "@/components/InstantGamingBanner";

export const metadata: Metadata = {
  title: "Best Game Deals - Up to 90% Off | Pikorafy",
  description:
    "Curated daily deals on PC, Xbox, PlayStation & Nintendo games. Save up to 90% on digital game keys from trusted marketplace Instant Gaming.",
};

type GameDeal = {
  title: string;
  platform: string;
  platformBadge: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercent: number;
  href: string;
  steamId: number;
};

const deals: GameDeal[] = [
  { title: "Elden Ring", platform: "PC", platformBadge: "Steam", originalPrice: "$59.99", discountedPrice: "$24.99", discountPercent: 58, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 1245620 },
  { title: "Cyberpunk 2077", platform: "PC", platformBadge: "Steam", originalPrice: "$59.99", discountedPrice: "$19.99", discountPercent: 67, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 1091500 },
  { title: "God of War Ragnarok", platform: "PlayStation", platformBadge: "PS5", originalPrice: "$69.99", discountedPrice: "$34.99", discountPercent: 50, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 2322010 },
  { title: "Zelda: Tears of the Kingdom", platform: "Nintendo", platformBadge: "Switch", originalPrice: "$69.99", discountedPrice: "$44.99", discountPercent: 36, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 0 },
  { title: "Red Dead Redemption 2", platform: "PC", platformBadge: "Steam", originalPrice: "$59.99", discountedPrice: "$14.99", discountPercent: 75, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 1174180 },
  { title: "Hogwarts Legacy", platform: "PC", platformBadge: "Steam", originalPrice: "$59.99", discountedPrice: "$22.99", discountPercent: 62, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 990080 },
  { title: "Resident Evil 4 Remake", platform: "PC", platformBadge: "Steam", originalPrice: "$59.99", discountedPrice: "$27.99", discountPercent: 53, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 2050650 },
  { title: "Starfield", platform: "Xbox", platformBadge: "Xbox", originalPrice: "$69.99", discountedPrice: "$29.99", discountPercent: 57, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 1716740 },
  { title: "Baldur's Gate 3", platform: "PC", platformBadge: "Steam", originalPrice: "$59.99", discountedPrice: "$39.99", discountPercent: 33, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 1086940 },
  { title: "Spider-Man 2", platform: "PlayStation", platformBadge: "PS5", originalPrice: "$69.99", discountedPrice: "$39.99", discountPercent: 43, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 0 },
  { title: "Mario Kart 8 Deluxe", platform: "Nintendo", platformBadge: "Switch", originalPrice: "$59.99", discountedPrice: "$39.99", discountPercent: 33, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 0 },
  { title: "Hades II", platform: "PC", platformBadge: "Steam", originalPrice: "$29.99", discountedPrice: "$19.99", discountPercent: 33, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 1145350 },
  { title: "The Last of Us Part I", platform: "PC", platformBadge: "Steam", originalPrice: "$59.99", discountedPrice: "$29.99", discountPercent: 50, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 1888930 },
  { title: "Diablo IV", platform: "Xbox", platformBadge: "Xbox", originalPrice: "$69.99", discountedPrice: "$24.99", discountPercent: 64, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 2344520 },
  { title: "Final Fantasy XVI", platform: "PC", platformBadge: "Steam", originalPrice: "$49.99", discountedPrice: "$29.99", discountPercent: 40, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 2515020 },
  { title: "Monster Hunter Wilds", platform: "PC", platformBadge: "Steam", originalPrice: "$69.99", discountedPrice: "$54.99", discountPercent: 21, href: "https://www.instant-gaming.com/?igr=pikorafy", steamId: 2246340 },
];

const platformTabs = ["All", "PC", "Xbox", "PlayStation", "Nintendo"];

const platformBadgeColors: Record<string, string> = {
  Steam: "bg-[#1b2838]/60 text-[#66c0f4] border-[#66c0f4]/20",
  Xbox: "bg-green-500/10 text-green-400 border-green-500/20",
  PS5: "bg-blue-600/10 text-blue-400 border-blue-600/20",
  Switch: "bg-red-500/10 text-red-400 border-red-500/20",
};

function getDealRating(discount: number) {
  if (discount >= 70) return { label: "HOT", color: "bg-red-500/15 text-red-400 border-red-500/20" };
  if (discount >= 50) return { label: "GREAT", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" };
  if (discount >= 30) return { label: "GOOD", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
  return { label: "FAIR", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" };
}

function DealCard({ deal }: { deal: GameDeal }) {
  const rating = getDealRating(deal.discountPercent);
  const hasCover = deal.steamId > 0;

  return (
    <a
      href={deal.href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group relative flex flex-col rounded-lg border border-[#2a2e3a] bg-[#1a1d27] overflow-hidden transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
    >
      {/* Cover image */}
      <div className="relative aspect-[460/215] w-full bg-[#0f1117] overflow-hidden">
        {hasCover ? (
          <Image
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${deal.steamId}/header.jpg`}
            alt={deal.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e2231] to-[#2a2e3a] flex items-center justify-center">
            <span className="text-2xl font-bold text-[#8b8fa3]/30">{deal.title.charAt(0)}</span>
          </div>
        )}
        {/* Discount badge */}
        <span className="absolute top-2 right-2 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
          -{deal.discountPercent}%
        </span>
        {/* Deal rating */}
        <span className={`absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border backdrop-blur-sm ${rating.color}`}>
          {rating.label}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-3">
        {/* Platform badge */}
        <span className={`self-start inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase border ${platformBadgeColors[deal.platformBadge] || "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"}`}>
          {deal.platformBadge}
        </span>

        {/* Title */}
        <h3 className="mt-1.5 text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight line-clamp-1">
          {deal.title}
        </h3>

        {/* Price */}
        <div className="mt-auto pt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-emerald-400">{deal.discountedPrice}</span>
          <span className="text-xs text-[#8b8fa3] line-through">{deal.originalPrice}</span>
        </div>
      </div>
    </a>
  );
}

const features = [
  {
    title: "Up to 90% off",
    description: "Best prices on digital game keys for PC, Xbox, PlayStation, and Nintendo.",
    icon: (
      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    title: "Instant delivery",
    description: "Get your game key in seconds. No waiting, no shipping.",
    icon: (
      <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    title: "Trusted platform",
    description: "Millions of satisfied customers. Safe and secure.",
    icon: (
      <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
];

export default function GamingDealsPage() {
  return (
    <div className="bg-[#0f1117] min-h-full">
      {/* Header */}
      <section className="border-b border-[#2a2e3a]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Updated daily
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Game Deals</h1>
              <p className="mt-2 text-sm text-[#8b8fa3]">
                Curated deals on PC, Xbox, PlayStation & Nintendo. Up to 90% off.
              </p>
            </div>
            <Link
              href="/gaming"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              &larr; Gaming Hub
            </Link>
          </div>

          {/* Platform Filter */}
          <div className="mt-6 flex flex-wrap gap-2">
            {platformTabs.map((tab, i) => (
              <span
                key={tab}
                className={
                  i === 0
                    ? "inline-flex rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 text-xs font-medium text-emerald-400 cursor-pointer"
                    : "inline-flex rounded-full border border-[#2a2e3a] bg-[#1a1d27] px-4 py-1.5 text-xs font-medium text-[#8b8fa3] transition-colors hover:border-[#3a3e4a] hover:text-white cursor-pointer"
                }
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        {/* Deal Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {deals.slice(0, 8).map((deal) => (
            <DealCard key={deal.title} deal={deal} />
          ))}
        </div>

        {/* Banner */}
        <div className="mt-8">
          <InstantGamingBanner className="w-full" />
        </div>

        {/* More Deals */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {deals.slice(8).map((deal) => (
            <DealCard key={deal.title} deal={deal} />
          ))}
        </div>

        {/* Why Instant Gaming */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-white text-center mb-8">
            Why buy from Instant Gaming?
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f1117] border border-[#2a2e3a]">
                  {feature.icon}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">{feature.title}</h3>
                <p className="mt-1.5 text-xs text-[#8b8fa3] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-16 rounded-lg border border-[#2a2e3a] bg-gradient-to-r from-[#1a1d27] to-emerald-500/5 p-8 text-center">
          <h2 className="text-lg font-bold text-white">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mt-2 text-sm text-[#8b8fa3]">
            Browse thousands more game deals on Instant Gaming.
          </p>
          <a
            href="https://www.instant-gaming.com/?igr=pikorafy"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Browse all deals
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </section>

        {/* Disclaimer */}
        <div className="mt-8 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4">
          <p className="text-xs text-[#8b8fa3]">
            Prices may vary. Last updated March 2026. All links are affiliate links — we may earn a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </div>
  );
}
