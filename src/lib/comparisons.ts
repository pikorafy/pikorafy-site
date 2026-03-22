import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface ComparisonFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  slug: string;
  toolA: string;
  toolB: string;
}

export interface Comparison {
  frontmatter: ComparisonFrontmatter;
  content: string;
  readingTime: number;
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/vs");

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function getAllComparisons(): Comparison[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  const comparisons = files.map((filename) => {
    const filePath = path.join(CONTENT_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    return {
      frontmatter: {
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        category: data.category ?? "",
        tags: data.tags ?? [],
        slug: data.slug ?? filename.replace(/\.mdx$/, ""),
        toolA: data.toolA ?? "",
        toolB: data.toolB ?? "",
      },
      content,
      readingTime: calculateReadingTime(content),
    } satisfies Comparison;
  });

  return comparisons.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export function getComparisonBySlug(slug: string): Comparison | undefined {
  const comparisons = getAllComparisons();
  return comparisons.find((c) => c.frontmatter.slug === slug);
}

export function getComparisonSlugs(): string[] {
  return getAllComparisons().map((c) => c.frontmatter.slug);
}
