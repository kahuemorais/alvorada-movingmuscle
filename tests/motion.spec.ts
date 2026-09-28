// Measurement of motion, with the two guarantees the design skill requires.
//
// One: nothing animates a layout property. Animating width, height or top makes the browser redo the layout on
// every frame, and it is the classic mistake of whoever animates for the sake of animating.
//
// Two: whoever asked for less motion in the system gets less motion. Motion with no way out is an accessibility
// barrier, not decoration.
import { expect, test } from "@playwright/test";

test("the section appears on scroll, and the box does not change size", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const before = await page.locator("section#steps").boundingBox();
  const animacoes = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .map((e) => getComputedStyle(e).animationName)
      .filter((n) => n && n !== "none"),
  );
  expect(animacoes.length, "no animation on the page").toBeGreaterThan(0);
  // The section box is the same during and after the animation: no animated layout.
  await page.waitForTimeout(600);
  const after = await page.locator("section#steps").boundingBox();
  expect(Math.abs((after?.width ?? 0) - (before?.width ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThanOrEqual(1);
});

test("with reduced motion on, the section is already visible and with no animation", async ({ browser }) => {
  const contexto = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 393, height: 852 } });
  const pageText = await contexto.newPage();
  await pageText.goto("/phoenix-az");
  await pageText.waitForTimeout(400);
  const measures = await pageText.evaluate(() => {
    const section = document.querySelector("section#steps");
    const box = section?.closest("div");
    return {
      opacidade: box ? getComputedStyle(box).opacity : null,
      animation: box ? getComputedStyle(box).animationName : null,
    };
  });
  expect(measures.opacidade).toBe("1");
  expect(measures.animation === "none" || measures.animation === null || measures.animation === "").toBe(true);
  await contexto.close();
});


test("the hero count starts at the floor and never passes through zero", async ({ page }) => {
  // The reason for each half of the rule: the HTML leaves the server with the three final values
  // (1,840, 4.8 and 12), and the count cannot paint a number the server did not say nor pass through zero,
  // which is how the 4.8 rating showed as 0.3 at the beginning, measured frame by frame. Now the count starts at
  // 90% of the value and goes up: 1,656 to 1,840, 4.3 to 4.8, 11 to 12, and it never goes down and never goes back to zero.
  await page.addInitScript(() => {
    (window as unknown as { __quadros: string[] }).__quadros = [];
    const read = () => {
      const dl = document.querySelector("section:has(#hero-title) dl");
      if (dl) (window as unknown as { __quadros: string[] }).__quadros.push(dl.textContent ?? "");
      if ((window as unknown as { __quadros: string[] }).__quadros.length < 60) requestAnimationFrame(read);
    };
    requestAnimationFrame(read);
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
  expect(lidos.length, `only ${lidos.length} frame(s) with the three numbers`).toBeGreaterThan(10);

  // The floor: 90% of the value from the city file, rounded by the component formatter itself.
  const piso = [Math.round(1840 * 0.9), Number((4.8 * 0.9).toFixed(1)), Math.round(12 * 0.9)];
  for (const quadro of lidos) {
    quadro.forEach((value, i) => {
      expect(value, `a frame painted ${value} at number ${i + 1}, below the floor ${piso[i]}`).toBeGreaterThanOrEqual(piso[i]);
    });
  }
  // The count goes up, never down and never back to zero. The first frame below the final value is the floor: before it
  // is the value the server delivered, which stays on the screen between the HTML paint and the hydration.
  const start = lidos.findIndex((quadro) => quadro[0] < 1840);
  expect(start, "the count did not start: no frame below the final value").toBeGreaterThan(-1);
  const contagem = lidos.slice(start);
  expect(contagem.length).toBeGreaterThan(5);
  for (let i = 1; i < contagem.length; i += 1) {
    contagem[i].forEach((value, j) => {
      expect(value, `the count went down from ${contagem[i - 1][j]} to ${value} at number ${j + 1}`).toBeGreaterThanOrEqual(contagem[i - 1][j]);
    });
  }
  // The first frame of the count is the floor, and the last is the value from the city file, which the server delivered.
  expect(contagem[0]).toEqual(piso);
  expect(contagem.at(-1)).toEqual([1840, 4.8, 12]);
});

test("the hero background does not eat the action click, and does not animate", async ({ page }) => {
  // Two guarantees at once: the background asset cannot sit between the finger and the button, and the grid and the
  // glow are static, so there is no new animation for whoever asked for less motion.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const target = page.locator("section:has(#hero-title) a[href='#simulator']").first();
  await target.click();
  await page.waitForTimeout(400);
  expect(new URL(page.url()).hash).toBe("#simulator");

  const background = page.locator('[data-background="hero"]');
  await expect(background).toHaveCSS("pointer-events", "none");
  await expect(background).toHaveCSS("animation-name", "none");
});

