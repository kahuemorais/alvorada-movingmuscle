// Varredura de todos os arquivos de cidade, e não só do que está publicado hoje.
//
// Por que existe separado do city.test.ts: aquele prova a regra do carregador com uma cidade; este
// percorre a pasta inteira. A pasta pode chegar a cerca de 120 cidades, e cada arquivo novo é um arquivo
// escrito à mão: sem varredura, a cidade número 40 entra torta e o erro aparece na visita, na forma de
// número quebrado na tela. Com varredura, o build falha dizendo qual arquivo e qual campo.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { esquemaCidade } from "./schema";

const PASTA = path.join(process.cwd(), "src", "data", "cities");

describe("varredura dos arquivos de cidade", () => {
  const arquivos = readdirSync(PASTA).filter((nome) => nome.endsWith(".json"));

  it("tem pelo menos uma cidade publicada", () => {
    expect(arquivos.length).toBeGreaterThan(0);
  });

  it("cada arquivo passa no esquema, com o nome do arquivo na falha", () => {
    const problemas: string[] = [];
    for (const arquivo of arquivos) {
      const bruto: unknown = JSON.parse(readFileSync(path.join(PASTA, arquivo), "utf8"));
      const resultado = esquemaCidade.safeParse(bruto);
      if (!resultado.success) {
        const campos = resultado.error.issues.map((i) => i.path.join(".") || "raiz").join(", ");
        problemas.push(`${arquivo}: ${campos}`);
      }
    }
    expect(problemas, `arquivos com problema:\n${problemas.join("\n")}`).toEqual([]);
  });

  it("o nome do arquivo é o slug declarado dentro dele", () => {
    // Divergência entre os dois produziria endereço de página diferente do slug usado em endereço
    // canônico e em dado estruturado.
    const divergentes = arquivos
      .map((arquivo) => ({ arquivo, slug: JSON.parse(readFileSync(path.join(PASTA, arquivo), "utf8")).slug }))
      .filter(({ arquivo, slug }) => arquivo !== `${slug}.json`)
      .map(({ arquivo, slug }) => `${arquivo} declara ${slug}`);
    expect(divergentes).toEqual([]);
  });
});
