import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface AlternativeFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  slug: string;
  toolName: string;
  topAlternatives: string[];
}

export interface Alternative {
  frontmatter: AlternativeFrontmatter;
  content: string;
  readingTime: number;
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/alternatives");

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function getAllAlternatives(): Alternative[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  const alternatives = files.map((filename) => {
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
        toolName: data.toolName ?? "",
        topAlternatives: data.topAlternatives ?? [],
      },
      content,
      readingTime: calculateReadingTime(content),
    } satisfies Alternative;
  });

  return alternatives.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export function getAlternativeBySlug(slug: string): Alternative | undefined {
  const alternatives = getAllAlternatives();
  return alternatives.find((a) => a.frontmatter.slug === slug);
}

export function getAlternativeSlugs(): string[] {
  return getAllAlternatives().map((a) => a.frontmatter.slug);
}
