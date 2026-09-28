// Os cabeçalhos de segurança como dado, para serem testáveis.
//
// O que foi conferido na fonte antes de escrever a política: o pacote de analytics carrega
// `/_vercel/insights/script.js` em produção, de mesma origem, e só o modo de depuração busca
// `va.vercel-scripts.com`. E o Next injeta script em linha para hidratar a página, o que impede
// `script-src` sem `'unsafe-inline'` numa página estática.
import { describe, expect, it } from "vitest";
import configuracao from "../../next.config";
import { cabecalhosSeguranca } from "./security-headers";

const politica = () => cabecalhosSeguranca().find((c) => c.key === "Content-Security-Policy")!.value;

describe("cabeçalhos de segurança", () => {
  it("declara as cinco proteções exigidas", () => {
    expect(cabecalhosSeguranca().map((c) => c.key)).toEqual([
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "X-Frame-Options",
      "Permissions-Policy",
    ]);
  });

  it("fecha objeto, base, enquadramento e formulário", () => {
    for (const diretiva of ["object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'"]) {
      expect(politica()).toContain(diretiva);
    }
  });

  it("não libera eval em produção, e libera só em desenvolvimento", () => {
    // O defeito aparecia no console: o React em modo de desenvolvimento usa `eval()` para reconstruir
    // pilha de chamada e para o recarregamento rápido, e a política fechada bloqueava. A exceção existe, e
    // existe SÓ no lado de desenvolvimento — é esta segunda linha que impede a primeira de ser esquecida.
    expect(politica()).not.toContain("unsafe-eval");
    const emDesenvolvimento = cabecalhosSeguranca("development").find(
      (c) => c.key === "Content-Security-Policy",
    )!.value;
    expect(emDesenvolvimento).toContain("'unsafe-eval'");
    // E a exceção não arrasta o resto da política: as quatro proteções continuam fechadas lá também.
    for (const diretiva of ["object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'"]) {
      expect(emDesenvolvimento).toContain(diretiva);
    }
  });

  it("não libera origem de terceiro além da que serve o medidor", () => {
    const origens = politica().match(/https:\/\/[a-z0-9.-]+/g) ?? [];
    expect(new Set(origens)).toEqual(new Set(["https://va.vercel-scripts.com"]));
  });

  it("permite script em linha, que é o que a hidratação do Next exige", () => {
    expect(politica()).toContain("script-src 'self' 'unsafe-inline'");
  });

  it("a configuração do Next aplica os cabeçalhos em toda rota", async () => {
    // Sem esta ligação, o dado existe e a resposta continua sem proteção nenhuma.
    expect(typeof configuracao.headers).toBe("function");
    const rotas = await configuracao.headers!();
    expect(rotas).toHaveLength(1);
    expect(rotas[0].source).toBe("/(.*)");
    expect(rotas[0].headers.map((c) => c.key)).toEqual(cabecalhosSeguranca().map((c) => c.key));
  });

  it("mantém as outras proteções com o valor esperado", () => {
    const mapa = Object.fromEntries(cabecalhosSeguranca().map((c) => [c.key, c.value]));
    expect(mapa["X-Content-Type-Options"]).toBe("nosniff");
    expect(mapa["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(mapa["X-Frame-Options"]).toBe("DENY");
    expect(mapa["Permissions-Policy"]).toContain("camera=()");
  });
});
