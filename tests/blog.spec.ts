import { expect, test } from "@playwright/test";

// O blog ganhou enfeite: faixa com a foto da abertura no índice, tempo de leitura calculado do
// corpo, primeiro cartão em destaque e seções numeradas no texto. Cada um destes testes prende uma dessas
// decisões, e sem eles a próxima mexida no visual derruba o enfeite e nada avisa.

const INDICE = "/blog";
const TEXTO = "/blog/how-to-read-your-solar-estimate";

test("o índice abre com a faixa da foto, e o texto claro lê sobre os pixels", async ({ page }) => {
  // A faixa reusa a foto e o véu da abertura da página de cidade, mas o recorte é outro: a faixa é baixa, então o
  // texto pega a parte clara da foto. Por isso a medida é sobre os PIXELS, e não sobre uma cor de fundo que aqui
  // não existe — e por isso ela é feita nas duas larguras, porque o recorte muda com a largura.
  for (const largura of [
    { width: 1280, height: 900 },
    { width: 393, height: 852 },
  ]) {
    await page.setViewportSize(largura);
    await page.goto(INDICE);
    await page.waitForTimeout(500);
    const foto = (await page.screenshot()).toString("base64");
    const medidas = await page.evaluate(async ({ foto }) => {
      const linear = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const lumDe = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
      const img = new Image();
      img.src = "data:image/png;base64," + foto;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const media = (x: number, y: number, w: number, h: number) => {
        const d = ctx.getImageData(x, y, w, h).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i];
          g += d[i + 1];
          b += d[i + 2];
          n++;
        }
        return lumDe(r / n, g / n, b / n);
      };
      const corDe = (el: Element) => {
        const s = document.createElement("canvas").getContext("2d")!;
        s.fillStyle = "#ffffff";
        s.fillRect(0, 0, 1, 1);
        s.fillStyle = getComputedStyle(el).color;
        s.fillRect(0, 0, 1, 1);
        const d = s.getImageData(0, 0, 1, 1).data;
        return lumDe(d[0], d[1], d[2]);
      };
      const cabecalho = document.querySelector("main header")!;
      const caixa = cabecalho.getBoundingClientRect();
      const saida: Record<string, number> = {};
      const alvos: [string, string][] = [
        ["titulo", "h1"],
        ["frase", "p.type-body"],
      ];
      for (const [chave, seletor] of alvos) {
        const el = cabecalho.querySelector(seletor);
        if (!el) continue;
        const c = el.getBoundingClientRect();
        // A amostra sai da área de respiro ao lado do texto, que é o que o texto teria atrás se ele não existisse.
        const x = Math.max(Math.min(Math.round(c.right + 16), Math.round(caixa.right - 30)), 2);
        const fundo = media(x, Math.round(c.y + c.height / 2 - 6), 16, 12);
        const [alto, baixo] = [fundo, corDe(el)].sort((a, z) => z - a);
        saida[chave] = Math.round(((alto + 0.05) / (baixo + 0.05)) * 100) / 100;
      }
      return saida;
    }, { foto });
    expect(medidas.titulo, `título em ${largura.width}px mediu ${medidas.titulo}`).toBeGreaterThanOrEqual(4.5);
    expect(medidas.frase, `frase em ${largura.width}px mediu ${medidas.frase}`).toBeGreaterThanOrEqual(4.5);
  }
});

test("o primeiro cartão do índice ocupa as duas colunas, e os outros não", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(INDICE);
  await page.waitForTimeout(400);
  const larguras = await page.locator("main ul li").evaluateAll((cartoes) =>
    cartoes.map((c) => Math.round(c.getBoundingClientRect().width)),
  );
  expect(larguras.length).toBeGreaterThan(1);
  // Em duas colunas, o destacado ocupa a linha inteira: a largura dele é o dobro da dos vizinhos, e não um
  // número escrito no teste — assim a asserção continua valendo se a grade mudar de largura.
  expect(larguras[0]).toBeGreaterThan(larguras[1] * 1.8);
  for (const largura of larguras.slice(1)) expect(largura).toBeCloseTo(larguras[1], -1);
});

test("cada cartão mostra o tempo de leitura, calculado do texto", async ({ page }) => {
  // O tempo é conta, e não texto escrito à mão: o que este teste prende é que ele chega à tela com o ícone, e
  // que não é sempre o mesmo número — constante passaria por qualquer verificação de formato.
  await page.goto(INDICE);
  const leituras = await page.locator("main ul li").evaluateAll((cartoes) =>
    cartoes.map((c) => {
      const linha = [...c.querySelectorAll("p")].find((p) => /min read/.test(p.textContent ?? ""));
      return {
        texto: linha?.textContent?.trim() ?? "",
        temIcone: Boolean(linha?.querySelector("svg")),
      };
    }),
  );
  expect(leituras.length).toBeGreaterThan(1);
  for (const leitura of leituras) {
    expect(leitura.texto, `cartão sem tempo de leitura: ${leitura.texto}`).toMatch(/\d+ min read/);
    expect(leitura.temIcone, `tempo de leitura sem ícone: ${leitura.texto}`).toBe(true);
  }
  const numeros = leituras.map((l) => Number(l.texto.match(/(\d+) min/)![1]));
  expect(new Set(numeros).size).toBeGreaterThan(1);
});

test("as seções do texto são numeradas, na ordem em que aparecem", async ({ page }) => {
  await page.goto(TEXTO);
  const medicoes = await page.locator("article h2").evaluateAll((titulos) => {
    const numerados = titulos
      .map((titulo) => {
        const circulo = titulo.querySelector("span");
        if (!circulo) return null;
        const c = circulo.getBoundingClientRect();
        const t = titulo.getBoundingClientRect();
        // O texto do título é um nó de texto ao lado do círculo, então a posição dele sai de um Range: comparar
        // com a borda do próprio h2 não diria nada, porque o círculo está DENTRO dele e as duas esquerdas
        // coincidem por construção.
        const noDeTexto = [...titulo.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim());
        const alcance = document.createRange();
        if (noDeTexto) alcance.selectNodeContents(noDeTexto);
        const texto = alcance.getBoundingClientRect();
        const estilo = getComputedStyle(circulo);
        const luminancia = (cor: string) => {
          const canais = cor.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
          const linear = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * linear(canais[0]) + 0.7152 * linear(canais[1]) + 0.0722 * linear(canais[2]);
        };
        return {
          numero: (circulo.textContent ?? "").trim(),
          // O círculo fica na mesma linha do título e o texto começa depois dele.
          alinhado: Math.abs(c.top - t.top) < c.height,
          textoDepoisDoCirculo: Boolean(noDeTexto) && texto.left >= c.right - 1,
          redondo: Math.round(c.width) === Math.round(c.height),
          // Fundo claro, número escuro e borda discreta. O primeiro desenho era círculo escuro
          // com número dourado, e ficou pesado. Peso é julgamento, então o teste prende o que é medível: o
          // fundo mais claro que o número, e uma borda visível mas da espessura de um fio.
          fundoMaisClaroQueNumero: luminancia(estilo.backgroundColor) > luminancia(estilo.color),
          temBorda: parseFloat(estilo.borderTopWidth) > 0 && estilo.borderTopStyle !== "none",
          bordaDiscreta: parseFloat(estilo.borderTopWidth) <= 2,
        };
      })
      .filter((n) => n !== null);
    return numerados;
  });
  expect(medicoes.length).toBeGreaterThan(3);
  medicoes.forEach((m, indice) => {
    expect(m!.numero, `seção ${indice + 1} sem número`).toBe(String(indice + 1));
    expect(m!.alinhado, `número da seção ${indice + 1} fora da linha do título`).toBe(true);
    expect(m!.textoDepoisDoCirculo, `texto da seção ${indice + 1} não começa depois do número`).toBe(true);
    expect(m!.redondo, `número da seção ${indice + 1} não está em círculo`).toBe(true);
    expect(m!.fundoMaisClaroQueNumero, `número da seção ${indice + 1} não está escuro sobre fundo claro`).toBe(true);
    expect(m!.temBorda, `número da seção ${indice + 1} sem borda`).toBe(true);
    expect(m!.bordaDiscreta, `borda do número da seção ${indice + 1} grossa demais`).toBe(true);
  });
});

test("o tempo de leitura também aparece na linha de crédito do texto", async ({ page }) => {
  await page.goto(TEXTO);
  const credito = await page.locator("article header p").last().innerText();
  expect(credito).toMatch(/\d+ min read/);
  expect(credito).toContain("Published");
});
