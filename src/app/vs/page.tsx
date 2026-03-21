import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tool Comparisons - Pikorafy",
  description:
    "Side-by-side comparisons of popular AI and SaaS tools. Features, pricing, pros and cons — all in one place.",
};

const comparisons = [
  {
    title: "Notion vs Obsidian",
    slug: "notion-vs-obsidian",
    category: "Productivity",
    description: "Cloud-first collaboration vs local-first Markdown notes.",
    toolA: "Notion",
    toolB: "Obsidian",
  },
  {
    title: "ChatGPT vs Claude",
    slug: "chatgpt-vs-claude",
    category: "AI",
    description: "Comparing the two leading AI assistants for everyday tasks.",
    toolA: "ChatGPT",
    toolB: "Claude",
  },
  {
    title: "Vercel vs Netlify",
    slug: "vercel-vs-netlify",
    category: "Hosting",
    description: "Which frontend deployment platform is right for your stack?",
    toolA: "Vercel",
    toolB: "Netlify",
  },
  {
    title: "Figma vs Sketch",
    slug: "figma-vs-sketch",
    category: "Design",
    description: "Browser-based design vs native Mac app. Which wins in 2026?",
    toolA: "Figma",
    toolB: "Sketch",
  },
  {
    title: "Linear vs Jira",
    slug: "linear-vs-jira",
    category: "Project Management",
    description: "Modern speed-first tracker vs the enterprise standard.",
    toolA: "Linear",
    toolB: "Jira",
  },
  {
    title: "Supabase vs Firebase",
    slug: "supabase-vs-firebase",
    category: "Backend",
    description: "Open source Postgres platform vs Google's app development suite.",
    toolA: "Supabase",
    toolB: "Firebase",
  },
  {
    title: "Tailwind CSS vs Bootstrap",
    slug: "tailwind-vs-bootstrap",
    category: "Frontend",
    description: "Utility-first CSS framework vs component-based toolkit.",
    toolA: "Tailwind",
    toolB: "Bootstrap",
  },
  {
    title: "Cursor vs GitHub Copilot",
    slug: "cursor-vs-github-copilot",
    category: "AI",
    description: "AI-native editor vs AI plugin for your existing IDE.",
    toolA: "Cursor",
    toolB: "Copilot",
  },
  {
    title: "PostgreSQL vs MySQL",
    slug: "postgresql-vs-mysql",
    category: "Databases",
    description: "Two relational databases with different strengths and trade-offs.",
    toolA: "PostgreSQL",
    toolB: "MySQL",
  },
  {
    title: "Stripe vs Paddle",
    slug: "stripe-vs-paddle",
    category: "Payments",
    description: "Payment processor vs merchant of record. What suits your SaaS?",
    toolA: "Stripe",
    toolB: "Paddle",
  },
  {
    title: "Next.js vs Nuxt",
    slug: "nextjs-vs-nuxt",
    category: "Frontend",
    description: "React meta-framework vs Vue meta-framework for full-stack apps.",
    toolA: "Next.js",
    toolB: "Nuxt",
  },
  {
    title: "Docker vs Podman",
    slug: "docker-vs-podman",
    category: "DevOps",
    description: "The container runtime standard vs its daemonless challenger.",
    toolA: "Docker",
    toolB: "Podman",
  },
];

const categories = Array.from(new Set(comparisons.map((c) => c.category)));

export default function VsPage() {
  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tool Comparisons
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Side-by-side comparisons of popular AI and SaaS tools. Features,
            pricing, pros, and cons.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mt-8 flex flex-wrap gap-2">
          <span className="inline-flex rounded-lg bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white">
            All
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex rounded-lg border border-zinc-700 bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-[#3B82F6]/50 hover:text-white cursor-pointer"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Comparisons Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((comp) => (
            <Link
              key={comp.slug}
              href={`/vs/${comp.slug}`}
              className="group rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              <span className="inline-flex rounded-md bg-[#3B82F6]/10 px-2 py-0.5 text-xs font-medium text-[#3B82F6]">
                {comp.category}
              </span>

              {/* VS Badge */}
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-white">
                  {comp.toolA.charAt(0)}
                </span>
                <span className="text-xs font-bold text-zinc-500">VS</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-white">
                  {comp.toolB.charAt(0)}
                </span>
              </div>

              <h2 className="mt-4 text-base font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                {comp.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">{comp.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#3B82F6]">
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
