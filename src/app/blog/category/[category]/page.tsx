import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  const categories = new Set(
    articles.map((a) =>
      a.frontmatter.category.toLowerCase().replace(/\s+/g, "-")
    )
  );
  return Array.from(categories).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const title = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${title} Articles`,
    description: `Browse all ${title} articles on Pikorafy. Reviews, comparisons, and guides.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const articles = getAllArticles();
  const categoryTitle = category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const filtered = articles.filter(
    (a) =>
      a.frontmatter.category.toLowerCase().replace(/\s+/g, "-") === category
  );

  return (
    <div className="bg-[#0f1117] min-h-full py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <nav className="mb-6 text-sm text-[#8b8fa3]">
          <Link
            href="/blog"
            className="hover:text-[#3B82F6] transition-colors"
          >
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#e4e6eb]">{categoryTitle}</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
          {categoryTitle}
        </h1>
        <p className="mt-3 text-[#8b8fa3]">
          {filtered.length} article{filtered.length !== 1 ? "s" : ""} in this
          category
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Link
              key={article.frontmatter.slug}
              href={`/blog/${article.frontmatter.slug}`}
              className="group flex flex-col rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-6 transition-all hover:border-[#3B82F6]/50 hover:bg-[#1e2231]"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="rounded-full bg-[#3B82F6]/10 px-3 py-0.5 text-xs font-medium text-[#3B82F6]">
                  {article.frontmatter.category}
                </span>
                <span className="text-xs text-[#8b8fa3]">
                  {article.readingTime} min read
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#e4e6eb] group-hover:text-[#3B82F6] transition-colors">
                {article.frontmatter.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#8b8fa3]">
                {article.frontmatter.description}
              </p>
              <time className="mt-4 text-xs text-[#8b8fa3]">
                {new Date(article.frontmatter.date).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </time>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
