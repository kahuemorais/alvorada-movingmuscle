// Medidas de acabamento: defeito de tela que o teste não pegava.
//
// Os dois defeitos desta medida apareceram depois da troca de escala de tipo. O degrau `number`
// subiu de 36 para 48 px, e o campo de conta passou a desenhar texto maior que a caixa dele. Nenhuma medida
// anterior olhava para isso: as de navegação medem barra e âncora, e as do simulador medem comportamento.
import { expect, test } from "@playwright/test";

test("o valor do campo da conta cabe dentro da caixa", async ({ page }) => {
  await page.goto("/phoenix-az");
  const campo = page.locator("#bill");
  const m = await campo.evaluate((e: HTMLInputElement) => {
    const estilo = getComputedStyle(e);
    const caixa = e.getBoundingClientRect();
    return {
      tamanhoDoTexto: parseFloat(estilo.fontSize),
      alturaDaCaixa: caixa.height,
      alturaDaLetra: parseFloat(estilo.lineHeight) || parseFloat(estilo.fontSize),
      transbordo: e.scrollWidth - e.clientWidth,
    };
  });
  // A letra precisa caber na altura, e o texto não pode ser cortado na largura.
  expect(m.alturaDaLetra).toBeLessThanOrEqual(m.alturaDaCaixa);
  expect(m.transbordo).toBeLessThanOrEqual(1);
});

test("os botões de passo cabem na própria caixa", async ({ page }) => {
  // Os passos são ícone, e não texto, então o que se mede é o desenho dentro do botão. A primeira versão
  // deste teste procurava os sinais de mais e menos como texto e não achava nada: eles são SVG.
  await page.goto("/phoenix-az");
  const passos = page.locator(
    'button[aria-label^="Lower the bill"], button[aria-label^="Raise the bill"]',
  );
  const medidas = await passos.evaluateAll((botoes) =>
    botoes.map((b) => {
      const svg = b.querySelector("svg");
      return {
        desenho: svg ? Math.round(svg.getBoundingClientRect().height) : 0,
        caixa: Math.round(b.getBoundingClientRect().height),
      };
    }),
  );
  expect(medidas.length).toBe(2);
  for (const m of medidas) {
    expect(m.desenho).toBeGreaterThan(0);
    expect(m.desenho).toBeLessThanOrEqual(m.caixa);
  }
});

test("o rótulo de cada grupo de controle tem respiro até o que vem abaixo", async ({ page }) => {
  await page.goto("/phoenix-az");
  const medidas = await page.evaluate(() => {
    const legendas = Array.from(document.querySelectorAll("#simulator legend"));
    return legendas.map((legenda) => {
      const grupo = legenda.parentElement!;
      const primeiro = Array.from(grupo.children).find((c) => c !== legenda);
      const base = legenda.getBoundingClientRect().bottom;
      const topo = primeiro ? primeiro.getBoundingClientRect().top : base;
      return { texto: legenda.textContent?.trim().slice(0, 28), vao: Math.round(topo - base) };
    });
  });
  expect(medidas.length).toBeGreaterThanOrEqual(2);
  for (const m of medidas) expect(m.vao).toBeGreaterThanOrEqual(12);
});

test("a abertura não repete o que o bloco de passos diz", async ({ page }) => {
  // A abertura trazia uma linha sobre licença, instalação em um dia e interligação. O bloco de passos, duas
  // telas abaixo, tem um passo para cada um dos três. Repetição não é ênfase aqui: é o mesmo fato ocupando
  // o lugar onde a pessoa decide pedir a visita.
  await page.goto("/phoenix-az");
  const abertura = await page.locator("main section").first().innerText();
  expect(abertura).not.toMatch(/permit/i);
  expect(abertura).not.toMatch(/interconnection/i);
  // E o bloco de passos continua dizendo os três fatos, para a informação não ter sumido da página.
  const passos = await page.locator("section#steps").innerText();
  expect(passos).toMatch(/permit/i);
  expect(passos).toMatch(/interconnection/i);
});

test("a chamada final tem uma ação só, e é o telefone", async ({ page }) => {
  // O bloco que pede a ligação oferecia, ao lado do telefone, um link para voltar ao simulador. Na hora da
  // decisão, uma ação.
  await page.goto("/phoenix-az");
  const acoes = await page.locator("section#agendar a").evaluateAll((as) =>
    as.map((a) => a.getAttribute("href") || ""),
  );
  expect(acoes.length).toBe(1);
  expect(acoes[0].startsWith("tel:")).toBe(true);
});

test("o favicon é o ícone do site, e não o padrão da ferramenta", async ({ page, request }) => {
  // O projeto nasceu com o favicon.ico do gerador, que não tem nada a ver com a marca. O ícone passa a ser
  // um SVG do Phosphor, a mesma família de ícones que a página usa, na cor de ação do DESIGN.md.
  await page.goto("/phoenix-az");
  const links = await page.locator('link[rel~="icon"]').evaluateAll((ls) =>
    ls.map((l) => l.getAttribute("href") || ""),
  );
  expect(links.some((h) => h.includes("icon.svg"))).toBe(true);
  expect(links.some((h) => h.includes("favicon.ico"))).toBe(false);

  const resposta = await request.get("/icon.svg");
  expect(resposta.status()).toBe(200);
  expect(resposta.headers()["content-type"]).toContain("image/svg+xml");
  const corpo = await resposta.text();
  // A cor de ação do DESIGN.md, em minúsculas como o tema declara.
  expect(corpo.toLowerCase()).toContain("#e8882a");
  // E é um SVG de verdade, com o desenho dentro.
  expect(corpo).toMatch(/<svg[^>]*viewBox=/);
  expect(corpo).toMatch(/<(path|circle|rect)/);
});

test("o filete da sobrancelha tem a cor do próprio rótulo", async ({ page }) => {
  // O traço que vem antes do rótulo ("The calculator", "Your estimate") estava na cor
  // secundária, o azul, e era para estar na cor da fonte. O filete é enfeite de hierarquia do rótulo, então ele
  // usa a cor do rótulo; onde o rótulo é a cor de apoio, o filete é a cor de apoio. As duas sobrancelhas sobre
  // superfície que não é o fundo claro — a da faixa da foto, no blog, e a do fecho, na faixa de ação — têm regra
  // própria e por isso ficam fora desta medida (o fecho usa tinta a 60% e o rótulo dele é tinta).
  await page.goto("/phoenix-az");
  const sobrancelhas = await page.evaluate(() =>
    [...document.querySelectorAll("main p")]
      .filter((p) => {
        const filho = p.firstElementChild;
        return (
          p.children.length === 1 &&
          filho?.tagName === "SPAN" &&
          getComputedStyle(filho).height === "1px"
        );
      })
      .map((p) => ({
        rotulo: (p.textContent ?? "").trim(),
        corDoRotulo: getComputedStyle(p).color,
        corDoFilete: getComputedStyle(p.firstElementChild!).backgroundColor,
      })),
  );
  const corDeApoio = "rgb(91, 97, 103)";
  const deApoio = sobrancelhas.filter((s) => s.corDoRotulo === corDeApoio);
  expect(
    deApoio.length,
    `só ${deApoio.length} sobrancelha(s) de apoio na página: ${JSON.stringify(sobrancelhas)}`,
  ).toBeGreaterThanOrEqual(4);
  for (const s of deApoio) {
    expect(s.corDoFilete, `o filete de "${s.rotulo}" não tem a cor do rótulo`).toBe(s.corDoRotulo);
  }
  // A sobrancelha do fecho passou a rótulo CLARO quando a foto entrou na faixa (o fundo dela é o véu escuro), então
  // o caso do rótulo em tinta a 60% — o do bloco do meio — é um, e o claro é o outro.
  const emTinta = sobrancelhas.filter((s) => s.corDoRotulo === "rgb(22, 24, 26)");
  expect(emTinta.length, `só ${emTinta.length} sobrancelha(s) em tinta na página`).toBeGreaterThanOrEqual(1);
  for (const s of emTinta) {
    expect(s.corDoFilete, `o filete de "${s.rotulo}" não está em tinta a 60%`).toContain("0.6)");
    expect(s.corDoFilete, `o filete de "${s.rotulo}" está no azul`).not.toContain("30, 95, 191");
  }
  const emCanvas = sobrancelhas.filter((s) => s.corDoRotulo === "rgb(247, 246, 243)");
  expect(emCanvas.length, `só ${emCanvas.length} sobrancelha(s) claras na página`).toBeGreaterThanOrEqual(1);
  for (const s of emCanvas) {
    expect(s.corDoFilete, `o filete de "${s.rotulo}" não está claro a 60%`).toContain("0.6)");
    expect(s.corDoFilete, `o filete de "${s.rotulo}" está no azul`).not.toContain("30, 95, 191");
  }
});

test("os controles do simulador têm a mesma largura", async ({ page }) => {
  // Medido antes, no celular: a caixa da conta tinha 144 px por causa de um limite de largura sem motivo,
  // e os três atalhos de cobertura tinham 105, 111 e 104 px, enquanto o cursor e os cartões de
  // perfil ocupavam os 345 px da coluna. Quatro controles, três larguras.
  //
  // A conferência dos cartões de perfil só vale na coluna única: do tamanho médio para cima o simulador
  // vira duas colunas e os cartões passam a dividir a segunda, por desenho.
  const medir = () =>
    page.evaluate(() => {
      const larg = (e: Element | null | undefined) =>
        e ? Math.round(e.getBoundingClientRect().width) : null;
      const caixaConta = document.querySelector("#bill")?.closest("div[class*=rounded-lg]");
      const caixaCursor = document.querySelector('input[type="range"]')?.closest("div[class*=rounded-lg]");
      const atalhos: Element[] = Array.from(document.querySelectorAll("#simulator button")).filter((b) =>
        /^(Half|Most|All) /.test(b.textContent?.trim() ?? ""),
      );
      // O atalho de perfil deixou de ser rádio dentro de label e virou botão com `data-perfil`: o gancho da
      // medida é o atributo que o componente escreve, não o papel de acessibilidade que ele tinha antes.
      const cartao = document.querySelector("#simulator [data-perfil]");
      const retangulos = atalhos.map((b) => b.getBoundingClientRect());
      const caixa = caixaCursor?.getBoundingClientRect() ?? null;
      return {
        conta: larg(caixaConta),
        cursor: larg(caixaCursor),
        cartao: larg(cartao),
        atalhoEsquerda: retangulos.length ? Math.round(Math.min(...retangulos.map((r) => r.left))) : null,
        atalhoDireita: retangulos.length ? Math.round(Math.max(...retangulos.map((r) => r.right))) : null,
        caixaEsquerda: caixa ? Math.round(caixa.left) : null,
        caixaDireita: caixa ? Math.round(caixa.right) : null,
        quantosAtalhos: atalhos.length,
      };
    });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const celular = await medir();
  expect(celular.quantosAtalhos).toBe(3);
  expect(celular.conta).toBe(celular.cursor);
  expect(celular.cartao).toBe(celular.cursor);
  expect(celular.atalhoEsquerda).not.toBeNull();
  expect(celular.caixaEsquerda).not.toBeNull();
  expect(Math.abs((celular.atalhoEsquerda ?? 0) - (celular.caixaEsquerda ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((celular.atalhoDireita ?? 0) - (celular.caixaDireita ?? 0))).toBeLessThanOrEqual(1);

  // Do tamanho médio para cima, os dois controles da primeira coluna continuam iguais entre si.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const desktop = await medir();
  expect(desktop.conta).toBe(desktop.cursor);
});


test("a seção das equipes não tem azul, e o círculo da equipe é ícone", async ({ page }) => {
  // O azul não entra nesta seção. O último azul da página era o círculo de iniciais das equipes
  // (`bg-secondary` no `AvatarFallback`, medido no HTML publicado: era a única classe `secondary` da página inteira).
  // Ele passou para tinta cheia e, depois, as iniciais
  // saíram e entrou o capacete (`IconeEquipe`), porque a equipe tem nome, não rosto, e as iniciais davam monograma errado
  // ("TO" para "The Okafor brothers"). A medida varre a seção e não aceita a cor secundária em fundo, texto nem
  // borda, e é assim que ela volta se alguém reintroduzir um `secondary` no bloco. O resto entra também:
  // nota da equipe e "since" em `support`, o pino dos bairros no dourado escuro, o fundo dos cartões em
  // `surface`, e nenhuma pastilha atrás da nota.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const AZUL = "rgb(30, 95, 191)";
    const secao = document.querySelector("#proof")!;
    const azul = [...secao.querySelectorAll("*")]
      .map((e) => {
        const s = getComputedStyle(e);
        const usos = [
          s.backgroundColor,
          s.color,
          s.borderTopColor,
          s.borderBottomColor,
          s.borderLeftColor,
          s.borderRightColor,
        ].filter((v) => v === AZUL).length;
        return usos ? `${e.tagName}[${(e.getAttribute("class") ?? "").slice(0, 60)}]` : null;
      })
      .filter(Boolean);

    const monograma = secao.querySelector('[data-slot="avatar-fallback"]');
    const cartaoDaEquipe = [...secao.querySelectorAll('[data-slot="card"]')].find((c) =>
      (c.textContent ?? "").includes("installs"),
    )!;
    const linhaDaEquipe = cartaoDaEquipe.querySelector("p.microcopy")!;
    const nota = linhaDaEquipe.querySelector("span")!;
    // O pino do primeiro bairro da lista.
    const pino = [...secao.querySelectorAll("li span svg")].map((s) => getComputedStyle(s.parentElement!).color)[0];

    const pintura = document.createElement("canvas").getContext("2d")!;
    const cor = (e: Element, propriedade: string) => {
      pintura.fillStyle = "#ffffff";
      pintura.fillStyle = getComputedStyle(e)[propriedade as never] as string;
      const normalizada = String(pintura.fillStyle);
      // Cor opaca o canvas devolve em hexadecimal, e a leitura da asserção espera rgb.
      if (normalizada.startsWith("#")) {
        const n = parseInt(normalizada.slice(1), 16);
        return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
      }
      return normalizada;
    };
    return {
      azul,
      monograma: monograma
        ? {
            letras: (monograma.textContent ?? "").trim(),
            glifos: monograma.querySelectorAll("svg").length,
            fundo: getComputedStyle(monograma).backgroundColor,
            cor: getComputedStyle(monograma).color,
          }
        : null,
      fundoDoCartao: getComputedStyle(cartaoDaEquipe).backgroundColor,
      corDaLinha: cor(linhaDaEquipe, "color"),
      lerNota: (nota.textContent ?? "").trim(),
      fundoDaNota: getComputedStyle(nota).backgroundColor,
      corDoPino: pino,
    };
  });

  expect(m.azul, `a cor secundária voltou em: ${m.azul?.join(" | ")}`).toEqual([]);
  expect(m.monograma, "não achei o círculo da equipe").not.toBeNull();
  // O círculo é o par dos outros dois desta seção: tinta cheia atrás, glifo dourado na frente (8,78 sobre a tinta).
  expect(m.monograma!.fundo, "o círculo da equipe não está em tinta").toBe("rgb(22, 24, 26)");
  expect(m.monograma!.cor, "o glifo do círculo não está no dourado claro").toBe("rgb(245, 166, 35)");
  expect(m.monograma!.glifos, "o círculo da equipe perdeu o ícone").toBe(1);
  expect(m.monograma!.letras, "as iniciais voltaram para o círculo da equipe").toBe("");
  // Fundo dos cartões: `surface`, sem lavagem.
  expect(m.fundoDoCartao, "o cartão da equipe perdeu o fundo surface").toBe("rgb(255, 255, 255)");
  // Nota, "installs" e "since" saem do `support`, que é o cinza de apoio.
  expect(m.corDaLinha, "a linha da equipe não está em support").toBe("rgb(91, 97, 103)");
  // A nota é número solto: o pino existe e nada pinta atrás dela.
  expect(m.lerNota).toMatch(/^\d/);
  expect(m.fundoDaNota, "a nota da equipe ganhou pastilha").toBe("rgba(0, 0, 0, 0)");
  // O pino do bairro continua no dourado escuro, que mede 3,92 sobre o branco.
  expect(m.corDoPino, "o pino saiu do dourado escuro").toBe("rgb(176, 116, 15)");
});

// As três fotos dos passos no compacto. Abaixo de 840 px a foto do cartão estava esticando o
// cartão, porque só existia teto no desktop (`md:max-h-[11rem]`) e no compacto o `aspect-[4/3]` com `w-full`
// dava a altura da coluna inteira em proporção. Medido antes, em 390 px: 233 px de altura por foto.
test.describe("a foto do passo no compacto", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a foto tem teto de altura e mantém o recorte", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(400);
    const m = await page.evaluate(() =>
      [...document.querySelectorAll("#steps img")].map((i) => ({
        altura: Math.round(i.getBoundingClientRect().height),
        largura: Math.round(i.getBoundingClientRect().width),
        recorte: getComputedStyle(i).objectFit,
      })),
    );
    expect(m, "o bloco dos passos não tem três fotos").toHaveLength(3);
    for (const foto of m) {
      // 10 rem é 160 px, mais 1 px de tolerância do arredondamento do navegador.
      expect(foto.altura, `a foto passou do teto de 10 rem: ${foto.altura} px`).toBeLessThanOrEqual(161);
      expect(foto.largura, "a foto perdeu a largura da coluna").toBeGreaterThan(200);
      expect(foto.recorte, "a foto perdeu o recorte cover").toBe("cover");
    }
  });
});

// O desktop continua com o teto de 11 rem que já existia: o corte é só o compacto.
test.describe("a foto do passo no desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a foto mantém o teto de 11 rem", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(400);
    const alturas = await page.evaluate(() =>
      [...document.querySelectorAll("#steps img")].map((i) => Math.round(i.getBoundingClientRect().height)),
    );
    // 11 rem é 176 px, mais 1 px de tolerância.
    expect(alturas.every((a) => a <= 177), `alturas no desktop: ${alturas.join(", ")}`).toBe(true);
  });
});
