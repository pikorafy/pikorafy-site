"use client";

import Image from "next/image";

interface InstantGamingBannerProps {
  variant?: "pc" | "xbox" | "playstation" | "nintendo";
  className?: string;
}

const AFFILIATE_URL = "https://www.instant-gaming.com/?igr=pikorafy";

const VARIANT_CONFIG: Record<string, { label: string }> = {
  pc: { label: "PC Games" },
  xbox: { label: "Xbox Games" },
  playstation: { label: "PlayStation Games" },
  nintendo: { label: "Nintendo Games" },
};

export default function InstantGamingBanner({ variant = "pc", className = "" }: InstantGamingBannerProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <a
      href={AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`not-prose group flex items-center gap-4 sm:gap-6 rounded-xl border border-[#2a2e3a] bg-gradient-to-r from-[#1a1d27] to-[#1e2231] p-4 sm:p-6 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 ${className}`}
    >
      <div className="shrink-0">
        <Image
          src="/partners/instant-gaming/logo.png"
          alt="Instant Gaming"
          width={48}
          height={48}
          className="rounded-lg"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#e4e6eb] group-hover:text-emerald-400 transition-colors">
            {config.label} up to 90% off
          </span>
          <span className="hidden sm:inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
            Partner Deal
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#8b8fa3] truncate">
          Instant delivery of digital game keys — PC, Xbox, PlayStation & Nintendo
        </p>
      </div>

      <div className="shrink-0 hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white group-hover:bg-emerald-600 transition-colors">
        Browse deals
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </a>
  );
}
