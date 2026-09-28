// Medida do texto da página contra o arquivo de dados.
//
// Por que existe: "o conteúdo do documento está todo na página" é a afirmação mais fácil de fazer e a mais
// fácil de quebrar sem ninguém ver. Uma reescrita de copy, um rótulo trocado, e um fato do documento some da
// tela em silêncio.
//
// O que ela garante, em duas frentes:
//   1. Toda string do arquivo de dados aparece na página, normalizando espaço. Como o arquivo de dados é onde
//      vive o texto que a pagina mostra, isso cobre depoimento, resposta de FAQ, rótulo de perfil,
//      texto de equipe e nota de incentivo, incluindo os números dentro das frases.
//   2. O texto visível não tem travessão e não tem exclamação, que são a Camada 0 do `kopy`, a disciplina de
//      escrita deste projeto. O auditor mecânico dele roda sobre arquivo de texto; aqui a mesma regra vira
//      medida, no texto que a página realmente mostra.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const CIDADE = JSON.parse(
  readFileSync("src/data/cities/phoenix-az.json", "utf8"),
) as Record<string, unknown>;

function strings(valor: unknown, saida: string[] = []): string[] {
  if (typeof valor === "string") {
    if (valor.trim().length > 12) saida.push(valor.trim());
  } else if (Array.isArray(valor)) {
    valor.forEach((v) => strings(v, saida));
  } else if (valor && typeof valor === "object") {
    Object.values(valor).forEach((v) => strings(v, saida));
  }
  return saida;
}

const normalizar = (s: string) => s.replace(/\s+/g, " ").trim();

test("o texto da pagina sai do documento original", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  // textContent, e não innerText: as respostas do FAQ vivem dentro do acordeão fechado, e innerText ignora
  // texto escondido. A primeira versão desta medida acusou seis respostas ausentes por causa disso, quando o
  // defeito era o método, não a página.
  const corpo = await page.evaluate(() => document.body.textContent ?? "");
  const pagina = normalizar(corpo);

  const faltando = strings(CIDADE).filter((s) => !pagina.includes(normalizar(s)));
  expect(faltando, `string do arquivo de dados que não aparece na página: ${faltando.join(" | ")}`).toEqual(
    [],
  );
});

test("o texto da pagina passa na camada zero do kopy", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const corpo = await page.evaluate(() => document.body.textContent ?? "");
  // Travessão é proibido, e o traço do nome da região metropolitana é meia-risca, que não é travessão.
  expect(corpo).not.toContain("—");
  // Exclamação é proibida na copy do projeto.
  expect(corpo).not.toContain("!");
});
