// Site robots. It allows everything and points at the sitemap, and it does not try to hide any path: the
// page is public, and what should not be indexed either does not exist or sits behind the access
// protection of the host.
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/urls";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Absolute address of the sitemap, through the same composer as the rest, with no trailing slash.
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
