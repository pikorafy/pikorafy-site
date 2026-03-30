"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const platformFilters = [
  { label: "All Deals", href: "/gaming/deals", active: true },
  { label: "PC", href: "/gaming/deals?platform=pc", active: false },
  { label: "PlayStation", href: "/gaming/deals?platform=playstation", active: false },
  { label: "Xbox", href: "/gaming/deals?platform=xbox", active: false },
  { label: "Nintendo", href: "/gaming/deals?platform=nintendo", active: false },
];

const stats = [
  { value: "5,000+", label: "Game deals" },
  { value: "90%", label: "Max discount" },
  { value: "Instant", label: "Key delivery" },
];

export function HeroBackgroundPaths() {
  return (
    <div className="relative w-full overflow-hidden bg-[#0f1117] border-b border-[#2a2e3a]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-blue-500/8" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          {/* Left: Text content */}
          <div className="max-w-2xl">
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

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Find the{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                  best game deals
                </span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[#8b8fa3] leading-relaxed max-w-lg">
                Compare prices across stores. Save up to 90% on PC, PlayStation, Xbox & Nintendo game keys.
              </p>

              {/* Platform filter pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {platformFilters.map((filter) => (
                  <Link
                    key={filter.label}
                    href={filter.href}
                    className={
                      filter.active
                        ? "rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
                        : "rounded-full border border-[#2a2e3a] bg-[#1a1d27] px-4 py-1.5 text-sm font-medium text-[#8b8fa3] transition-colors hover:border-[#3a3e4a] hover:text-white"
                    }
                  >
                    {filter.label}
                  </Link>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/gaming/deals"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  Browse Deals
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/vs"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:border-[#3a3e4a] hover:bg-[#1e2231]"
                >
                  Compare Services
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right: Stats cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-3 lg:gap-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-xl border border-[#2a2e3a] bg-[#1a1d27]/80 backdrop-blur-sm px-4 py-5 sm:px-6 sm:py-6 text-center"
              >
                <span className="text-xl sm:text-2xl font-bold text-emerald-400">{stat.value}</span>
                <span className="mt-1 text-xs text-[#8b8fa3]">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
