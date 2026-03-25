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

const STATIC_BANNERS: Record<Exclude<BannerVariant, "dynamic">, { src: string; alt: string }> = {
  pc: { src: "/partners/instant-gaming/pc-games.png", alt: "PC Games up to 90% off on Instant Gaming" },
  xbox: { src: "/partners/instant-gaming/xbox.png", alt: "Xbox Games up to 90% off on Instant Gaming" },
  playstation: { src: "/partners/instant-gaming/playstation.png", alt: "PlayStation Games up to 90% off on Instant Gaming" },
  nintendo: { src: "/partners/instant-gaming/nintendo.png", alt: "Nintendo Games up to 90% off on Instant Gaming" },
};

export default function InstantGamingBanner({ variant = "dynamic", className = "" }: InstantGamingBannerProps) {
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

  // Static image banner with affiliate link
  const banner = STATIC_BANNERS[variant];

  return (
    <a
      href={AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`block rounded-xl border border-[#2a2e3a] overflow-hidden transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 ${className}`}
    >
      <Image
        src={banner.src}
        alt={banner.alt}
        width={300}
        height={600}
        className="w-full h-auto"
      />
    </a>
  );
}
