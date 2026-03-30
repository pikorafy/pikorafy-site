import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import InstantGamingBanner from "@/components/InstantGamingBanner";
import { HeroBackgroundPaths } from "@/components/ui/background-paths";
import ToolLogo from "@/components/ToolLogo";

export const metadata: Metadata = {
  title: "Pikorafy - Best Game Deals, Comparisons & Free Tools",
  description:
    "Find the best game deals with up to 90% off. Compare gaming subscriptions, key stores, and platforms. Free developer utilities included.",
};

const hotDeals = [
  { title: "Elden Ring", platform: "Steam", discount: 58, price: "$24.99", original: "$59.99" },
  { title: "Cyberpunk 2077", platform: "Steam", discount: 67, price: "$19.99", original: "$59.99" },
  { title: "Baldur's Gate 3", platform: "Steam", discount: 33, price: "$39.99", original: "$59.99" },
  { title: "Red Dead Redemption 2", platform: "Steam", discount: 75, price: "$14.99", original: "$59.99" },
  { title: "God of War Ragnarok", platform: "PS5", discount: 50, price: "$34.99", original: "$69.99" },
  { title: "Starfield", platform: "Xbox", discount: 57, price: "$29.99", original: "$69.99" },
  { title: "Monster Hunter Wilds", platform: "Steam", discount: 21, price: "$54.99", original: "$69.99" },
  { title: "Hades II", platform: "Steam", discount: 33, price: "$19.99", original: "$29.99" },
];

const AFFILIATE_URL = "https://www.instant-gaming.com/?igr=pikorafy";

const platformBadgeColors: Record<string, string> = {
  Steam: "bg-[#1b2838]/60 text-[#66c0f4] border-[#66c0f4]/20",
  Xbox: "bg-green-500/10 text-green-400 border-green-500/20",
  PS5: "bg-blue-600/10 text-blue-400 border-blue-600/20",
  Switch: "bg-red-500/10 text-red-400 border-red-500/20",
};

function getDealRating(discount: number) {
  if (discount >= 70) return { label: "HOT", color: "bg-red-500/15 text-red-400 border-red-500/20" };
  if (discount >= 50) return { label: "GREAT", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" };
  if (discount >= 30) return { label: "GOOD", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
  return { label: "FAIR", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" };
}

const gamingComparisons = [
  { slug: "xbox-game-pass-vs-ps-plus", toolA: "Xbox Game Pass", toolB: "PS Plus", label: "Subscriptions" },
  { slug: "eneba-vs-g2a-vs-kinguin", toolA: "Eneba", toolB: "G2A", label: "Key Stores" },
  { slug: "dlss-4-vs-fsr-4", toolA: "DLSS 4.5", toolB: "FSR 4", label: "AI Upscaling" },
];

const freeTools = [
  { title: "JSON Formatter", slug: "json-formatter", icon: "{}" },
  { title: "Password Generator", slug: "password-generator", icon: "***" },
  { title: "QR Code Generator", slug: "qr-code-generator", icon: "QR" },
  { title: "Color Converter", slug: "color-converter", icon: "#" },
  { title: "Regex Tester", slug: "regex-tester", icon: ".*" },
  { title: "Word Counter", slug: "word-counter", icon: "Aa" },
];

export default function Home() {
  const comparisons = getAllComparisons().slice(0, 6);
  const articles = getAllArticles().slice(0, 4);

  return (
    <div className="flex flex-col min-h-full">
      <HeroBackgroundPaths />

      {/* Hot Deals Section — gg.deals style */}
      <section className="bg-[#0f1117] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Hot Deals</h2>
              <span className="rounded-full bg-red-500/15 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
                Live
              </span>
            </div>
            <Link
              href="/gaming/deals"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all deals &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {hotDeals.map((deal) => {
              const rating = getDealRating(deal.discount);
              return (
                <a
                  key={deal.title}
                  href={AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="group relative flex flex-col rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 transition-all hover:border-emerald-500/30 hover:bg-[#1e2231] hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
                >
                  {/* Top row: platform + deal rating */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase border ${platformBadgeColors[deal.platform] || "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"}`}>
                      {deal.platform}
                    </span>
                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border ${rating.color}`}>
                      {rating.label}
                    </span>
                  </div>

                  {/* Game title */}
                  <h3 className="mt-3 text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
                    {deal.title}
                  </h3>

                  {/* Pricing row */}
                  <div className="mt-auto pt-3 flex items-end justify-between">
                    <div>
                      <span className="text-xs text-[#8b8fa3] line-through block">{deal.original}</span>
                      <span className="text-lg font-bold text-emerald-400">{deal.price}</span>
                    </div>
                    <span className="rounded-md bg-emerald-500/15 border border-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-400">
                      -{deal.discount}%
                    </span>
                  </div>

                  {/* Store attribution */}
                  <p className="mt-2 text-[10px] text-[#8b8fa3]">via Instant Gaming</p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Instant Gaming Banner */}
      <section className="bg-[#0f1117] pb-6">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <InstantGamingBanner />
        </div>
      </section>

      {/* Gaming Comparisons — horizontal cards */}
      <section className="bg-[#0f1117] py-12 border-t border-[#2a2e3a]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Gaming Comparisons</h2>
            <Link href="/vs" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {gamingComparisons.map((comp) => (
              <Link
                key={comp.slug}
                href={`/vs/${comp.slug}`}
                className="group flex items-center gap-4 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 transition-all hover:border-emerald-500/30 hover:bg-[#1e2231]"
              >
                <div className="flex items-center gap-2">
                  <ToolLogo name={comp.toolA} size={22} />
                  <span className="text-xs text-[#8b8fa3]">vs</span>
                  <ToolLogo name={comp.toolB} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {comp.toolA} vs {comp.toolB}
                  </p>
                  <p className="text-xs text-[#8b8fa3]">{comp.label}</p>
                </div>
                <svg className="h-4 w-4 text-[#8b8fa3] transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Comparisons Grid */}
      <section className="bg-[#0f1117] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Popular Comparisons</h2>
            <Link href="/vs" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((comp) => (
              <Link
                key={comp.frontmatter.slug}
                href={`/vs/${comp.frontmatter.slug}`}
                className="group flex items-center justify-between rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 transition-all hover:border-emerald-500/30 hover:bg-[#1e2231]"
              >
                <div className="flex items-center gap-3">
                  <ToolLogo name={comp.frontmatter.toolA} size={22} />
                  <span className="text-xs text-[#8b8fa3]">vs</span>
                  <ToolLogo name={comp.frontmatter.toolB} size={22} />
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {comp.frontmatter.toolA} vs {comp.frontmatter.toolB}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="bg-[#0f1117] py-12 border-t border-[#2a2e3a]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Latest Articles</h2>
            <Link href="/blog" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((article) => (
              <Link
                key={article.frontmatter.slug}
                href={`/blog/${article.frontmatter.slug}`}
                className="group flex flex-col rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-5 transition-all hover:border-emerald-500/30 hover:bg-[#1e2231]"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    {article.frontmatter.category}
                  </span>
                  <time className="text-[10px] text-[#8b8fa3]">
                    {new Date(article.frontmatter.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                  {article.frontmatter.title}
                </h3>
                <span className="mt-auto pt-3 text-xs font-medium text-emerald-400">
                  Read more &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Free Tools Strip */}
      <section className="bg-[#0f1117] py-12 border-t border-[#2a2e3a]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Free Tools</h2>
            <Link href="/tools" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              View all 22 tools &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {freeTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex flex-col items-center rounded-lg border border-[#2a2e3a] bg-[#1a1d27] p-4 transition-all hover:border-emerald-500/30 hover:bg-[#1e2231] text-center"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f1117] border border-[#2a2e3a] text-sm font-mono font-bold text-emerald-400 group-hover:border-emerald-500/30">
                  {tool.icon}
                </span>
                <span className="mt-2 text-xs font-medium text-white group-hover:text-emerald-400 transition-colors">
                  {tool.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
