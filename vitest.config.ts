// Configuração do vitest, que existia sem arquivo nenhum e por isso rodava com os padrões.
//
// Dois ajustes, os dois aprendidos na prática:
//
// 1. O atalho `@/` mora no `tsconfig.json` e quem aplica é o Next; o vitest não lê tsconfig. Enquanto os
//    testes importavam só vizinhos de pasta, ninguém notou; o primeiro teste que importa arquivo de
//    `src/app`, que usa `@/` por convenção do projeto, não carregava sem este espelho.
// 2. O padrão do vitest casa `*.spec.ts`, e a medida de navegação usa essa extensão para o Playwright. Com
//    os padrões, `pnpm verify` reprovava porque o vitest tentava rodar o arquivo do navegador dentro do
//    ambiente de Node. O domínio de cada um fica explícito: teste de unidade em `src`, medida de navegador
//    em `tests`, e nenhum dos dois invade o outro.
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
