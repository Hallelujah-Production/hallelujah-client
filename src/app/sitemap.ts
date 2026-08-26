import type { MetadataRoute } from "next";
import { getAllChurchSlugs } from "@/lib/services";
import { PLATFORM_SITE_URL } from "@/lib/brand";

const SITE_URL = PLATFORM_SITE_URL;

/**
 * Only public pages are listed. Authenticated routes are marked noindex in
 * their layout metadata and never appear here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllChurchSlugs();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/churches`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const churchRoutes: MetadataRoute.Sitemap = slugs.flatMap((slug) => [
    {
      url: `${SITE_URL}/church/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/church/${slug}/prayer`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ]);

  return [...staticRoutes, ...churchRoutes];
}
