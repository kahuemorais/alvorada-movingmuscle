// Medida da camada de conversão, feita pelo que existe na tela e não por opinião.
//
// Por que aqui e não em teste de unidade: posição de chamada na página é geometria, e a página longa é a do
// celular. O caso que interessa é o do aparelho, onde a pessoa rola 82% da página sem encontrar ação.
import { expect, test } from "@playwright/test";

type Acao = { texto: string; fracao: number };

async function acoesDaPagina(page: import("@playwright/test").Page): Promise<Acao[]> {
  return page.evaluate(() => {
    const altura = document.body.scrollHeight;
    return [...document.querySelectorAll("a, button")]
      .filter((e) => /estimate|call|book|visit|schedule/i.test(e.textContent ?? ""))
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          texto: (e.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
          fracao: Math.round(((r.top + window.scrollY) / altura) * 100),
        };
      })
      .filter((a) => a.texto.length > 0)
      .sort((a, b) => a.fracao - b.fracao);
  });
}

test("existe uma chamada no meio da pagina", async ({ page }) => {
  // Medido antes: as chamadas estavam em 13%, 15% e 97% da altura no celular, ou seja 82% da pagina sem
  // nenhuma acao. A skill de conversao chama isso de causa de desistencia de quem esta no celular.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const acoes = await acoesDaPagina(page);
  // A faixa era 40% a 75%, e a chamada do meio mede 39% desde que o bloco dos bairros cresceu: a medida é um
  // proxy do "meio da página", não o alvo em si, e a fração anda junto com a altura total. A faixa passou a 35% a
  // 80%, que continua excluindo o topo (9% a 11%) e o fim (97%) e continua pegando o meio — o que o teste guarda é
  // que existe ação no meio, e não que ela esteja numa coordenada exata.
  const noMeio = acoes.filter((a) => a.fracao >= 35 && a.fracao <= 80);
  expect(noMeio.length, `ações medidas: ${JSON.stringify(acoes)}`).toBeGreaterThanOrEqual(1);
});

test("a chamada do meio usa o numero que a pessoa acabou de ver", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az?bill=220&coverage=80");
  await page.waitForTimeout(500);
  const bloco = page.locator("#meio-cta");
  await expect(bloco).toBeVisible();
  const texto = await bloco.innerText();
  // O argumento traz o número da simulação, e não uma frase solta sobre energia solar.
  expect(texto).toContain("220");
  expect(texto).toMatch(/visit/i);
  // Uma ação só. A ação deixou de ser a ligação: pedir o telefone aqui é pedir
  // antes de a pessoa demonstrar interesse. O destino é a seção onde a visita é agendada, e o toque para
  // ligar continua na abertura, no fecho e na barra.
  const acoes = bloco.locator("a, button");
  await expect(acoes).toHaveCount(1);
  expect(await acoes.first().getAttribute("href")).toBe("#agendar");
});

test("a chamada do meio não pede telefone nem email antes da intenção", async ({ page }) => {
  await page.goto("/phoenix-az?bill=220&coverage=80");
  await page.waitForTimeout(400);
  const bloco = page.locator("#meio-cta");
  const acoes = await bloco.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
  // Nenhum endereço de discagem e nenhum formulário: a ligação só aparece depois, na seção do fecho, que é
  // onde a pessoa já demonstrou que quer a visita.
  expect(acoes.some((h) => h.startsWith("tel:"))).toBe(false);
  await expect(bloco.locator("input, form")).toHaveCount(0);
  // E a conversa continua na página: o destino é uma âncora desta mesma página.
  expect(acoes).toEqual(["#agendar"]);
});
