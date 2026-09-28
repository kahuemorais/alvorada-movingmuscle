// Vitest configuration. It used to exist with no file at all, so it ran with the defaults.
//
// Two adjustments, both learned the hard way:
//
// 1. The `@/` alias lives in `tsconfig.json` and Next is what applies it; vitest does not read tsconfig.
//    While the tests only imported neighbors in the same folder, nobody noticed; the first test that
//    imports a file from `src/app`, which uses `@/` by project convention, would not load without this
//    mirror.
// 2. The vitest default matches `*.spec.ts`, and the browser measurement uses that extension for
//    Playwright. With the defaults, `pnpm verify` failed because vitest tried to run the browser file
//    inside the Node environment. Each domain is explicit now: unit tests in `src`, browser measurement in
//    `tests`, and neither one invades the other.
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["tests/**", "node_modules/**", ".next/**"],
  },
});
