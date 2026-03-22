import type { Metadata } from "next";
import Link from "next/link";
import { getAllComparisons } from "@/lib/comparisons";

export const metadata: Metadata = {
  title: "Tool Comparisons - Pikorafy",
  description:
    "Side-by-side comparisons of popular AI and SaaS tools. Features, pricing, pros and cons — all in one place.",
};

export default function VsPage() {
  const comparisons = getAllComparisons();
  const categories = Array.from(
    new Set(comparisons.map((c) => c.frontmatter.category))
  );

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tool Comparisons
          </h1>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            Side-by-side comparisons of popular AI and SaaS tools. Features,
            pricing, pros, and cons.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mt-8 flex flex-wrap gap-2">
          <span className="inline-flex rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white">
            All
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex rounded-lg border border-[#2a2e3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#8b8fa3] transition-colors hover:border-blue-500/50 hover:text-white cursor-pointer"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Comparisons Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((comp) => (
            <Link
              key={comp.frontmatter.slug}
              href={`/vs/${comp.frontmatter.slug}`}
              className="group rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-blue-500/50 hover:bg-[#1e2231]"
            >
              <span className="inline-flex rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                {comp.frontmatter.category}
              </span>

              {/* VS Badge */}
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-white">
                  {comp.frontmatter.toolA.charAt(0)}
                </span>
                <span className="text-xs font-bold text-[#8b8fa3]">VS</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-white">
                  {comp.frontmatter.toolB.charAt(0)}
                </span>
              </div>

              <h2 className="mt-4 text-base font-semibold text-[#e4e6eb] group-hover:text-blue-500 transition-colors">
                {comp.frontmatter.title}
              </h2>
              <p className="mt-2 text-sm text-[#8b8fa3]">
                {comp.frontmatter.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-500">
                Compare
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
