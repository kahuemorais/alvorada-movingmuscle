// The public address of the site, in a single place.
//
// It exists because there were three different truths about the same address: the canonical and the Open
// Graph used `https://host/slug`, the structured data used `https://host/slug/` and the redirect of the
// root too. The two with a slash point at an address that answers 308, and that shape divergence
// already stopped the page from opening once, when `trailingSlash` was on. Here the composition is a single one,
// and the test checks that no composed path ends in a slash.
//
// And the fallback to localhost is no longer silent: in production, with no environment variable configured, the
// canonical, the share image and the structured data would point at the build machine, which is
// worse than failing. In production with no address, the build stops.
const SLUG_FORM = /^[a-z0-9-]+$/;

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function siteUrl(): string {
  const proprio = process.env.NEXT_PUBLIC_SITE_URL;
  if (proprio) return withoutTrailingSlash(proprio);

  const hospedagem = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (hospedagem) return `https://${withoutTrailingSlash(hospedagem)}`;

  // Publication environment is where the address matters: Vercel sets `VERCEL`, and any continuous
  // integration sets `CI`. A build run on the developer machine is not a publication, and bringing down the
  // local build protects nobody: it gets in the way of verification. `REQUIRE_PUBLIC_ADDRESS=1` forces the requirement
  // for hosting that sets neither of the two.
  const inProduction = Boolean(process.env.VERCEL) || Boolean(process.env.CI) || process.env.REQUIRE_PUBLIC_ADDRESS === "1";
  if (process.env.NODE_ENV === "production" && inProduction) {
    throw new Error(
      "public address not configured: set NEXT_PUBLIC_SITE_URL, or run on Vercel, which fills VERCEL_PROJECT_PRODUCTION_URL",
    );
  }
  // Outside the publication environment the return is localhost, and the warning exists so the fallback is not
  // silent: canonical and share image pointing at the wrong machine is an expensive defect.
  if (process.env.NODE_ENV === "production") {
    console.warn("public address not configured: using http://localhost:3000 in the build");
  }
  return "http://localhost:3000";
}

export function cityPath(slug: string): string {
  if (!SLUG_FORM.test(slug)) throw new Error(`invalid slug: ${slug}`);
  return `/${slug}`;
}

// Pure composer, taking the site as a parameter: it is the same one used by the page address and by the
// address declared in the structured data. Having a single composer is what stops the two from diverging
// again, which was the original defect.
// Blog path: the index without a slug and the text with a slug, through the same composer as the city path, and with
// the same closed shape. It exists here and not in the page because a hand-built address is the defect this
// module already records: that is how the canonical and the structured data came to disagree.
export function blogPath(slug?: string): string {
  if (slug === undefined) return "/blog";
  if (!SLUG_FORM.test(slug)) throw new Error(`invalid slug: ${slug}`);
  return `/blog/${slug}`;
}

export function cityPageUrl(site: string, slug: string): string {
  return `${withoutTrailingSlash(site)}${cityPath(slug)}`;
}

export function cityUrl(slug: string): string {
  return cityPageUrl(siteUrl(), slug);
}

export function blogPageUrl(site: string, slug?: string): string {
  return `${withoutTrailingSlash(site)}${blogPath(slug)}`;
}

export function blogUrl(slug?: string): string {
  return blogPageUrl(siteUrl(), slug);
}
