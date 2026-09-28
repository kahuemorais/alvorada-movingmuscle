import { expect, test } from "@playwright/test";

// O requisito de negócio: na segunda-feira, quem cuida das campanhas precisa saber quais anúncios
// geraram simulações de economia. Pageview não responde isso, então o evento leva a origem junto dos números.
//
// Este teste existe porque o defeito morava exatamente no vão entre as duas metades: o módulo de analytics sabia
// ler a tag da busca, e o teste de unidade dele prova isso com a busca na mão. Só que o simulador reescreve a URL
// a cada ajuste (`replaceState` com bill e coverage), e os eventos liam `window.location.search` no momento de
// disparar — quando as tags já tinham sido apagadas. A função estava certa e o evento chegava vazio. É o tipo de
// defeito que só aparece com a página inteira rodando, que é o que este arquivo faz.
const COM_CAMPANHA = "/phoenix-az?utm_source=google&utm_medium=cpc&utm_campaign=phoenix-solar&gclid=abc123";

async function comFila(page: import("@playwright/test").Page) {
  // A fila do `va` é a mesma porta que o @vercel/analytics usa; a página não serve o script dele no ambiente
  // local, então a fila fica nossa e o teste lê o que a aplicação mandou.
  await page.addInitScript(() => {
    (window as unknown as { __va: unknown[] }).__va = [];
    (window as unknown as { va: (cmd: string, dados: unknown) => void }).va = (cmd, dados) => {
      (window as unknown as { __va: unknown[] }).__va.push({ cmd, dados });
    };
  });
}

const eventos = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __va: { cmd: string; dados: { name?: string; data?: Record<string, unknown> } }[] })
        .__va ?? [],
  );

async function mexerNoSimulador(page: import("@playwright/test").Page, conta: number) {
  const campo = page.locator("#simulator input#bill");
  await campo.click();
  await campo.fill(String(conta));
  await campo.blur();
  // A espera é a do próprio código: o evento só sai depois que a pessoa para de mexer, para não contar cada
  // passo do controle como uma simulação no relatório da equipe de mídia.
  await page.waitForTimeout(1800);
}

test("o evento da simulação leva a campanha, mesmo depois de a URL perder as tags", async ({ page }) => {
  await comFila(page);
  await page.goto(COM_CAMPANHA);
  await page.waitForTimeout(600);
  await mexerNoSimulador(page, 310);

  const fila = await eventos(page);
  const concluido = fila.filter((e) => e.cmd === "event" && e.dados?.name === "simulation_completed").pop();
  expect(concluido, "nenhum evento simulation_completed").toBeTruthy();

  const dados = concluido!.dados.data ?? {};
  // Os quatro números da simulação continuam no evento: é o que o time usa para decidir o que pausar.
  expect(dados.panels).toBe(24);
  expect(dados.bill).toBe(310);
  // E a origem, que é o ponto do requisito.
  expect(dados.utm_source, "evento sem utm_source").toBe("google");
  expect(dados.utm_medium, "evento sem utm_medium").toBe("cpc");
  expect(dados.utm_campaign, "evento sem utm_campaign").toBe("phoenix-solar");
  expect(dados.gclid, "evento sem gclid").toBe("abc123");

  // A URL perdeu as tags ao ajustar o controle, e isso é de propósito: o link compartilhado leva a simulação.
  expect(await page.evaluate(() => window.location.search)).not.toContain("utm_source");
});

test("a campanha sobrevive a uma segunda visita na mesma sessão", async ({ page }) => {
  // O módulo guarda a origem na sessão justamente porque a pessoa rola a página e mexe no simulador depois. Sem
  // esta guarda, a segunda visita dentro da mesma sessão mandaria o evento sem a tag, e o relatório da agência
  // contaria a simulação como tráfego direto.
  await comFila(page);
  await page.goto(COM_CAMPANHA);
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForTimeout(600);
  await mexerNoSimulador(page, 430);

  const fila = await eventos(page);
  const concluido = fila.filter((e) => e.cmd === "event" && e.dados?.name === "simulation_completed").pop();
  const dados = concluido?.dados.data ?? {};
  expect(dados.utm_campaign, "a campanha se perdeu na recarga").toBe("phoenix-solar");
});

test("sem campanha na URL, o evento não inventa origem", async ({ page }) => {
  await comFila(page);
  await page.goto("/phoenix-az");
  await page.waitForTimeout(600);
  await mexerNoSimulador(page, 310);

  const fila = await eventos(page);
  const concluido = fila.filter((e) => e.cmd === "event" && e.dados?.name === "simulation_completed").pop();
  const dados = concluido?.dados.data ?? {};
  expect(dados.panels).toBe(24);
  for (const chave of ["utm_source", "utm_medium", "utm_campaign", "gclid", "fbclid"]) {
    expect(dados[chave], `evento sem campanha ganhou ${chave}`).toBeUndefined();
  }
});
