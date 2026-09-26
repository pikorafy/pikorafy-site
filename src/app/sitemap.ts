import type { MetadataRoute } from "next";
import { GENRES, getIndexableGames } from "@/lib/catalog";

const BASE_URL = "https://pikorafy.com";

// Game pages come from the database, so rebuild the sitemap daily.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/stores`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
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
      changeFrequency: "daily",
      priority: 0.95,
    },
  ];


  // Only games with published written content; price-only pages are noindex.
  const gamePages: MetadataRoute.Sitemap = (await getIndexableGames()).map((g) => ({
    url: `${BASE_URL}/game/${g.slug}`,
    lastModified: new Date(g.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const catalogPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/games`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/xbox`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/playstation`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/nintendo`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    ...GENRES.map((g) => ({
      url: `${BASE_URL}/games/${g.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  return [
    ...staticPages,
    ...catalogPages,
    ...gamePages,
  ];
}
