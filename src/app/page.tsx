import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pikorafy - Pick Smarter. Build Faster.",
  description:
    "Compare AI and SaaS tools side-by-side. Find the best alternatives, read in-depth reviews, and use free developer tools.",
};

const popularComparisons = [
  { title: "Notion vs Obsidian", slug: "notion-vs-obsidian", categoryA: "Notion", categoryB: "Obsidian" },
  { title: "ChatGPT vs Claude", slug: "chatgpt-vs-claude", categoryA: "ChatGPT", categoryB: "Claude" },
  { title: "Vercel vs Netlify", slug: "vercel-vs-netlify", categoryA: "Vercel", categoryB: "Netlify" },
  { title: "Figma vs Sketch", slug: "figma-vs-sketch", categoryA: "Figma", categoryB: "Sketch" },
  { title: "Linear vs Jira", slug: "linear-vs-jira", categoryA: "Linear", categoryB: "Jira" },
  { title: "Supabase vs Firebase", slug: "supabase-vs-firebase", categoryA: "Supabase", categoryB: "Firebase" },
];

const freeTools = [
  { title: "JSON Formatter", description: "Format and validate JSON data instantly.", slug: "json-formatter" },
  { title: "Password Generator", description: "Generate strong, secure passwords.", slug: "password-generator" },
  { title: "Base64 Encoder", description: "Encode and decode Base64 strings.", slug: "base64-encoder" },
  { title: "Color Converter", description: "Convert between HEX, RGB, and HSL.", slug: "color-converter" },
  { title: "Markdown Preview", description: "Preview Markdown as rendered HTML.", slug: "markdown-preview" },
  { title: "UUID Generator", description: "Generate UUIDs v4 on the fly.", slug: "uuid-generator" },
];

const latestArticles = [
  {
    title: "The State of AI Code Assistants in 2026",
    excerpt: "A deep dive into how AI-powered coding tools have evolved and which ones deliver real productivity gains.",
    slug: "ai-code-assistants-2026",
    date: "March 15, 2026",
  },
  {
    title: "Choosing the Right Database for Your SaaS",
    excerpt: "PostgreSQL, MySQL, or a managed service? We break down the trade-offs for modern SaaS applications.",
    slug: "choosing-database-saas",
    date: "March 10, 2026",
  },
  {
    title: "Why Developer Experience Matters More Than Ever",
    excerpt: "How companies that invest in DX are shipping faster, retaining talent, and building better products.",
    slug: "developer-experience-matters",
    date: "March 5, 2026",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0f1117] py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Pick smarter.{" "}
            <span className="text-[#3B82F6]">Build faster.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-zinc-400">
            Compare AI and SaaS tools side-by-side. Find the best alternatives,
            read honest reviews, and access free developer utilities — all in
            one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/vs"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#3B82F6] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#0f1117]"
            >
              Browse Comparisons
            </Link>
            <form className="flex w-full max-w-sm">
              <input
                type="email"
                placeholder="you@example.com"
                className="h-12 flex-1 rounded-l-lg border border-zinc-700 bg-[#1a1d27] px-4 text-sm text-white placeholder-zinc-500 focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
              />
              <button
                type="submit"
                className="h-12 rounded-r-lg border border-[#3B82F6] bg-[#3B82F6]/10 px-5 text-sm font-semibold text-[#3B82F6] transition-colors hover:bg-[#3B82F6]/20"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Comparisons */}
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
            {popularComparisons.map((comp) => (
              <Link
                key={comp.slug}
                href={`/vs/${comp.slug}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-sm font-bold text-[#3B82F6]">
                    {comp.categoryA.charAt(0)}
                  </span>
                  <span className="text-sm font-medium text-zinc-500">vs</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300">
                    {comp.categoryB.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                  {comp.title}
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
              View all
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

      {/* Latest Articles */}
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
            {latestArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group flex flex-col rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
              >
                <time className="text-xs text-zinc-500">{article.date}</time>
                <h3 className="mt-3 text-lg font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                  {article.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                  {article.excerpt}
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
            Get weekly tool comparisons, SaaS deals, and developer resources
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
