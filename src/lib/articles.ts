import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface ArticleFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  slug: string;
}

export interface Article {
  frontmatter: ArticleFrontmatter;
  content: string;
  readingTime: number;
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  const articles = files.map((filename) => {
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
      },
      content,
      readingTime: calculateReadingTime(content),
    } satisfies Article;
  });

  return articles.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export function getArticleBySlug(slug: string): Article | undefined {
  const articles = getAllArticles();
  return articles.find((a) => a.frontmatter.slug === slug);
}

export function getArticleSlugs(): string[] {
  return getAllArticles().map((a) => a.frontmatter.slug);
}
