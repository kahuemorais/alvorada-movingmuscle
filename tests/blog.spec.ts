import { expect, test } from "@playwright/test";

// The blog gained decoration: a band with the opening photo on the index, reading time calculated from the
// body, the first card featured and numbered sections in the text. Each of these tests pins one of those
// decisions, and without them the next touch on the visual drops the decoration and nothing warns.

const INDEX = "/blog";
const TEXT = "/blog/how-to-read-your-solar-estimate";

test("the index opens with the photo band, and the light text reads over the pixels", async ({ page }) => {
  // The band reuses the photo and the veil of the city page opening, but the crop is another one: the band is low, so the
  // text lands on the light part of the photo. That is why the measurement is over the PIXELS, and not over a background color that does not
  // exist here, and why it is made at both widths, because the crop changes with the width.
  for (const width of [
    { width: 1280, height: 900 },
    { width: 393, height: 852 },
  ]) {
    await page.setViewportSize(width);
    await page.goto(INDEX);
    await page.waitForTimeout(500);
    const photo = (await page.screenshot()).toString("base64");
    const measures = await page.evaluate(async ({ photo }) => {
      const linear = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const luminanceOf = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
      const img = new Image();
      img.src = "data:image/png;base64," + photo;
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
        return luminanceOf(r / n, g / n, b / n);
      };
      const colorOf = (el: Element) => {
        const s = document.createElement("canvas").getContext("2d")!;
        s.fillStyle = "#ffffff";
        s.fillRect(0, 0, 1, 1);
        s.fillStyle = getComputedStyle(el).color;
        s.fillRect(0, 0, 1, 1);
        const d = s.getImageData(0, 0, 1, 1).data;
        return luminanceOf(d[0], d[1], d[2]);
      };
      const header = document.querySelector("main header")!;
      const box = header.getBoundingClientRect();
      const output: Record<string, number> = {};
      const alvos: [string, string][] = [
        ["title", "h1"],
        ["frase", "p.type-body"],
      ];
      for (const [key, seletor] of alvos) {
        const el = header.querySelector(seletor);
        if (!el) continue;
        const c = el.getBoundingClientRect();
        // The sample comes from the breathing area next to the text, which is what the text would have behind it if it did not exist.
        const x = Math.max(Math.min(Math.round(c.right + 16), Math.round(box.right - 30)), 2);
        const background = media(x, Math.round(c.y + c.height / 2 - 6), 16, 12);
        const [high, low] = [background, colorOf(el)].sort((a, z) => z - a);
        output[key] = Math.round(((high + 0.05) / (low + 0.05)) * 100) / 100;
      }
      return output;
    }, { photo });
    expect(measures.title, `title at ${width.width}px measured ${measures.title}`).toBeGreaterThanOrEqual(4.5);
    expect(measures.frase, `phrase at ${width.width}px measured ${measures.frase}`).toBeGreaterThanOrEqual(4.5);
  }
});

test("the first card of the index takes the two columns, and the others do not", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(INDEX);
  await page.waitForTimeout(400);
  const widths = await page.locator("main ul li").evaluateAll((cards) =>
    cards.map((c) => Math.round(c.getBoundingClientRect().width)),
  );
  expect(widths.length).toBeGreaterThan(1);
  // In two columns, the featured one takes the whole row: its width is double that of the neighbors, and not a
  // number written in the test, so the assertion keeps holding if the grid changes width.
  expect(widths[0]).toBeGreaterThan(widths[1] * 1.8);
  for (const width of widths.slice(1)) expect(width).toBeCloseTo(widths[1], -1);
});

test("each card shows the reading time, calculated from the text", async ({ page }) => {
  // The time is a computation, and not hand-written text: what this test pins is that it reaches the screen with the icon, and
  // that it is not always the same number, because a constant would pass any format check.
  await page.goto(INDEX);
  const readings = await page.locator("main ul li").evaluateAll((cards) =>
    cards.map((c) => {
      const line = [...c.querySelectorAll("p")].find((p) => /min read/.test(p.textContent ?? ""));
      return {
        text: line?.textContent?.trim() ?? "",
        hasIcon: Boolean(line?.querySelector("svg")),
      };
    }),
  );
  expect(readings.length).toBeGreaterThan(1);
  for (const reading of readings) {
    expect(reading.text, `card with no reading time: ${reading.text}`).toMatch(/\d+ min read/);
    expect(reading.hasIcon, `reading time with no icon: ${reading.text}`).toBe(true);
  }
  const numbers = readings.map((l) => Number(l.text.match(/(\d+) min/)![1]));
  expect(new Set(numbers).size).toBeGreaterThan(1);
});

test("the sections of the text are numbered, in the order they appear", async ({ page }) => {
  await page.goto(TEXT);
  const measurements = await page.locator("article h2").evaluateAll((titles) => {
    const numerados = titles
      .map((title) => {
        const circulo = title.querySelector("span");
        if (!circulo) return null;
        const c = circulo.getBoundingClientRect();
        const t = title.getBoundingClientRect();
        // The title text is a text node next to the circle, so its position comes from a Range: comparing
        // with the edge of the h2 itself would say nothing, because the circle is INSIDE it and the two lefts
        // coincide by construction.
        const postNode = [...title.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim());
        const alcance = document.createRange();
        if (postNode) alcance.selectNodeContents(postNode);
        const text = alcance.getBoundingClientRect();
        const style = getComputedStyle(circulo);
        const luminancia = (color: string) => {
          const canais = color.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
          const linear = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * linear(canais[0]) + 0.7152 * linear(canais[1]) + 0.0722 * linear(canais[2]);
        };
        return {
          number: (circulo.textContent ?? "").trim(),
          // The circle sits on the same line as the title and the text starts after it.
          alinhado: Math.abs(c.top - t.top) < c.height,
          textAfterCircle: Boolean(postNode) && text.left >= c.right - 1,
          redondo: Math.round(c.width) === Math.round(c.height),
          // Light background, dark number and a discreet border. The first drawing was a dark circle
          // with a golden number, and it came out heavy. Weight is judgment, so the test pins what is measurable: the
          // background lighter than the number, and a border that is visible but the thickness of a thread.
          backgroundLighterThanNumber: luminancia(style.backgroundColor) > luminancia(style.color),
          hasBorder: parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== "none",
          bordaDiscreta: parseFloat(style.borderTopWidth) <= 2,
        };
      })
      .filter((n) => n !== null);
    return numerados;
  });
  expect(measurements.length).toBeGreaterThan(3);
  measurements.forEach((m, index) => {
    expect(m!.number, `section ${index + 1} with no number`).toBe(String(index + 1));
    expect(m!.alinhado, `number of section ${index + 1} outside the title line`).toBe(true);
    expect(m!.textAfterCircle, `text of section ${index + 1} does not start after the number`).toBe(true);
    expect(m!.redondo, `number of section ${index + 1} is not in a circle`).toBe(true);
    expect(m!.backgroundLighterThanNumber, `number of section ${index + 1} is not dark over a light background`).toBe(true);
    expect(m!.hasBorder, `number of section ${index + 1} with no border`).toBe(true);
    expect(m!.bordaDiscreta, `border of the number of section ${index + 1} too thick`).toBe(true);
  });
});

test("the reading time also appears in the credit line of the text", async ({ page }) => {
  await page.goto(TEXT);
  const credito = await page.locator("article header p").last().innerText();
  expect(credito).toMatch(/\d+ min read/);
  expect(credito).toContain("Published");
});
