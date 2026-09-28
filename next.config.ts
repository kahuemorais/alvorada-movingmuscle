import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // No `trailingSlash`, and not by oversight. The first version had `trailingSlash: true` because the
  // canonical and the Open Graph declared the URL with a trailing slash, and in the local build that
  // worked. On the published domain it did not: Vercel normalizes the URL without the slash before Next
  // sees the request, so /phoenix-az/ answered 308 to /phoenix-az and /phoenix-az answered 404, meaning
  // the city page did not open through any path. Now the served address, the canonical and the Open Graph
  // are all without the slash, which is the Next default and what the host serves.
  poweredByHeader: false,

  // Security headers on every route. The values live in `src/lib/security-headers.ts`, not here, because
  // there they are testable data: `pnpm test` fails if someone loosens the policy without noticing. The
  // reasons for the two `unsafe-inline` exceptions are written in the module itself.
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders() }];
  },
};

export default nextConfig;
