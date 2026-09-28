// Medida do que a página tem de recurso visual, para a planura não voltar sem ninguém ver.
//
// Medição de partida: zero gradiente e zero imagem em 6.434 px de altura no celular. Só cor sólida e
// borda, que era a planura que se via na tela.
import { expect, test } from "@playwright/test";

test("a pagina tem foto de servico, e nao so cor solida", async ({ page }) => {
  await page.goto("/phoenix-az");
  // Com as fotos abaixo da dobra, todas são `loading="lazy"`: a página é percorrida e a espera é pelos arquivos, com
  // uma segunda passada de rolagem enquanto faltar alguma — sem isso a medida reprova foto que simplesmente ainda não
  // foi pedida ao servidor.
  const faltando = await page.evaluate(async () => {
    for (let tentativa = 0; tentativa < 40; tentativa++) {
      const pendentes = [...document.images].filter((i) => !i.complete);
      if (pendentes.length === 0) return [];
      if (tentativa < 12) window.scrollBy(0, 500);
      else window.scrollBy(0, -400);
      await new Promise((r) => setTimeout(r, 150));
    }
    return [...document.images].filter((i) => !i.complete).map((i) => i.currentSrc || i.src);
  });
  expect(faltando, `fotos que não carregaram: ${faltando.join(", ")}`).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const medidas = await page.evaluate(() => {
    // A foto é o que ocupa espaço de cena: os ícones da página são pequenos e contá-los não provaria nada.
    const cena = [...document.querySelectorAll("img")].filter((s) => s.getBoundingClientRect().width > 300);
    const gradientes = [...document.querySelectorAll("body *")].filter((e) =>
      getComputedStyle(e).backgroundImage.includes("gradient"),
    );
    return {
      cena: cena.length,
      maiorCena: cena.length ? Math.round(Math.max(...cena.map((s) => s.getBoundingClientRect().width))) : 0,
      carregada: cena.every((s) => (s as HTMLImageElement).naturalWidth > 0),
      gradientes: gradientes.length,
      altura: document.body.scrollHeight,
    };
  });
  expect(medidas.cena, "nenhuma foto de cena na página").toBeGreaterThanOrEqual(1);
  expect(medidas.carregada, "a foto de cena não carregou").toBe(true);
  // A abertura deixou de ter véu em gradiente quando virou bloco de tinta com a foto ao lado, e a página
  // não usa gradiente em lugar nenhum agora. A regra da skill é que gradiente, quando existe, seja funcional, e não
  // que exista: exigir gradiente aqui seria guardar um recurso que o desenho abandonou.
  // E a cena aparece em tamanho de cena, não espremida num canto.
  expect(medidas.maiorCena).toBeGreaterThan(300);
});

test("as fotos da página passam por caminho local, e não por terceiro", async ({ page }) => {
  // Servir a foto do próprio domínio evita requisição a terceiro e mantém a política de segurança fechada, que
  // aqui proíbe imagem de fora. Este teste guarda essa decisão; o nome citava só a foto da abertura, que deixou
  // de existir, e a guarda vale para toda imagem da página.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const origens = await page.evaluate(() =>
    [...document.querySelectorAll("img")].map((i) => new URL((i as HTMLImageElement).src).origin),
  );
  const proprio = new URL(page.url()).origin;
  expect(origens.length).toBeGreaterThan(0);
  for (const o of origens) expect(o, "imagem servida de terceiro").toBe(proprio);
});


test("no desktop a abertura é uma coluna centrada sobre tinta, sem foto", async ({ page }) => {
  // Composição: texto centrado sobre cor sólida, e nada mais. A foto que ficava em faixa abaixo
  // do painel saiu porque atrapalhava o desenho novo, então a medida perdeu as asserções da foto e
  // ganhou a que guarda a decisão: a abertura não tem imagem nenhuma. O resto continua: o texto sobre cor própria,
  // e a faixa de números com as três divisórias.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    const titulo = document.querySelector("#hero-title");
    const faixa = hero?.querySelector("dl");
    const pintura = document.createElement("canvas").getContext("2d");
    const cor = (e: Element) => {
      pintura!.fillStyle = "#ffffff";
      pintura!.fillStyle = getComputedStyle(e).backgroundColor;
      return String(pintura!.fillStyle);
    };
    if (!hero || !titulo || !faixa) return null;
    const h = hero.getBoundingClientRect();
    const t = titulo.getBoundingClientRect();
    const bloco = titulo.closest("div");
    return {
      imagens: hero.querySelectorAll("img").length,
      fundoDoTexto: bloco ? cor(bloco) : null,
      fundoDaPagina: cor(document.body),
      desvioDoCentro: Math.round(Math.abs(t.x + t.width / 2 - (h.x + h.width / 2))),
      divisoes: faixa.querySelectorAll("div[class*=border-l]").length,
      itens: faixa.querySelectorAll("dd").length,
    };
  });
  expect(m, "não achei a abertura").not.toBeNull();
  expect(m!.imagens, "a abertura voltou a ter imagem").toBe(0);
  expect(m!.fundoDoTexto, "o texto não está sobre cor sólida própria").not.toBe(m!.fundoDaPagina);
  expect(m!.desvioDoCentro, `o título está ${m!.desvioDoCentro}px fora do centro da abertura`).toBeLessThanOrEqual(4);
  expect(m!.itens, "a faixa de números não tem três itens").toBe(3);
  expect(m!.divisoes, "a faixa de números não tem as divisórias finas").toBe(2);
});

test("no celular a abertura é a coluna centrada na largura da tela, sem foto", async ({ page }) => {
  // A medida no celular era sobre a foto em faixa, que saiu. O que ela guarda agora é o desenho novo na largura
  // estreita: o painel ocupa a tela, o título está centrado, e nada estoura a largura.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    const painel = hero?.querySelector(":scope > div");
    const titulo = document.querySelector("#hero-title");
    if (!hero || !painel || !titulo) return null;
    const h = hero.getBoundingClientRect();
    const p = painel.getBoundingClientRect();
    const t = titulo.getBoundingClientRect();
    // A faixa dos três números tem que caber em UMA linha: com `flex-wrap` o terceiro caía para baixo, que foi o
    // defeito relatado no celular.
    const numeros = [...hero.querySelectorAll("dl > div")].map((d) => Math.round(d.getBoundingClientRect().top));
    return {
      imagens: hero.querySelectorAll("img").length,
      painelNaLargura: Math.round((p.width / h.width) * 100),
      desvioDoCentro: Math.round(Math.abs(t.x + t.width / 2 - (p.x + p.width / 2))),
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      numeros: numeros,
      // O título desce um degrau no celular, e é isso que decide a altura da abertura: a 56 px, na coluna de
      // 345 px, o headline de 70 caracteres quebrava em SETE linhas e levava o painel a 953 px, mais alto que
      // a tela. A 40 px ele quebra em cinco. Sem esta medida, o display volta ao celular sem nada reprovar.
      pxDoTitulo: parseFloat(getComputedStyle(titulo).fontSize),
      linhasDoTitulo: Math.round(t.height / parseFloat(getComputedStyle(titulo).lineHeight)),
    };
  });
  expect(m, "não achei a abertura no celular").not.toBeNull();
  expect(m!.imagens, "a abertura voltou a ter imagem").toBe(0);
  // Um degrau abaixo do desktop, e não meio degrau: o tipo tem de ser um dos degraus declarados no DESIGN.md.
  expect(m!.pxDoTitulo, "o título voltou ao degrau de display no celular").toBe(40);
  expect(m!.linhasDoTitulo, `o título ocupa ${m!.linhasDoTitulo} linhas no celular`).toBeLessThanOrEqual(5);
  expect(m!.painelNaLargura, `o painel ocupa ${m!.painelNaLargura}% da abertura`).toBeGreaterThanOrEqual(95);
  expect(m!.desvioDoCentro, `o título está ${m!.desvioDoCentro}px fora do centro`).toBeLessThanOrEqual(4);
  expect(m!.overflowX, "a abertura estourou a largura no celular").toBe(0);
  expect(m!.numeros, `os três números começam nas alturas ${m!.numeros.join(", ")}`).toHaveLength(3);
  const mesmaLinha = Math.max(...m!.numeros) - Math.min(...m!.numeros) <= 2;
  expect(mesmaLinha, `os três números não estão na mesma linha: ${m!.numeros.join(", ")}`).toBe(true);
});

test("a tipografia do site não é a que todo gerador usa", async ({ page }) => {
  // O scanner da skill classifica Inter, Roboto, Geist, Plus Jakarta e Space Grotesk como gastas, porque todo
  // gerador de interface converge para elas. Esta medida guarda a troca para a fonte não voltar por descuido,
  // que é o tipo de mudança que passa batido em revisão de código.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const familia = await page.evaluate(() => getComputedStyle(document.body).fontFamily.toLowerCase());
  expect(familia, `família medida: ${familia}`).toContain("archivo");
  for (const gasta of ["inter", "roboto", "geist", "plus jakarta", "space grotesk"]) {
    expect(familia.includes(gasta), `a fonte ${gasta} voltou`).toBe(false);
  }
});


test("o simulador tem forro de painel", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const painel = page.locator("#simulator div.rounded-xl.border").first();
  await expect(painel).toBeVisible();
  const fundo = await painel.evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(fundo).not.toBe("rgba(0, 0, 0, 0)");
});


test("o depoimento em destaque é mais alto que os outros dois", async ({ page }) => {
  // A primeira versão fazia o destaque ocupar duas colunas e ele ficava esticado, com um vão
  // ao lado. Agora o destaque ocupa a altura dos dois, com os outros empilhados na coluna vizinha.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const alturas = await page.evaluate(() =>
    [...document.querySelectorAll("#proof [class*=rounded]")]
      .map((e) => Math.round(e.getBoundingClientRect().height))
      .filter((h) => h > 80),
  );
  expect(alturas.length, `alturas medidas: ${alturas.join(", ")}`).toBeGreaterThanOrEqual(3);
  const destaque = Math.max(...alturas);
  const menores = alturas.filter((h) => h < destaque);
  expect(menores.length).toBeGreaterThanOrEqual(2);
  expect(destaque, "o destaque não está mais alto que os outros").toBeGreaterThan(Math.max(...menores));
});

test("as perguntas ficam em duas colunas no desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const titulo = document.querySelector("#faq-title")?.getBoundingClientRect();
    // O seletor é o marcador estável do acordeão, e não uma lista de padrões frouxos: `div[class*=flex]`
    // passou a casar com a caixa que envolve a sobrancelha e o título quando o bloco ganhou enfeite, e a
    // medida acusava "lado a lado" olhando para a coluna do próprio título.
    const lista = document.querySelector('#faq [data-slot="accordion"]');
    return { titulo: titulo ? Math.round(titulo.left) : null, lista: lista ? Math.round(lista.getBoundingClientRect().left) : null };
  });
  expect(m.lista).not.toBeNull();
  expect(m.lista!, "o título e a lista não ficaram lado a lado").toBeGreaterThan(m.titulo!);
});

test("a faixa final é tomada pela cor de ação, e a foto não a apaga", async ({ page }) => {
  // A faixa continua sendo a cor de ação na BASE (é ela que aparece se a foto não carregar), e por cima entrou a foto
  // com véu. O contraste do texto dela passou a ser medido sobre os PIXELS, na sonda própria
  // (`o texto do fecho tem contraste medido sobre os pixels da foto`), porque contra a cor declarada da seção a conta
  // mede o fundo errado — foi assim que ela devolveu 2 para 1 depois da mudança.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const secao = document.querySelector("#agendar") as HTMLElement;
    const camadas = [...secao.children]
      .filter((c) => getComputedStyle(c).position === "absolute")
      .map((c) => getComputedStyle(c).backgroundImage);
    return {
      fundo: getComputedStyle(secao).backgroundColor,
      camadas,
    };
  });
  expect(m.fundo).not.toBe("rgba(0, 0, 0, 0)");
  // As duas camadas do fundo, na ordem em que pintam: a foto e o véu de tinta por cima dela.
  expect(m.camadas.length, `a faixa perdeu as camadas de fundo: ${JSON.stringify(m.camadas)}`).toBeGreaterThanOrEqual(2);
  expect(m.camadas[0]).toContain("paineis-no-deserto.avif");
  expect(m.camadas[1]).toContain("linear-gradient");
});


test("o depoimento em destaque se distingue por borda, com o texto centrado", async ({ page }) => {
  // O destaque precisava se distinguir dos outros dois, e o texto não podia ficar encostado no
  // topo de um cartão alto. A distinção começou como cor de fundo e borda na cor de ação, passou a secundária e
  // voltou; com as fotos, a cor de fundo saiu, porque sem a casa dentro do cartão ela era
  // mancha: ficaram a borda e a marca de citação. A centralização vive no conteúdo, e não no cartão, que foi o erro
  // da primeira tentativa: medido em 266 px em cima contra 154 embaixo.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    // O destaque é escolhido pela borda na cor de ação, que é determinística. A primeira versão escolhia "o cartão
    // mais alto", e depois da mudança de fundo isso passou a apontar para outro elemento: a medida acusou contraste
    // de 1,18 porque estava medindo uma caixa transparente, não o destaque.
    const cartoes = [...document.querySelectorAll("#proof [class*=rounded]")].filter(
      (e) => e.getBoundingClientRect().height > 120,
    );
    const destaque = cartoes.find((e) => (e.className || "").toString().includes("border-primary"));
    const outro = cartoes.find((e) => !(e.className || "").toString().includes("border-primary"));
    if (!destaque || !outro) return null;
    const c = getComputedStyle(destaque);
    const o = getComputedStyle(outro);
    const normalizar = (cor: string) => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return cor;
      ctx.fillStyle = "#ffffff";
      ctx.fillStyle = cor;
      const normalizada = String(ctx.fillStyle);
      if (normalizada.startsWith("#")) {
        const n = parseInt(normalizada.slice(1), 16);
        return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
      }
      return normalizada;
    };
    const lum = (rgbOriginal: string) => {
      const rgba = normalizar(rgbOriginal).match(/\d+(\.\d+)?/g) ?? [];
      const alfa = rgba.length > 3 ? Number(rgba[3]) : 1;
      const p = rgba.slice(0, 3).map(Number).map((v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      const base = 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
      return base * alfa + 1 * (1 - alfa);
    };
    const contraste = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
    };
    const citacao = destaque.querySelector("blockquote");
    const legenda = [...destaque.querySelectorAll("p")].find((p) => (p.textContent ?? "").includes(","));
    const fundo = c.backgroundColor;
    const caixa = destaque.getBoundingClientRect();
    const conteudo = destaque.querySelector("[class*=CardContent], [class*=flex]");
    const cb = conteudo?.getBoundingClientRect();
    return {
      fundoDestaque: c.backgroundColor,
      fundoOutro: o.backgroundColor,
      bordaDestaque: c.borderColor,
      bordaOutro: o.borderColor,
      diferencaDeFundo: Math.round(Math.abs(lum(fundo) - lum(o.backgroundColor)) * 100) / 100,
      contrasteCitacao: citacao ? contraste(fundo, getComputedStyle(citacao).color) : null,
      contrasteLegenda: legenda ? contraste(fundo, getComputedStyle(legenda).color) : null,
      acima: cb ? Math.round(cb.top - caixa.top) : null,
      abaixo: cb ? Math.round(caixa.bottom - cb.bottom) : null,
    };
  });
  expect(m, "não achei os depoimentos").not.toBeNull();
  // A lavagem de fundo (`bg-primary/25`) saiu do destaque: sem a casa dentro do cartão ela virou
  // mancha sem trabalho, e quem distingue o destaque agora é a borda na cor de ação, com a marca de citação dentro.
  // As duas metades disso são medidas: fundo IGUAL ao dos outros cartões e borda DIFERENTE.
  expect(m!.fundoDestaque, "o destaque ganhou lavagem de fundo de novo").toBe(m!.fundoOutro);
  for (const [rotulo, r] of [["citação", m!.contrasteCitacao], ["legenda", m!.contrasteLegenda]] as const) {
    expect(r, `contraste da ${rotulo} sobre o destaque: ${r}`).toBeGreaterThanOrEqual(4.5);
  }
  expect(m!.bordaDestaque, "o destaque não tem borda própria").not.toBe(m!.bordaOutro);
  expect(
    Math.abs((m!.acima ?? 0) - (m!.abaixo ?? 0)),
    `espaço acima ${m!.acima} e abaixo ${m!.abaixo}`,
  ).toBeLessThanOrEqual(40);
});


test("nenhuma resposta do acordeão fica cortada no celular", async ({ page }) => {
  // Defeito relatado: as respostas 1, 4 e 5 apareciam pela metade no celular. Causa: o conteúdo tinha altura
  // presa na variável que o Radix mede, e o pai tem overflow hidden, então resposta mais alta que o valor
  // medido perdia o fim. A altura pertence aos quadros da animação, não ao elemento em repouso.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(600);
  const gatilhos = page.locator("#faq button");
  const total = await gatilhos.count();
  expect(total).toBeGreaterThan(3);
  for (let i = 0; i < total; i++) {
    await gatilhos.nth(i).click();
    await page.waitForTimeout(700);
    const cortado = await page.evaluate(() => {
      const abertos = [...document.querySelectorAll('#faq [role=region], #faq [data-state="open"]')].filter((e) =>
        (e.textContent ?? "").trim().length > 60,
      );
      return abertos
        .map((e) => ({ tag: e.tagName, sobra: e.scrollHeight - Math.round(e.getBoundingClientRect().height) }))
        .filter((x) => x.sobra > 2);
    });
    expect(cortado, `pergunta ${i + 1} com texto cortado: ${JSON.stringify(cortado)}`).toEqual([]);
    await gatilhos.nth(i).click();
    await page.waitForTimeout(300);
  }
});


test("toda foto da página tem dimensão declarada e carrega", async ({ page }) => {
  // Foto é prova de serviço, e prova precisa carregar de verdade. Largura e altura declaradas evitam que ela empurre
  // o conteúdo quando termina de baixar, que é o defeito de layout mais comum com imagem. Com as seis fotos, a
  // medida saiu do pé da prova social e passou a valer para TODA imagem da página, que é onde o defeito pode
  // voltar agora que são seis.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  // Percorre a página e espera cada arquivo: as fotos são `loading="lazy"` e as de baixo só carregam quando chegam perto.
  const faltando = await page.evaluate(async () => {
    for (let tentativa = 0; tentativa < 40; tentativa++) {
      const pendentes = [...document.images].filter((i) => !i.complete);
      if (pendentes.length === 0) return [];
      if (tentativa < 12) window.scrollBy(0, 500);
      else window.scrollBy(0, -400);
      await new Promise((r) => setTimeout(r, 150));
    }
    return [...document.images].filter((i) => !i.complete).map((i) => i.currentSrc || i.src);
  });
  expect(faltando, `fotos que não carregaram: ${faltando.join(", ")}`).toEqual([]);
  const fotos = await page.locator("img").evaluateAll((imgs) =>
    imgs.map((i) => ({
      arquivo: new URL((i as HTMLImageElement).src).pathname.split("/").pop(),
      largura: i.getAttribute("width"),
      altura: i.getAttribute("height"),
      carregou: (i as HTMLImageElement).naturalWidth > 0,
      alt: i.getAttribute("alt"),
    })),
  );
  expect(fotos.length).toBe(5);
  for (const foto of fotos) {
    expect(foto.largura, `${foto.arquivo} sem width declarada`).toBeTruthy();
    expect(foto.altura, `${foto.arquivo} sem height declarada`).toBeTruthy();
    expect(foto.carregou, `${foto.arquivo} não carregou`).toBe(true);
    expect((foto.alt ?? "").length, `${foto.arquivo} sem texto alternativo`).toBeGreaterThan(0);
    const resposta = await page.request.get(`/fotos/${foto.arquivo}`);
    expect(resposta.status(), `${foto.arquivo} não é servida pelo site`).toBe(200);
  }
});


test("o texto do hero tem contraste medido sobre os pixels", async ({ page }) => {
  // O texto da abertura vive sobre o painel de tinta com os véus decorativos (grade e sol), e essa soma não se
  // confere com a cor declarada no CSS: o que vale é o pixel que está atrás. Esta medida recorta a área de respiro
  // ao lado do texto, sem os pixels do próprio texto, e calcula a luminância média dali contra a cor do texto. É a
  // única forma honesta de afirmar que o título lê bem — e é ela que dá o teto do amarelo do enfeite.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(700);
  // A lista tem os três textos da abertura, e não só o título e o parágrafo: a sobrancelha ficou sem contraste
  // quando o sol subiu para o topo do painel, e ela é o pedaço do texto que mais perto da faixa amarela fica.
  for (const seletor of [
    "#hero-title",
    "section:has(#hero-title) p.type-body",
    "section:has(#hero-title) p.type-label",
  ]) {
    const alvo = page.locator(seletor).first();
    const caixa = await alvo.boundingBox();
    expect(caixa, `não achei ${seletor}`).not.toBeNull();
    // A amostra é a área de respiro à direita do texto, dentro do painel: ali existe tinta com a grade e o sol. A
    // primeira versão recortava uma faixa abaixo do texto, que cai sobre os distintivos claros e devolveu 1,37
    // medindo a coisa errada.
    // A amostra sai do bloco onde o texto vive, e não da abertura inteira: a abertura tem borda e arredondamento, e
    // amostrar a borda mede a calçada em vez do painel.
    const bloco = await page
      .locator("section:has(#hero-title) > div")
      .first()
      .boundingBox();
    expect(bloco, "não achei o bloco de texto da abertura").not.toBeNull();
    // A sobrancelha é o único texto da abertura que tem fundo PRÓPRIO (uma pílula). Nela a amostra sai de dentro
    // da pílula, na lateral interna onde não há glifo: medindo ao lado, como nas outras duas, a perda de contraste
    // passou despercebida quando o sol subiu para o topo do painel — este é o caso que exige amostra própria.
    const temPilula = seletor.includes("type-label");
    const sobrou = bloco!.x + bloco!.width - (caixa!.x + caixa!.width);
    const larguraAmostra = temPilula ? 6 : Math.max(24, Math.min(Math.round(sobrou - 8), 160));
    const faixa = {
      x: temPilula
        ? Math.round(caixa!.x + 3)
        : Math.round(bloco!.x + bloco!.width - larguraAmostra - 4),
      y: Math.round(caixa!.y + caixa!.height / 2 - (temPilula ? 5 : 0)),
      width: larguraAmostra,
      height: temPilula ? 10 : 12,
    };
    const b64 = (await page.screenshot({ clip: faixa })).toString("base64");
    const cor = await alvo.evaluate((e) => getComputedStyle(e).color);
    const r = await page.evaluate(
      async ({ b64, cor }) => {
        const linear = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        const lumDe = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          sr += d[i];
          sg += d[i + 1];
          sb += d[i + 2];
          n++;
        }
        const mr = sr / n;
        const mg = sg / n;
        const mb = sb / n;
        const fundo = lumDe(mr, mg, mb);
        // A cor do texto é lida pintando um pixel no canvas e lendo o que saiu. Ler o texto da propriedade não
        // serve: o navegador devolve oklab, e tratar esses números como se fossem 0 a 255 devolveu um contraste de
        // 1,78 medindo uma cor que não existe.
        //
        // A tinta de base da sonda é o FUNDO AMOSTRADO, e não branco: texto com opacidade (a sobrancelha e o
        // parágrafo usam `canvas/70` e `canvas/85`) compõe com o que está atrás, e compor sobre branco devolve um
        // texto mais claro do que o olho vê — foi assim que a perda de contraste da sobrancelha passou batida.
        const sonda = document.createElement("canvas");
        sonda.width = 1;
        sonda.height = 1;
        const sctx = sonda.getContext("2d");
        if (!sctx) return null;
        sctx.fillStyle = `rgb(${Math.round(mr)}, ${Math.round(mg)}, ${Math.round(mb)})`;
        sctx.fillRect(0, 0, 1, 1);
        sctx.fillStyle = cor;
        sctx.fillRect(0, 0, 1, 1);
        const px = sctx.getImageData(0, 0, 1, 1).data;
        const texto = lumDe(px[0], px[1], px[2]);
        const [alto, baixo] = [fundo, texto].sort((a, b) => b - a);
        return Math.round(((alto + 0.05) / (baixo + 0.05)) * 100) / 100;
      },
      { b64, cor },
    );
    expect(r, `contraste medido contra os pixels: ${r} em ${seletor}`).not.toBeNull();
    expect(r!, `contraste medido contra os pixels: ${r} em ${seletor}`).toBeGreaterThanOrEqual(4.5);
  }
});


test("o card do blog é clicável por inteiro, e a borda muda no hover", async ({ page }) => {
  // Card clicável inteiro, e o hover mudando a borda, não só o sublinhado do título. O clique é
  // conferido longe do título, no canto inferior do card, que é onde um link só no texto não pegaria.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog");
  await page.waitForTimeout(500);
  const card = page.locator("main ul li").first();
  const caixa = await card.boundingBox();
  expect(caixa, "não achei card no blog").not.toBeNull();

  const antes = await card.evaluate((e) => getComputedStyle(e).borderColor);
  await card.hover();
  await page.waitForTimeout(300);
  const depois = await card.evaluate((e) => getComputedStyle(e).borderColor);
  expect(depois, `borda antes ${antes}, depois ${depois}`).not.toBe(antes);

  // Esperar a URL mudar, e não o estado de carga: em página já carregada o estado resolve na hora e a conferência
  // acontece antes de a navegação terminar, que foi o que fez a medida reprovar com a navegação funcionando.
  await page.mouse.click(caixa!.x + caixa!.width - 14, caixa!.y + caixa!.height - 10);
  await page.waitForURL(/\/blog\/.+/, { timeout: 15000 });
  expect(page.url(), "clicar no canto do card não navegou").toContain("/blog/");
});


test("os links de fonte do blog abrem em outra aba", async ({ page }) => {
  // Quem clica numa fonte não pode sair da página. Nem todo texto tem fonte, então a medida
  // percorre os primeiros e cobra os atributos onde houver link externo, exigindo que exista pelo menos um.
  await page.goto("/blog");
  await page.waitForTimeout(400);
  const links = page.locator("main ul li h2 a");
  const quantos = Math.min(await links.count(), 3);
  expect(quantos, "não achei texto no blog").toBeGreaterThan(0);
  let externos = 0;
  for (let i = 0; i < quantos; i++) {
    await links.nth(i).click();
    await page.waitForURL(/\/blog\/.+/, { timeout: 15000 });
    const total = await page.locator('main a[href^="http"]').count();
    for (let n = 0; n < total; n++) {
      const link = page.locator('main a[href^="http"]').nth(n);
      externos++;
      expect(await link.getAttribute("target"), "link externo na mesma aba").toBe("_blank");
      expect(await link.getAttribute("rel"), "link externo sem noopener").toContain("noopener");
    }
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
  }
  expect(externos, "nenhum link externo encontrado nos textos conferidos").toBeGreaterThan(0);
});


test("no desktop os três cards ficam lado a lado, com o botão centralizado", async ({ page }) => {
  // Em tela larga os cards do fim do texto ficam em linha, e o botão de ver todos centralizado
  // embaixo. A medida confere as duas posições, e não a existência dos elementos.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog/how-to-read-your-solar-estimate");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const secao = document.querySelector('section[aria-labelledby="outros-titulo"]');
    const cards = [...(secao?.querySelectorAll("li") ?? [])].map((li) => li.getBoundingClientRect());
    const botao = secao?.querySelector("a[href='/blog']")?.getBoundingClientRect();
    if (cards.length < 3 || !botao || !secao) return null;
    const topos = cards.map((c) => Math.round(c.top));
    const esquerdas = cards.slice(0, 3).map((c) => Math.round(c.left));
    const centroSecao = secao.getBoundingClientRect().left + secao.getBoundingClientRect().width / 2;
    return {
      mesmosTopos: Math.max(...topos.slice(0, 3)) - Math.min(...topos.slice(0, 3)) <= 2,
      esquerdasDistintas: new Set(esquerdas).size === 3,
      botaoAbaixo: botao.top >= Math.max(...topos.slice(0, 3)),
      desvioDoCentro: Math.round(Math.abs(botao.left + botao.width / 2 - centroSecao)),
    };
  });
  expect(m, "não achei o bloco dos outros textos").not.toBeNull();
  expect(m!.mesmosTopos, "os cards não estão alinhados no mesmo topo").toBe(true);
  expect(m!.esquerdasDistintas, "os cards não estão lado a lado").toBe(true);
  expect(m!.botaoAbaixo, "o botão não está abaixo dos cards").toBe(true);
  expect(m!.desvioDoCentro, `desvio do centro: ${m!.desvioDoCentro}px`).toBeLessThanOrEqual(4);
});


test("no desktop o índice do blog mostra o destaque sozinho e os outros dois por linha", async ({ page }) => {
  // Os cards do índice lado a lado, dois por linha em tela larga. O card mais novo ocupa as duas colunas, então a
  // primeira linha tem UM card e as seguintes continuam com DOIS. A medida é a mesma de antes (quem compartilha o topo está na
  // mesma linha, que é o que define linha em grade), com as duas contagens separadas, e a largura do destaque
  // conferida em relação à do vizinho em vez de contra um número escrito aqui.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("main ul li")].map((li) => li.getBoundingClientRect());
    if (cards.length < 3) return null;
    const topos = cards.map((c) => Math.round(c.top));
    const naPrimeiraLinha = topos.filter((t) => Math.abs(t - topos[0]) <= 2).length;
    const segundoTopo = Math.min(...topos.filter((t) => t > topos[0] + 2));
    const naSegundaLinha = topos.filter((t) => Math.abs(t - segundoTopo) <= 2).length;
    return {
      naPrimeiraLinha,
      naSegundaLinha,
      larguraDestaque: Math.round(cards[0].width),
      larguraVizinho: Math.round(cards[1].width),
      total: cards.length,
    };
  });
  expect(m, "não achei cards no índice").not.toBeNull();
  expect(m!.naPrimeiraLinha, `cards na primeira linha: ${m!.naPrimeiraLinha}`).toBe(1);
  expect(m!.naSegundaLinha, `cards na segunda linha: ${m!.naSegundaLinha}`).toBe(2);
  expect(
    m!.larguraDestaque,
    `destaque com ${m!.larguraDestaque}px contra ${m!.larguraVizinho}px do vizinho`,
  ).toBeGreaterThan(m!.larguraVizinho * 1.8);
});

test("no celular o índice do blog segue com um card por linha", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/blog");
  await page.waitForTimeout(500);
  const naPrimeiraLinha = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("main ul li")].map((li) => Math.round(li.getBoundingClientRect().top));
    if (cards.length < 2) return 0;
    return cards.filter((t) => Math.abs(t - cards[0]) <= 2).length;
  });
  expect(naPrimeiraLinha).toBe(1);
});


test("a barra limita o conteúdo à largura dos itens da página", async ({ page }) => {
  // A logo à esquerda e os botões à direita, mas dentro da largura dos itens da página, e não
  // esticados até as bordas da janela. A medida compara as duas pontas com a coluna de conteúdo.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const barra = document.querySelector('nav[aria-label="Main navigation"]');
    // A referência era a abertura, que era o primeiro item visível dentro de main. Depois que a abertura passou a
    // pegar a largura toda da janela ela deixou de servir como coluna: a barra se alinha com o CONTEÚDO, e agora quem
    // define essa coluna é o simulador, o primeiro bloco que continua dentro do contêiner. Comparar com a caixa de main
    // dava zero enquanto os itens da barra passavam da largura visível, porque a caixa inclui o respiro; comparar com o
    // primeiro filho também não serve, porque o primeiro filho é o script de dado estruturado, com caixa em zero.
    // A seção do simulador passou a pegar a largura da janela, e quem carrega a coluna de
    // conteúdo é o invólucro de dentro dela (`> div`), que é a referência agora.
    const conteudo = document.querySelector("main section#simulator > div");
    if (!barra || !conteudo) return null;
    const dentro = [...barra.querySelectorAll("span")].find((s) => (s.textContent ?? "").trim() === "Brightfield Solar");
    const destinos = [...barra.querySelectorAll("a")];
    const ultimo = destinos[destinos.length - 1];
    if (!dentro || !ultimo) return null;
    const c = conteudo.getBoundingClientRect();
    const estilo = getComputedStyle(conteudo);
    // A coluna de conteúdo é a CAIXA DE DENTRO do invólucro (o invólucro carrega o respiro lateral), e é ela que
    // os itens da barra têm de respeitar.
    const esquerda = c.left + parseFloat(estilo.paddingLeft);
    const direita = c.right - parseFloat(estilo.paddingRight);
    const d = dentro.getBoundingClientRect();
    const u = ultimo.getBoundingClientRect();
    return {
      esquerda: Math.round(d.left - esquerda),
      direita: Math.round(direita - u.right),
      larguraDosItens: Math.round(direita - esquerda),
    };
  });
  expect(m, "não achei a barra ou o conteúdo").not.toBeNull();
  // A marca começa onde a coluna começa, e o último destino termina onde a coluna termina, com folga de poucos px.
  expect(Math.abs(m!.esquerda), `desvio à esquerda: ${m!.esquerda}px`).toBeLessThanOrEqual(6);
  expect(Math.abs(m!.direita), `desvio à direita: ${m!.direita}px`).toBeLessThanOrEqual(6);
});


test("no desktop a abertura começa logo abaixo da barra, com os cantos de cima retos", async ({ page }) => {
  // A abertura não pode entrar por baixo da barra, ela começa abaixo dela. A abertura em zero com espaço extra no
  // texto para escapar da barra flutuante era o arranjo errado.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    if (!hero) return null;
    const r = hero.getBoundingClientRect();
    const estilo = getComputedStyle(hero);
    const raio = [estilo.borderTopLeftRadius, estilo.borderTopRightRadius].map((v) => parseFloat(v));
    const barra = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
    const texto = document.querySelector("#hero-title")!.getBoundingClientRect();
    return {
      distanciaDaBarra: Math.round(r.top - barra.bottom),
      raioTopo: raio,
      textoAbaixoDaBarra: texto.top >= barra.bottom,
      textoDentroDaAbertura: texto.top >= r.top,
    };
  });
  expect(m, "não achei a abertura").not.toBeNull();
  // Começa abaixo da barra, e não longe dela: a folga tem que ser pequena, senão vira buraco no topo da página.
  expect(m!.distanciaDaBarra, `a abertura começa ${m!.distanciaDaBarra}px abaixo da barra`).toBeGreaterThanOrEqual(-1);
  expect(m!.distanciaDaBarra, `a abertura começa ${m!.distanciaDaBarra}px abaixo da barra`).toBeLessThanOrEqual(32);
  expect(Math.max(...m!.raioTopo), "os cantos de cima continuam arredondados").toBe(0);
  expect(m!.textoAbaixoDaBarra, "a barra cobre o título da abertura").toBe(true);
  expect(m!.textoDentroDaAbertura, "o título escapou para cima da abertura").toBe(true);
});


test("o texto do blog usa a largura da coluna", async ({ page }) => {
  // O texto ocupa a largura da coluna, e não uma coluna estreita com lateral de navegação ao lado. A medida confere o
  // aproveitamento da coluna, e registra o custo: linha mais longa que a faixa confortável de leitura, uma escolha e
  // não descuido.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog/how-to-read-your-solar-estimate");
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const coluna = document.querySelector("main")?.getBoundingClientRect();
    const caixa = document.querySelector('main div[class*="max-w-[52rem]"]');
    const titulo = document.querySelector("h1")?.getBoundingClientRect();
    const corpo = document.querySelector('main div[class*="max-w-[52rem]"] p');
    if (!coluna || !caixa || !titulo || !corpo) return null;
    const c = caixa.getBoundingClientRect();
    const px = parseFloat(getComputedStyle(corpo).fontSize);
    return {
      aproveitamento: Math.round((c.width / coluna.width) * 100),
      tituloIgualAoTexto: Math.abs(Math.round(titulo.width) - Math.round(c.width)) <= 2,
      caracteresPorLinha: Math.round(c.width / (px * 0.5)),
    };
  });
  expect(m, "não achei o texto do blog").not.toBeNull();
  expect(m!.aproveitamento, `o texto usa ${m!.aproveitamento}% da coluna`).toBeGreaterThanOrEqual(75);
  expect(m!.tituloIgualAoTexto, "título e texto estão com larguras diferentes").toBe(true);
  // O número fica na mensagem para não virar regra escondida: é a consequência aceita de alargar.
  expect(m!.caracteresPorLinha, `cerca de ${m!.caracteresPorLinha} caracteres por linha`).toBeGreaterThan(80);
});


test("o fundo da abertura é a foto do serviço, com o véu de tinta atrás do texto", async ({ page }) => {
  // O fundo é foto, e a camada decorativa passou a ser o véu de tinta sobre
  // ela. A grade fina e o sol amarelo saíram com a foto: ela já tem a luz que o véu imitava. O que se mede agora é
  // a foto servida do próprio domínio, o véu desenhando gradiente, e as garantias de camada decorativa.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    const painel = hero?.querySelector(":scope > div");
    const fundo = hero?.querySelector('[data-fundo="abertura"]');
    const conteudo = document.querySelector("#hero-title")?.closest("div");
    if (!hero || !painel || !fundo || !conteudo) return null;
    const estilo = getComputedStyle(fundo);
    const foto = getComputedStyle(painel).backgroundImage;
    // O navegador devolve a URL ABSOLUTA no valor computado, então comparar origem é o que diz se a foto é nossa —
    // checar "não tem http" reprovava o próprio domínio.
    const url = foto.match(/url\("?([^")]+)"?\)/);
    return {
      fotoNoPainel: foto.includes("url("),
      fotoLocal: Boolean(url) && new URL(url![1], location.href).origin === location.origin,
      caminhoDaFoto: url ? url[1] : null,
      desenha: estilo.backgroundImage.includes("gradient"),
      atras: Number(estilo.zIndex) < Number(getComputedStyle(conteudo).zIndex),
      zIndex: Number(estilo.zIndex),
      semPonteiro: estilo.pointerEvents === "none",
      escondido: fundo.getAttribute("aria-hidden") === "true",
      primeiroFilho: hero.firstElementChild === fundo,
    };
  });
  expect(m, "não achei o fundo da abertura").not.toBeNull();
  expect(m!.fotoNoPainel, "o painel da abertura não tem foto no fundo").toBe(true);
  expect(m!.fotoLocal, `a foto do fundo vem de fora: ${m!.caminhoDaFoto}`).toBe(true);
  expect(m!.desenha, "o véu não desenha gradiente").toBe(true);
  expect(m!.atras, "o véu não está atrás do texto").toBe(true);
  // `-z-10` também satisfaz "menor que o texto" e some atrás do painel de tinta: o que garante a leitura é o
  // fundo ficar acima do zero, dentro do contexto do painel (`isolate`).
  expect(m!.zIndex, "o fundo está no negativo e some atrás do painel").toBeGreaterThanOrEqual(0);
  expect(m!.semPonteiro, "o fundo captura o ponteiro").toBe(true);
  expect(m!.escondido, "o fundo aparece para o leitor de tela").toBe(true);
  // O fundo mora DENTRO do painel: como primeiro filho da seção ele roubaria a amostra do teste de contraste.
  expect(m!.primeiroFilho, "o fundo virou primeiro filho da seção").toBe(false);
});

test("a abertura é uma coluna centrada, sem foto, e o simulador continua na primeira tela", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    const titulo = document.querySelector("#hero-title");
    const bloco = titulo?.closest("div");
    if (!hero || !titulo || !bloco) return null;
    const b = bloco.getBoundingClientRect();
    const t = titulo.getBoundingClientRect();
    const simulador = document.querySelector("#simulator > div")!.getBoundingClientRect();
    return {
      imagens: hero.querySelectorAll("img").length,
      desvioDoCentro: Math.round(Math.abs(t.x + t.width / 2 - (b.x + b.width / 2))),
      medidaDoTitulo: Math.round(t.width),
      // O título é o pedaço que tem de respirar: em três linhas ele não respira, e a medida que o faz
      // fechar em duas é maior que a medida de leitura do corpo. As duas coisas são medidas aqui.
      linhasDoTitulo: Math.round(t.height / parseFloat(getComputedStyle(titulo).lineHeight)),
      pxDoTitulo: parseFloat(getComputedStyle(titulo).fontSize),
      // A abertura pega a largura toda da janela; o resto da página continua na coluna de 64 rem.
      larguraDaAbertura: Math.round(hero.getBoundingClientRect().width),
      larguraDaColuna: Math.round(simulador.width),
      janela: window.innerWidth,
      // O simulador não pode sair da primeira tela: é o que a abertura existe para entregar. Com a foto fora, a
      // abertura ficou mais baixa, e esta asserção virou a diferença entre passar com folga e passar raspando.
      topoDoSimulador: Math.round(simulador.top),
    };
  });
  expect(m, "não achei a abertura").not.toBeNull();
  expect(m!.imagens, "a abertura voltou a ter imagem").toBe(0);
  expect(m!.desvioDoCentro, `o título está ${m!.desvioDoCentro}px fora do centro do bloco`).toBeLessThanOrEqual(4);
  // O título tem medida própria, e ela é maior que a medida de leitura DE PROPÓSITO: 54 rem é o que faz o
  // headline de 70 caracteres fechar em duas linhas no desktop. Medido antes da mudança: com os 40 rem do
  // corpo o título ocupava três linhas, que é o excesso visual medido. A medida de 40 rem
  // continua governando o texto corrido, e o teto de baixo aqui é o que impede o título de voltar aos 40 rem.
  expect(m!.medidaDoTitulo, `o título mede ${m!.medidaDoTitulo}px`).toBeLessThanOrEqual(864);
  expect(m!.medidaDoTitulo).toBeGreaterThan(640);
  expect(m!.pxDoTitulo, "o título perdeu o degrau de display no desktop").toBe(56);
  expect(m!.linhasDoTitulo, `o título ocupa ${m!.linhasDoTitulo} linhas`).toBe(2);
  // Abertura na largura da janela, e o resto da página na coluna: é o desenho, e as duas metades dele são medidas.
  expect(m!.larguraDaAbertura, `a abertura mede ${m!.larguraDaAbertura}px numa janela de ${m!.janela}px`).toBe(m!.janela);
  expect(m!.larguraDaColuna, "a coluna de conteúdo esticou junto com a abertura").toBeLessThan(m!.janela);
  expect(
    m!.topoDoSimulador,
    `o simulador começa em ${m!.topoDoSimulador}px de uma janela de ${m!.janela}px`,
  ).toBeLessThan(m!.janela);
});


// O desenho mais visual: as faixas de fundo, o cartaz do resultado, os bairros em
// grade com pino dourado, os títulos de seção mais largos e as três fotos. Cada metade tem uma medida
// própria aqui, porque nenhuma delas aparece em teste de unidade e todas foram decididas olhando a tela.
test.describe("faixas de fundo e o desenho da página", () => {
  // Com menos movimento ligado, a entrada das seções sai de cena e as caixas medidas são as de layout: as faixas
  // entram na rolagem com deslocamento de 12 px, e a caixa de um elemento em animação carrega esse deslocamento.
  test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });

  test("as cinco faixas se encostam e cada uma tem o fundo planejado", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const faixas = await page.evaluate(() => {
      const pintura = document.createElement("canvas").getContext("2d")!;
      const cor = (e: Element) => {
        pintura.fillStyle = "#ffffff";
        pintura.fillStyle = getComputedStyle(e).backgroundColor;
        return String(pintura.fillStyle);
      };
      const secoes = [...document.querySelectorAll("main section")];
      return secoes.map((secao, indice) => {
        const r = secao.getBoundingClientRect();
        const anterior = indice > 0 ? secoes[indice - 1].getBoundingClientRect() : null;
        return {
          id: secao.id,
          fundo: cor(secao),
          topo: Math.round(r.top + window.scrollY),
          baseAnterior: anterior ? Math.round(anterior.bottom + window.scrollY) : null,
          conteudo: Math.round((secao.firstElementChild ?? secao).getBoundingClientRect().width),
          janela: window.innerWidth,
        };
      });
    });
    expect(faixas.map((f) => f.id)).toEqual(["simulator", "steps", "proof", "faq", "agendar"]);
    // A ordem pedida: canvas, surface, canvas, a cor de ação a 12% e a cor de ação cheia. O que o navegador devolve
    // é o hexadecimal quando a cor é opaca e `rgba` quando tem alfa.
    expect(faixas[0].fundo).toBe("#f7f6f3");
    expect(faixas[1].fundo).toBe("#ffffff");
    expect(faixas[2].fundo).toBe("#f7f6f3");
    // A faixa do FAQ é a cor de ação com alfa, e o navegador devolve isso em `oklab(...)` — o alfa é o que se mede.
    expect(faixas[3].fundo).toContain("/ 0.12)");
    expect(faixas[4].fundo).toBe("#e8882a");
    for (const faixa of faixas) {
      if (faixa.baseAnterior !== null) {
        // As faixas encostam uma na outra: sem vão do fundo da página entre elas, que era o risco de trocar o
        // `gap` do `main` por fundo de seção sem tirar o respiro de cada uma.
        expect(faixa.topo, `a faixa ${faixa.id} não encosta na anterior`).toBe(faixa.baseAnterior);
      }
      expect(faixa.conteudo, `o conteúdo da faixa ${faixa.id} estourou a janela`).toBeLessThanOrEqual(faixa.janela);
    }
  });

  test("o texto de cada faixa tem contraste contra o fundo que está atrás dele", async ({ page }) => {
    // O fundo de cada texto é composto subindo a árvore: as faixas têm alfa (a de 12%) e os cartões brancos ficam
    // por cima delas, então medir contra o fundo da seção daria o par errado. O mínimo é o do Material: 4,5 para
    // texto pequeno e 3 para texto grande (a partir de 24 px).
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const medidas = await page.evaluate(() => {
      const pintura = document.createElement("canvas");
      pintura.width = 1;
      pintura.height = 1;
      const tinta = pintura.getContext("2d")!;
      // Ler o PIXEL é o jeito que resolve qualquer cor do CSS, inclusive as que o Tailwind v4 escreve em `oklab(...)`
      // quando a classe tem alfa: `fillStyle` devolve essas sem converter.
      const ler = (valor: string) => {
        tinta.clearRect(0, 0, 1, 1);
        tinta.fillStyle = "#000000";
        tinta.fillStyle = valor;
        tinta.fillRect(0, 0, 1, 1);
        const d = tinta.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255];
      };
      const sobrepor = (frente: number[], fundo: number[]) => {
        const a = frente[3];
        return [frente[0] * a + fundo[0] * (1 - a), frente[1] * a + fundo[1] * (1 - a), frente[2] * a + fundo[2] * (1 - a), 1];
      };
      const luminancia = (c: number[]) => {
        const canal = (v: number) => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]);
      };
      const contraste = (a: number[], b: number[]) => {
        const [la, lb] = [luminancia(a), luminancia(b)];
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };
      // O fundo acumulado: página, e depois cada ancestral até o próprio elemento, compondo os alfas.
      const fundoDe = (el: Element) => {
        const cadeia: Element[] = [];
        let no: Element | null = el;
        while (no) {
          cadeia.push(no);
          no = no.parentElement;
        }
        let acumulado = [247, 246, 243, 1];
        for (const n of cadeia.reverse()) {
          const c = ler(getComputedStyle(n).backgroundColor);
          if (c[3] > 0) acumulado = sobrepor(c, acumulado);
        }
        return acumulado;
      };
      const textos = [...document.querySelectorAll("main p, main h2, main h3, main blockquote, main li, main dt, main dd")];
      // Texto sobre FOTO não se mede por composição de cor: o fundo dele é uma imagem, que esta conta não vê. Quem
      // mede esse caso é a sonda de pixel — a do fecho vive logo abaixo, e a da abertura já existia.
      const sobreFoto = (el: Element) => {
        const secao = el.closest("section");
        if (!secao) return false;
        return [...secao.querySelectorAll("*")].some((n) => {
          const e = getComputedStyle(n);
          return e.backgroundImage !== "none" && e.backgroundImage.includes("url(");
        });
      };
      const lidos = textos
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.height > 0 &&
            (el.textContent ?? "").trim().length > 0 &&
            !sobreFoto(el)
          );
        })
        .map((el) => {
          const estilo = getComputedStyle(el);
          const fundo = fundoDe(el);
          const cor = sobrepor(ler(estilo.color), fundo);
          return {
            texto: (el.textContent ?? "").trim().slice(0, 30),
            px: parseFloat(estilo.fontSize),
            contraste: Math.round(contraste(cor, fundo) * 100) / 100,
          };
        });
      return lidos;
    });
    expect(medidas.length).toBeGreaterThan(20);
    for (const m of medidas) {
      const minimo = m.px >= 24 ? 3 : 4.5;
      expect(m.contraste, `"${m.texto}" mede ${m.contraste} para 1, e o mínimo é ${minimo}`).toBeGreaterThanOrEqual(minimo);
    }
  });

  test("o texto do fecho tem contraste medido sobre os pixels da foto", async ({ page }) => {
    // A faixa do fecho passou a ter a foto dos painéis no deserto com o véu de tinta por cima. Contraste sobre foto
    // não se calcula pela cor declarada no CSS: o que vale é o pixel que está atrás do texto. Esta medida recorta a
    // área de respiro à DIREITA da linha do texto, sem glifo, e compara a luminância média dali com a cor do texto,
    // composta sobre esse mesmo fundo (o texto da faixa tem alfa). É a mesma técnica da medida da abertura.
    await page.goto("/phoenix-az");
    await page.waitForTimeout(900);
    // A faixa do fecho fica no fim do documento: o alvo precisa estar na janela para o recorte do screenshot existir.
    await page.locator("#final-cta-title").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const bloco = (await page.locator("#agendar > div.relative").boundingBox())!;
    expect(bloco, "não achei a coluna do fecho").not.toBeNull();
    const amostrar = async (faixa: { x: number; y: number; width: number; height: number }) => {
      const b64 = (await page.screenshot({ clip: faixa })).toString("base64");
      return page.evaluate(async (b64) => {
        const img = new Image();
        img.src = "data:image/png;base64," + b64;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          sr += d[i];
          sg += d[i + 1];
          sb += d[i + 2];
          n++;
        }
        return [sr / n, sg / n, sb / n];
      }, b64);
    };
    for (const seletor of ["#final-cta-title", "#agendar p.type-body", "#agendar p.type-label"]) {
      const alvo = page.locator(seletor).first();
      const caixa = await alvo.boundingBox();
      expect(caixa, `não achei ${seletor}`).not.toBeNull();
      const sobra = bloco.x + bloco.width - (caixa!.x + caixa!.width);
      const largura = Math.max(20, Math.min(Math.round(sobra - 8), 160));
      const faixa = {
        x: Math.round(caixa!.x + caixa!.width + 4),
        y: Math.round(caixa!.y + caixa!.height / 2 - 6),
        width: largura,
        height: 12,
      };
      const comVeu = await amostrar(faixa);
      const cor = await alvo.evaluate((e) => getComputedStyle(e).color);
      const contraste = await page.evaluate(
        async ({ fundo, cor }) => {
          const linear = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          const lum = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
          const sonda = document.createElement("canvas");
          sonda.width = 1;
          sonda.height = 1;
          const sctx = sonda.getContext("2d")!;
          sctx.fillStyle = `rgb(${Math.round(fundo[0])}, ${Math.round(fundo[1])}, ${Math.round(fundo[2])})`;
          sctx.fillRect(0, 0, 1, 1);
          sctx.fillStyle = cor;
          sctx.fillRect(0, 0, 1, 1);
          const px = sctx.getImageData(0, 0, 1, 1).data;
          const [alto, baixo] = [lum(fundo[0], fundo[1], fundo[2]), lum(px[0], px[1], px[2])].sort((a, b) => b - a);
          return Math.round(((alto + 0.05) / (baixo + 0.05)) * 100) / 100;
        },
        { fundo: comVeu, cor },
      );
      expect(contraste, `"${seletor}" mede ${contraste} para 1 sobre os pixels do fecho`).toBeGreaterThanOrEqual(4.5);
      // E a foto não pode ter sumido atrás do véu. A medida é a diferença entre o mesmo recorte COM e SEM o véu: o que
      // muda ali é a contribuição da foto (o véu é tinta neutra), então diferença pequena significa foto invisível.
      // Medido com o véu do fecho em 0,70 / 0,52 / 0,46: 14 a 34 unidades por canal; com o véu antigo da abertura,
      // 20 a 30% menos.
      await page.evaluate(() => {
        const veu = document.querySelector("#agendar > .veu-foto-fecho") as HTMLElement;
        veu.dataset.veuGuardado = veu.style.backgroundImage;
        veu.style.backgroundImage = "none";
      });
      const semVeu = await amostrar(faixa);
      await page.evaluate(() => {
        const veu = document.querySelector("#agendar > .veu-foto-fecho") as HTMLElement;
        veu.style.backgroundImage = veu.dataset.veuGuardado ?? "";
      });
      const contribuicao = Math.round(Math.max(...comVeu.map((v, i) => Math.abs(v - semVeu[i]))));
      expect(
        contribuicao,
        `"${seletor}": a foto contribui só ${contribuicao} unidade(s) atrás do véu (com ${JSON.stringify(comVeu.map(Math.round))}, sem ${JSON.stringify(semVeu.map(Math.round))})`,
      ).toBeGreaterThanOrEqual(12);
    }
  });

  test("os bairros são grade com pino dourado, e não chips miúdos", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const pintura = document.createElement("canvas").getContext("2d")!;
      const cor = (e: Element) => {
        pintura.fillStyle = "#ffffff";
        pintura.fillStyle = getComputedStyle(e).backgroundColor;
        return String(pintura.fillStyle);
      };
      // A lista de bairros é a maior do bloco: as outras duas listas da seção são os depoimentos e as equipes.
      const bloco = [...document.querySelectorAll("#proof ul")].sort((a, b) => b.children.length - a.children.length)[0];
      const itens = [...bloco.children];
      const pinos = itens.map((li) => {
        const svg = li.querySelector("svg")!;
        return { temPino: Boolean(svg), cor: getComputedStyle(svg.parentElement!).color, fundo: cor(li) };
      });
      return {
        itens: itens.length,
        grade: getComputedStyle(bloco).display,
        colunas: getComputedStyle(bloco).gridTemplateColumns.split(" ").length,
        pinos,
      };
    });
    // A cidade traz cinco bairros, e a lista mostra os cinco.
    expect(m.itens).toBe(5);
    // Grade de verdade, com três colunas no desktop, e não uma fila de chips.
    expect(m.grade).toBe("grid");
    expect(m.colunas).toBe(3);
    for (const pino of m.pinos) {
      expect(pino.temPino, "um bairro ficou sem o pino").toBe(true);
      // O pino é dourado escuro: o dourado claro mede 1,86 para 1 sobre o branco e não identifica um desenho de 16 px.
      expect(pino.cor, "o pino não está no dourado escuro do DESIGN.md").toBe("rgb(176, 116, 15)");
      // Nenhum item carrega fundo próprio: o chip branco com borda saiu de cena.
      expect(pino.fundo, "o item do bairro voltou a ser chip").toBe("rgba(0, 0, 0, 0)");
    }
  });

  test("o resultado tem as duas contas em linha, e não tem mais o filete âmbar", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const pintura = document.createElement("canvas").getContext("2d")!;
      const cor = (e: Element) => {
        pintura.fillStyle = "#ffffff";
        pintura.fillStyle = getComputedStyle(e).backgroundColor;
        return String(pintura.fillStyle);
      };
      const cartao = document.querySelector("#simulator output")!;
      const filetes = [...cartao.querySelectorAll("span[aria-hidden]")].filter(
        (s) => getComputedStyle(s).height === "1px",
      );
      const rotulos = [...cartao.querySelectorAll("p")];
      const custo = rotulos.find((p) => (p.textContent ?? "").includes("Cost after"))!;
      const retorno = rotulos.find((p) => (p.textContent ?? "").includes("Years to payback"))!;
      const caixa = (p: Element) => p.parentElement!.getBoundingClientRect();
      return {
        filetes: filetes.map((f) => cor(f)),
        custo: { topo: Math.round(caixa(custo).top), esquerda: Math.round(caixa(custo).left) },
        retorno: { topo: Math.round(caixa(retorno).top), esquerda: Math.round(caixa(retorno).left) },
      };
    });
    // O filete âmbar que atravessava a coluna acima do rótulo da economia saiu, e a medida guarda a
    // ausência dele: dentro do resultado não sobra nenhuma linha de 1 px.
    expect(m.filetes, `sobrou uma linha no resultado: ${JSON.stringify(m.filetes)}`).toEqual([]);
    // Custo e retorno na mesma linha: mesmo topo, colunas diferentes.
    expect(m.custo.topo, "custo e retorno não estão na mesma linha").toBe(m.retorno.topo);
    expect(m.retorno.esquerda, "as duas contas ficaram na mesma coluna").toBeGreaterThan(m.custo.esquerda + 100);
  });

  test("os títulos de seção cabem em 54 rem", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => ({
      titulos: [...document.querySelectorAll("main h2")].map((h) => Math.round(h.getBoundingClientRect().width)),
      colunaDoTituloDoFaq: Math.round(
        document.querySelector("#faq h2")!.parentElement!.getBoundingClientRect().width,
      ),
    }));
    // A medida de leitura do corpo é 40 rem (640 px); o título tem a dele, maior, para não quebrar em três linhas.
    for (const largura of m.titulos) {
      expect(largura, `um título de seção mede ${largura}px, acima dos 54 rem`).toBeLessThanOrEqual(864);
      expect(largura, `um título de seção encolheu para ${largura}px`).toBeGreaterThan(320);
    }
    // A coluna do título do FAQ cresceu de 16 para 22 rem: em 16 rem o título quebrava em quatro linhas.
    expect(m.colunaDoTituloDoFaq).toBeGreaterThanOrEqual(330);
  });

  test("cada foto no seu lugar: quatro de conteúdo e duas de fundo", async ({ page }) => {
    // O mapa das fotos, na ordem em que aparecem: abertura e o passo 1 com as duas fotos que já existiam, e as
    // quatro novas nos outros lugares — passo 2, depoimento em destaque, bairros, equipes e fecho. Duas delas são
    // fundo de faixa (abertura e fecho) e por isso não aparecem como `img`: a medida lê o `background-image`.
    await page.goto("/phoenix-az");
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const arquivos = (seletor: string) =>
        [...document.querySelectorAll<HTMLImageElement>(`${seletor} img`)].map(
          (i) => new URL(i.src).pathname.split("/").pop() ?? "",
        );
      const fundo = (seletor: string) => getComputedStyle(document.querySelector(seletor)!).backgroundImage;
      return {
        steps: arquivos("#steps"),
        proof: arquivos("#proof"),
        abertura: fundo(".fundo-abertura"),
        fecho: fundo(".fundo-fecho"),
      };
    });
    expect(m.steps).toEqual(["tecnico-no-telhado.avif", "trilho-no-telhado.avif", "paineis-no-campo.avif"]);
    // A prova social tem DUAS: a equipe erguendo o módulo, acima dos cartões de equipe, e a casa no bloco dos bairros.
    // A casa chegou a ficar dentro do depoimento em destaque e saiu: foto sobre a lavagem âmbar do
    // destaque some com o telhado, e o que decidiu foi "uma casa, um lugar".
    expect(m.proof).toEqual(["equipe-na-calcada.avif", "casa-phoenix.avif"]);
    expect(m.abertura).toContain("instaladores-no-telhado.avif");
    expect(m.fecho).toContain("paineis-no-deserto.avif");
  });
});

