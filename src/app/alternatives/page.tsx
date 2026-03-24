import type { Metadata } from "next";
import Link from "next/link";
import { getAllAlternatives } from "@/lib/alternatives";
import ToolLogo from "@/components/ToolLogo";

export const metadata: Metadata = {
  title: "Software Alternatives Directory - Pikorafy",
  description:
    "Find the best alternatives to popular AI and SaaS tools. Compare features, pricing, and community ratings.",
};

export default function AlternativesPage() {
  const alternatives = getAllAlternatives();

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Software Alternatives
          </h1>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            Explore alternatives to popular tools. Compare features, pricing,
            and find the best fit for your workflow.
          </p>
        </div>

        {/* Alternatives List */}
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {alternatives.map((alt) => (
            <Link
              key={alt.frontmatter.slug}
              href={`/alternatives/${alt.frontmatter.slug}`}
              className="group flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-blue-500/50 hover:bg-[#1e2231]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <ToolLogo name={alt.frontmatter.toolName} size={28} />
                  <div>
                    <h2 className="text-lg font-semibold text-[#e4e6eb] group-hover:text-blue-500 transition-colors">
                      {alt.frontmatter.toolName} Alternatives
                    </h2>
                    <p className="text-sm text-[#8b8fa3]">
                      {alt.frontmatter.description}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                  {alt.frontmatter.topAlternatives.length} options
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {alt.frontmatter.topAlternatives.map((name) => (
                  <span
                    key={name}
                    className="inline-flex rounded-md border border-[#2a2e3a] bg-[#0f1117] px-2.5 py-1 text-xs text-[#8b8fa3]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
