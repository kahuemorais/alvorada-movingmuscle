// Security headers as data, and not scattered across the Next configuration.
//
// Why it exists: the response came out with no protection at all, on a page that runs third-party script and
// travels through ads, where framing and script origin stop being theory. As data,
// the headers become testable, and `pnpm test` fails if someone loosens the policy without noticing.
//
// What the policy blocks: third-party origin script that is not the meter, `eval`, plugin and embedded
// object, base hijacking to rewrite a relative address, framing in another site and sending of
// a form outwards.
//
// What it does not block, and why, so it does not look like carelessness:
//
//   script-src with 'unsafe-inline' Next injects the hydration script inline in the served HTML. Nonce
//                                   would require dynamic rendering, and the page is static on purpose,
//                                   because of cost and caching; a per-build hash does not work, because the
//                                   header configuration is evaluated before there is HTML to measure.
//   style-src with 'unsafe-inline'  the same reason, for the critical style Next injects.
//
// The two exceptions are the known cost of a static page in Next. If one day the page becomes
// rendered on every request, the path is a per-request nonce, which is what the documentation of the version
// describes (01-app/02-guides/content-security-policy.md).
export type Header = { key: string; value: string };

function policy(environment: string) {
  const isDevelopment = environment === "development";
  return [
    "default-src 'self'",
    // The Vercel meter loads `/_vercel/insights/script.js`, from the same origin, when it is production; the
    // address `va.vercel-scripts.com` only appears in debug mode, and stays allowed so
    // development does not break without warning.
    //
    // `'unsafe-eval'` ONLY in development, and for a reason that is not laziness: React in
    // development mode uses `eval()` to rebuild the call stack and for fast refresh, and without
    // it the console reports an error on every load, and that is how this defect appeared. In production
    // none of that runs, and the policy stays closed against `eval`; the test of this file fails whoever
    // takes the exception to the production side.
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    // The send of the meter also goes through the same origin in production.
    "connect-src 'self' https://va.vercel-scripts.com",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

// The environment enters as a parameter so the test can exercise both sides: the production one, which cannot
// have `unsafe-eval`, and the development one, which needs it. Without the parameter, the function reads the environment it
// is running in, which is what the Next configuration does.
export function securityHeaders(environment: string = process.env.NODE_ENV ?? "production"): Header[] {
  return [
    { key: "Content-Security-Policy", value: policy(environment) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()",
    },
  ];
}
