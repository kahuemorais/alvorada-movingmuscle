// Medida da navegação, no navegador de verdade.
//
// Por que este arquivo existe, e não um teste de unidade sobre classes: o defeito da barra não era de
// lógica, era de geometria. A medida de tela pegou as duas queixas: o item Home parava abaixo do
// topo, e a barra do celular flutuava com canto arredondado quando não era para ter nem uma coisa nem
// outra. Classe escrita no código não prova nada disso; medir a caixa do elemento prova.
import { expect, test } from "@playwright/test";

const BARRA = 'nav[aria-label="Main navigation"]';

test.describe("barra de navegação no celular", () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test("encosta na borda de baixo e ocupa a largura toda", async ({ page }) => {
    await page.goto("/phoenix-az");
    const caixa = (await page.locator(BARRA).boundingBox())!;
    expect(Math.round(caixa.width)).toBe(393);
    expect(Math.round(caixa.y + caixa.height)).toBe(852);
  });

  test("não tem canto arredondado e mantém o vidro", async ({ page }) => {
    await page.goto("/phoenix-az");
    const estilo = await page.locator(BARRA).evaluate((n) => {
      const s = getComputedStyle(n);
      return { raio: s.borderTopLeftRadius, filtro: s.backdropFilter };
    });
    expect(estilo.raio).toBe("0px");
    expect(estilo.filtro).toContain("blur");
  });

  test("o item Home leva ao topo do documento", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator(`${BARRA} a[href="#topo"]`).click();
    await page.waitForFunction(() => window.scrollY === 0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("o conteúdo não fica atrás da barra no fim da página", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      // A medida passou a olhar o CONTEÚDO da última faixa, e não a caixa dela: com as faixas, a seção termina no fim
      // do documento de propósito (é a cor de ação até a borda), e quem reserva a barra é o respiro de baixo dela. O
      // que precisa estar visível é o último texto, que é o aviso do incentivo estadual.
      const ultimo = document.querySelector("main > section:last-of-type")!;
      const conteudo = ultimo.lastElementChild!.lastElementChild!.getBoundingClientRect();
      const barra = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      return { conteudo: conteudo.bottom, barra: barra.top };
    });
    expect(Math.round(m.barra - m.conteudo)).toBeGreaterThan(8);
  });

  test("no celular a abertura e o simulador reservam a altura da barra", async ({ page }) => {
    // A barra vive fixa na borda de baixo, então ela cobre a faixa de baixo da janela em QUALQUER posição de
    // rolagem. Medido antes desta mudança: no primeiro quadro da página a faixa de números da abertura ficava
    // 3 px atrás da barra numa janela de 852 e 33 px numa de 667, e o campo da conta, quando o navegador o
    // traz para a área visível, podia cair na mesma faixa. O conserto é reservar o espaço da barra no fim dos
    // dois blocos que têm campo e ação, e não só no fim do documento.
    await page.goto("/phoenix-az");
    const m = await page.evaluate(() => {
      const barra = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      const abertura = document.querySelector("section:has(#hero-title) > div")!;
      const simulador = document.querySelector("#simulator")!;
      const cta = document.querySelector("section:has(#hero-title) a[href='#simulator']")!.getBoundingClientRect();
      // O que ficava atrás da barra: a faixa dos três números e a linha de procedência, que
      // mora logo abaixo dela. Medir as duas peças, e não a reserva sozinha, é o que pega essa queixa: a
      // reserva estava do tamanho da barra, e o conteúdo da abertura passava dela por causa do lead de duas frases.
      const itens = [...document.querySelectorAll("section:has(#hero-title) dl > div")];
      const ultimoNumero = itens[itens.length - 1].getBoundingClientRect();
      const procedencia = document.querySelector("section:has(#hero-title) dl + p")!.getBoundingClientRect();
      const lead = document.querySelector("section:has(#hero-title) p.type-body")!;
      return {
        alturaDaBarra: Math.round(barra.height),
        topoDaBarra: Math.round(barra.top),
        reservaDaAbertura: Math.round(parseFloat(getComputedStyle(abertura).paddingBottom)),
        reservaDoSimulador: Math.round(parseFloat(getComputedStyle(simulador).paddingBottom)),
        ctaFundo: Math.round(cta.bottom),
        fundoDosNumeros: Math.round(ultimoNumero.bottom),
        fundoDaProcedencia: Math.round(procedencia.bottom),
        frasesDoLead: (lead.textContent ?? "").split(/[.!?]/).filter((t) => t.trim().length > 0).length,
      };
    });
    // A reserva é a altura da barra mais o respiro que já existia em volta do conteúdo da abertura.
    expect(m.reservaDaAbertura).toBeGreaterThanOrEqual(m.alturaDaBarra + 24);
    expect(m.reservaDoSimulador).toBeGreaterThanOrEqual(m.alturaDaBarra);
    // E a ação da abertura fica acima da barra na posição em que a página abre.
    expect(m.ctaFundo).toBeLessThan(m.topoDaBarra);
    // A prova social da abertura também: os três números e a linha da distribuidora acima do vidro.
    expect(m.fundoDosNumeros, "os três números caem atrás da barra").toBeLessThan(m.topoDaBarra);
    expect(m.fundoDaProcedencia, "a linha da distribuidora cai atrás da barra").toBeLessThan(m.topoDaBarra);
    // E o lead da abertura é uma frase: é o que devolve o espaço que a faixa de números perdia.
    expect(m.frasesDoLead, "o lead da abertura voltou a ter mais de uma frase").toBe(1);

    // No destino da âncora, o PRIMEIRO controle do painel fica acima da barra. Antes a âncora era
    // medida pelo campo da conta, porque era ele que abria a coluna; com os quatro cartões de perfil na frente,
    // quem o salto traz para a tela é o primeiro cartão, e o campo da conta passa a ficar abaixo da
    // dobra no celular (851 px numa janela de 852, medido), atrás da barra. Isso não é defeito do salto: é a
    // consequência da ordem pedida, e o campo continua editável e visível, com medida própria em
    // `tests/simulador.spec.ts`. O que este teste guarda é que o salto não termina com um controle DEBAIXO da barra.
    await page.locator(`${BARRA} a[href="#simulator"]`).click();
    await page.waitForTimeout(900);
    const alvo = await page.evaluate(() => {
      const cartao = document.querySelector("#simulator [data-perfil]")!.getBoundingClientRect();
      const painel = document.querySelector("#simulator .grid")!.getBoundingClientRect();
      const barra = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      return {
        topoDoCartao: Math.round(cartao.top),
        fundoDoCartao: Math.round(cartao.bottom),
        topoDoPainel: Math.round(painel.top),
        topoDaBarra: Math.round(barra.top),
      };
    });
    // O painel começa na área visível e o primeiro cartão fica inteiro acima da barra.
    expect(alvo.topoDoPainel).toBeGreaterThanOrEqual(0);
    expect(alvo.topoDoCartao).toBeGreaterThanOrEqual(0);
    expect(alvo.fundoDoCartao).toBeLessThan(alvo.topoDaBarra);
  });

  test("o item Call leva à seção de agendar, e não disca", async ({ page }) => {
    // O botão de ligar do menu leva para a seção onde a visita é agendada. O telefone
    // continua dentro daquela seção, escrito como telefone, então quem quiser ligar liga de lá.
    await page.goto("/phoenix-az");
    // O seletor é explícito, e não `.last()`: a barra ganhou o item do blog e o que este teste mede é o
    // item de conversão, não "o último da barra". Com o `.last()` o teste passava a apontar para o blog
    // no dia em que ele entrou no menu, e o conserto errado seria afrouxar a asserção. Quem guarda a
    // ordem, com o item de conversão no fim, é o teste seguinte.
    const item = page.locator(`${BARRA} a[href="#agendar"]`);
    await expect(item).toHaveText(/Call/i);
    const href = (await item.getAttribute("href"))!;
    expect(href.startsWith("#")).toBe(true);
    await item.click();
    // A rolagem das âncoras é suave, então o destino não chega no mesmo
    // instante do clique. A espera é pela seção entrar na janela, que é justamente o que este teste mede —
    // e o salto seco continua valendo para quem pediu menos movimento no sistema.
    await page.waitForFunction(
      (h) => {
        const caixa = document.querySelector(`${h} a[href^="tel:"]`)?.getBoundingClientRect();
        return Boolean(caixa && caixa.top < window.innerHeight && caixa.bottom > 0);
      },
      href,
      { timeout: 6000 },
    );
    // A medida é visibilidade, e não distância do topo: esta é a última seção da página, então o
    // navegador não consegue subir mais e o topo dela para acima de zero. O que importa é que a seção
    // entre na janela e que o telefone, que é o canal, fique visível.
    const naJanela = await page.evaluate((h) => {
      const secao = document.querySelector(h)!.getBoundingClientRect();
      const telefone = document.querySelector(`${h} a[href^="tel:"]`);
      const caixa = telefone?.getBoundingClientRect();
      return {
        altura: window.innerHeight,
        topo: Math.round(secao.top),
        base: Math.round(secao.bottom),
        telefoneVisivel: Boolean(caixa && caixa.top < window.innerHeight && caixa.bottom > 0),
      };
    }, href);
    expect(naJanela.topo).toBeLessThan(naJanela.altura);
    expect(naJanela.base).toBeGreaterThan(0);
    expect(naJanela.telefoneVisivel).toBe(true);
  });

  test("o item de conversão fecha a barra, com o blog antes dele", async ({ page }) => {
    // A ordem: o item que leva ao agendamento é o último da barra. O blog é destino de
    // outra página e entra antes dele. Antes daqui a ordem era medida de lado, pelo `.last()` do teste de
    // cima, que quando o blog entrou no menu passou a apontar para o blog.
    await page.goto("/phoenix-az");
    const rotulos = (await page.locator(`${BARRA} a`).allInnerTexts()).map((t) => t.trim());
    expect(rotulos.at(-1)).toBe("Call");
    // O blog existe no menu, aponta para a página do blog e não é o último item: o endereço com barra
    // inicial diz que é outra página, e não âncora desta, que é o que o resto da barra é.
    const blog = page.locator(`${BARRA} a[href="/blog"]`);
    await expect(blog).toHaveText(/Blog/i);
    expect(rotulos.indexOf("Blog")).toBeGreaterThan(-1);
    expect(rotulos.indexOf("Blog")).toBeLessThan(rotulos.length - 1);
  });

  test("os cinco rótulos cabem em uma linha cada", async ({ page }) => {
    // A barra usa `flex-1` no celular, então cada item novo aperta a coluna dos outros. Rótulo comprido
    // quebra em duas linhas, e quebrar não muda a altura do alvo de toque: o teste de 48 px não denuncia.
    // O que denuncia é a altura do rótulo passar de um line-height. Se algum quebrar, o conserto é rótulo
    // mais curto, e não fonte menor.
    await page.goto("/phoenix-az");
    // Espera a fonte trocar, e não um tempo fixo: o rótulo mais largo é medido com a fonte que o visitante
    // vê, e a fonte do sistema é mais estreita que a do site, então medir antes da troca mediria o caso
    // fácil.
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    // O seletor passou a ser o gancho do rótulo, e não "qualquer span do item": o item ganhou um invólucro em
    // volta do ícone (para o dourado do cursor), e "qualquer span" passou a contar dez elementos em cinco itens.
    const linhas = await page.locator(`${BARRA} a [data-rotulo]`).evaluateAll((rotulos) =>
      rotulos.map((rotulo) => {
        const altura = rotulo.getBoundingClientRect().height;
        const linha = parseFloat(getComputedStyle(rotulo).lineHeight);
        return Math.round(altura / linha);
      }),
    );
    expect(linhas).toHaveLength(5);
    for (const n of linhas) expect(n).toBe(1);
  });

  test("no celular a marca vive dentro da abertura, e uma vez só", async ({ page }) => {
    // A marca no começo da página, no celular, fica DENTRO da abertura. Antes ela vivia numa linha
    // de identidade acima do bloco de tinta, e essa linha deixou de existir na página de cidade: o teste que
    // guardava o conteúdo dela (sem cidade e sem sigla) saiu junto, porque o assunto dele era a linha, que não há.
    // O que se guarda agora são as duas metades do arranjo novo: a marca dentro da abertura, uma vez só, e fora da
    // barra de baixo, que é curta e aperta os rótulos.
    await page.goto("/phoenix-az");
    const abertura = page.locator("section:has(#hero-title)");
    await expect(abertura).toContainText("Brightfield Solar");
    await expect(page.locator('nav[aria-label="Brightfield Solar"]')).toHaveCount(0);
    // A barra de baixo carrega a marca no DOM (o item é escondido por classe a partir do tamanho médio), então a
    // guarda é de VISIBILIDADE, e não de texto: `toContainText` lê o DOM e reprovava uma marca que ninguém vê.
    const visiveis = await page.evaluate(() =>
      [...document.querySelectorAll("span, a, p")].filter(
        (el) =>
          el.children.length === 0 &&
          (el.textContent ?? "").trim() === "Brightfield Solar" &&
          el.getBoundingClientRect().width > 0,
      ).length,
    );
    expect(visiveis, `a marca aparece ${visiveis} vezes visível no celular`).toBe(1);
  });

  test("o alvo de toque de cada item tem pelo menos 48 px", async ({ page }) => {
    await page.goto("/phoenix-az");
    const alturas = await page.locator(`${BARRA} a`).evaluateAll((itens) =>
      itens.map((i) => Math.round(i.getBoundingClientRect().height)),
    );
    expect(alturas.length).toBeGreaterThan(0);
    for (const altura of alturas) expect(altura).toBeGreaterThanOrEqual(48);
  });
});

test.describe("barra de navegação do tamanho médio para cima", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("fica no topo, ocupa a largura e carrega a marca à esquerda", async ({ page }) => {
    // Esta medida guardava a regra anterior: a barra não podia alcançar a marca, porque a marca vivia fora dela, na
    // linha de identidade. No arranjo atual a marca está dentro da barra, então o que se guarda é que ela está contida
    // na barra e antes dos destinos.
    await page.goto("/phoenix-az");
    const m = await page.evaluate(() => {
      const barra = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      const dentro = [...document.querySelectorAll('nav[aria-label="Main navigation"] span')].find(
        (s) => (s.textContent ?? "").trim() === "Brightfield Solar",
      );
      const destino = document.querySelector('nav[aria-label="Main navigation"] a')!.getBoundingClientRect();
      const rb = dentro?.getBoundingClientRect();
      return {
        topo: Math.round(barra.top),
        largura: Math.round(barra.width),
        base: Math.round(barra.bottom),
        dentroDaBarra: rb ? Math.round(rb.top) >= Math.round(barra.top) && Math.round(rb.bottom) <= Math.round(barra.bottom) : false,
        antesDosDestinos: rb ? Math.round(rb.right) <= Math.round(destino.left) + 1 : false,
      };
    });
    expect(m.topo).toBe(0);
    expect(m.largura).toBe(1280);
    expect(m.dentroDaBarra, "a marca não está contida na barra").toBe(true);
    expect(m.antesDosDestinos, "a marca não está à esquerda dos destinos").toBe(true);
  });

  test("a âncora de seção para abaixo da barra, sem esconder o título", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.locator(`${BARRA} a[href="#steps"]`).click();
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => {
      const secao = document.querySelector("#steps")!.getBoundingClientRect();
      const barra = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      return { secao: Math.round(secao.top), barra: Math.round(barra.bottom) };
    });
    expect(m.secao).toBeGreaterThanOrEqual(m.barra);
  });
});
