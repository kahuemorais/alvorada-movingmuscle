// Configuração da medida de navegação.
//
// O servidor do teste é o build de produção, e não o modo de desenvolvimento: é o que a hospedagem serve,
// e medir no modo de desenvolvimento mediria CSS com caminho diferente (o Tailwind injeta folha separada,
// por exemplo), então um defeito de produção poderia passar aqui.
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
      // O build de produção exige endereço quando o ambiente é de publicação, e a integração contínua
      // marca CI. Aqui o endereço é o local, que é o correto para medir.
      NEXT_PUBLIC_SITE_URL: "http://localhost:3200",
    },
  },
});
