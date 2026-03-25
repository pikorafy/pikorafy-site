"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useState } from "react";

type BannerVariant = "pc" | "xbox" | "playstation" | "nintendo" | "dynamic";

interface InstantGamingBannerProps {
  variant?: BannerVariant;
  className?: string;
}

const AFFILIATE_URL = "https://www.instant-gaming.com/?igr=pikorafy";
const IGR = "pikorafy";

const VARIANT_CONFIG: Record<Exclude<BannerVariant, "dynamic">, { label: string; icon: string }> = {
  pc: { label: "PC Games", icon: "🖥️" },
  xbox: { label: "Xbox Games", icon: "🎮" },
  playstation: { label: "PlayStation Games", icon: "🎮" },
  nintendo: { label: "Nintendo Games", icon: "🕹️" },
};

export default function InstantGamingBanner({ variant = "pc", className = "" }: InstantGamingBannerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Dynamic banner using Instant Gaming's JS API
  if (variant === "dynamic") {
    const bannerId = `ig-banner-${Math.random().toString(36).slice(2, 8)}`;

    return (
      <div className={`rounded-xl border border-[#2a2e3a] overflow-hidden ${className}`}>
        <Script id={`ig-config-${bannerId}`} strategy="afterInteractive">
          {`
            window.igBannerConfig = window.igBannerConfig || {};
            window.igBannerConfig = {
              lang: 'en',
              igr: '${IGR}',
              banners: ['${bannerId}']
            };
          `}
        </Script>
        <Script
          src="https://www.instant-gaming.com/api/banner/partner/loader.js"
          strategy="afterInteractive"
        />
        <div className={bannerId} />
      </div>
    );
  }

  // Horizontal CTA banner (not a stretched image)
  const config = VARIANT_CONFIG[variant];

  return (
    <a
      href={AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`not-prose group flex items-center gap-4 sm:gap-6 rounded-xl border border-[#2a2e3a] bg-gradient-to-r from-[#1a1d27] to-[#1e2231] p-4 sm:p-6 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 ${className}`}
    >
      {/* Logo */}
      <div className="shrink-0">
        <Image
          src="/partners/instant-gaming/logo.png"
          alt="Instant Gaming"
          width={48}
          height={48}
          className="rounded-lg"
        />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#e4e6eb] group-hover:text-blue-400 transition-colors">
            {config.label} up to 90% off
          </span>
          <span className="hidden sm:inline-flex rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-green-400">
            Partner Deal
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#8b8fa3] truncate">
          Instant delivery of digital game keys — PC, Xbox, PlayStation & Nintendo
        </p>
      </div>

      {/* CTA */}
      <div className="shrink-0 hidden sm:flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white group-hover:bg-blue-600 transition-colors">
        Browse deals
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </a>
  );
}
