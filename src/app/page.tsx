import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import NewsletterSignup from "@/components/NewsletterSignup";
import InstantGamingBanner from "@/components/InstantGamingBanner";
import { HeroBackgroundPaths } from "@/components/ui/background-paths";
import ToolLogo from "@/components/ToolLogo";

export const metadata: Metadata = {
  title: "Pikorafy - Game Deals, Comparisons & Free Tools",
  description:
    "Find the best game deals with up to 90% off. Compare gaming subscriptions, key stores, and AI tools side-by-side. Free developer utilities included.",
};

const freeTools = [
  { title: "JSON Formatter", description: "Format and validate JSON data instantly.", slug: "json-formatter" },
  { title: "Password Generator", description: "Generate strong, secure passwords.", slug: "password-generator" },
  { title: "QR Code Generator", description: "Generate QR codes from any text or URL.", slug: "qr-code-generator" },
  { title: "Color Converter", description: "Convert between HEX, RGB, and HSL.", slug: "color-converter" },
  { title: "Word Counter", description: "Count words, characters, and reading time.", slug: "word-counter" },
  { title: "Regex Tester", description: "Test regex patterns with live matching.", slug: "regex-tester" },
];

export default function Home() {
  const comparisons = getAllComparisons().slice(0, 6);
  const articles = getAllArticles().slice(0, 3);

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <HeroBackgroundPaths />

      {/* Gaming Section - Primary Focus */}
      <section className="bg-[#0f1117] py-20 border-b border-[#2a2e3a]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Game Deals & Comparisons
              </h2>
              <p className="mt-2 text-sm text-zinc-400">Save up to 90% on digital game keys</p>
            </div>
            <Link
              href="/gaming"
              className="text-sm font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              Gaming Hub
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/gaming/deals"
              className="group relative flex flex-col rounded-xl border border-green-500/20 bg-gradient-to-br from-[#1a1d27] to-green-500/5 p-6 transition-all hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/5"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                Game Deals
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Curated deals on PC, Xbox, PlayStation & Nintendo. Up to 90% off digital keys.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-green-400">
                Browse deals
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
            <Link
              href="/vs/xbox-game-pass-vs-ps-plus"
              className="group flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              <div className="flex items-center gap-3">
                <ToolLogo name="Xbox Game Pass" size={20} />
                <span className="text-xs text-zinc-500">vs</span>
                <ToolLogo name="PS Plus" size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                Xbox Game Pass vs PS Plus
              </h3>
              <p className="mt-2 flex-1 text-sm text-zinc-400">
                Which gaming subscription wins? Tiers, pricing, and game libraries compared.
              </p>
              <span className="mt-4 text-sm font-medium text-[#3B82F6]">Read comparison</span>
            </Link>
            <Link
              href="/vs/eneba-vs-g2a-vs-kinguin"
              className="group flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-300">Eneba</span>
                <span className="text-xs text-zinc-500">vs</span>
                <span className="text-xs font-medium text-zinc-300">G2A</span>
                <span className="text-xs text-zinc-500">vs</span>
                <span className="text-xs font-medium text-zinc-300">Kinguin</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                Eneba vs G2A vs Kinguin
              </h3>
              <p className="mt-2 flex-1 text-sm text-zinc-400">
                Game key marketplaces compared. Which offers the best prices and reliability?
              </p>
              <span className="mt-4 text-sm font-medium text-[#3B82F6]">Read comparison</span>
            </Link>
          </div>
          <div className="mt-8">
            <InstantGamingBanner />
          </div>
        </div>
      </section>

      {/* Popular Comparisons - now from real data */}
      <section className="bg-[#0f1117] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Popular Comparisons
            </h2>
            <Link
              href="/vs"
              className="text-sm font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((comp) => (
              <Link
                key={comp.frontmatter.slug}
                href={`/vs/${comp.frontmatter.slug}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
              >
                <div className="flex items-center gap-4">
                  <ToolLogo name={comp.frontmatter.toolA} size={24} />
                  <span className="text-sm font-medium text-zinc-500">vs</span>
                  <ToolLogo name={comp.frontmatter.toolB} size={24} />
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                  {comp.frontmatter.toolA} vs {comp.frontmatter.toolB}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Free Tools */}
      <section className="bg-[#0f1117] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Free Tools
            </h2>
            <Link
              href="/tools"
              className="text-sm font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              View all 22 tools
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {freeTools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
              >
                <h3 className="text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Gaming Articles CTA */}
      <section className="bg-gradient-to-b from-purple-500/5 to-blue-500/5 bg-[#0f1117] py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Gaming Guides & Reviews
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Cloud gaming services, gaming VPNs, subscription comparisons, and more.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/blog/best-game-streaming-services-2026"
              className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB]"
            >
              Cloud Gaming Guide
            </Link>
            <Link
              href="/blog/best-gaming-vpns-2026"
              className="inline-flex items-center gap-2 rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              Gaming VPN Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Articles - now from real data */}
      <section className="bg-[#0f1117] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Latest Articles
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.frontmatter.slug}
                href={`/blog/${article.frontmatter.slug}`}
                className="group flex flex-col rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
              >
                <time className="text-xs text-zinc-500">
                  {new Date(article.frontmatter.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <h3 className="mt-3 text-lg font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                  {article.frontmatter.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                  {article.frontmatter.description}
                </p>
                <span className="mt-4 text-sm font-medium text-[#3B82F6]">
                  Read more
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-[#1a1d27] py-20">
        <div className="mx-auto max-w-2xl px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Stay in the loop
          </h2>
          <p className="mt-4 text-zinc-400">
            Get the best game deals, tool comparisons, and guides
            delivered to your inbox weekly.
          </p>
          <div className="mt-8 flex justify-center">
            <NewsletterSignup />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
