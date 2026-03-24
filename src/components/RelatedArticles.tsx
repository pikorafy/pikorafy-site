import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import { getAllAlternatives } from "@/lib/alternatives";

interface RelatedItem {
  type: "blog" | "vs" | "alternatives";
  title: string;
  description: string;
  slug: string;
  category: string;
  tags: string[];
}

interface RelatedArticlesProps {
  currentSlug: string;
  category: string;
  tags: string[];
  type: "blog" | "vs" | "alternatives";
}

function getTypeBadge(type: RelatedItem["type"]) {
  switch (type) {
    case "blog":
      return "Article";
    case "vs":
      return "Comparison";
    case "alternatives":
      return "Alternative";
  }
}

function getHref(item: RelatedItem) {
  switch (item.type) {
    case "blog":
      return `/blog/${item.slug}`;
    case "vs":
      return `/vs/${item.slug}`;
    case "alternatives":
      return `/alternatives/${item.slug}`;
  }
}

function scoreRelevance(
  item: RelatedItem,
  category: string,
  tags: string[]
): number {
  let score = 0;
  if (item.category === category) score += 2;
  for (const tag of tags) {
    if (item.tags.includes(tag)) score += 1;
  }
  return score;
}

export default function RelatedArticles({
  currentSlug,
  category,
  tags,
  type,
}: RelatedArticlesProps) {
  const allItems: RelatedItem[] = [];

  // Gather all articles
  for (const a of getAllArticles()) {
    allItems.push({
      type: "blog",
      title: a.frontmatter.title,
      description: a.frontmatter.description,
      slug: a.frontmatter.slug,
      category: a.frontmatter.category,
      tags: a.frontmatter.tags,
    });
  }

  // Gather all comparisons
  for (const c of getAllComparisons()) {
    allItems.push({
      type: "vs",
      title: c.frontmatter.title,
      description: c.frontmatter.description,
      slug: c.frontmatter.slug,
      category: c.frontmatter.category,
      tags: c.frontmatter.tags,
    });
  }

  // Gather all alternatives
  for (const a of getAllAlternatives()) {
    allItems.push({
      type: "alternatives",
      title: a.frontmatter.title,
      description: a.frontmatter.description,
      slug: a.frontmatter.slug,
      category: a.frontmatter.category,
      tags: a.frontmatter.tags,
    });
  }

  // Exclude current item and score the rest
  const scored = allItems
    .filter((item) => !(item.type === type && item.slug === currentSlug))
    .map((item) => ({
      item,
      score: scoreRelevance(item, category, tags),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item);

  if (scored.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-xl font-semibold text-[#e4e6eb]">
        Related Reading
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {scored.map((item) => (
          <Link
            key={`${item.type}-${item.slug}`}
            href={getHref(item)}
            className="group rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-5 transition-colors hover:border-blue-500/40"
          >
            <span className="inline-flex rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-500">
              {getTypeBadge(item.type)}
            </span>
            <h3 className="mt-3 text-sm font-medium text-[#e4e6eb] line-clamp-2 group-hover:text-blue-400 transition-colors">
              {item.title}
            </h3>
            <p className="mt-2 text-xs text-[#8b8fa3] line-clamp-2">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
