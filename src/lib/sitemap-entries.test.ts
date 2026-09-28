// The site map, built from the same list that generates the pages.
//
// The test exists for two concrete reasons: the address has to come from the same composer as the canonical one
// (there was structured data pointing at an address that redirects), and the modification
// date has to come from the city file, not from the build: a build date changes the one hundred and twenty
// pages on every publication even when nothing changed, and that teaches the crawler to ignore the field.
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { sitemapAddresses, type SitemapEntry } from "./sitemap-entries";

const FOLDER = path.join(process.cwd(), "src", "data", "cities");

describe("site map", () => {
  const entries: SitemapEntry[] = readdirSync(FOLDER)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({
      slug: name.replace(/\.json$/, ""),
      lastModified: statSync(path.join(FOLDER, name)).mtime,
    }));

  it("builds one absolute address per city, with no trailing slash", () => {
    const map = sitemapAddresses(entries, "https://brightfield.example");
    expect(map).toHaveLength(entries.length);
    expect(map[0].url).toBe("https://brightfield.example/phoenix-az");
    for (const item of map) {
      expect(item.url.startsWith("https://")).toBe(true);
      expect(item.url).not.toMatch(/\/$/);
    }
  });

  it("uses the city file date, and not the build date", () => {
    const fromFile = statSync(path.join(FOLDER, "phoenix-az.json")).mtime;
    const map = sitemapAddresses(entries, "https://brightfield.example");
    const phoenix = map.find((i) => i.url.endsWith("/phoenix-az"))!;
    expect(phoenix.lastModified).toBeInstanceOf(Date);
    expect((phoenix.lastModified as Date).getTime()).toBe(fromFile.getTime());
    // And it is not the current date: it is the proof that the date comes from the file.
    expect(Math.abs((phoenix.lastModified as Date).getTime() - Date.now())).toBeGreaterThan(1000);
  });

  it("the map route covers every published city", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example");
    const map = await sitemap();
    expect(map).toHaveLength(entries.length);
    for (const slug of entries.map((e) => e.slug)) {
      expect(map.map((i: { url: string }) => i.url)).toContain(`https://brightfield.example/${slug}`);
    }
    vi.unstubAllEnvs();
  });

  it("the robots route frees the page and points at the map, with no trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example");
    const r = await robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe("https://brightfield.example/sitemap.xml");
    vi.unstubAllEnvs();
  });

  it("refuses a slug of invalid shape, like the rest of the address", () => {
    expect(() => sitemapAddresses([{ slug: "../etc", lastModified: new Date() }], "https://x.example")).toThrow(/invalid slug/);
  });
});
