import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Software Alternatives Directory - Pikorafy",
  description:
    "Find the best alternatives to popular AI and SaaS tools. Compare features, pricing, and community ratings.",
};

const alternatives = [
  {
    name: "Notion",
    description: "All-in-one workspace for notes, docs, and project management.",
    alternativeCount: 12,
    slug: "notion",
    topAlternatives: ["Obsidian", "Coda", "Slite"],
  },
  {
    name: "Slack",
    description: "Team messaging and collaboration platform.",
    alternativeCount: 8,
    slug: "slack",
    topAlternatives: ["Discord", "Microsoft Teams", "Mattermost"],
  },
  {
    name: "GitHub Copilot",
    description: "AI-powered code completion and suggestion tool.",
    alternativeCount: 10,
    slug: "github-copilot",
    topAlternatives: ["Cursor", "Codeium", "Tabnine"],
  },
  {
    name: "Figma",
    description: "Collaborative interface design and prototyping tool.",
    alternativeCount: 7,
    slug: "figma",
    topAlternatives: ["Sketch", "Penpot", "Lunacy"],
  },
  {
    name: "Vercel",
    description: "Frontend cloud platform for deploying web applications.",
    alternativeCount: 9,
    slug: "vercel",
    topAlternatives: ["Netlify", "Cloudflare Pages", "Railway"],
  },
  {
    name: "Airtable",
    description: "Spreadsheet-database hybrid for organizing anything.",
    alternativeCount: 11,
    slug: "airtable",
    topAlternatives: ["NocoDB", "Baserow", "Teable"],
  },
  {
    name: "Stripe",
    description: "Online payment processing for internet businesses.",
    alternativeCount: 6,
    slug: "stripe",
    topAlternatives: ["Paddle", "Lemon Squeezy", "PayPal"],
  },
  {
    name: "Jira",
    description: "Issue tracking and agile project management.",
    alternativeCount: 14,
    slug: "jira",
    topAlternatives: ["Linear", "Shortcut", "Plane"],
  },
  {
    name: "Datadog",
    description: "Cloud monitoring and observability platform.",
    alternativeCount: 8,
    slug: "datadog",
    topAlternatives: ["Grafana", "New Relic", "SigNoz"],
  },
];

export default function AlternativesPage() {
  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Software Alternatives
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Explore alternatives to popular tools. Compare features, pricing,
            and find the best fit for your workflow.
          </p>
        </div>

        {/* Alternatives List */}
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {alternatives.map((alt) => (
            <Link
              key={alt.slug}
              href={`/alternatives/${alt.slug}`}
              className="group flex flex-col rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-lg font-bold text-[#3B82F6]">
                    {alt.name.charAt(0)}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                      {alt.name} Alternatives
                    </h2>
                    <p className="text-sm text-zinc-400">{alt.description}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                  {alt.alternativeCount} options
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {alt.topAlternatives.map((name) => (
                  <span
                    key={name}
                    className="inline-flex rounded-md border border-zinc-700 bg-[#0f1117] px-2.5 py-1 text-xs text-zinc-400"
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
