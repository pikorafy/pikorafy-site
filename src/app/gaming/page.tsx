import type { Metadata } from "next";
import Link from "next/link";
import InstantGamingBanner from "@/components/InstantGamingBanner";

export const metadata: Metadata = {
  title: "Gaming Hub - Deals, Comparisons & Guides | Pikorafy",
  description:
    "Your gaming hub on Pikorafy. Find the best game deals, compare gaming subscriptions, and read expert guides on Game Pass, PS Plus, and more.",
};

const sections = [
  {
    title: "Game Deals",
    description: "Up to 90% off on PC, Xbox, PS & Nintendo keys. Updated daily.",
    href: "/gaming/deals",
    cta: "Browse deals",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
    bgGradient: "from-[#1a1d27] to-emerald-500/5",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
  },
  {
    title: "Comparisons",
    description: "Side-by-side breakdowns of gaming subscriptions, key stores, and platforms.",
    href: "/vs",
    cta: "View comparisons",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
    bgGradient: "from-[#1a1d27] to-blue-500/5",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: "Guides & Articles",
    description: "Cloud gaming, VPNs for gaming, streaming setup, and more expert guides.",
    href: "/blog",
    cta: "Read guides",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
    bgGradient: "from-[#1a1d27] to-purple-500/5",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5" />
      </svg>
    ),
  },
];

const featuredComparisons = [
  {
    title: "Xbox Game Pass vs PS Plus",
    description: "Which gaming subscription gives you more value?",
    href: "/vs/xbox-game-pass-vs-ps-plus",
    tools: ["Xbox Game Pass", "PS Plus"],
    badge: "Subscriptions",
  },
  {
    title: "Eneba vs G2A vs Kinguin",
    description: "Game key marketplaces compared. Best prices and reliability.",
    href: "/vs/eneba-vs-g2a-vs-kinguin",
    tools: ["Eneba", "G2A", "Kinguin"],
    badge: "Key Stores",
  },
  {
    title: "DLSS 4.5 vs FSR 4",
    description: "AI upscaling technologies compared for gamers.",
    href: "/vs/dlss-4-vs-fsr-4",
    tools: ["DLSS 4.5", "FSR 4"],
    badge: "AI Upscaling",
  },
  {
    title: "Discord Nitro vs Telegram Premium",
    description: "Premium chat upgrades for gamers — which is worth it?",
    href: "/vs/discord-nitro-vs-telegram-premium",
    tools: ["Discord Nitro", "Telegram Premium"],
    badge: "Communication",
  },
];

export default function GamingPage() {
  return (
    <div className="bg-[#0f1117] min-h-full">
      {/* Header */}
      <section className="border-b border-[#2a2e3a]">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-12 sm:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          <div className="relative max-w-2xl">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Gaming Hub
            </h1>
            <p className="mt-3 text-sm text-[#8b8fa3] leading-relaxed">
              Your one-stop hub for game deals, subscription comparisons, and expert gaming guides. Save money and make smarter choices.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        {/* Section Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className={`group flex flex-col rounded-lg border ${section.borderColor} bg-gradient-to-br ${section.bgGradient} p-5 transition-all hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f1117] border border-[#2a2e3a] ${section.iconColor}`}>
                {section.icon}
              </div>
              <h2 className="mt-3 text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
                {section.title}
              </h2>
              <p className="mt-1.5 flex-1 text-xs text-[#8b8fa3] leading-relaxed">
                {section.description}
              </p>
              <span className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${section.iconColor}`}>
                {section.cta}
                <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        {/* Featured Comparisons */}
        <section className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Featured Comparisons</h2>
            <Link href="/vs" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featuredComparisons.map((comp) => (
              <Link
                key={comp.title}
                href={comp.href}
                className="group flex flex-col rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-5 transition-all hover:border-emerald-500/30 hover:bg-[#1e2231]"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    {comp.badge}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {comp.title}
                </h3>
                <p className="mt-1 text-xs text-[#8b8fa3]">
                  {comp.description}
                </p>
                <span className="mt-3 text-xs font-medium text-emerald-400">
                  Read comparison &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Instant Gaming Banner */}
        <div className="mt-12">
          <InstantGamingBanner className="w-full" />
        </div>
      </div>
    </div>
  );
}
