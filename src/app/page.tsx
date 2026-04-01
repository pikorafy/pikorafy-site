import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import { AFFILIATE_DISCLOSURE_SHORT } from "@/lib/affiliate";
import InstantGamingBanner from "@/components/InstantGamingBanner";
import { HeroBackgroundPaths } from "@/components/ui/background-paths";
import ToolLogo from "@/components/ToolLogo";
import DealsGrid from "@/components/DealsGrid";

export const metadata: Metadata = {
  title: "Pikorafy — Best Game Deals, Price Comparisons & Value Analysis",
  description:
    "Find the best game deals with real-time price comparison across 30+ stores. Value analysis, deal ratings, and Metacritic scores to help you buy smart.",
};

const gamingComparisons = [
  { slug: "xbox-game-pass-vs-ps-plus", toolA: "Xbox Game Pass", toolB: "PS Plus", label: "Subscriptions" },
  { slug: "eneba-vs-g2a-vs-kinguin", toolA: "Eneba", toolB: "G2A", label: "Key Stores" },
  { slug: "dlss-4-vs-fsr-4", toolA: "DLSS 4.5", toolB: "FSR 4", label: "AI Upscaling" },
];

export default function Home() {
  const comparisons = getAllComparisons().slice(0, 6);
  const articles = getAllArticles().slice(0, 4);

  return (
    <div className="flex flex-col min-h-full">
      <HeroBackgroundPaths />

      {/* Hot Deals Section — fetched client-side */}
      <section className="bg-[#0f1117] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Hot Deals</h2>
              <span className="rounded-full bg-red-500/15 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-400 animate-pulse">
                Live
              </span>
            </div>
            <Link
              href="/deals"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all deals &rarr;
            </Link>
          </div>
          <p className="text-xs text-[#8b8fa3]/60 mb-4">{AFFILIATE_DISCLOSURE_SHORT}</p>

          <DealsGrid
            sortBy="Deal Rating"
            pageSize={8}
            metacritic={60}
            columns="4"
            showMetacritic={false}
            showGetDeal={false}
          />
        </div>
      </section>

      {/* Instant Gaming Banner */}
      <section className="bg-[#0f1117] pb-6">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <InstantGamingBanner />
        </div>
      </section>

      {/* Gaming Comparisons */}
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
    </div>
  );
}
