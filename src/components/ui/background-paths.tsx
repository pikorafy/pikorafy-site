"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Most popular games for the marquee
const GAME_IMAGES = [
  { name: "Elden Ring", steamId: 1245620 },
  { name: "Cyberpunk 2077", steamId: 1091500 },
  { name: "Baldur's Gate 3", steamId: 1086940 },
  { name: "Red Dead Redemption 2", steamId: 1174180 },
  { name: "God of War Ragnarök", steamId: 2322010 },
  { name: "Monster Hunter Wilds", steamId: 2246340 },
  { name: "Hades II", steamId: 1145350 },
  { name: "Hogwarts Legacy", steamId: 990080 },
  { name: "Resident Evil 4", steamId: 2050650 },
  { name: "The Last of Us", steamId: 1888930 },
  { name: "Starfield", steamId: 1716740 },
  { name: "Diablo IV", steamId: 2344520 },
  { name: "GTA V", steamId: 271590 },
  { name: "Counter-Strike 2", steamId: 730 },
  { name: "Palworld", steamId: 1623730 },
  { name: "Helldivers 2", steamId: 553850 },
];

const FADE_IN = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

export function HeroBackgroundPaths() {
  const duplicatedImages = [...GAME_IMAGES, ...GAME_IMAGES];

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] max-h-[900px] overflow-hidden bg-[#0f1117] border-b border-[#2a2e3a] flex flex-col items-center justify-center text-center px-4">
      {/* Centered content */}
      <div className="z-10 flex flex-col items-center">
        {/* Tagline pill */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Deals updated daily
        </motion.div>

        {/* Title */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-white"
        >
          {["Find", "the"].map((word, i) => (
            <motion.span key={i} variants={FADE_IN} className="inline-block">
              {word}&nbsp;
            </motion.span>
          ))}
          <motion.span
            variants={FADE_IN}
            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400"
          >
            Best Game
          </motion.span>
          <br />
          <motion.span
            variants={FADE_IN}
            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400"
          >
            Deals
          </motion.span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-[#8b8fa3]"
        >
          Compare prices across 30+ stores. Save up to 90% on PC, PlayStation, Xbox & Nintendo game keys.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Link href="/gaming/deals">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-600 cursor-pointer"
            >
              Browse Deals
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </motion.span>
          </Link>
          <Link href="/stores">
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
            >
              View Stores
            </motion.span>
          </Link>
        </motion.div>
      </div>

      {/* Animated game cover marquee at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 md:h-2/5 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
        <motion.div
          className="flex gap-4 pt-4"
          animate={{
            x: ["-50%", "0%"],
          }}
          transition={{
            ease: "linear",
            duration: 40,
            repeat: Infinity,
          }}
        >
          {duplicatedImages.map((game, index) => (
            <div
              key={`${game.steamId}-${index}`}
              className="relative h-40 md:h-56 flex-shrink-0 rounded-2xl overflow-hidden shadow-md shadow-black/30"
              style={{
                aspectRatio: "460/215",
                rotate: `${index % 2 === 0 ? -2 : 3}deg`,
              }}
            >
              <Image
                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamId}/header.jpg`}
                alt={game.name}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Gradient overlay above marquee for depth */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 md:h-2/5 bg-gradient-to-t from-[#0f1117] via-transparent to-transparent pointer-events-none z-[5]" />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0f1117] to-transparent pointer-events-none z-[5]" />
    </section>
  );
}
