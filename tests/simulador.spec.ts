// Medida do simulador no navegador.
//
// Por que aqui e não em teste de unidade: o defeito não estava no cálculo, que tem teste próprio e passa,
// estava no estado da interface. A escolha de cobertura da pessoa era descartada ao trocar de card de
// perfil, e isso só aparece clicando de verdade.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const cidade = JSON.parse(readFileSync("src/data/cities/phoenix-az.json", "utf8"));
const PRIMEIRO_PERFIL = cidade.householdProfiles[0];

// A barra fixa cobre o que estiver na borda de baixo da janela, então o alvo é centralizado antes do
// clique. Aceita seletor de CSS ou localizador: o card de perfil é encontrado por texto, e texto não é
// seletor de CSS, então misturar os dois dentro do navegador não funciona.
async function clicarCentralizado(
  page: import("@playwright/test").Page,
  alvo: string | import("@playwright/test").Locator,
) {
  const elemento = typeof alvo === "string" ? page.locator(alvo).first() : alvo;
  await elemento.scrollIntoViewIfNeeded();
  await elemento.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(250);
  await elemento.click();
}

// O controle de cobertura passou de três cartões para um cursor de cinco em cinco. Este ajudante
// é o mesmo ponto de entrada dos dois testes que dirigem a cobertura, para não repetir o arrasto.
async function definirCobertura(page: import("@playwright/test").Page, valor: number) {
  const cursor = page.locator('input[type="range"]').first();
  await cursor.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await cursor.fill(String(valor));
  await page.waitForTimeout(350);
}

async function coberturaMarcada(page: import("@playwright/test").Page) {
  return page.locator('input[type="range"]').first().inputValue();
}

test("a cobertura vai de 50 a 100 de cinco em cinco pontos", async ({ page }) => {
  // A cobertura vai de 50% a 100%, de cinco em cinco pontos. A página oferecia três
  // pontos (50, 80 e 100), o que é requisito de aceitação não atendido.
  await page.goto("/phoenix-az");
  const cursor = page.locator('input[type="range"]').first();
  await expect(cursor).toHaveAttribute("min", "50");
  await expect(cursor).toHaveAttribute("max", "100");
  await expect(cursor).toHaveAttribute("step", "5");

  // Um valor que não é nenhum dos três antigos, para provar que a grade existe de verdade.
  await cursor.scrollIntoViewIfNeeded();
  await cursor.fill("55");
  await page.waitForTimeout(400);
  const endereco = await page.evaluate(() => new URLSearchParams(location.search).get("coverage"));
  expect(endereco).toBe("55");
  await expect(page.locator("text=55%").first()).toBeVisible();

  // E o endereço de quem recebe o link abre com o mesmo valor.
  await page.goto("/phoenix-az?bill=220&coverage=95");
  await page.waitForTimeout(300);
  await expect(page.locator('input[type="range"]').first()).toHaveValue("95");

  // Valor fora da grade é recusado e cai no padrão, em vez de virar simulação torta.
  await page.goto("/phoenix-az?bill=220&coverage=57");
  await page.waitForTimeout(300);
  await expect(page.locator('input[type="range"]').first()).toHaveValue("80");
});

test("o rótulo do incentivo sai do dado da cidade", async ({ page }) => {
  // O rótulo dizia "30%" escrito à mão, com o dado trazendo a alíquota em fração. A prova aqui é fraca
  // sozinha (o valor de hoje também é 30%), e por isso o teste de unidade da função é que sustenta a
  // regra: aqui se confere que a tela mostra o que o arquivo da cidade diz.
  await page.goto("/phoenix-az");
  const esperado = `${Math.round(cidade.federalCreditRate * 100)}%`;
  const rotulo = await page.locator("text=Cost after the").first().innerText();
  expect(rotulo).toContain(esperado);
});

test("trocar de card de perfil não descarta a cobertura escolhida", async ({ page }) => {
  await page.goto("/phoenix-az");

  await definirCobertura(page, 50);
  expect(await coberturaMarcada(page)).toBe("50");

  await clicarCentralizado(page, page.getByText(PRIMEIRO_PERFIL.label).first());
  await page.waitForTimeout(500);

  expect(await coberturaMarcada(page)).toBe("50");
  // E o card fez o que promete: a conta passou a ser a típica daquele perfil.
  const conta = await page.locator("#bill").inputValue();
  expect(Number(conta.replace(/[^0-9]/g, ""))).toBe(PRIMEIRO_PERFIL.typicalBill);
});

test("a conta típica do perfil entra mesmo com a cobertura em 100%", async ({ page }) => {
  await page.goto("/phoenix-az");
  await definirCobertura(page, 100);
  await clicarCentralizado(page, page.getByText(PRIMEIRO_PERFIL.label).first());
  await page.waitForTimeout(500);
  expect(await coberturaMarcada(page)).toBe("100");
});

// ---------------------------------------------------------------------------------------------
// Hierarquia do resultado e explicação do número.
//
// A calculadora tem de parecer uma pequena ferramenta financeira, e não um cartão com
// quatro números iguais. As duas medidas abaixo guardam isso: qual número manda, e de onde ele vem.
// ---------------------------------------------------------------------------------------------

test("a economia é o número em destaque, e os outros três viram linhas de extrato", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const saida = document.querySelector("#simulator output");
    if (!saida) return null;
    const de48 = [...saida.querySelectorAll("p")].filter((p) => parseFloat(getComputedStyle(p).fontSize) === 48);
    const de20 = [...saida.querySelectorAll("p")].filter((p) => parseFloat(getComputedStyle(p).fontSize) === 20);
    return {
      quantosDe48: de48.length,
      rotuloDoDestaque: de48[0]?.parentElement?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      extrato: de20.map((p) => ({
        rotulo: p.parentElement?.querySelector("p")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
        valor: (p.textContent ?? "").trim(),
      })),
    };
  });
  expect(m, "não achei o bloco de resultado").not.toBeNull();
  // Antes os quatro números estavam no mesmo degrau de 48 px e nada dizia qual era a resposta da pergunta
  // que a pessoa fez. Agora o degrau grande tem um dono só, e ele é a economia.
  expect(m!.quantosDe48).toBe(1);
  expect(m!.rotuloDoDestaque).toContain("Monthly savings");
  // E os outros três viraram linhas de extrato, no degrau de 20 px, na ordem em que a conta acontece.
  // O rótulo do crédito sai do arquivo da cidade, e não do texto escrito aqui: cidade nova com outra alíquota
  // não pode quebrar a asserção nem o rótulo.
  expect(m!.extrato.map((l) => l.rotulo)).toEqual([
    "Panels",
    `Cost after the ${Math.round(cidade.federalCreditRate * 100)}% federal credit`,
    "Years to payback",
  ]);
});

test("o resultado diz em quanto a conta fica, e não só quanto ela economiza", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const saida = page.locator("#simulator output");
  // O número em destaque é a economia; a frase ao lado dela é o contexto abaixo dos
  // números, e é a mesma aritmética da simulação (conta menos economia), não dado novo.
  await expect(saida).toContainText("Monthly savings");
  await expect(saida).toContainText(/Your bill goes to about \$[\d,.]+ a month/);
});

test("a página mostra de onde vem o valor, com os números da cidade", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const itens = await page.evaluate(() =>
    [...document.querySelectorAll("#como-calculamos ol > li")].map((li) =>
      (li.textContent ?? "").replace(/\s+/g, " ").trim(),
    ),
  );
  // Seis contas, nesta ordem: consumo, alvo, geração de um painel, painéis, preço e economia.
  expect(itens).toHaveLength(6);
  expect(itens[0]).toContain(`$${cidade.utilityRatePerKwh.toFixed(2)}`);
  expect(itens[2]).toContain(String(cidade.panelWatts));
  expect(itens[2]).toContain(String(cidade.peakSunHoursPerDay));
  expect(itens[4]).toContain(`$${cidade.costPerWattInstalled.toFixed(2)}`);
  expect(itens[4]).toContain(`${Math.round(cidade.federalCreditRate * 100)}%`);
});

test("quando o mínimo entra, a página diz por que o sistema passa do que a conta indica", async ({ page }) => {
  // Cenário da regra do mínimo, exercitado pela tela e não pela função: conta de $90 com
  // 50% de cobertura pede 4,27 painéis, e o mínimo de Phoenix são 8.
  await page.goto("/phoenix-az?bill=90&coverage=50");
  await page.waitForTimeout(500);
  const alerta = page.locator('#simulator [data-slot="alert"]').first();
  await expect(alerta).toBeVisible();
  const texto = (await alerta.innerText()).replace(/\s+/g, " ");
  expect(texto).toContain("Why more panels than you asked for");
  // O motivo tem os dois pedaços: painel é unidade inteira, e existe um mínimo por instalação.
  expect(texto).toMatch(/whole unit/i);
  expect(texto).toContain(`minimum of ${cidade.minPanels}`);
  // E o piso de preço que o mínimo impõe está dito, com o número do arquivo da cidade.
  await expect(page.locator("#simulator output")).toContainText("$6,930");
  // A mesma regra aparece na lista das seis contas, que é onde ela fica visível antes de o resultado
  // surpreender: a explicação não depende do aviso.
  const contas = await page.evaluate(() =>
    [...document.querySelectorAll("#como-calculamos ol > li")].map((li) =>
      (li.textContent ?? "").replace(/\s+/g, " ").trim(),
    ),
  );
  expect(contas[3]).toContain(`minimum of ${cidade.minPanels}`);
});

test("o aviso de estimativa fecha o bloco do cálculo, e não é letra miúda", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const aviso = document.querySelector("#aviso-estimativa");
    if (!aviso) return null;
    const item = aviso.querySelector("li");
    if (!item) return null;
    const estiloDoItem = getComputedStyle(item);
    const caixa = aviso.getBoundingClientRect();
    const forro = document.querySelector("#simulator div.rounded-xl.border")?.getBoundingClientRect();
    const vizinho = document.querySelector("#como-calculamos ol")?.getBoundingClientRect();
    return {
      px: parseFloat(estiloDoItem.fontSize),
      alturaDaLinha: parseFloat(estiloDoItem.lineHeight),
      borda: parseFloat(getComputedStyle(aviso).borderTopWidth),
      foraDoCartao: aviso.closest('[data-slot="card"]') === null,
      abaixoDoResultado: forro ? caixa.top >= forro.bottom - 1 : false,
      dentroDaExplicacao: aviso.closest("#como-calculamos") !== null,
      depoisDasContas: vizinho ? caixa.top >= vizinho.bottom - 1 : false,
      texto: (aviso.textContent ?? "").replace(/\s+/g, " ").trim(),
    };
  });
  expect(m, "não achei o aviso de estimativa").not.toBeNull();
  // Era `microcopy`: 14 px, no pé do cartão, em quatro linhas. Estava pequeno demais para
  // o que precisa dizer, e o que precisa dizer é o que decide se a pessoa confia no número.
  expect(m!.px, "o aviso voltou a ser letra miúda").toBeGreaterThanOrEqual(16);
  expect(m!.alturaDaLinha / m!.px).toBeGreaterThanOrEqual(1.4);
  expect(m!.borda, "o aviso perdeu a caixa própria").toBeGreaterThan(0);
  // Duas correções medidas aqui: o aviso saiu de dentro do
  // cartão do resultado, onde os três blocos ficavam grudados; e depois ficou UM bloco em vez de dois cards. O
  // aviso passou a ser a segunda parte do bloco da explicação: fora do cartão, abaixo do resultado, dentro da
  // caixa do cálculo e depois das seis contas, separado delas por fio de 1 px.
  expect(m!.foraDoCartao, "o aviso voltou para dentro do cartão do resultado").toBe(true);
  expect(m!.abaixoDoResultado, "o aviso subiu para cima do resultado").toBe(true);
  expect(m!.dentroDaExplicacao, "o aviso saiu do bloco da explicação").toBe(true);
  expect(m!.depoisDasContas, "o aviso ficou acima das contas").toBe(true);
  // E as quatro informações seguem ditas: é estimativa, usa a tarifa de referência, não é proposta e o número
  // real varia. A tarifa e as horas de sol em si saíram daqui porque já estão nas contas acima, e o texto agora
  // as nomeia como o que elas são: número de referência da cidade, não o da casa de quem lê.
  expect(m!.texto).toMatch(/estimate/i);
  expect(m!.texto).toMatch(/reference numbers/i);
  // "Não é proposta" está dito com essas palavras, e é a distinção entre estimativa e
  // proposta de verdade.
  expect(m!.texto).toMatch(/not a quote/i);
  expect(m!.texto).toMatch(/shade/i);
});

test("o destaque usa dólar redondo, e a conta detalhada guarda o centavo", async ({ page }) => {
  // Distinção: no cartão do resultado, "$179" e "$14,726" leem como ferramenta; na lista das
  // seis contas, o centavo é o que permite conferir a aritmética. Um número, dois tratamentos, e a diferença é
  // asserção em vez de gosto.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const saida = document.querySelector("#simulator output");
    if (!saida) return null;
    const porTamanho = (px: number) =>
      [...saida.querySelectorAll("p")]
        .filter((p) => parseFloat(getComputedStyle(p).fontSize) === px)
        .map((p) => (p.textContent ?? "").trim());
    const contas = [...document.querySelectorAll("#como-calculamos ol > li")].map((li) =>
      (li.textContent ?? "").replace(/\s+/g, " "),
    );
    return { destaque: porTamanho(48), extrato: porTamanho(20), conta: contas.join(" | ") };
  });
  expect(m, "não achei o bloco de resultado").not.toBeNull();
  // Estado inicial da página, o da tabela de `src/lib/aceitacao.test.ts`: economia de $179,01 e custo de $14.726,25 depois do crédito.
  expect(m!.destaque).toEqual(["$179"]);
  expect(m!.extrato).toContain("$14,726");
  expect(m!.conta).toContain("$179.01");
  expect(m!.conta).toContain("$14,726.25");
  // E o rodapé do cartão diz em quanto a conta fica, também em dólar redondo.
  await expect(page.locator("#simulator output")).toContainText("Your bill goes to about $41 a month");
});

test("com o piso da cidade, a conta separa o arredondamento do mínimo", async ({ page }) => {
  // Defeito encontrado: a frase juntava os dois passos da regra em um só. O cálculo faz
  // Math.max(city.minPanels, Math.ceil(panelsRaw)) — arredonda e depois aplica o piso — e a conta dizia que o
  // sistema "rounds up to 8" (o teto de 6.84 é 7) e que o piso estava abaixo do arredondado (ele está acima).
  // Estado com piso: conta de $90 com 80% pede 6.84 painéis, arredonda para 7, e o mínimo de Phoenix é 8.
  await page.goto("/phoenix-az?bill=90&coverage=80");
  await page.waitForTimeout(600);
  const linha = await page.evaluate(
    () =>
      [...document.querySelectorAll("#como-calculamos li")]
        .map((li) => (li.textContent ?? "").replace(/\s+/g, " ").trim())
        .find((t) => t.includes("of them, and a panel")) ?? "",
  );
  expect(linha, "não achei a linha dos painéis na conta detalhada").not.toBe("");
  // A asserção olha o número e o sentido: copy pode mudar, o número não.
  expect(linha).toMatch(/so that is 7\./);
  expect(linha).toMatch(/minimum of 8 panels/);
  expect(linha).toMatch(/floor is above the rounded number/);
  expect(linha, "a conta voltou a dizer que o arredondamento chegou no piso").not.toMatch(/rounds up to 8\b/);
  expect(linha, "a conta voltou a dizer que o piso está abaixo").not.toMatch(/under the number above/i);
});

test("o aviso do excedente tem espaço entre o valor e a frase", async ({ page }) => {
  // Defeito encontrado: a quebra de linha depois do valor comia o espaço, e a tela imprimia
  // "The extra $1.73goes to Arizona Public Service". Estado com teto: conta de $430 com 100% de cobertura.
  await page.goto("/phoenix-az?bill=430&coverage=100");
  await page.waitForTimeout(600);
  const aviso = await page.evaluate(() =>
    [...document.querySelectorAll("#simulator [role='alert']")]
      .map((e) => (e.textContent ?? "").replace(/\s+/g, " "))
      .join(" || "),
  );
  expect(aviso, "não achei o aviso do excedente").toContain("The extra");
  expect(aviso).toMatch(/The extra \$1\.73 goes to/);
  // E nenhum valor colado em letra em nenhum aviso da tela.
  expect(aviso, "valor colado na palavra seguinte").not.toMatch(/\$[\d.,]+[A-Za-z]/);
});

test("o perfil de residência é atalho, e não formulário", async ({ page }) => {
  // Os quatro cartões com bolinha de rádio pareciam formulário, e o estado escolhido
  // estava fraco. A bolinha saiu; o estado passou a ser o mesmo dos atalhos de cobertura, e esta medida guarda
  // as duas metades: não há rádio, e o escolhido se anuncia.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const antes = await page.evaluate(() => {
    const cartoes = [...document.querySelectorAll("#simulator [data-perfil]")];
    const marcado = cartoes.find((c) => c.getAttribute("aria-pressed") === "true");
    return {
      quantos: cartoes.length,
      radios: document.querySelectorAll('#simulator input[type="radio"], #simulator [role="radio"]').length,
      pressionados: cartoes.filter((c) => c.getAttribute("aria-pressed") === "true").length,
      primeiro: (cartoes[0]?.textContent ?? "").replace(/\s+/g, " ").trim(),
      // O fundo do escolhido, além da borda e do anel: o cartão ativo tem fundo próprio, e este é
      // o par que o resto da página usa (canvas atrás, surface na frente). Nada de tinta cheia.
      fundoDoMarcado: marcado ? getComputedStyle(marcado).backgroundColor : null,
      fundosDosOutros: cartoes
        .filter((c) => c.getAttribute("aria-pressed") !== "true")
        .map((c) => getComputedStyle(c).backgroundColor),
    };
  });
  expect(antes.quantos).toBe(4);
  expect(antes.radios, "a bolinha de rádio voltou ao atalho de perfil").toBe(0);
  // Um só vem escolhido, e é o do estado inicial da página ($220), que NÃO é o primeiro da lista (a conta de $90).
  expect(antes.pressionados, "o cartão do estado inicial não nasceu marcado").toBe(1);
  expect(antes.primeiro).toContain("About $90 a month");
  // Canvas atrás, surface na frente: rgb(247, 246, 243) contra rgb(255, 255, 255).
  expect(antes.fundoDoMarcado, "o cartão escolhido não ganhou o fundo canvas").toBe("rgb(247, 246, 243)");
  for (const fundo of antes.fundosDosOutros) {
    expect(fundo, "um cartão solto saiu do fundo surface").toBe("rgb(255, 255, 255)");
  }

  await clicarCentralizado(page, page.locator("#simulator [data-perfil]").first());
  await page.waitForTimeout(400);
  const depois = await page.evaluate(() =>
    [...document.querySelectorAll("#simulator [data-perfil]")].map((c) => c.getAttribute("aria-pressed")),
  );
  expect(depois.filter((v) => v === "true")).toHaveLength(1);
  expect(depois[0]).toBe("true");
});

test("o simulador abre em $220 com 80%, e com o cartão de três quartos marcado", async ({ page }) => {
  // O ponto de partida é $220 e 80%, a primeira linha da tabela de `src/lib/aceitacao.test.ts`. Esse estado é a conta
  // típica da "Three-bedroom house, no pool", e o cartão dela nasce marcado, com os outros três soltos. Antes nenhum
  // cartão vinha marcado, e a tela não dizia de onde vinha o estado inicial.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const cartoes = [...document.querySelectorAll("#simulator [data-perfil]")];
    return {
      conta: (document.querySelector("#simulator #bill") as HTMLInputElement).value,
      cobertura: (document.querySelector('#simulator input[type="range"]') as HTMLInputElement).value,
      leituraDaCobertura: [...document.querySelectorAll("#simulator .type-lead")].map((e) => e.textContent?.trim()),
      marcados: cartoes
        .map((c, i) => ({ i, texto: (c.textContent ?? "").replace(/\s+/g, " ").trim(), marcado: c.getAttribute("aria-pressed") })),
      // O estado visual que os outros cartões já usam: borda e anel da cor de ação quando `aria-pressed`.
      bordaDoMarcado: cartoes.find((c) => c.getAttribute("aria-pressed") === "true")
        ? getComputedStyle(cartoes.find((c) => c.getAttribute("aria-pressed") === "true")!).borderColor
        : null,
      bordaDosOutros: cartoes
        .filter((c) => c.getAttribute("aria-pressed") !== "true")
        .map((c) => getComputedStyle(c).borderColor),
    };
  });
  expect(m.conta, "a conta não abre em 220").toBe("220");
  expect(m.cobertura, "a cobertura não abre em 80").toBe("80");
  expect(m.leituraDaCobertura, "o valor da cobertura não é mostrado em %").toContain("80%");
  const marcados = m.marcados.filter((c) => c.marcado === "true");
  expect(marcados, `cartões marcados: ${JSON.stringify(marcados)}`).toHaveLength(1);
  expect(marcados[0].texto, "o cartão marcado não é o de três quartos").toContain("Three-bedroom house, no pool");
  expect(marcados[0].texto).toContain("About $220 a month");
  for (const outro of m.bordaDosOutros) {
    expect(outro, "um cartão solto ficou com a borda da cor de ação").not.toBe(m.bordaDoMarcado);
  }
  // Os quatro cartões continuam marcáveis: clicar no primeiro troca a conta E o cartão ativo, e a cobertura fica.
  await clicarCentralizado(page, page.locator("#simulator [data-perfil]").first());
  await page.waitForTimeout(400);
  const depois = await page.evaluate(() => {
    const cartoes = [...document.querySelectorAll("#simulator [data-perfil]")];
    return {
      conta: (document.querySelector("#simulator #bill") as HTMLInputElement).value,
      cobertura: (document.querySelector('#simulator input[type="range"]') as HTMLInputElement).value,
      ativos: cartoes.map((c) => c.getAttribute("aria-pressed")),
    };
  });
  expect(depois.conta, "o cartão clicado não trocou a conta").toBe("90");
  expect(depois.ativos.filter((v) => v === "true")).toEqual(["true"]);
  expect(depois.cobertura, "o cartão clicado mexeu na cobertura").toBe("80");
});

test("os perfis abrem a coluna, com o campo da conta logo abaixo e a cobertura em seguida", async ({ page }) => {
  // Quem chega não sabe a própria conta de cor, então o atalho de perfil passa a abrir a coluna; o
  // campo continua logo abaixo, editável, e a cobertura vem no degrau seguinte. O que se mede é a ORDEM na tela, e
  // não a ordem no arquivo, porque ordem visual é o que importa aqui. A outra metade da regra (escolher um cartão só
  // troca a conta e não devolve a cobertura ao padrão) tem medida própria em `trocar de card de perfil não descarta
  // a cobertura escolhida`.
  for (const largura of [393, 1280]) {
    await page.setViewportSize({ width: largura, height: 900 });
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const conta = document.querySelector("#simulator #bill") as HTMLInputElement | null;
      const cobertura = document.querySelector('#simulator input[type="range"]');
      const perfis = document.querySelector("#simulator [data-perfil]")?.closest("fieldset");
      const caixa = (e: Element | null | undefined) => (e ? e.getBoundingClientRect() : null);
      const c = caixa(conta);
      const o = caixa(cobertura);
      const p = caixa(perfis);
      return {
        perfis: p ? { topo: Math.round(p.top), base: Math.round(p.bottom) } : null,
        conta: c ? { topo: Math.round(c.top), base: Math.round(c.bottom) } : null,
        cobertura: o ? { topo: Math.round(o.top), base: Math.round(o.bottom) } : null,
        editavel: conta ? !conta.disabled && !conta.readOnly : false,
        visivel: c ? c.width > 40 && c.height > 10 : false,
        cartoes: perfis ? perfis.querySelectorAll("[data-perfil]").length : 0,
      };
    });
    expect(m.perfis, `não achei os perfis em ${largura}px`).not.toBeNull();
    expect(m.conta, `não achei o campo da conta em ${largura}px`).not.toBeNull();
    expect(m.cobertura, `não achei a cobertura em ${largura}px`).not.toBeNull();
    expect(m.cartoes, "os quatro perfis não estão todos lá").toBe(4);
    // O input continua editável e visível: a ordem mudou, o campo não.
    expect(m.editavel, `o campo da conta ficou travado em ${largura}px`).toBe(true);
    expect(m.visivel, `o campo da conta sumiu em ${largura}px`).toBe(true);
    expect(m.perfis!.base, `os perfis não estão acima do campo da conta em ${largura}px`).toBeLessThanOrEqual(
      m.conta!.topo,
    );
    expect(
      m.conta!.base,
      `a cobertura não está logo abaixo do campo da conta em ${largura}px`,
    ).toBeLessThanOrEqual(m.cobertura!.topo);
  }
});
