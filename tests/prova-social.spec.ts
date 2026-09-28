// Medida da prova social.
//
// A seção tinha três cartões de um tipo e três de outro, com ícones diferentes, e nada
// dizendo por que são dois grupos. A causa não era o ícone, era a ausência de rótulo e um título que
// prometia a ordem inversa da que a página mostra.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Um seletor só: com vírgula o CSS cria dois seletores, e `${SECAO} h2` passava a casar também com a
// seção inteira, o que fez a primeira versão deste teste comparar o texto de tudo.
const SECAO = "section#proof";

test("cada trio tem um rótulo, na ordem da página", async ({ page }) => {
  await page.goto("/phoenix-az");
  // Três rótulos agora, e não dois: o bloco dos bairros atendidos ganhou título próprio porque
  // "Crews cover" não dizia o que era nem para que servia. Ele é um terceiro grupo de verdade, então entra na
  // contagem em vez de virar texto solto.
  const rotulos = await page.locator(`${SECAO} h3`).allInnerTexts();
  expect(rotulos.map((r) => r.trim().toLowerCase())).toEqual([
    "what the neighbors say",
    "who did the work",
    "where the crews work",
  ]);

  // Cada rótulo fica acima do seu trio: o primeiro acima da primeira citação, o segundo acima do
  // primeiro cartão de equipe. É isso que separa um trio do outro.
  const posicoes = await page.evaluate((seletor) => {
    const secao = document.querySelector(seletor)!;
    const y = (el: Element) => Math.round(el.getBoundingClientRect().top + window.scrollY);
    const rotulos = Array.from(secao.querySelectorAll("h3")).map(y);
    const citacao = secao.querySelector("blockquote");
    const equipe = Array.from(secao.querySelectorAll("p, span")).find((e) =>
      e.textContent?.includes("installs"),
    );
    return { rotulos, citacao: citacao ? y(citacao) : null, equipe: equipe ? y(equipe) : null };
  }, SECAO);
  expect(posicoes.citacao).not.toBeNull();
  expect(posicoes.equipe).not.toBeNull();
  expect(posicoes.rotulos[0]).toBeLessThan(posicoes.citacao!);
  expect(posicoes.rotulos[1]).toBeLessThan(posicoes.equipe!);
  expect(posicoes.rotulos[1]).toBeGreaterThan(posicoes.citacao!);
  // O terceiro rótulo fecha a seção, depois das equipes: ele fala dos lugares, e os lugares vêm depois de quem
  // trabalha neles.
  expect(posicoes.rotulos[2]).toBeGreaterThan(posicoes.equipe!);
});

test("o título da seção não promete ordem que a página não segue", async ({ page }) => {
  await page.goto("/phoenix-az");
  const titulo = (await page.locator(`${SECAO} h2`).innerText()).toLowerCase();
  // O título antigo dizia "who did the work, and what the neighbors say" e a seção mostra o contrário.
  expect(titulo).not.toContain("who did the work, and");
});

test("o depoimento em destaque não estica até a altura dos dois da direita", async ({ page }) => {
  // Defeito medido antes: sem a foto, o destaque acompanhava a altura dos dois cartões
  // da direita e virava um retângulo branco com a citação no meio, porque ocupava duas linhas com o padrão
  // `align-items: stretch` da grade. Na grade nova ele está sozinho na primeira linha, e não há vizinho para
  // esticá-lo: a medida fica como guarda, junto com o degrau de tipo da citação, que continua um acima dos outros.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate((seletor) => {
    const grade = document.querySelector(`${seletor} .grid`)!;
    const cartoes = [...grade.children];
    const altura = (el: Element) => Math.round(el.getBoundingClientRect().height);
    const citacoes = [...document.querySelectorAll(`${seletor} blockquote`)];
    return {
      quantos: cartoes.length,
      destaque: altura(cartoes[0]),
      dois: altura(cartoes[1]) + altura(cartoes[2]),
      sizeDestaque: parseFloat(getComputedStyle(citacoes[0]).fontSize),
      sizeOutras: parseFloat(getComputedStyle(citacoes[1]).fontSize),
    };
  }, SECAO);
  expect(m.quantos, "a grade dos depoimentos mudou de tamanho").toBe(3);
  expect(m.destaque, "o destaque acompanhou a altura dos dois da direita").toBeLessThan(m.dois);
  expect(m.sizeDestaque, "a citação do destaque não subiu para type-lead").toBe(20);
  expect(m.sizeOutras, "a citação dos outros dois mudou de degrau").toBe(16);
});

// A grade dos depoimentos no desktop. O destaque deixa de ocupar duas LINHAS na coluna da
// esquerda e passa a ocupar as duas COLUNAS da primeira linha, com os outros dois lado a lado na segunda. A
// medida guarda a geometria, e não a classe: largura de cada cartão contra a largura da grade, e o topo de cada
// um, que é o que diz em que linha ele caiu.
test("no desktop o destaque ocupa a primeira linha inteira e os outros dois dividem a segunda", async ({
  page,
}) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate((seletor) => {
    const grade = document.querySelector(`${seletor} .grid`)!;
    const caixas = [...grade.children].map((el) => el.getBoundingClientRect());
    return {
      larguraDaGrade: Math.round(grade.getBoundingClientRect().width),
      larguras: caixas.map((r) => Math.round(r.width)),
      topos: caixas.map((r) => Math.round(r.top)),
    };
  }, SECAO);
  expect(m.larguras, "a grade dos depoimentos mudou de tamanho").toHaveLength(3);
  expect(m.larguras[0], "o destaque não ocupa as duas colunas").toBeGreaterThan(m.larguraDaGrade - 2);
  // Cada um dos outros dois com metade da grade, descontado o vão de 16 px entre as colunas.
  const meia = (m.larguraDaGrade - 16) / 2;
  expect(Math.abs(m.larguras[1] - meia), `largura do segundo: ${m.larguras[1]} contra ${meia}`).toBeLessThanOrEqual(2);
  expect(Math.abs(m.larguras[2] - meia), `largura do terceiro: ${m.larguras[2]} contra ${meia}`).toBeLessThanOrEqual(2);
  // Primeira linha só com o destaque, e a segunda com os dois partindo do mesmo topo.
  expect(m.topos[0], "o destaque não ficou acima dos outros dois").toBeLessThan(m.topos[1]);
  expect(m.topos[1], "os dois da segunda linha não começam juntos").toBe(m.topos[2]);
});

// E no compacto nada muda: uma coluna, os três empilhados, com a Marta primeiro, que é a ordem do arquivo.
test.describe("a grade dos depoimentos no compacto", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("os três seguem empilhados com a Marta primeiro", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(400);
    const m = await page.evaluate((seletor) => {
      const grade = document.querySelector(`${seletor} .grid`)!;
      const caixas = [...grade.children].map((el) => el.getBoundingClientRect());
      return {
        larguraDaGrade: Math.round(grade.getBoundingClientRect().width),
        larguras: caixas.map((r) => Math.round(r.width)),
        topos: caixas.map((r) => Math.round(r.top)),
        primeiraFala: (grade.children[0].textContent ?? "").replace(/\s+/g, " "),
      };
    }, SECAO);
    expect(m.larguras).toEqual([m.larguraDaGrade, m.larguraDaGrade, m.larguraDaGrade]);
    expect(m.topos[0]).toBeLessThan(m.topos[1]);
    expect(m.topos[1]).toBeLessThan(m.topos[2]);
    // O primeiro da pilha é o depoimento da Marta, que é a ordem do arquivo da cidade.
    const primeiro = JSON.parse(
      readFileSync("src/data/cities/phoenix-az.json", "utf8"),
    ).testimonials[0].author as string;
    expect(m.primeiraFala, "o primeiro da pilha não é o da Marta").toContain(primeiro);
  });
});
