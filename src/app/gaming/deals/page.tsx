import type { Metadata } from "next";
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
};

const deals: GameDeal[] = [
  {
    title: "Elden Ring",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$59.99",
    discountedPrice: "$24.99",
    discountPercent: 58,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Cyberpunk 2077",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$59.99",
    discountedPrice: "$19.99",
    discountPercent: 67,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "God of War Ragnarok",
    platform: "PlayStation",
    platformBadge: "PS5",
    originalPrice: "$69.99",
    discountedPrice: "$34.99",
    discountPercent: 50,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Zelda: Tears of the Kingdom",
    platform: "Nintendo",
    platformBadge: "Switch",
    originalPrice: "$69.99",
    discountedPrice: "$44.99",
    discountPercent: 36,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Red Dead Redemption 2",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$59.99",
    discountedPrice: "$14.99",
    discountPercent: 75,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Hogwarts Legacy",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$59.99",
    discountedPrice: "$22.99",
    discountPercent: 62,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Resident Evil 4 Remake",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$59.99",
    discountedPrice: "$27.99",
    discountPercent: 53,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Starfield",
    platform: "Xbox",
    platformBadge: "Xbox",
    originalPrice: "$69.99",
    discountedPrice: "$29.99",
    discountPercent: 57,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Baldur's Gate 3",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$59.99",
    discountedPrice: "$39.99",
    discountPercent: 33,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Spider-Man 2",
    platform: "PlayStation",
    platformBadge: "PS5",
    originalPrice: "$69.99",
    discountedPrice: "$39.99",
    discountPercent: 43,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Mario Kart 8 Deluxe",
    platform: "Nintendo",
    platformBadge: "Switch",
    originalPrice: "$59.99",
    discountedPrice: "$39.99",
    discountPercent: 33,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Hades II",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$29.99",
    discountedPrice: "$19.99",
    discountPercent: 33,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "The Last of Us Part I",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$59.99",
    discountedPrice: "$29.99",
    discountPercent: 50,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Diablo IV",
    platform: "Xbox",
    platformBadge: "Xbox",
    originalPrice: "$69.99",
    discountedPrice: "$24.99",
    discountPercent: 64,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Final Fantasy XVI",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$49.99",
    discountedPrice: "$29.99",
    discountPercent: 40,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
  {
    title: "Monster Hunter Wilds",
    platform: "PC",
    platformBadge: "Steam",
    originalPrice: "$69.99",
    discountedPrice: "$54.99",
    discountPercent: 21,
    href: "https://www.instant-gaming.com/?igr=pikorafy",
  },
];

const platformTabs = ["All", "PC", "Xbox", "PlayStation", "Nintendo"];

const platformBadgeColors: Record<string, string> = {
  Steam: "bg-[#1b2838]/60 text-[#66c0f4] border-[#66c0f4]/20",
  Xbox: "bg-green-500/10 text-green-400 border-green-500/20",
  PS5: "bg-blue-600/10 text-blue-400 border-blue-600/20",
  Switch: "bg-red-500/10 text-red-400 border-red-500/20",
};

const features = [
  {
    title: "Up to 90% off",
    description: "Best prices on digital game keys for PC, Xbox, PlayStation, and Nintendo.",
    icon: (
      <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    title: "Instant delivery",
    description: "Get your game key in seconds after purchase. No waiting, no shipping.",
    icon: (
      <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    title: "Trusted platform",
    description: "Millions of satisfied customers worldwide. Safe and secure transactions.",
    icon: (
      <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
];

export default function GamingDealsPage() {
  return (
    <div className="bg-[#0f1117] min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#2a2e3a]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 mb-6">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
              Updated daily
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Game Deals
            </h1>
            <p className="mt-6 text-lg text-[#8b8fa3] leading-relaxed">
              Curated daily deals on PC, Xbox, PlayStation &amp; Nintendo games. Up to 90% off.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 sm:py-16">
        {/* Platform Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {platformTabs.map((tab, i) => (
            <span
              key={tab}
              className={
                i === 0
                  ? "inline-flex rounded-lg bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                  : "inline-flex rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] transition-colors hover:border-[#3B82F6]/50 hover:text-white cursor-pointer"
              }
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Deals Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {deals.slice(0, 8).map((deal) => (
            <a
              key={deal.title}
              href={deal.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group relative flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-5 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231] hover:shadow-lg hover:shadow-blue-500/5"
            >
              {/* Discount badge */}
              <div className="absolute -top-2.5 right-4 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-400 border border-green-500/20">
                -{deal.discountPercent}%
              </div>

              {/* Platform badge */}
              <div>
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase border ${platformBadgeColors[deal.platformBadge] || "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"}`}>
                  {deal.platformBadge}
                </span>
              </div>

              {/* Game title */}
              <h3 className="mt-3 text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors leading-tight">
                {deal.title}
              </h3>

              {/* Pricing */}
              <div className="mt-auto pt-4 flex items-baseline gap-2">
                <span className="text-sm text-[#8b8fa3] line-through">
                  {deal.originalPrice}
                </span>
                <span className="text-xl font-bold text-green-400">
                  {deal.discountedPrice}
                </span>
              </div>

              {/* CTA */}
              <span className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-[#2563EB]">
                Buy now
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>

              {/* Attribution */}
              <p className="mt-2 text-center text-[10px] text-[#8b8fa3]">via Instant Gaming</p>
            </a>
          ))}
        </div>

        {/* Instant Gaming Banner */}
        <div className="mt-10">
          <InstantGamingBanner className="w-full" />
        </div>

        {/* More Deals Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {deals.slice(8).map((deal) => (
            <a
              key={deal.title}
              href={deal.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group relative flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-5 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231] hover:shadow-lg hover:shadow-blue-500/5"
            >
              {/* Discount badge */}
              <div className="absolute -top-2.5 right-4 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-400 border border-green-500/20">
                -{deal.discountPercent}%
              </div>

              {/* Platform badge */}
              <div>
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase border ${platformBadgeColors[deal.platformBadge] || "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"}`}>
                  {deal.platformBadge}
                </span>
              </div>

              {/* Game title */}
              <h3 className="mt-3 text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors leading-tight">
                {deal.title}
              </h3>

              {/* Pricing */}
              <div className="mt-auto pt-4 flex items-baseline gap-2">
                <span className="text-sm text-[#8b8fa3] line-through">
                  {deal.originalPrice}
                </span>
                <span className="text-xl font-bold text-green-400">
                  {deal.discountedPrice}
                </span>
              </div>

              {/* CTA */}
              <span className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-[#2563EB]">
                Buy now
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>

              {/* Attribution */}
              <p className="mt-2 text-center text-[10px] text-[#8b8fa3]">via Instant Gaming</p>
            </a>
          ))}
        </div>

        {/* Why buy from Instant Gaming */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-white sm:text-3xl text-center mb-10">
            Why buy from Instant Gaming?
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f1117] border border-[#2a2e3a]">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-[#8b8fa3] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-20 rounded-xl border border-[#2a2e3a] bg-gradient-to-r from-[#1a1d27] to-[#1e2231] p-8 sm:p-12 text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mt-3 text-[#8b8fa3]">
            Browse thousands more game deals on Instant Gaming with prices up to 90% off.
          </p>
          <a
            href="https://www.instant-gaming.com/?igr=pikorafy"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB]"
          >
            Browse all deals on Instant Gaming
            <svg className="h-4 w-4 transition-transform hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </section>

        {/* Disclaimer */}
        <div className="mt-12 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6">
          <p className="text-sm text-[#8b8fa3]">
            Prices may vary. Last updated March 2026. All links are affiliate links — we may earn a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </div>
  );
}
