import { NextRequest, NextResponse } from "next/server";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import { getAllAlternatives } from "@/lib/alternatives";

interface SearchResult {
  title: string;
  description: string;
  url: string;
  type: "Article" | "Comparison" | "Alternative";
}

function matchesQuery(query: string, ...fields: string[]): boolean {
  const lower = query.toLowerCase();
  return fields.some((field) => field.toLowerCase().includes(lower));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];

  // Search articles
  const articles = getAllArticles();
  for (const article of articles) {
    const { title, description, tags, slug } = article.frontmatter;
    if (matchesQuery(query, title, description, ...tags)) {
      results.push({
        title,
        description,
        url: `/blog/${slug}`,
        type: "Article",
      });
    }
  }

  // Search comparisons
  const comparisons = getAllComparisons();
  for (const comparison of comparisons) {
    const { title, description, tags, slug, toolA, toolB } = comparison.frontmatter;
    if (matchesQuery(query, title, description, ...tags, toolA, toolB)) {
      results.push({
        title,
        description,
        url: `/vs/${slug}`,
        type: "Comparison",
      });
    }
  }

  // Search alternatives
  const alternatives = getAllAlternatives();
  for (const alternative of alternatives) {
    const { title, description, tags, slug, toolName } = alternative.frontmatter;
    if (matchesQuery(query, title, description, ...tags, toolName)) {
      results.push({
        title,
        description,
        url: `/alternatives/${slug}`,
        type: "Alternative",
      });
    }
  }

  return NextResponse.json({ results: results.slice(0, 10) });
}
