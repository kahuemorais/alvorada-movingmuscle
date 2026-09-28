// Sitemap of the hundred and twenty city pages.
//
// The list comes from the data folder, not from a list written by hand here: publishing city number 121 is
// dropping its file into `src/data/cities`, and the sitemap follows in the next build.
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { sitemapAddresses, type SitemapEntry } from "@/lib/sitemap-entries";
import { siteUrl } from "@/lib/urls";

// Static, like the pages: the sitemap is built at build time, not on every visit.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const folder = path.join(process.cwd(), "src", "data", "cities");
  const entries: SitemapEntry[] = readdirSync(folder)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({
      slug: name.replace(/\.json$/, ""),
      // Date of the file, not of the build: that is what makes the field mean something to the search engine.
      lastModified: statSync(path.join(folder, name)).mtime,
    }));

  return sitemapAddresses(entries, siteUrl());
}
