import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog - Pikorafy",
  description:
    "In-depth articles on AI tools, SaaS comparisons, developer productivity, and building smarter with the right stack.",
};

const articles = [
  {
    title: "The State of AI Code Assistants in 2026",
    excerpt:
      "A deep dive into how AI-powered coding tools have evolved and which ones deliver real productivity gains.",
    slug: "ai-code-assistants-2026",
    date: "March 15, 2026",
    category: "AI Tools",
  },
  {
    title: "Choosing the Right Database for Your SaaS",
    excerpt:
      "PostgreSQL, MySQL, or a managed service? We break down the trade-offs for modern SaaS applications.",
    slug: "choosing-database-saas",
    date: "March 10, 2026",
    category: "Databases",
  },
  {
    title: "Why Developer Experience Matters More Than Ever",
    excerpt:
      "How companies that invest in DX are shipping faster, retaining talent, and building better products.",
    slug: "developer-experience-matters",
    date: "March 5, 2026",
    category: "Opinion",
  },
  {
    title: "Building a Design System from Scratch",
    excerpt:
      "A practical guide to creating a scalable design system for your product team using modern tooling.",
    slug: "building-design-system",
    date: "February 28, 2026",
    category: "Design",
  },
  {
    title: "The Rise of Edge Computing for SaaS",
    excerpt:
      "Edge functions, CDN-first architectures, and why latency is becoming a competitive advantage.",
    slug: "edge-computing-saas",
    date: "February 22, 2026",
    category: "Infrastructure",
  },
  {
    title: "Open Source Alternatives to Popular SaaS Tools",
    excerpt:
      "A curated list of open source projects that can replace expensive SaaS subscriptions.",
    slug: "open-source-alternatives",
    date: "February 15, 2026",
    category: "Open Source",
  },
  {
    title: "How to Evaluate AI Writing Tools",
    excerpt:
      "A framework for comparing AI writing assistants based on quality, speed, cost, and integration.",
    slug: "evaluate-ai-writing-tools",
    date: "February 10, 2026",
    category: "AI Tools",
  },
  {
    title: "Migrating from Monolith to Microservices",
    excerpt:
      "Lessons learned from teams that successfully broke apart their monolithic applications.",
    slug: "monolith-to-microservices",
    date: "February 5, 2026",
    category: "Architecture",
  },
  {
    title: "The Best CI/CD Pipelines Compared",
    excerpt:
      "GitHub Actions, GitLab CI, CircleCI, and more — which pipeline fits your workflow?",
    slug: "best-cicd-pipelines",
    date: "January 30, 2026",
    category: "DevOps",
  },
];

export default function BlogPage() {
  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Blog
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            In-depth articles on AI tools, SaaS comparisons, and developer
            productivity.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group flex flex-col rounded-xl border border-zinc-800 bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-md bg-[#3B82F6]/10 px-2.5 py-1 text-xs font-medium text-[#3B82F6]">
                  {article.category}
                </span>
                <time className="text-xs text-zinc-500">{article.date}</time>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                {article.title}
              </h2>
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
    </div>
  );
}
