import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import { getAllAlternatives } from "@/lib/alternatives";

const BASE_URL = "https://pikorafy.com";


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
      url: `${BASE_URL}/stores`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/gaming`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/gaming/deals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/deals`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/quiz`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];


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
    ...articlePages,
    ...comparisonPages,
    ...alternativePages,
    ...categoryPages,
  ];
}
