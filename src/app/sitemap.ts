import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import { getAllAlternatives } from "@/lib/alternatives";

const BASE_URL = "https://pikorafy.com";

const tools = [
  "json-formatter",
  "password-generator",
  "base64",
  "color-converter",
  "markdown-preview",
  "uuid-generator",
  "url-encoder",
  "text-diff",
  "meta-tag-generator",
  "lorem-ipsum",
  "word-counter",
  "image-compressor",
  "qr-code-generator",
  "css-gradient-generator",
  "regex-tester",
  "hash-generator",
  "html-entity-encoder",
  "svg-to-png",
  "timestamp-converter",
  "json-to-csv",
  "jwt-decoder",
  "css-minifier",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  const comparisons = getAllComparisons();
  const alternatives = getAllAlternatives();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/vs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/alternatives`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = tools.map((slug) => ({
    url: `${BASE_URL}/tools/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/blog/${a.frontmatter.slug}`,
    lastModified: new Date(a.frontmatter.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const comparisonPages: MetadataRoute.Sitemap = comparisons.map((c) => ({
    url: `${BASE_URL}/vs/${c.frontmatter.slug}`,
    lastModified: new Date(c.frontmatter.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const alternativePages: MetadataRoute.Sitemap = alternatives.map((a) => ({
    url: `${BASE_URL}/alternatives/${a.frontmatter.slug}`,
    lastModified: new Date(a.frontmatter.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categories = Array.from(
    new Set(articles.map((a) => a.frontmatter.category.toLowerCase().replace(/\s+/g, "-")))
  );
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/blog/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...toolPages,
    ...articlePages,
    ...comparisonPages,
    ...alternativePages,
    ...categoryPages,
  ];
}
