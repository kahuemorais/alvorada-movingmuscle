// O mapa do site, montado da mesma lista que gera as páginas.
//
// O teste existe por dois motivos concretos: o endereço precisa sair do mesmo compositor do canônico
// (havia dado estruturado apontando para um endereço que redireciona), e a data de
// modificação precisa vir do arquivo da cidade, não do build: data de build muda as cento e vinte
// páginas a cada publicação sem que nada tenha mudado, e isso ensina o buscador a ignorar o campo.
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { enderecosDoMapa, type EntradaDoMapa } from "./mapa-sitemap";

const PASTA = path.join(process.cwd(), "src", "data", "cities");

describe("mapa do site", () => {
  const entradas: EntradaDoMapa[] = readdirSync(PASTA)
    .filter((nome) => nome.endsWith(".json"))
    .map((nome) => ({
      slug: nome.replace(/\.json$/, ""),
      lastModified: statSync(path.join(PASTA, nome)).mtime,
    }));

  it("monta um endereço absoluto por cidade, sem barra no fim", () => {
    const mapa = enderecosDoMapa(entradas, "https://brightfield.example");
    expect(mapa).toHaveLength(entradas.length);
    expect(mapa[0].url).toBe("https://brightfield.example/phoenix-az");
    for (const item of mapa) {
      expect(item.url.startsWith("https://")).toBe(true);
      expect(item.url).not.toMatch(/\/$/);
    }
  });

  it("usa a data do arquivo da cidade, e não a data do build", () => {
    const doArquivo = statSync(path.join(PASTA, "phoenix-az.json")).mtime;
    const mapa = enderecosDoMapa(entradas, "https://brightfield.example");
    const phoenix = mapa.find((i) => i.url.endsWith("/phoenix-az"))!;
    expect(phoenix.lastModified).toBeInstanceOf(Date);
    expect((phoenix.lastModified as Date).getTime()).toBe(doArquivo.getTime());
    // E não é a data de agora: é a prova de que a data vem do arquivo.
    expect(Math.abs((phoenix.lastModified as Date).getTime() - Date.now())).toBeGreaterThan(1000);
  });

  it("a rota do mapa cobre todas as cidades publicadas", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example");
    const mapa = await sitemap();
    expect(mapa).toHaveLength(entradas.length);
    for (const slug of entradas.map((e) => e.slug)) {
      expect(mapa.map((i: { url: string }) => i.url)).toContain(`https://brightfield.example/${slug}`);
    }
    vi.unstubAllEnvs();
  });

  it("a rota de robôs libera a página e aponta para o mapa, sem barra no fim", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example");
    const r = await robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe("https://brightfield.example/sitemap.xml");
    vi.unstubAllEnvs();
  });

  it("recusa slug de forma inválida, como o resto do endereço", () => {
    expect(() => enderecosDoMapa([{ slug: "../etc", lastModified: new Date() }], "https://x.example")).toThrow(/slug inválido/);
  });
});
