// The security headers as data, so they can be tested.
//
// What was checked in the source before writing the policy: the analytics package loads
// `/_vercel/insights/script.js` in production, same origin, and only the debug mode fetches
// `va.vercel-scripts.com`. And Next injects inline script to hydrate the page, which rules out
// `script-src` without `'unsafe-inline'` on a static page.
import { describe, expect, it } from "vitest";
import config from "../../next.config";
import { securityHeaders } from "./security-headers";

const policy = () => securityHeaders().find((c) => c.key === "Content-Security-Policy")!.value;

describe("security headers", () => {
  it("declares the five required protections", () => {
    expect(securityHeaders().map((c) => c.key)).toEqual([
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "X-Frame-Options",
      "Permissions-Policy",
    ]);
  });

  it("closes object, base, framing and form", () => {
    for (const directive of ["object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'"]) {
      expect(policy()).toContain(directive);
    }
  });

  it("does not allow eval in production, and allows it only in development", () => {
    // The defect showed up in the console: React in development mode uses `eval()` to rebuild
    // the call stack and for the fast refresh, and the closed policy blocked it. The exception exists, and
    // exists ONLY on the development side: it is this second line that keeps the first one from being forgotten.
    expect(policy()).not.toContain("unsafe-eval");
    const inDevelopment = securityHeaders("development").find(
      (c) => c.key === "Content-Security-Policy",
    )!.value;
    expect(inDevelopment).toContain("'unsafe-eval'");
    // And the exception does not drag the rest of the policy with it: the four protections stay closed there too.
    for (const directive of ["object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'"]) {
      expect(inDevelopment).toContain(directive);
    }
  });

  it("does not allow a third-party origin beyond the one that serves the meter", () => {
    const origens = policy().match(/https:\/\/[a-z0-9.-]+/g) ?? [];
    expect(new Set(origens)).toEqual(new Set(["https://va.vercel-scripts.com"]));
  });

  it("allows inline script, which is what the Next hydration requires", () => {
    expect(policy()).toContain("script-src 'self' 'unsafe-inline'");
  });

  it("the Next configuration applies the headers on every route", async () => {
    // Without this link, the data exists and the response keeps going out with no protection at all.
    expect(typeof config.headers).toBe("function");
    const rotas = await config.headers!();
    expect(rotas).toHaveLength(1);
    expect(rotas[0].source).toBe("/(.*)");
    expect(rotas[0].headers.map((c) => c.key)).toEqual(securityHeaders().map((c) => c.key));
  });

  it("keeps the other protections with the expected value", () => {
    const map = Object.fromEntries(securityHeaders().map((c) => [c.key, c.value]));
    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["Permissions-Policy"]).toContain("camera=()");
  });
});
