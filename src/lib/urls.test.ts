// O endereço público em um lugar só. O motivo é medido: o canônico e o Open Graph usavam endereço sem
// barra, o dado estruturado usava com barra e o redirecionamento da raiz também, então o dado estruturado
// apontava para um endereço que responde 308. E a queda para localhost era silenciosa: em produção, sem
// variável de ambiente, o canônico e a imagem de compartilhamento passariam a apontar para a máquina de
// quem roda o build.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { urlDoSchema } from "./structured";
import { cityPath, cityUrl, siteUrl } from "./urls";

const cidade = JSON.parse(readFileSync("src/data/cities/phoenix-az.json", "utf8"));

afterEach(() => vi.unstubAllEnvs());

describe("endereço público", () => {
  it("usa a variável própria quando existe, sem barra no fim", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example/");
    expect(siteUrl()).toBe("https://brightfield.example");
  });

  it("cai na variável da hospedagem quando a própria não existe", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "alvorada.vercel.app");
    expect(siteUrl()).toBe("https://alvorada.vercel.app");
  });

  it.each([
    ["na Vercel", { VERCEL: "1" }],
    ["em integração contínua", { CI: "1" }],
    ["com exigência explícita", { EXIGIR_ENDERECO_PUBLICO: "1" }],
  ])("em publicação %s sem endereço configurado, falha em vez de apontar para localhost", (_nome, marcador) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("CI", "");
    vi.stubEnv("EXIGIR_ENDERECO_PUBLICO", "");
    for (const [chave, valor] of Object.entries(marcador)) vi.stubEnv(chave, valor);
    expect(() => siteUrl()).toThrow(/endereço público/);
  });

  it("build de produção na máquina de quem desenvolve avisa e segue com localhost", () => {
    // Build local não é publicação: derrubar aqui não protege ninguém e atrapalha a verificação.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("CI", "");
    vi.stubEnv("EXIGIR_ENDERECO_PUBLICO", "");
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(siteUrl()).toBe("http://localhost:3000");
    expect(aviso).toHaveBeenCalledWith(expect.stringMatching(/localhost/));
    aviso.mockRestore();
  });

  it("em desenvolvimento sem endereço configurado, cai no localhost sem avisar", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(siteUrl()).toBe("http://localhost:3000");
    expect(aviso).not.toHaveBeenCalled();
    aviso.mockRestore();
  });

  it("monta caminho e endereço de cidade sem barra no fim", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example");
    expect(cityPath("phoenix-az")).toBe("/phoenix-az");
    expect(cityUrl("phoenix-az")).toBe("https://brightfield.example/phoenix-az");
    expect(cityPath("phoenix-az")).not.toMatch(/\/$/);
    expect(cityUrl("phoenix-az")).not.toMatch(/\/$/);
  });

  it("o dado estruturado aponta para o mesmo endereço do canônico, sem barra", () => {
    // Divergiram uma vez: o canônico usava sem barra e o dado estruturado com barra, então o endereço
    // declarado ao buscador respondia 308.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brightfield.example");
    const doSchema = urlDoSchema(cidade, siteUrl());
    expect(doSchema).toBe("https://brightfield.example/phoenix-az");
    expect(doSchema).not.toMatch(/\/$/);
  });

  it("recusa slug que não seja forma de slug", () => {
    // O mesmo motivo do carregador: o slug vira endereço, então forma fechada aqui também.
    expect(() => cityPath("Phoenix AZ")).toThrow(/slug inválido/);
    expect(() => cityUrl("../etc")).toThrow(/slug inválido/);
  });
});
