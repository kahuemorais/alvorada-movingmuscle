// The public address in one place only. The reason is measured: the canonical and the Open Graph used an address with no
// slash, the structured data used one with a slash and the root redirect as well, so the structured data
// pointed at an address that answers 308. And the fallback to localhost was silent: in production, with no
// environment variable, the canonical and the share image would start pointing at the machine of
// whoever runs the build.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { schemaUrl } from "./structured";
import { cityPath, cityUrl, siteUrl } from "./urls";

const city = JSON.parse(readFileSync("src/data/cities/phoenix-az.json", "utf8"));

afterEach(() => vi.unstubAllEnvs());

describe("public address", () => {
  it("uses its own variable when it exists, with no trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example/");
    expect(siteUrl()).toBe("https://brightfield.example");
  });

  it("falls back to the hosting variable when its own does not exist", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "alvorada.vercel.app");
    expect(siteUrl()).toBe("https://alvorada.vercel.app");
  });

  it.each([
    ["on Vercel", { VERCEL: "1" }],
    ["on continuous integration", { CI: "1" }],
    ["with an explicit requirement", { REQUIRE_PUBLIC_ADDRESS: "1" }],
  ])("in a publication %s with no address configured, it fails instead of pointing at localhost", (_nome, marker) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("CI", "");
    vi.stubEnv("REQUIRE_PUBLIC_ADDRESS", "");
    for (const [key, value] of Object.entries(marker)) vi.stubEnv(key, value);
    expect(() => siteUrl()).toThrow(/public address/);
  });

  it("a production build on the developer machine warns and goes on with localhost", () => {
    // A local build is not a publication: failing here protects nobody and gets in the way of the verification.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("CI", "");
    vi.stubEnv("REQUIRE_PUBLIC_ADDRESS", "");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(siteUrl()).toBe("http://localhost:3000");
    expect(warning).toHaveBeenCalledWith(expect.stringMatching(/localhost/));
    warning.mockRestore();
  });

  it("in development with no address configured, it falls back to localhost without warning", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(siteUrl()).toBe("http://localhost:3000");
    expect(warning).not.toHaveBeenCalled();
    warning.mockRestore();
  });

  it("builds the city path and address with no trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example");
    expect(cityPath("phoenix-az")).toBe("/phoenix-az");
    expect(cityUrl("phoenix-az")).toBe("https://brightfield.example/phoenix-az");
    expect(cityPath("phoenix-az")).not.toMatch(/\/$/);
    expect(cityUrl("phoenix-az")).not.toMatch(/\/$/);
  });

  it("the structured data points at the same address as the canonical one, with no slash", () => {
    // They diverged once: the canonical used no slash and the structured data used a slash, so the address
    // declared to the crawler answered 308.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example");
    const fromSchema = schemaUrl(city, siteUrl());
    expect(fromSchema).toBe("https://brightfield.example/phoenix-az");
    expect(fromSchema).not.toMatch(/\/$/);
  });

  it("refuses a slug that is not slug shape", () => {
    // The same reason as the loader: the slug becomes an address, so the shape is closed here too.
    expect(() => cityPath("Phoenix AZ")).toThrow(/invalid slug/);
    expect(() => cityUrl("../etc")).toThrow(/invalid slug/);
  });
});
