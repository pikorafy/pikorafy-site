import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Blog - Pikorafy",
  description:
    "In-depth articles on AI tools, SaaS comparisons, developer productivity, and building smarter with the right stack.",
};

export default function BlogPage() {
  const articles = getAllArticles();

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Blog
          </h1>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            In-depth articles on AI tools, SaaS comparisons, and developer
            productivity.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.frontmatter.slug}
              href={`/blog/${article.frontmatter.slug}`}
              className="group flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-blue-500/50 hover:bg-[#1e2231]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
                  {article.frontmatter.category}
                </span>
                <time className="text-xs text-[#8b8fa3]">
                  {article.frontmatter.date}
                </time>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[#e4e6eb] group-hover:text-blue-500 transition-colors">
                {article.frontmatter.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#8b8fa3]">
                {article.frontmatter.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-500">
                  Read more
                </span>
                <span className="text-xs text-[#8b8fa3]">
                  {article.readingTime} min read
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
