import type { Metadata } from "next";
import Link from "next/link";
import InstantGamingBanner from "@/components/InstantGamingBanner";

export const metadata: Metadata = {
  title: "Gaming - Deals, Comparisons & Guides | Pikorafy",
  description:
    "Your gaming hub on Pikorafy. Find the best game deals, compare gaming subscriptions, and read expert guides on Game Pass, PS Plus, and more.",
};

const sections = [
  {
    title: "Game Deals",
    description: "Curated deals on PC, Xbox, PlayStation & Nintendo games. Up to 90% off on digital keys.",
    href: "/gaming/deals",
    cta: "Browse deals",
    icon: (
      <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
  },
  {
    title: "Gaming Comparisons",
    description: "Side-by-side breakdowns of gaming subscriptions, key stores, and platforms.",
    href: "/vs",
    cta: "View comparisons",
    icon: (
      <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: "Gaming Articles",
    description: "Expert guides on game streaming, VPNs for gaming, and getting the most out of your setup.",
    href: "/blog",
    cta: "Read articles",
    icon: (
      <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5" />
      </svg>
    ),
  },
];

const featuredComparisons = [
  {
    title: "Xbox Game Pass vs PS Plus",
    description: "Which gaming subscription gives you more value? We compare libraries, pricing, and perks.",
    href: "/vs/xbox-game-pass-vs-ps-plus",
    tools: ["Xbox Game Pass", "PS Plus"],
  },
  {
    title: "Eneba vs G2A vs Kinguin",
    description: "The top game key marketplaces compared. Find out which offers the best prices and reliability.",
    href: "/vs/eneba-vs-g2a-vs-kinguin",
    tools: ["Eneba", "G2A", "Kinguin"],
  },
  {
    title: "Discord Nitro vs Telegram Premium",
    description: "Premium chat subscriptions for gamers. Which one is actually worth the money?",
    href: "/vs/discord-nitro-vs-telegram-premium",
    tools: ["Discord Nitro", "Telegram Premium"],
  },
];

export default function GamingPage() {
  return (
    <div className="bg-[#0f1117] min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#2a2e3a]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Gaming on Pikorafy
            </h1>
            <p className="mt-6 text-lg text-[#8b8fa3] leading-relaxed">
              Your one-stop hub for game deals, subscription comparisons, and expert gaming guides.
              Save money and make smarter choices.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 sm:py-16">
        {/* Section Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231] hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f1117] border border-[#2a2e3a]">
                {section.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                {section.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-[#8b8fa3] leading-relaxed">
                {section.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#3B82F6]">
                {section.cta}
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
            </Link>
          ))}
        </div>

        {/* Featured Comparisons */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Featured Comparisons
            </h2>
            <Link
              href="/vs"
              className="text-sm font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {featuredComparisons.map((comp) => (
              <Link
                key={comp.title}
                href={comp.href}
                className="group flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {comp.tools.map((tool, i) => (
                    <span key={tool} className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-[#e4e6eb]">{tool}</span>
                      {i < comp.tools.length - 1 && (
                        <span className="text-xs text-[#8b8fa3]">vs</span>
                      )}
                    </span>
                  ))}
                </div>
                <h3 className="mt-3 text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                  {comp.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-[#8b8fa3] leading-relaxed">
                  {comp.description}
                </p>
                <span className="mt-4 text-sm font-medium text-[#3B82F6]">
                  Read comparison
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Instant Gaming Banner */}
        <div className="mt-16">
          <InstantGamingBanner className="w-full" />
        </div>
      </div>
    </div>
  );
}
