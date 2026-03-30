"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const platformFilters = [
  { label: "All Deals", href: "/gaming/deals", active: true },
  { label: "PC", href: "/gaming/deals?platform=pc", active: false },
  { label: "PlayStation", href: "/gaming/deals?platform=playstation", active: false },
  { label: "Xbox", href: "/gaming/deals?platform=xbox", active: false },
  { label: "Nintendo", href: "/gaming/deals?platform=nintendo", active: false },
];

// Most sold/played games for the full-width background mosaic
const mosaicRow1 = [
  { name: "Elden Ring", steamId: 1245620 },
  { name: "Cyberpunk 2077", steamId: 1091500 },
  { name: "Baldur's Gate 3", steamId: 1086940 },
  { name: "Red Dead Redemption 2", steamId: 1174180 },
  { name: "God of War Ragnarök", steamId: 2322010 },
  { name: "Monster Hunter Wilds", steamId: 2246340 },
  { name: "Hades II", steamId: 1145350 },
  { name: "Hogwarts Legacy", steamId: 990080 },
];

const mosaicRow2 = [
  { name: "Resident Evil 4", steamId: 2050650 },
  { name: "The Last of Us", steamId: 1888930 },
  { name: "Starfield", steamId: 1716740 },
  { name: "Diablo IV", steamId: 2344520 },
  { name: "GTA V", steamId: 271590 },
  { name: "Counter-Strike 2", steamId: 730 },
  { name: "Palworld", steamId: 1623730 },
  { name: "Helldivers 2", steamId: 553850 },
];

const mosaicRow3 = [
  { name: "God of War Ragnarök", steamId: 2322010 },
  { name: "Hades II", steamId: 1145350 },
  { name: "GTA V", steamId: 271590 },
  { name: "Elden Ring", steamId: 1245620 },
  { name: "Diablo IV", steamId: 2344520 },
  { name: "Cyberpunk 2077", steamId: 1091500 },
  { name: "Monster Hunter Wilds", steamId: 2246340 },
  { name: "The Last of Us", steamId: 1888930 },
];

const mosaicRow4 = [
  { name: "Baldur's Gate 3", steamId: 1086940 },
  { name: "Starfield", steamId: 1716740 },
  { name: "Hogwarts Legacy", steamId: 990080 },
  { name: "Red Dead Redemption 2", steamId: 1174180 },
  { name: "Counter-Strike 2", steamId: 730 },
  { name: "Resident Evil 4", steamId: 2050650 },
  { name: "Palworld", steamId: 1623730 },
  { name: "Helldivers 2", steamId: 553850 },
];

function MosaicRow({ games, direction, speed }: { games: typeof mosaicRow1; direction: "left" | "right"; speed: number }) {
  const doubled = [...games, ...games];
  const animName = direction === "left" ? "scrollLeft" : "scrollRight";
  return (
    <div
      className={`flex gap-2 animate-[${animName}_${speed}s_linear_infinite]`}
      style={{ width: "max-content" }}
    >
      {doubled.map((game, i) => (
        <div key={`${game.steamId}-${i}`} className="relative w-[220px] lg:w-[260px] aspect-[460/215] rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamId}/header.jpg`}
            alt={game.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function HeroBackgroundPaths() {
  return (
    <div className="relative w-full overflow-hidden bg-[#0f1117] border-b border-[#2a2e3a]">
      {/* Full-width scrolling mosaic background */}
      <div className="absolute inset-0 flex flex-col justify-center gap-2 opacity-30">
        <MosaicRow games={mosaicRow1} direction="left" speed={25} />
        <MosaicRow games={mosaicRow2} direction="right" speed={30} />
        <MosaicRow games={mosaicRow3} direction="left" speed={35} />
        <MosaicRow games={mosaicRow4} direction="right" speed={28} />
      </div>

      {/* Dark overlay + gradient for text readability */}
      <div className="absolute inset-0 bg-[#0f1117]/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1117] via-transparent to-[#0f1117]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117]/90 via-[#0f1117]/40 to-[#0f1117]/90" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />

      {/* Hero content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Deals updated daily
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
              Find the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                best game deals
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#b0b3c0] leading-relaxed max-w-xl mx-auto">
              Compare prices across stores. Save up to 90% on PC, PlayStation, Xbox & Nintendo game keys.
            </p>

            {/* Platform filter pills */}
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {platformFilters.map((filter) => (
                <Link
                  key={filter.label}
                  href={filter.href}
                  className={
                    filter.active
                      ? "rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
                      : "rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-[#b0b3c0] transition-colors hover:border-white/20 hover:text-white"
                  }
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/gaming/deals"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                Browse Deals
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/vs"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10"
              >
                Compare Services
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
