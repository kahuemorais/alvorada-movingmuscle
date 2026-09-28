// Measure of the visual assets the page carries, so the flatness cannot come back unnoticed.
//
// Starting measurement: zero gradient and zero image across 6.434 px of height on mobile. Only solid color and
// border, which was the flatness visible on the screen.
import { expect, test } from "@playwright/test";

test("the pageText has a service photo, and not just solid color", async ({ page }) => {
  await page.goto("/phoenix-az");
  // With the photos below the fold, all of them are `loading="lazy"`: the page is scrolled and the wait is for the files,
  // with a second scrolling pass while any is still missing. Without that, the measure fails a photo that simply has not
  // been requested from the server yet.
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
  expect(faltando, `photos that did not load: ${faltando.join(", ")}`).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const measures = await page.evaluate(() => {
    // The photo is what takes up scene space: the icons on the page are small and counting them would prove nothing.
    const scene = [...document.querySelectorAll("img")].filter((s) => s.getBoundingClientRect().width > 300);
    const gradientes = [...document.querySelectorAll("body *")].filter((e) =>
      getComputedStyle(e).backgroundImage.includes("gradient"),
    );
    return {
      scene: scene.length,
      largestScene: scene.length ? Math.round(Math.max(...scene.map((s) => s.getBoundingClientRect().width))) : 0,
      carregada: scene.every((s) => (s as HTMLImageElement).naturalWidth > 0),
      gradientes: gradientes.length,
      height: document.body.scrollHeight,
    };
  });
  expect(measures.scene, "no scene photo on the page").toBeGreaterThanOrEqual(1);
  expect(measures.carregada, "the scene photo did not load").toBe(true);
  // The opening no longer has a gradient veil since it became a block of ink with the photo beside it, and the page
  // uses no gradient anywhere now. The rule from the skill is that a gradient, when it exists, is functional, and not
  // that it must exist: requiring a gradient here would guard a resource the design abandoned.
  // And the scene shows up at scene size, not squeezed into a corner.
  expect(measures.largestScene).toBeGreaterThan(300);
});

test("the page photos go through a local path, and not through a third party", async ({ page }) => {
  // Serving the photo from our own domain avoids a request to a third party and keeps the security policy closed, which
  // here forbids an outside image. This test guards that decision; the name used to mention only the opening photo, which no longer
  // exists, and the guard applies to every image on the page.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const origins = await page.evaluate(() =>
    [...document.querySelectorAll("img")].map((i) => new URL((i as HTMLImageElement).src).origin),
  );
  const proprio = new URL(page.url()).origin;
  expect(origins.length).toBeGreaterThan(0);
  for (const o of origins) expect(o, "image served by a third party").toBe(proprio);
});


test("on desktop the hero is a column centered over ink, with no photo", async ({ page }) => {
  // Composition: text centered over solid color, and nothing else. The photo that sat in a band below
  // the panel is gone because it got in the way of the new design, so the measure lost the photo assertions and
  // gained the one that guards the decision: the opening has no image at all. The rest stays: the text over its own color,
  // and the band of numbers with the three dividers.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    const title = document.querySelector("#hero-title");
    const band = hero?.querySelector("dl");
    const pintura = document.createElement("canvas").getContext("2d");
    const color = (e: Element) => {
      pintura!.fillStyle = "#ffffff";
      pintura!.fillStyle = getComputedStyle(e).backgroundColor;
      return String(pintura!.fillStyle);
    };
    if (!hero || !title || !band) return null;
    const h = hero.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    const block = title.closest("div");
    return {
      imagens: hero.querySelectorAll("img").length,
      textBackground: block ? color(block) : null,
      pageBackground: color(document.body),
      centerOffset: Math.round(Math.abs(t.x + t.width / 2 - (h.x + h.width / 2))),
      divisoes: band.querySelectorAll("div[class*=border-l]").length,
      items: band.querySelectorAll("dd").length,
    };
  });
  expect(m, "did not find the hero").not.toBeNull();
  expect(m!.imagens, "the hero has an image again").toBe(0);
  expect(m!.textBackground, "the text is not over its own solid color").not.toBe(m!.pageBackground);
  expect(m!.centerOffset, `the title is ${m!.centerOffset}px off the center of the opening`).toBeLessThanOrEqual(4);
  expect(m!.items, "the band of numbers does not have three items").toBe(3);
  expect(m!.divisoes, "the band of numbers does not have the thin dividers").toBe(2);
});

test("on mobile the hero is the column centered on the screen width, with no photo", async ({ page }) => {
  // The mobile measure used to be about the photo in a band, which is gone. What it guards now is the new design at narrow
  // width: the panel fills the screen, the title is centered, and nothing overflows the width.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    const panel = hero?.querySelector(":scope > div");
    const title = document.querySelector("#hero-title");
    if (!hero || !panel || !title) return null;
    const h = hero.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    // The band of three numbers has to fit in ONE line: with `flex-wrap` the third one dropped down, which was the
    // defect reported on mobile.
    const numbers = [...hero.querySelectorAll("dl > div")].map((d) => Math.round(d.getBoundingClientRect().top));
    return {
      imagens: hero.querySelectorAll("img").length,
      panelAtWidth: Math.round((p.width / h.width) * 100),
      centerOffset: Math.round(Math.abs(t.x + t.width / 2 - (p.x + p.width / 2))),
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      numbers: numbers,
      // The title drops one step on mobile, and that is what decides the height of the opening: at 56 px, in the
      // 345 px column, the 70 character headline broke into SEVEN lines and pushed the panel to 953 px, taller than
      // the screen. At 40 px it breaks into five. Without this measure, the display can go back to mobile with nothing failing.
      titlePx: parseFloat(getComputedStyle(title).fontSize),
      titleLines: Math.round(t.height / parseFloat(getComputedStyle(title).lineHeight)),
    };
  });
  expect(m, "did not find the hero on mobile").not.toBeNull();
  expect(m!.imagens, "the hero has an image again").toBe(0);
  // One step below desktop, and not half a step: the type has to be one of the steps declared in DESIGN.md.
  expect(m!.titlePx, "the title went back to the display step on mobile").toBe(40);
  expect(m!.titleLines, `the title takes ${m!.titleLines} lines on mobile`).toBeLessThanOrEqual(5);
  expect(m!.panelAtWidth, `the panel takes ${m!.panelAtWidth}% of the opening`).toBeGreaterThanOrEqual(95);
  expect(m!.centerOffset, `the title is ${m!.centerOffset}px off the center`).toBeLessThanOrEqual(4);
  expect(m!.overflowX, "the hero overflowed the width on mobile").toBe(0);
  expect(m!.numbers, `the three numbers start at heights ${m!.numbers.join(", ")}`).toHaveLength(3);
  const sameLine = Math.max(...m!.numbers) - Math.min(...m!.numbers) <= 2;
  expect(sameLine, `the three numbers are not on the same line: ${m!.numbers.join(", ")}`).toBe(true);
});

test("the site typography is not the one every generator uses", async ({ page }) => {
  // The skill scanner classifies Inter, Roboto, Geist, Plus Jakarta and Space Grotesk as worn out, because every
  // interface generator converges on them. This measure guards the swap so the font does not come back by oversight,
  // which is the kind of change that slips through code review.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const familia = await page.evaluate(() => getComputedStyle(document.body).fontFamily.toLowerCase());
  expect(familia, `measured family: ${familia}`).toContain("archivo");
  for (const gasta of ["inter", "roboto", "geist", "plus jakarta", "space grotesk"]) {
    expect(familia.includes(gasta), `the font ${gasta} came back`).toBe(false);
  }
});


test("the simulator has a panel fill", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const panel = page.locator("#simulator div.rounded-xl.border").first();
  await expect(panel).toBeVisible();
  const background = await panel.evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
});


test("the featured testimonial is taller than the other two", async ({ page }) => {
  // The first version made the featured card take two columns and it came out stretched, with a gap
  // beside it. Now the featured card takes the height of both, with the others stacked in the neighboring column.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const heights = await page.evaluate(() =>
    [...document.querySelectorAll("#proof [class*=rounded]")]
      .map((e) => Math.round(e.getBoundingClientRect().height))
      .filter((h) => h > 80),
  );
  expect(heights.length, `measured heights: ${heights.join(", ")}`).toBeGreaterThanOrEqual(3);
  const featured = Math.max(...heights);
  const menores = heights.filter((h) => h < featured);
  expect(menores.length).toBeGreaterThanOrEqual(2);
  expect(featured, "the featured card is no longer taller than the others").toBeGreaterThan(Math.max(...menores));
});

test("the questions sit in two columns on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const title = document.querySelector("#faq-title")?.getBoundingClientRect();
    // The selector is the stable marker of the accordion, and not a list of loose patterns: `div[class*=flex]`
    // started matching the box that wraps the eyebrow and the title when the block gained an ornament, and the
    // measure reported "side by side" while looking at the column of the title itself.
    const list = document.querySelector('#faq [data-slot="accordion"]');
    return { title: title ? Math.round(title.left) : null, list: list ? Math.round(list.getBoundingClientRect().left) : null };
  });
  expect(m.list).not.toBeNull();
  expect(m.list!, "the title and the list did not end up side by side").toBeGreaterThan(m.title!);
});

test("the final band is taken over by the action color, and the photo does not erase it", async ({ page }) => {
  // The band remains the action color at the BASE (it is what shows if the photo fails to load), and on top of it came the photo
  // with a veil. The contrast of its text is now measured over the PIXELS, in its own probe
  // (`the closing text has contrast measured over the pixels of the photo`), because against the declared color of the section the calculation
  // measures the wrong background. That is how it returned 2 to 1 after the change.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const section = document.querySelector("#book") as HTMLElement;
    const layers = [...section.children]
      .filter((c) => getComputedStyle(c).position === "absolute")
      .map((c) => getComputedStyle(c).backgroundImage);
    return {
      background: getComputedStyle(section).backgroundColor,
      layers,
    };
  });
  expect(m.background).not.toBe("rgba(0, 0, 0, 0)");
  // The two background layers, in the order they paint: the photo and the ink veil over it.
  expect(m.layers.length, `the band lost the background layers: ${JSON.stringify(m.layers)}`).toBeGreaterThanOrEqual(2);
  expect(m.layers[0]).toContain("panels-in-desert.avif");
  expect(m.layers[1]).toContain("linear-gradient");
});


test("the featured testimonial stands out by border, with the text centered", async ({ page }) => {
  // The featured card had to stand out from the other two, and the text could not sit against the
  // top of a tall card. The distinction started as background color and border in the action color, moved to the secondary and
  // came back; with the photos, the background color went away, because without the house inside the card it was
  // a smudge: the border and the quote mark stayed. The centering lives in the content, and not in the card, which was the mistake
  // of the first attempt: measured at 266 px on top against 154 at the bottom.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    // The featured card is chosen by the border in the action color, which is deterministic. The first version chose "the tallest
    // card", and after the background change that started pointing at another element: the measure reported a contrast
    // of 1.18 because it was measuring a transparent box, not the featured card.
    const cards = [...document.querySelectorAll("#proof [class*=rounded]")].filter(
      (e) => e.getBoundingClientRect().height > 120,
    );
    const featured = cards.find((e) => (e.className || "").toString().includes("border-primary"));
    const outro = cards.find((e) => !(e.className || "").toString().includes("border-primary"));
    if (!featured || !outro) return null;
    const c = getComputedStyle(featured);
    const o = getComputedStyle(outro);
    const normalizar = (color: string) => {
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return color;
      ctx.fillStyle = "#ffffff";
      ctx.fillStyle = color;
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
    const citacao = featured.querySelector("blockquote");
    const legenda = [...featured.querySelectorAll("p")].find((p) => (p.textContent ?? "").includes(","));
    const background = c.backgroundColor;
    const box = featured.getBoundingClientRect();
    const conteudo = featured.querySelector("[class*=CardContent], [class*=flex]");
    const cb = conteudo?.getBoundingClientRect();
    return {
      featuredBackground: c.backgroundColor,
      otherBackground: o.backgroundColor,
      bordaDestaque: c.borderColor,
      otherBorder: o.borderColor,
      backgroundDifference: Math.round(Math.abs(lum(background) - lum(o.backgroundColor)) * 100) / 100,
      contrasteCitacao: citacao ? contraste(background, getComputedStyle(citacao).color) : null,
      contrasteLegenda: legenda ? contraste(background, getComputedStyle(legenda).color) : null,
      above: cb ? Math.round(cb.top - box.top) : null,
      below: cb ? Math.round(box.bottom - cb.bottom) : null,
    };
  });
  expect(m, "did not find the testimonials").not.toBeNull();
  // The background wash (`bg-primary/25`) left the featured card: without the house inside the card it became
  // a smudge with no purpose, and what now sets the featured card apart is the border in the action color, with the quote mark inside.
  // The two halves of that are measured: background EQUAL to the other cards and border DIFFERENT.
  expect(m!.featuredBackground, "the featured card picked up a background wash again").toBe(m!.otherBackground);
  for (const [label, r] of [["quote", m!.contrasteCitacao], ["caption", m!.contrasteLegenda]] as const) {
    expect(r, `contrast of the ${label} over the featured card: ${r}`).toBeGreaterThanOrEqual(4.5);
  }
  expect(m!.bordaDestaque, "the featured card has no border of its own").not.toBe(m!.otherBorder);
  expect(
    Math.abs((m!.above ?? 0) - (m!.below ?? 0)),
    `space above ${m!.above} and below ${m!.below}`,
  ).toBeLessThanOrEqual(40);
});


test("no accordion answer is cut off on mobile", async ({ page }) => {
  // Reported defect: answers 1, 4 and 5 appeared cut in half on mobile. Cause: the content had a height
  // locked to the variable Radix measures, and the parent has overflow hidden, so an answer taller than the measured
  // value lost its end. The height belongs to the animation frames, not to the element at rest.
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
        .map((e) => ({ tag: e.tagName, remainder: e.scrollHeight - Math.round(e.getBoundingClientRect().height) }))
        .filter((x) => x.remainder > 2);
    });
    expect(cortado, `question ${i + 1} with cut text: ${JSON.stringify(cortado)}`).toEqual([]);
    await gatilhos.nth(i).click();
    await page.waitForTimeout(300);
  }
});


test("every photo on the page has a declared dimension and loads", async ({ page }) => {
  // A photo is proof of service, and proof has to load for real. Declared width and height stop it from pushing
  // the content when it finishes downloading, which is the most common layout defect with an image. With the six photos, the
  // measure left the foot of the social proof and now applies to EVERY image on the page, which is where the defect can
  // come back now that there are six.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  // Walks the page and waits for each file: the photos are `loading="lazy"` and the lower ones only load when they get close.
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
  expect(faltando, `photos that did not load: ${faltando.join(", ")}`).toEqual([]);
  const photos = await page.locator("img").evaluateAll((imgs) =>
    imgs.map((i) => ({
      file: new URL((i as HTMLImageElement).src).pathname.split("/").pop(),
      width: i.getAttribute("width"),
      height: i.getAttribute("height"),
      carregou: (i as HTMLImageElement).naturalWidth > 0,
      alt: i.getAttribute("alt"),
    })),
  );
  expect(photos.length).toBe(5);
  for (const photo of photos) {
    expect(photo.width, `${photo.file} has no declared width`).toBeTruthy();
    expect(photo.height, `${photo.file} has no declared height`).toBeTruthy();
    expect(photo.carregou, `${photo.file} did not load`).toBe(true);
    expect((photo.alt ?? "").length, `${photo.file} has no alt text`).toBeGreaterThan(0);
    const answer = await page.request.get(`/fotos/${photo.file}`);
    expect(answer.status(), `${photo.file} is not served by the site`).toBe(200);
  }
});


test("the hero text has contrast measured over the pixels", async ({ page }) => {
  // The text of the opening sits over the ink panel with the decorative veils (grid and sun), and that sum does not
  // match the color declared in the CSS: what counts is the pixel behind it. This measure crops the breathing area
  // beside the text, without the pixels of the text itself, and computes the average luminance there against the color of the text. It is the
  // only honest way to state that the title reads well, and it is what sets the ceiling of the yellow in the ornament.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(700);
  // The list has the three texts of the opening, and not only the title and the paragraph: the eyebrow lost contrast
  // when the sun moved up to the top of the panel, and it is the piece of text that sits closest to the yellow band.
  for (const seletor of [
    "#hero-title",
    "section:has(#hero-title) p.type-body",
    "section:has(#hero-title) p.type-label",
  ]) {
    const target = page.locator(seletor).first();
    const box = await target.boundingBox();
    expect(box, `did not find ${seletor}`).not.toBeNull();
    // The sample is the breathing area to the right of the text, inside the panel: there the ink with the grid and the sun lives.
    // The first version cropped a band below the text, which falls on the light badges and returned 1,37
    // while measuring the wrong thing.
    // The sample comes from the block where the text lives, and not from the whole opening: the opening has a border and rounding, and
    // sampling the border measures the sidewalk instead of the panel.
    const block = await page
      .locator("section:has(#hero-title) > div")
      .first()
      .boundingBox();
    expect(block, "did not find the hero text block").not.toBeNull();
    // The eyebrow is the only text of the opening with a background OF ITS OWN (a pill). For it the sample comes from inside
    // the pill, on the inner side where there is no glyph: measured beside it, as with the other two, the loss of contrast
    // went unnoticed when the sun moved up to the top of the panel. This is the case that requires its own sample.
    const hasPill = seletor.includes("type-label");
    const sobrou = block!.x + block!.width - (box!.x + box!.width);
    const sampleWidth = hasPill ? 6 : Math.max(24, Math.min(Math.round(sobrou - 8), 160));
    const band = {
      x: hasPill
        ? Math.round(box!.x + 3)
        : Math.round(block!.x + block!.width - sampleWidth - 4),
      y: Math.round(box!.y + box!.height / 2 - (hasPill ? 5 : 0)),
      width: sampleWidth,
      height: hasPill ? 10 : 12,
    };
    const b64 = (await page.screenshot({ clip: band })).toString("base64");
    const color = await target.evaluate((e) => getComputedStyle(e).color);
    const r = await page.evaluate(
      async ({ b64, color }) => {
        const linear = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        const luminanceOf = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
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
        const background = luminanceOf(mr, mg, mb);
        // The text color is read by painting a pixel on the canvas and reading what came out. Reading the text from the
        // property does not work: the browser returns oklab, and treating those numbers as if they were 0 to 255 returned a
        // contrast of 1,78 while measuring a color that does not exist.
        //
        // The base ink of the probe is the SAMPLED BACKGROUND, and not white: text with opacity (the eyebrow and the
        // paragraph use `canvas/70` and `canvas/85`) composites with what is behind it, and compositing over white returns a
        // text lighter than the eye sees. That is how the loss of contrast in the eyebrow slipped by.
        const sonda = document.createElement("canvas");
        sonda.width = 1;
        sonda.height = 1;
        const sctx = sonda.getContext("2d");
        if (!sctx) return null;
        sctx.fillStyle = `rgb(${Math.round(mr)}, ${Math.round(mg)}, ${Math.round(mb)})`;
        sctx.fillRect(0, 0, 1, 1);
        sctx.fillStyle = color;
        sctx.fillRect(0, 0, 1, 1);
        const px = sctx.getImageData(0, 0, 1, 1).data;
        const text = luminanceOf(px[0], px[1], px[2]);
        const [high, low] = [background, text].sort((a, b) => b - a);
        return Math.round(((high + 0.05) / (low + 0.05)) * 100) / 100;
      },
      { b64, color },
    );
    expect(r, `contrast measured against the pixels: ${r} in ${seletor}`).not.toBeNull();
    expect(r!, `contrast measured against the pixels: ${r} in ${seletor}`).toBeGreaterThanOrEqual(4.5);
  }
});


test("the blog card is clickable as a whole, and the border changes on hover", async ({ page }) => {
  // Card clickable as a whole, and the hover changing the border, not just the underline of the title. The click is
  // checked far from the title, in the bottom corner of the card, which is where a link only on the text would not catch.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog");
  await page.waitForTimeout(500);
  const card = page.locator("main ul li").first();
  const box = await card.boundingBox();
  expect(box, "did not find a card in the blog").not.toBeNull();

  const before = await card.evaluate((e) => getComputedStyle(e).borderColor);
  await card.hover();
  await page.waitForTimeout(300);
  const after = await card.evaluate((e) => getComputedStyle(e).borderColor);
  expect(after, `border before ${before}, after ${after}`).not.toBe(before);

  // Waiting for the URL to change, and not for the load state: on an already loaded page the state resolves right away and the check
  // happens before the navigation finishes, which is what made the measure fail while navigation worked.
  await page.mouse.click(box!.x + box!.width - 14, box!.y + box!.height - 10);
  await page.waitForURL(/\/blog\/.+/, { timeout: 15000 });
  expect(page.url(), "clicking the corner of the card did not navigate").toContain("/blog/");
});


test("the blog source links open in another tab", async ({ page }) => {
  // Whoever clicks a source cannot leave the page. Not every text has a source, so the measure
  // walks the first ones and checks the attributes wherever there is an external link, requiring that at least one exists.
  await page.goto("/blog");
  await page.waitForTimeout(400);
  const links = page.locator("main ul li h2 a");
  const howMany = Math.min(await links.count(), 3);
  expect(howMany, "did not find text in the blog").toBeGreaterThan(0);
  let externos = 0;
  for (let i = 0; i < howMany; i++) {
    await links.nth(i).click();
    await page.waitForURL(/\/blog\/.+/, { timeout: 15000 });
    const total = await page.locator('main a[href^="http"]').count();
    for (let n = 0; n < total; n++) {
      const link = page.locator('main a[href^="http"]').nth(n);
      externos++;
      expect(await link.getAttribute("target"), "external link in the same tab").toBe("_blank");
      expect(await link.getAttribute("rel"), "external link without noopener").toContain("noopener");
    }
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
  }
  expect(externos, "no external link found in the texts checked").toBeGreaterThan(0);
});


test("on desktop the three cards sit side by side, with the button centered", async ({ page }) => {
  // On a wide screen the cards at the end of the text sit in a line, and the see all button is centered
  // below. The measure checks the two positions, and not the existence of the elements.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog/how-to-read-your-solar-estimate");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const section = document.querySelector('section[aria-labelledby="others-title"]');
    const cards = [...(section?.querySelectorAll("li") ?? [])].map((li) => li.getBoundingClientRect());
    const botao = section?.querySelector("a[href='/blog']")?.getBoundingClientRect();
    if (cards.length < 3 || !botao || !section) return null;
    const topos = cards.map((c) => Math.round(c.top));
    const esquerdas = cards.slice(0, 3).map((c) => Math.round(c.left));
    const centroSecao = section.getBoundingClientRect().left + section.getBoundingClientRect().width / 2;
    return {
      mesmosTopos: Math.max(...topos.slice(0, 3)) - Math.min(...topos.slice(0, 3)) <= 2,
      esquerdasDistintas: new Set(esquerdas).size === 3,
      buttonBelow: botao.top >= Math.max(...topos.slice(0, 3)),
      centerOffset: Math.round(Math.abs(botao.left + botao.width / 2 - centroSecao)),
    };
  });
  expect(m, "did not find the block of the other texts").not.toBeNull();
  expect(m!.mesmosTopos, "the cards are not aligned at the same top").toBe(true);
  expect(m!.esquerdasDistintas, "the cards are not side by side").toBe(true);
  expect(m!.buttonBelow, "the button is not below the cards").toBe(true);
  expect(m!.centerOffset, `offset from the center: ${m!.centerOffset}px`).toBeLessThanOrEqual(4);
});


test("on desktop the blog index shows the featured card alone and the other two per line", async ({ page }) => {
  // The index cards side by side, two per line on a wide screen. The newest card takes both columns, so the
  // first line has ONE card and the following ones keep TWO. The measure is the same as before (whoever shares the top is on the
  // same line, which is what defines a line in a grid), with the two counts separated, and the width of the featured card
  // checked against that of its neighbor instead of against a number written here.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("main ul li")].map((li) => li.getBoundingClientRect());
    if (cards.length < 3) return null;
    const topos = cards.map((c) => Math.round(c.top));
    const onFirstLine = topos.filter((t) => Math.abs(t - topos[0]) <= 2).length;
    const secondTop = Math.min(...topos.filter((t) => t > topos[0] + 2));
    const onSecondLine = topos.filter((t) => Math.abs(t - secondTop) <= 2).length;
    return {
      onFirstLine,
      onSecondLine,
      featuredWidth: Math.round(cards[0].width),
      neighborWidth: Math.round(cards[1].width),
      total: cards.length,
    };
  });
  expect(m, "did not find cards in the index").not.toBeNull();
  expect(m!.onFirstLine, `cards on the first line: ${m!.onFirstLine}`).toBe(1);
  expect(m!.onSecondLine, `cards on the second line: ${m!.onSecondLine}`).toBe(2);
  expect(
    m!.featuredWidth,
    `featured card at ${m!.featuredWidth}px against ${m!.neighborWidth}px of the neighbor`,
  ).toBeGreaterThan(m!.neighborWidth * 1.8);
});

test("on mobile the blog index keeps one card per line", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/blog");
  await page.waitForTimeout(500);
  const onFirstLine = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("main ul li")].map((li) => Math.round(li.getBoundingClientRect().top));
    if (cards.length < 2) return 0;
    return cards.filter((t) => Math.abs(t - cards[0]) <= 2).length;
  });
  expect(onFirstLine).toBe(1);
});


test("the bar keeps the content within the width of the page items", async ({ page }) => {
  // The logo on the left and the buttons on the right, but inside the width of the page items, and not
  // stretched to the edges of the window. The measure compares the two ends against the content column.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const bar = document.querySelector('nav[aria-label="Main navigation"]');
    // The reference used to be the opening, which was the first visible item inside main. After the opening started
    // taking the whole window width it stopped working as a column: the bar aligns with the CONTENT, and now what
    // defines that column is the simulator, the first block that stays inside the container. Comparing with the box of main
    // gave zero while the bar items went past the visible width, because the box includes the breathing room; comparing with the
    // first child does not work either, because the first child is the structured data script, with a box at zero.
    // The simulator section started taking the window width, and what carries the content
    // column is its inner wrapper (`> div`), which is the reference now.
    const conteudo = document.querySelector("main section#simulator > div");
    if (!bar || !conteudo) return null;
    const inside = [...bar.querySelectorAll("span")].find((s) => (s.textContent ?? "").trim() === "Brightfield Solar");
    const destinations = [...bar.querySelectorAll("a")];
    const last = destinations[destinations.length - 1];
    if (!inside || !last) return null;
    const c = conteudo.getBoundingClientRect();
    const style = getComputedStyle(conteudo);
    // The content column is the INNER BOX of the wrapper (the wrapper carries the side breathing room), and it is what
    // the bar items have to respect.
    const esquerda = c.left + parseFloat(style.paddingLeft);
    const direita = c.right - parseFloat(style.paddingRight);
    const d = inside.getBoundingClientRect();
    const u = last.getBoundingClientRect();
    return {
      esquerda: Math.round(d.left - esquerda),
      direita: Math.round(direita - u.right),
      itemWidth: Math.round(direita - esquerda),
    };
  });
  expect(m, "did not find the bar or the content").not.toBeNull();
  // The brand starts where the column starts, and the last destination ends where the column ends, with a few px of slack.
  expect(Math.abs(m!.esquerda), `offset to the left: ${m!.esquerda}px`).toBeLessThanOrEqual(6);
  expect(Math.abs(m!.direita), `offset to the right: ${m!.direita}px`).toBeLessThanOrEqual(6);
});


test("on desktop the hero starts right below the bar, with the top corners square", async ({ page }) => {
  // The opening cannot slide under the bar, it starts below it. The opening at zero with extra space in the
  // text to escape the floating bar was the wrong arrangement.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    if (!hero) return null;
    const r = hero.getBoundingClientRect();
    const style = getComputedStyle(hero);
    const raio = [style.borderTopLeftRadius, style.borderTopRightRadius].map((v) => parseFloat(v));
    const bar = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
    const text = document.querySelector("#hero-title")!.getBoundingClientRect();
    return {
      distanceFromBar: Math.round(r.top - bar.bottom),
      topRadius: raio,
      textBelowBar: text.top >= bar.bottom,
      textInsideHero: text.top >= r.top,
    };
  });
  expect(m, "did not find the hero").not.toBeNull();
  // It starts below the bar, and not far from it: the slack has to be small, otherwise it becomes a hole at the top of the page.
  expect(m!.distanceFromBar, `the opening starts ${m!.distanceFromBar}px below the bar`).toBeGreaterThanOrEqual(-1);
  expect(m!.distanceFromBar, `the opening starts ${m!.distanceFromBar}px below the bar`).toBeLessThanOrEqual(32);
  expect(Math.max(...m!.topRadius), "the top corners are still rounded").toBe(0);
  expect(m!.textBelowBar, "the bar covers the hero title").toBe(true);
  expect(m!.textInsideHero, "the title escaped to the top of the hero").toBe(true);
});


test("the blog text uses the width of the column", async ({ page }) => {
  // The text takes the width of the column, and not a narrow column with a navigation rail beside it. The measure checks the
  // use of the column, and records the cost: a line longer than the comfortable reading range, a choice and
  // not an oversight.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog/how-to-read-your-solar-estimate");
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const column = document.querySelector("main")?.getBoundingClientRect();
    const box = document.querySelector('main div[class*="max-w-[52rem]"]');
    const title = document.querySelector("h1")?.getBoundingClientRect();
    const body = document.querySelector('main div[class*="max-w-[52rem]"] p');
    if (!column || !box || !title || !body) return null;
    const c = box.getBoundingClientRect();
    const px = parseFloat(getComputedStyle(body).fontSize);
    return {
      aproveitamento: Math.round((c.width / column.width) * 100),
      titleSameAsText: Math.abs(Math.round(title.width) - Math.round(c.width)) <= 2,
      charactersPerLine: Math.round(c.width / (px * 0.5)),
    };
  });
  expect(m, "did not find the blog text").not.toBeNull();
  expect(m!.aproveitamento, `the text uses ${m!.aproveitamento}% of the column`).toBeGreaterThanOrEqual(75);
  expect(m!.titleSameAsText, "title and text have different widths").toBe(true);
  // The number stays in the message so it does not become a hidden rule: it is the accepted consequence of widening.
  expect(m!.charactersPerLine, `about ${m!.charactersPerLine} characters per line`).toBeGreaterThan(80);
});


test("the hero background is the service photo, with the ink veil behind the text", async ({ page }) => {
  // The background is a photo, and the decorative layer became the ink veil over
  // it. The fine grid and the yellow sun left with the photo: it already has the light the veil imitated. What is measured now is
  // the photo served from our own domain, the veil drawing a gradient, and the guarantees of the decorative layer.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    const panel = hero?.querySelector(":scope > div");
    const background = hero?.querySelector('[data-background="hero"]');
    const conteudo = document.querySelector("#hero-title")?.closest("div");
    if (!hero || !panel || !background || !conteudo) return null;
    const style = getComputedStyle(background);
    const photo = getComputedStyle(panel).backgroundImage;
    // The browser returns the ABSOLUTE URL in the computed value, so comparing the origin is what says whether the photo is ours.
    // Checking "has no http" failed our own domain.
    const url = photo.match(/url\("?([^")]+)"?\)/);
    return {
      photoInPanel: photo.includes("url("),
      fotoLocal: Boolean(url) && new URL(url![1], location.href).origin === location.origin,
      photoPath: url ? url[1] : null,
      draws: style.backgroundImage.includes("gradient"),
      behind: Number(style.zIndex) < Number(getComputedStyle(conteudo).zIndex),
      zIndex: Number(style.zIndex),
      noPointer: style.pointerEvents === "none",
      escondido: background.getAttribute("aria-hidden") === "true",
      firstChild: hero.firstElementChild === background,
    };
  });
  expect(m, "did not find the hero background").not.toBeNull();
  expect(m!.photoInPanel, "the hero panel has no photo in the background").toBe(true);
  expect(m!.fotoLocal, `the background photo comes from outside: ${m!.photoPath}`).toBe(true);
  expect(m!.draws, "the veil does not draw a gradient").toBe(true);
  expect(m!.behind, "the veil is not behind the text").toBe(true);
  // `-z-10` also satisfies "less than the text" and vanishes behind the ink panel: what guarantees the reading is the
  // background staying above zero, inside the panel context (`isolate`).
  expect(m!.zIndex, "the background is in the negative and vanishes behind the panel").toBeGreaterThanOrEqual(0);
  expect(m!.noPointer, "the background captures the pointer").toBe(true);
  expect(m!.escondido, "the background shows for the screen reader").toBe(true);
  // The background lives INSIDE the panel: as the first child of the section it would steal the sample of the contrast test.
  expect(m!.firstChild, "the background became the first child of the section").toBe(false);
});

test("the hero is a centered column, with no photo, and the simulator stays in the first screen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector("section:has(#hero-title)");
    const title = document.querySelector("#hero-title");
    const block = title?.closest("div");
    if (!hero || !title || !block) return null;
    const b = block.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    const simulador = document.querySelector("#simulator > div")!.getBoundingClientRect();
    return {
      imagens: hero.querySelectorAll("img").length,
      centerOffset: Math.round(Math.abs(t.x + t.width / 2 - (b.x + b.width / 2))),
      titleMeasure: Math.round(t.width),
      // The title is the piece that has to breathe: in three lines it does not breathe, and the measure that makes it
      // close in two is larger than the reading measure of the body. Both things are measured here.
      titleLines: Math.round(t.height / parseFloat(getComputedStyle(title).lineHeight)),
      titlePx: parseFloat(getComputedStyle(title).fontSize),
      // The opening takes the whole window width; the rest of the page stays in the 64 rem column.
      heroWidth: Math.round(hero.getBoundingClientRect().width),
      columnWidth: Math.round(simulador.width),
      janela: window.innerWidth,
      // The simulator cannot leave the first screen: it is what the opening exists to deliver. With the photo gone, the
      // opening got shorter, and this assertion became the difference between passing with slack and passing barely.
      simulatorTop: Math.round(simulador.top),
    };
  });
  expect(m, "did not find the hero").not.toBeNull();
  expect(m!.imagens, "the hero has an image again").toBe(0);
  expect(m!.centerOffset, `the title is ${m!.centerOffset}px off the center of the block`).toBeLessThanOrEqual(4);
  // The title has a measure of its own, and it is larger than the reading measure ON PURPOSE: 54 rem is what makes the
  // 70 character headline close in two lines on desktop. Measured before the change: with the 40 rem of the
  // body the title took three lines, which is the measured visual excess. The 40 rem measure
  // still governs the running text, and the floor here is what stops the title from going back to 40 rem.
  expect(m!.titleMeasure, `the title measures ${m!.titleMeasure}px`).toBeLessThanOrEqual(864);
  expect(m!.titleMeasure).toBeGreaterThan(640);
  expect(m!.titlePx, "the title lost the display step on desktop").toBe(56);
  expect(m!.titleLines, `the title takes ${m!.titleLines} lines`).toBe(2);
  // The opening at the window width, and the rest of the page in the column: that is the design, and both halves of it are measured.
  expect(m!.heroWidth, `the opening measures ${m!.heroWidth}px in a window of ${m!.janela}px`).toBe(m!.janela);
  expect(m!.columnWidth, "the content column stretched together with the hero").toBeLessThan(m!.janela);
  expect(
    m!.simulatorTop,
    `the simulator starts at ${m!.simulatorTop}px of a window of ${m!.janela}px`,
  ).toBeLessThan(m!.janela);
});


// The most visual design: the background bands, the result poster, the neighborhoods in a
// grid with a golden pin, the wider section titles and the three photos. Each half has a measure
// of its own here, because none of them shows up in a unit test and all of them were decided by looking at the screen.
test.describe("background bands and the page design", () => {
  // With less motion enabled, the entry of the sections leaves the scene and the boxes measured are the layout ones: the bands
  // enter the scroll with a 12 px offset, and the box of an element in animation carries that offset.
  test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });

  test("the five bands touch each other and each one has the planned background", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const faixas = await page.evaluate(() => {
      const pintura = document.createElement("canvas").getContext("2d")!;
      const color = (e: Element) => {
        pintura.fillStyle = "#ffffff";
        pintura.fillStyle = getComputedStyle(e).backgroundColor;
        return String(pintura.fillStyle);
      };
      const secoes = [...document.querySelectorAll("main section")];
      return secoes.map((section, index) => {
        const r = section.getBoundingClientRect();
        const previous = index > 0 ? secoes[index - 1].getBoundingClientRect() : null;
        return {
          id: section.id,
          background: color(section),
          top: Math.round(r.top + window.scrollY),
          previousBase: previous ? Math.round(previous.bottom + window.scrollY) : null,
          conteudo: Math.round((section.firstElementChild ?? section).getBoundingClientRect().width),
          janela: window.innerWidth,
        };
      });
    });
    expect(faixas.map((f) => f.id)).toEqual(["simulator", "steps", "proof", "faq", "book"]);
    // The requested order: canvas, surface, canvas, the action color at 12% and the full action color. What the browser returns
    // is the hexadecimal when the color is opaque and `rgba` when it has alpha.
    expect(faixas[0].background).toBe("#f7f6f3");
    expect(faixas[1].background).toBe("#ffffff");
    expect(faixas[2].background).toBe("#f7f6f3");
    // The FAQ band is the action color with alpha, and the browser returns that as `oklab(...)`, the alpha is what is measured.
    expect(faixas[3].background).toContain("/ 0.12)");
    expect(faixas[4].background).toBe("#e8882a");
    for (const band of faixas) {
      if (band.previousBase !== null) {
        // The bands touch each other: with no gap of the page background between them, which was the risk of swapping the
        // `gap` of the `main` for a section background without removing the breathing room of each one.
        expect(band.top, `the band ${band.id} does not touch the previous one`).toBe(band.previousBase);
      }
      expect(band.conteudo, `the content of the band ${band.id} overflowed the window`).toBeLessThanOrEqual(band.janela);
    }
  });

  test("the text of each band has contrast against the background behind it", async ({ page }) => {
    // The background of each text is composited up the tree: the bands have alpha (the 12% one) and the white cards sit
    // on top of them, so measuring against the section background would give the wrong pair. The minimum is the Material one: 4,5 for
    // small text and 3 for large text (from 24 px).
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const measures = await page.evaluate(() => {
      const pintura = document.createElement("canvas");
      pintura.width = 1;
      pintura.height = 1;
      const ink = pintura.getContext("2d")!;
      // Reading the PIXEL is the way that resolves any color from the CSS, including the ones Tailwind v4 writes as `oklab(...)`
      // when the class has alpha: `fillStyle` returns those without converting.
      const read = (value: string) => {
        ink.clearRect(0, 0, 1, 1);
        ink.fillStyle = "#000000";
        ink.fillStyle = value;
        ink.fillRect(0, 0, 1, 1);
        const d = ink.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2], d[3] / 255];
      };
      const overlay = (front: number[], background: number[]) => {
        const a = front[3];
        return [front[0] * a + background[0] * (1 - a), front[1] * a + background[1] * (1 - a), front[2] * a + background[2] * (1 - a), 1];
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
      // The accumulated background: the page, and then each ancestor up to the element itself, compositing the alphas.
      const backgroundOf = (el: Element) => {
        const cadeia: Element[] = [];
        let no: Element | null = el;
        while (no) {
          cadeia.push(no);
          no = no.parentElement;
        }
        let acumulado = [247, 246, 243, 1];
        for (const n of cadeia.reverse()) {
          const c = read(getComputedStyle(n).backgroundColor);
          if (c[3] > 0) acumulado = overlay(c, acumulado);
        }
        return acumulado;
      };
      const texts = [...document.querySelectorAll("main p, main h2, main h3, main blockquote, main li, main dt, main dd")];
      // Text over a PHOTO is not measured by color composition: its background is an image, which this calculation does not see. What
      // measures that case is the pixel probe. The one for the closing lives right below, and the one for the opening already existed.
      const sobreFoto = (el: Element) => {
        const section = el.closest("section");
        if (!section) return false;
        return [...section.querySelectorAll("*")].some((n) => {
          const e = getComputedStyle(n);
          return e.backgroundImage !== "none" && e.backgroundImage.includes("url(");
        });
      };
      const lidos = texts
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
          const style = getComputedStyle(el);
          const background = backgroundOf(el);
          const color = overlay(read(style.color), background);
          return {
            text: (el.textContent ?? "").trim().slice(0, 30),
            px: parseFloat(style.fontSize),
            contraste: Math.round(contraste(color, background) * 100) / 100,
          };
        });
      return lidos;
    });
    expect(measures.length).toBeGreaterThan(20);
    for (const m of measures) {
      const minimo = m.px >= 24 ? 3 : 4.5;
      expect(m.contraste, `"${m.text}" measures ${m.contraste} to 1, and the minimum is ${minimo}`).toBeGreaterThanOrEqual(minimo);
    }
  });

  test("the closing text has contrast measured over the pixels of the photo", async ({ page }) => {
    // The closing band now has the photo of the panels in the desert with the ink veil on top. Contrast over a photo
    // is not computed from the color declared in the CSS: what counts is the pixel behind the text. This measure crops the
    // breathing area to the RIGHT of the text line, without glyphs, and compares the average luminance there with the color of the text,
    // composited over that same background (the text of the band has alpha). It is the same technique as the opening measure.
    await page.goto("/phoenix-az");
    await page.waitForTimeout(900);
    // The closing band sits at the end of the document: the target has to be in the window for the screenshot crop to exist.
    await page.locator("#final-cta-title").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const block = (await page.locator("#book > div.relative").boundingBox())!;
    expect(block, "did not find the closing column").not.toBeNull();
    const amostrar = async (band: { x: number; y: number; width: number; height: number }) => {
      const b64 = (await page.screenshot({ clip: band })).toString("base64");
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
    for (const seletor of ["#final-cta-title", "#book p.type-body", "#book p.type-label"]) {
      const target = page.locator(seletor).first();
      const box = await target.boundingBox();
      expect(box, `did not find ${seletor}`).not.toBeNull();
      const remainder = block.x + block.width - (box!.x + box!.width);
      const width = Math.max(20, Math.min(Math.round(remainder - 8), 160));
      const band = {
        x: Math.round(box!.x + box!.width + 4),
        y: Math.round(box!.y + box!.height / 2 - 6),
        width: width,
        height: 12,
      };
      const withVeil = await amostrar(band);
      const color = await target.evaluate((e) => getComputedStyle(e).color);
      const contraste = await page.evaluate(
        async ({ background, color }) => {
          const linear = (v: number) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          const lum = (r: number, g: number, b: number) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
          const sonda = document.createElement("canvas");
          sonda.width = 1;
          sonda.height = 1;
          const sctx = sonda.getContext("2d")!;
          sctx.fillStyle = `rgb(${Math.round(background[0])}, ${Math.round(background[1])}, ${Math.round(background[2])})`;
          sctx.fillRect(0, 0, 1, 1);
          sctx.fillStyle = color;
          sctx.fillRect(0, 0, 1, 1);
          const px = sctx.getImageData(0, 0, 1, 1).data;
          const [high, low] = [lum(background[0], background[1], background[2]), lum(px[0], px[1], px[2])].sort((a, b) => b - a);
          return Math.round(((high + 0.05) / (low + 0.05)) * 100) / 100;
        },
        { background: withVeil, color },
      );
      expect(contraste, `"${seletor}" measures ${contraste} to 1 over the pixels of the closing`).toBeGreaterThanOrEqual(4.5);
      // And the photo cannot have vanished behind the veil. The measure is the difference between the same crop WITH and WITHOUT the veil: what
      // changes there is the contribution of the photo (the veil is neutral ink), so a small difference means an invisible photo.
      // Measured with the closing veil at 0,70 / 0,52 / 0,46: 14 to 34 units per channel; with the old opening veil,
      // 20 to 30% less.
      await page.evaluate(() => {
        const veil = document.querySelector("#book > .closing-photo-veil") as HTMLElement;
        veil.dataset.storedVeil = veil.style.backgroundImage;
        veil.style.backgroundImage = "none";
      });
      const withoutVeil = await amostrar(band);
      await page.evaluate(() => {
        const veil = document.querySelector("#book > .closing-photo-veil") as HTMLElement;
        veil.style.backgroundImage = veil.dataset.storedVeil ?? "";
      });
      const contribuicao = Math.round(Math.max(...withVeil.map((v, i) => Math.abs(v - withoutVeil[i]))));
      expect(
        contribuicao,
        `"${seletor}": the photo contributes only ${contribuicao} unit(s) behind the veil (with ${JSON.stringify(withVeil.map(Math.round))}, without ${JSON.stringify(withoutVeil.map(Math.round))})`,
      ).toBeGreaterThanOrEqual(12);
    }
  });

  test("the neighborhoods are a grid with a golden pin, and not tiny chips", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const pintura = document.createElement("canvas").getContext("2d")!;
      const color = (e: Element) => {
        pintura.fillStyle = "#ffffff";
        pintura.fillStyle = getComputedStyle(e).backgroundColor;
        return String(pintura.fillStyle);
      };
      // The neighborhood list is the largest in the block: the other two lists in the section are the testimonials and the crews.
      const block = [...document.querySelectorAll("#proof ul")].sort((a, b) => b.children.length - a.children.length)[0];
      const items = [...block.children];
      const pinos = items.map((li) => {
        const svg = li.querySelector("svg")!;
        return { hasPin: Boolean(svg), color: getComputedStyle(svg.parentElement!).color, background: color(li) };
      });
      return {
        items: items.length,
        grid: getComputedStyle(block).display,
        columns: getComputedStyle(block).gridTemplateColumns.split(" ").length,
        pinos,
      };
    });
    // The city carries five neighborhoods, and the list shows all five.
    expect(m.items).toBe(5);
    // A real grid, with three columns on desktop, and not a row of chips.
    expect(m.grid).toBe("grid");
    expect(m.columns).toBe(3);
    for (const pin of m.pinos) {
      expect(pin.hasPin, "one neighborhood came out without the pin").toBe(true);
      // The pin is dark gold: the light gold measures 1,86 to 1 over white and does not identify a 16 px drawing.
      expect(pin.color, "the pin is not in the dark gold of DESIGN.md").toBe("rgb(176, 116, 15)");
      // No item carries a background of its own: the white chip with a border left the scene.
      expect(pin.background, "the neighborhood item went back to being a chip").toBe("rgba(0, 0, 0, 0)");
    }
  });

  test("the result has the two bills on one line, and no longer has the amber rule", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const pintura = document.createElement("canvas").getContext("2d")!;
      const color = (e: Element) => {
        pintura.fillStyle = "#ffffff";
        pintura.fillStyle = getComputedStyle(e).backgroundColor;
        return String(pintura.fillStyle);
      };
      const card = document.querySelector("#simulator output")!;
      const rules = [...card.querySelectorAll("span[aria-hidden]")].filter(
        (s) => getComputedStyle(s).height === "1px",
      );
      const labels = [...card.querySelectorAll("p")];
      const cost = labels.find((p) => (p.textContent ?? "").includes("Cost after"))!;
      const payback = labels.find((p) => (p.textContent ?? "").includes("Years to payback"))!;
      const box = (p: Element) => p.parentElement!.getBoundingClientRect();
      return {
        rules: rules.map((f) => color(f)),
        cost: { top: Math.round(box(cost).top), esquerda: Math.round(box(cost).left) },
        payback: { top: Math.round(box(payback).top), esquerda: Math.round(box(payback).left) },
      };
    });
    // The amber thin line that crossed the column above the savings label is gone, and the measure guards its
    // absence: inside the result no 1 px line is left.
    expect(m.rules, `a line is left in the result: ${JSON.stringify(m.rules)}`).toEqual([]);
    // Cost and payback on the same line: same top, different columns.
    expect(m.cost.top, "cost and payback are not on the same line").toBe(m.payback.top);
    expect(m.payback.esquerda, "the two bills ended up in the same column").toBeGreaterThan(m.cost.esquerda + 100);
  });

  test("the section titles fit in 54 rem", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => ({
      titles: [...document.querySelectorAll("main h2")].map((h) => Math.round(h.getBoundingClientRect().width)),
      faqTitleColumn: Math.round(
        document.querySelector("#faq h2")!.parentElement!.getBoundingClientRect().width,
      ),
    }));
    // The reading measure of the body is 40 rem (640 px); the title has its own, larger, so it does not break into three lines.
    for (const width of m.titles) {
      expect(width, `a section title measures ${width}px, above the 54 rem`).toBeLessThanOrEqual(864);
      expect(width, `a section title shrank to ${width}px`).toBeGreaterThan(320);
    }
    // The FAQ title column grew from 16 to 22 rem: at 16 rem the title broke into four lines.
    expect(m.faqTitleColumn).toBeGreaterThanOrEqual(330);
  });

  test("each photo in its place: four of content and two of background", async ({ page }) => {
    // The map of the photos, in the order they appear: opening and step 1 with the two photos that already existed, and the
    // four new ones in the other places: step 2, featured testimonial, neighborhoods, crews and closing. Two of them are
    // band background (opening and closing) and for that reason do not show up as `img`: the measure reads the `background-image`.
    await page.goto("/phoenix-az");
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => {
      const files = (seletor: string) =>
        [...document.querySelectorAll<HTMLImageElement>(`${seletor} img`)].map(
          (i) => new URL(i.src).pathname.split("/").pop() ?? "",
        );
      const background = (seletor: string) => getComputedStyle(document.querySelector(seletor)!).backgroundImage;
      return {
        steps: files("#steps"),
        proof: files("#proof"),
        hero: background(".hero-background"),
        closing: background(".closing-background"),
      };
    });
    expect(m.steps).toEqual(["technician-on-roof.avif", "rail-on-roof.avif", "panels-in-field.avif"]);
    // The social proof has TWO: the crew lifting the module, above the crew cards, and the house in the neighborhood block.
    // The house once sat inside the featured testimonial and left: a photo over the amber wash of the
    // featured card loses the roof, and what decided it was "one house, one place".
    expect(m.proof).toEqual(["crew-on-sidewalk.avif", "house-phoenix.avif"]);
    expect(m.hero).toContain("installers-on-roof.avif");
    expect(m.closing).toContain("panels-in-desert.avif");
  });
});

