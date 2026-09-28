// Configuration for the browser measurement.
//
// The test server is the production build, not the development mode: it is what the host serves, and
// measuring in development mode would measure CSS through a different path (Tailwind injects a separate
// sheet, for example), so a production defect could pass here.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3200",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start --port 3200",
    url: "http://localhost:3200/phoenix-az",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // The production build requires an address when the environment is a publishing one, and the CI
      // marks itself as CI. Here the address is the local one, which is the right one for measuring.
      NEXT_PUBLIC_SITE_URL: "http://localhost:3200",
    },
  },
});
