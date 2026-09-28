// Site map, built from the same city list that generates the pages.
//
// Two decisions worth recording:
//
// 1. The modification date comes from the city file, not from the build date. Build date teaches the
//    crawler to distrust the field: it sees the whole map changing on every publication, without a line
//    of the hundred and twenty pages having changed. The file date is factual: the data changed, the date changed.
// 2. The address comes from the same composer as the canonical (`cityPageUrl`), so map, canonical and structured
//    data cannot diverge, which was the defect found.
import type { MetadataRoute } from "next";
import { cityPageUrl } from "./urls";

export type SitemapEntry = { slug: string; lastModified: Date };

export function sitemapAddresses(entries: SitemapEntry[], site: string): MetadataRoute.Sitemap {
  return entries.map(({ slug, lastModified }) => ({
    url: cityPageUrl(site, slug),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
}
