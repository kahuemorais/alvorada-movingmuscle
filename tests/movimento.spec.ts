// Medida do movimento, com as duas garantias que a skill de desenho exige.
//
// Uma: nada anima propriedade de layout. Animação de largura, altura ou topo faz o navegador refazer o layout a
// cada quadro, e é o erro clássico de quem anima por animar.
//
// Duas: quem pediu menos movimento no sistema recebe menos movimento. Movimento sem saída é barreira de
// acessibilidade, não enfeite.
import { expect, test } from "@playwright/test";

test("a seccao aparece na rolagem, e a caixa nao muda de tamanho", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const antes = await page.locator("section#steps").boundingBox();
  const animacoes = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .map((e) => getComputedStyle(e).animationName)
      .filter((n) => n && n !== "none"),
  );
  expect(animacoes.length, "nenhuma animação na página").toBeGreaterThan(0);
  // A caixa da seção é a mesma durante e depois da animação: nada de layout animado.
  await page.waitForTimeout(600);
  const depois = await page.locator("section#steps").boundingBox();
  expect(Math.abs((depois?.width ?? 0) - (antes?.width ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((depois?.height ?? 0) - (antes?.height ?? 0))).toBeLessThanOrEqual(1);
});

test("com menos movimento ligado, a seccao ja esta visivel e sem animacao", async ({ browser }) => {
  const contexto = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 393, height: 852 } });
  const pagina = await contexto.newPage();
  await pagina.goto("/phoenix-az");
  await pagina.waitForTimeout(400);
  const medidas = await pagina.evaluate(() => {
    const secao = document.querySelector("section#steps");
    const caixa = secao?.closest("div");
    return {
      opacidade: caixa ? getComputedStyle(caixa).opacity : null,
      animacao: caixa ? getComputedStyle(caixa).animationName : null,
    };
  });
  expect(medidas.opacidade).toBe("1");
  expect(medidas.animacao === "none" || medidas.animacao === null || medidas.animacao === "").toBe(true);
  await contexto.close();
});


test("a contagem da abertura começa no piso e nunca passa pelo zero", async ({ page }) => {
  // O motivo de cada metade da regra: o HTML sai do servidor com os três valores finais
  // (1.840, 4,8 e 12), e a contagem não pode pintar um número que o servidor não disse nem passar pelo zero,
  // que é como a nota de 4,8 aparecia como 0,3 no começo, medido quadro a quadro. Agora a contagem começa em
  // 90% do valor e sobe: 1.656 até 1.840, 4,3 até 4,8, 11 até 12, e nunca desce e nunca volta ao zero.
  await page.addInitScript(() => {
    (window as unknown as { __quadros: string[] }).__quadros = [];
    const ler = () => {
      const dl = document.querySelector("section:has(#hero-title) dl");
      if (dl) (window as unknown as { __quadros: string[] }).__quadros.push(dl.textContent ?? "");
      if ((window as unknown as { __quadros: string[] }).__quadros.length < 60) requestAnimationFrame(ler);
    };
    requestAnimationFrame(ler);
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(1200);
  const quadros = await page.evaluate(
    () => (window as unknown as { __quadros: string[] }).__quadros,
  );
  const lidos = quadros
    .map((t) => /Installs completed([\d,]+)Average customer rating([\d.]+)Crews in the area([\d,]+)/.exec(t))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => [Number(m[1].replace(/,/g, "")), Number(m[2]), Number(m[3])] as const);
  expect(lidos.length, `só ${lidos.length} quadro(s) com os três números`).toBeGreaterThan(10);

  // O piso: 90% do valor do arquivo da cidade, arredondado pelo próprio formatador do componente.
  const piso = [Math.round(1840 * 0.9), Number((4.8 * 0.9).toFixed(1)), Math.round(12 * 0.9)];
  for (const quadro of lidos) {
    quadro.forEach((valor, i) => {
      expect(valor, `um quadro pintou ${valor} no lugar número ${i + 1}, abaixo do piso ${piso[i]}`).toBeGreaterThanOrEqual(piso[i]);
    });
  }
  // A contagem sobe, nunca desce e nunca volta ao zero. O primeiro quadro abaixo do valor final é o piso: antes dele
  // está o valor que o servidor entregou, que fica na tela entre a pintura do HTML e a hidratação.
  const inicio = lidos.findIndex((quadro) => quadro[0] < 1840);
  expect(inicio, "a contagem não começou: nenhum quadro abaixo do valor final").toBeGreaterThan(-1);
  const contagem = lidos.slice(inicio);
  expect(contagem.length).toBeGreaterThan(5);
  for (let i = 1; i < contagem.length; i += 1) {
    contagem[i].forEach((valor, j) => {
      expect(valor, `a contagem desceu de ${contagem[i - 1][j]} para ${valor} no número ${j + 1}`).toBeGreaterThanOrEqual(contagem[i - 1][j]);
    });
  }
  // O primeiro quadro da contagem é o piso, e o último é o valor do arquivo da cidade, que o servidor entregou.
  expect(contagem[0]).toEqual(piso);
  expect(contagem.at(-1)).toEqual([1840, 4.8, 12]);
});

test("o fundo da abertura nao come o clique da acao, e nao anima", async ({ page }) => {
  // Duas garantias de uma vez: o recurso de fundo nao pode ficar entre o dedo e o botao, e a grade e o
  // brilho sao estaticos, entao nao ha animacao nova para quem pediu menos movimento.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const alvo = page.locator("section:has(#hero-title) a[href='#simulator']").first();
  await alvo.click();
  await page.waitForTimeout(400);
  expect(new URL(page.url()).hash).toBe("#simulator");

  const fundo = page.locator('[data-fundo="abertura"]');
  await expect(fundo).toHaveCSS("pointer-events", "none");
  await expect(fundo).toHaveCSS("animation-name", "none");
});

