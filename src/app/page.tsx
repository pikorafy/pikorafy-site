import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";

export const metadata: Metadata = {
  title: "Pikorafy - Navigate the AI Revolution. Pick Smarter.",
  description:
    "Compare AI tools side-by-side. Honest reviews of ChatGPT, Claude, Gemini, Midjourney, and 500+ AI tools. Find the best AI alternative for every task.",
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
      <section className="relative overflow-hidden bg-[#0f1117] py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Navigate the{" "}
            <span className="text-[#3B82F6]">AI Revolution.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-zinc-400">
            500+ AI tools compared side-by-side. Honest reviews of ChatGPT, Claude,
            Gemini, Midjourney, and every AI tool that matters. Stop guessing,
            start picking smarter.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/vs"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#3B82F6] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#0f1117]"
            >
              Browse Comparisons
            </Link>
            <Link
              href="/tools"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-700 bg-[#1a1d27] px-8 text-sm font-semibold text-white transition-colors hover:border-[#3B82F6] hover:bg-[#1e2231]"
            >
              Free Tools
            </Link>
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-sm font-bold text-[#3B82F6]">
                    {comp.frontmatter.toolA.charAt(0)}
                  </span>
                  <span className="text-sm font-medium text-zinc-500">vs</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300">
                    {comp.frontmatter.toolB.charAt(0)}
                  </span>
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
              View all 15 tools
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
            Stay ahead of AI
          </h2>
          <p className="mt-4 text-zinc-400">
            Get weekly AI tool reviews, comparisons, and the best deals
            delivered to your inbox.
          </p>
          <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-12 flex-1 rounded-lg border border-zinc-700 bg-[#0f1117] px-4 text-sm text-white placeholder-zinc-500 focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
            <button
              type="submit"
              className="h-12 rounded-lg bg-[#3B82F6] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB]"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-3 text-xs text-zinc-500">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
