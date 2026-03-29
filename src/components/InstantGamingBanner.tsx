"use client";

import Image from "next/image";
import React, { Component, useEffect, useId, useRef, useState } from "react";

type BannerVariant = "pc" | "xbox" | "playstation" | "nintendo" | "dynamic";

class BannerErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface InstantGamingBannerProps {
  variant?: BannerVariant;
  className?: string;
}

const AFFILIATE_URL = "https://www.instant-gaming.com/?igr=pikorafy";
const IGR = "pikorafy";

const VARIANT_CONFIG: Record<Exclude<BannerVariant, "dynamic">, { label: string }> = {
  pc: { label: "PC Games" },
  xbox: { label: "Xbox Games" },
  playstation: { label: "PlayStation Games" },
  nintendo: { label: "Nintendo Games" },
};

// Track whether we've already loaded the IG script globally
let igScriptLoaded = false;

export default function InstantGamingBanner({ variant = "dynamic", className = "" }: InstantGamingBannerProps) {
  return (
    <BannerErrorBoundary fallback={<StaticBanner variant="pc" className={className} />}>
      <InstantGamingBannerInner variant={variant} className={className} />
    </BannerErrorBoundary>
  );
}

function InstantGamingBannerInner({ variant = "dynamic", className = "" }: InstantGamingBannerProps) {
  const reactId = useId();
  const bannerId = `ig-banner-${reactId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (variant !== "dynamic") return;

    try {
      // Set up the config before loading the script
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      win.igBannerConfig = {
        lang: "en",
        igr: IGR,
        banners: [bannerId],
      };

      function loadScript() {
        if (igScriptLoaded) {
          // Script already loaded — re-trigger by removing and re-adding
          const existing = document.querySelector('script[src*="instant-gaming.com/api/banner"]');
          if (existing) existing.remove();
          igScriptLoaded = false;
        }

        const script = document.createElement("script");
        script.src = "https://www.instant-gaming.com/api/banner/partner/loader.js";
        script.defer = true;
        script.onload = () => {
          igScriptLoaded = true;
          setLoaded(true);
          // Check after a short delay if the banner rendered
          setTimeout(() => {
            if (containerRef.current && containerRef.current.children.length === 0) {
              setFailed(true);
            }
          }, 3000);
        };
        script.onerror = () => setFailed(true);
        document.body.appendChild(script);
      }

      loadScript();
    } catch {
      setFailed(true);
    }
  }, [variant, bannerId]);

  // Dynamic banner
  if (variant === "dynamic") {
    // If the dynamic banner fails (ad blocker, etc.), show the static fallback
    if (failed) {
      return <StaticBanner variant="pc" className={className} />;
    }

    return (
      <div className={`not-prose rounded-xl border border-[#2a2e3a] overflow-hidden ${className}`}>
        <div ref={containerRef} className={bannerId} style={{ minHeight: 90 }}>
          {!loaded && (
            <div className="flex items-center justify-center py-6 text-sm text-[#8b8fa3]">
              Loading deals...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Static CTA banner
  return <StaticBanner variant={variant} className={className} />;
}

function StaticBanner({ variant, className }: { variant: Exclude<BannerVariant, "dynamic">; className: string }) {
  const config = VARIANT_CONFIG[variant];

  return (
    <a
      href={AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`not-prose group flex items-center gap-4 sm:gap-6 rounded-xl border border-[#2a2e3a] bg-gradient-to-r from-[#1a1d27] to-[#1e2231] p-4 sm:p-6 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 ${className}`}
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

      <div className="shrink-0 hidden sm:flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white group-hover:bg-blue-600 transition-colors">
        Browse deals
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </a>
  );
}
