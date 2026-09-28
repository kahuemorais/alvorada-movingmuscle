// Finish measurements: a screen defect the test did not catch.
//
// The two defects of this measurement appeared after the type scale change. The `number` step
// went up from 36 to 48 px, and the bill field started drawing text larger than its own box. No earlier
// measurement looked at that: the navigation ones measure bar and anchor, and the simulator ones measure behavior.
import { expect, test } from "@playwright/test";

test("the value of the bill field fits inside the box", async ({ page }) => {
  await page.goto("/phoenix-az");
  const campo = page.locator("#bill");
  const m = await campo.evaluate((e: HTMLInputElement) => {
    const style = getComputedStyle(e);
    const box = e.getBoundingClientRect();
    return {
      textSize: parseFloat(style.fontSize),
      boxHeight: box.height,
      letterHeight: parseFloat(style.lineHeight) || parseFloat(style.fontSize),
      transbordo: e.scrollWidth - e.clientWidth,
    };
  });
  // The letter has to fit in the height, and the text cannot be cut in the width.
  expect(m.letterHeight).toBeLessThanOrEqual(m.boxHeight);
  expect(m.transbordo).toBeLessThanOrEqual(1);
});

test("the step buttons fit in their own box", async ({ page }) => {
  // The steps are an icon, and not text, so what is measured is the drawing inside the button. The first version
  // of this test looked for the plus and minus signs as text and found nothing: they are SVG.
  await page.goto("/phoenix-az");
  const steps = page.locator(
    'button[aria-label^="Lower the bill"], button[aria-label^="Raise the bill"]',
  );
  const measures = await steps.evaluateAll((botoes) =>
    botoes.map((b) => {
      const svg = b.querySelector("svg");
      return {
        desenho: svg ? Math.round(svg.getBoundingClientRect().height) : 0,
        box: Math.round(b.getBoundingClientRect().height),
      };
    }),
  );
  expect(measures.length).toBe(2);
  for (const m of measures) {
    expect(m.desenho).toBeGreaterThan(0);
    expect(m.desenho).toBeLessThanOrEqual(m.box);
  }
});

test("the label of each control group has breathing room up to what comes below", async ({ page }) => {
  await page.goto("/phoenix-az");
  const measures = await page.evaluate(() => {
    const legendas = Array.from(document.querySelectorAll("#simulator legend"));
    return legendas.map((legenda) => {
      const grupo = legenda.parentElement!;
      const first = Array.from(grupo.children).find((c) => c !== legenda);
      const base = legenda.getBoundingClientRect().bottom;
      const top = first ? first.getBoundingClientRect().top : base;
      return { text: legenda.textContent?.trim().slice(0, 28), vao: Math.round(top - base) };
    });
  });
  expect(measures.length).toBeGreaterThanOrEqual(2);
  for (const m of measures) expect(m.vao).toBeGreaterThanOrEqual(12);
});

test("the hero does not repeat what the steps block says", async ({ page }) => {
  // The opening carried a line about the permit, installation in one day and interconnection. The steps block, two
  // screens below, has one step for each of the three. Repetition is not emphasis here: it is the same fact taking
  // the place where the person decides to ask for the visit.
  await page.goto("/phoenix-az");
  const hero = await page.locator("main section").first().innerText();
  expect(hero).not.toMatch(/permit/i);
  expect(hero).not.toMatch(/interconnection/i);
  // And the steps block keeps saying the three facts, so the information has not disappeared from the page.
  const steps = await page.locator("section#steps").innerText();
  expect(steps).toMatch(/permit/i);
  expect(steps).toMatch(/interconnection/i);
});

test("the closing call has a single action, and it is the phone", async ({ page }) => {
  // The block that asks for the call offered, next to the phone, a link to go back to the simulator. At the moment of
  // decision, one action.
  await page.goto("/phoenix-az");
  const actions = await page.locator("section#book a").evaluateAll((as) =>
    as.map((a) => a.getAttribute("href") || ""),
  );
  expect(actions.length).toBe(1);
  expect(actions[0].startsWith("tel:")).toBe(true);
});

test("the favicon is the site icon, and not the tool default", async ({ page, request }) => {
  // The project was born with the generator favicon.ico, which has nothing to do with the brand. The icon becomes
  // an SVG from Phosphor, the same icon family the page uses, in the DESIGN.md action color.
  await page.goto("/phoenix-az");
  const links = await page.locator('link[rel~="icon"]').evaluateAll((ls) =>
    ls.map((l) => l.getAttribute("href") || ""),
  );
  expect(links.some((h) => h.includes("icon.svg"))).toBe(true);
  expect(links.some((h) => h.includes("favicon.ico"))).toBe(false);

  const answer = await request.get("/icon.svg");
  expect(answer.status()).toBe(200);
  expect(answer.headers()["content-type"]).toContain("image/svg+xml");
  const body = await answer.text();
  // The DESIGN.md action color, in lowercase as the theme declares.
  expect(body.toLowerCase()).toContain("#e8882a");
  // And it is a real SVG, with the drawing inside.
  expect(body).toMatch(/<svg[^>]*viewBox=/);
  expect(body).toMatch(/<(path|circle|rect)/);
});

test("the eyebrow rule has the color of its own label", async ({ page }) => {
  // The stroke that comes before the label ("The calculator", "Your estimate") was in the secondary
  // color, the blue, and it was supposed to be in the font color. The rule is a hierarchy ornament of the label, so it
  // uses the label color; where the label is the support color, the rule is the support color. The two eyebrows over a
  // surface that is not the light background, the one in the photo band, on the blog, and the one in the closing, in the action band, have their own
  // rule and are therefore out of this measurement (the closing uses ink at 60% and its label is ink).
  await page.goto("/phoenix-az");
  const eyebrows = await page.evaluate(() =>
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
        label: (p.textContent ?? "").trim(),
        labelColor: getComputedStyle(p).color,
        ruleColor: getComputedStyle(p.firstElementChild!).backgroundColor,
      })),
  );
  const supportColor = "rgb(91, 97, 103)";
  const support = eyebrows.filter((s) => s.labelColor === supportColor);
  expect(
    support.length,
    `only ${support.length} support eyebrow(s) on the page: ${JSON.stringify(eyebrows)}`,
  ).toBeGreaterThanOrEqual(4);
  for (const s of support) {
    expect(s.ruleColor, `the rule of "${s.label}" does not have the label color`).toBe(s.labelColor);
  }
  // The closing eyebrow became a LIGHT label when the photo entered the band (its background is the dark veil), so
  // the case of the label in ink at 60%, the one in the middle block, is one, and the light one is the other.
  const inInk = eyebrows.filter((s) => s.labelColor === "rgb(22, 24, 26)");
  expect(inInk.length, `only ${inInk.length} eyebrow(s) in ink on the page`).toBeGreaterThanOrEqual(1);
  for (const s of inInk) {
    expect(s.ruleColor, `the rule of "${s.label}" is not in ink at 60%`).toContain("0.6)");
    expect(s.ruleColor, `the rule of "${s.label}" is in the blue`).not.toContain("30, 95, 191");
  }
  const inCanvas = eyebrows.filter((s) => s.labelColor === "rgb(247, 246, 243)");
  expect(inCanvas.length, `only ${inCanvas.length} light eyebrow(s) on the page`).toBeGreaterThanOrEqual(1);
  for (const s of inCanvas) {
    expect(s.ruleColor, `the rule of "${s.label}" is not light at 60%`).toContain("0.6)");
    expect(s.ruleColor, `the rule of "${s.label}" is in the blue`).not.toContain("30, 95, 191");
  }
});

test("the simulator controls have the same width", async ({ page }) => {
  // Measured before, on the phone: the bill box was 144 px because of a width limit with no reason,
  // and the three coverage shortcuts were 105, 111 and 104 px, while the cursor and the profile
  // cards took the 345 px of the column. Four controls, three widths.
  //
  // The check of the profile cards only holds in the single column: from the medium size up the simulator
  // becomes two columns and the cards start splitting the second one, by design.
  const medir = () =>
    page.evaluate(() => {
      const larg = (e: Element | null | undefined) =>
        e ? Math.round(e.getBoundingClientRect().width) : null;
      const billBox = document.querySelector("#bill")?.closest("div[class*=rounded-lg]");
      const cursorBox = document.querySelector('input[type="range"]')?.closest("div[class*=rounded-lg]");
      const atalhos: Element[] = Array.from(document.querySelectorAll("#simulator button")).filter((b) =>
        /^(Half|Most|All) /.test(b.textContent?.trim() ?? ""),
      );
      // The profile shortcut stopped being a radio inside a label and became a button with `data-profile`: the hook of the
      // measurement is the attribute the component writes, not the accessibility role it had before.
      const card = document.querySelector("#simulator [data-profile]");
      const retangulos = atalhos.map((b) => b.getBoundingClientRect());
      const box = cursorBox?.getBoundingClientRect() ?? null;
      return {
        bill: larg(billBox),
        cursor: larg(cursorBox),
        card: larg(card),
        leftShortcut: retangulos.length ? Math.round(Math.min(...retangulos.map((r) => r.left))) : null,
        rightShortcut: retangulos.length ? Math.round(Math.max(...retangulos.map((r) => r.right))) : null,
        leftBox: box ? Math.round(box.left) : null,
        rightBox: box ? Math.round(box.right) : null,
        quantosAtalhos: atalhos.length,
      };
    });

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const mobile = await medir();
  expect(mobile.quantosAtalhos).toBe(3);
  expect(mobile.bill).toBe(mobile.cursor);
  expect(mobile.card).toBe(mobile.cursor);
  expect(mobile.leftShortcut).not.toBeNull();
  expect(mobile.leftBox).not.toBeNull();
  expect(Math.abs((mobile.leftShortcut ?? 0) - (mobile.leftBox ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((mobile.rightShortcut ?? 0) - (mobile.rightBox ?? 0))).toBeLessThanOrEqual(1);

  // From the medium size up, the two controls of the first column stay equal to each other.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const desktop = await medir();
  expect(desktop.bill).toBe(desktop.cursor);
});


test("the crews section has no blue, and the crew circle is an icon", async ({ page }) => {
  // The blue does not enter this section. The last blue on the page was the initials circle of the crews
  // (`bg-secondary` in the `AvatarFallback`, measured in the published HTML: it was the only `secondary` class on the whole page).
  // It went to full ink and, later, the initials
  // left and the helmet came in (`IconeEquipe`), because the crew has a name, not a face, and the initials gave the wrong monogram
  // ("TO" for "The Okafor brothers"). The measurement sweeps the section and does not accept the secondary color in background, text nor
  // border, and that is how it comes back if someone reintroduces a `secondary` in the block. The rest also enters:
  // crew note and "since" in `support`, the neighborhoods pin in the dark gold, the card background in
  // `surface`, and no pill behind the note.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const BLUE = "rgb(30, 95, 191)";
    const section = document.querySelector("#proof")!;
    const azul = [...section.querySelectorAll("*")]
      .map((e) => {
        const s = getComputedStyle(e);
        const usos = [
          s.backgroundColor,
          s.color,
          s.borderTopColor,
          s.borderBottomColor,
          s.borderLeftColor,
          s.borderRightColor,
        ].filter((v) => v === BLUE).length;
        return usos ? `${e.tagName}[${(e.getAttribute("class") ?? "").slice(0, 60)}]` : null;
      })
      .filter(Boolean);

    const monograma = section.querySelector('[data-slot="avatar-fallback"]');
    const crewCard = [...section.querySelectorAll('[data-slot="card"]')].find((c) =>
      (c.textContent ?? "").includes("installs"),
    )!;
    const crewLine = crewCard.querySelector("p.microcopy")!;
    const note = crewLine.querySelector("span")!;
    // The pin of the first neighborhood in the list.
    const pin = [...section.querySelectorAll("li span svg")].map((s) => getComputedStyle(s.parentElement!).color)[0];

    const pintura = document.createElement("canvas").getContext("2d")!;
    const color = (e: Element, propriedade: string) => {
      pintura.fillStyle = "#ffffff";
      pintura.fillStyle = getComputedStyle(e)[propriedade as never] as string;
      const normalizada = String(pintura.fillStyle);
      // An opaque color the canvas returns in hexadecimal, and the assertion reading expects rgb.
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
            letters: (monograma.textContent ?? "").trim(),
            glifos: monograma.querySelectorAll("svg").length,
            background: getComputedStyle(monograma).backgroundColor,
            color: getComputedStyle(monograma).color,
          }
        : null,
      cardBackground: getComputedStyle(crewCard).backgroundColor,
      lineColor: color(crewLine, "color"),
      readNote: (note.textContent ?? "").trim(),
      noteBackground: getComputedStyle(note).backgroundColor,
      pinColor: pin,
    };
  });

  expect(m.azul, `the secondary color came back in: ${m.azul?.join(" | ")}`).toEqual([]);
  expect(m.monograma, "did not find the crew circle").not.toBeNull();
  // The circle is the pair of the other two in this section: full ink behind, golden glyph in front (8.78 over the ink).
  expect(m.monograma!.background, "the crew circle is not in ink").toBe("rgb(22, 24, 26)");
  expect(m.monograma!.color, "the circle glyph is not in the light gold").toBe("rgb(245, 166, 35)");
  expect(m.monograma!.glifos, "the crew circle lost the icon").toBe(1);
  expect(m.monograma!.letters, "the initials came back to the crew circle").toBe("");
  // Card background: `surface`, with no wash.
  expect(m.cardBackground, "the crew card lost the surface background").toBe("rgb(255, 255, 255)");
  // The note, "installs" and "since" come from `support`, which is the support gray.
  expect(m.lineColor, "the crew line is not in support").toBe("rgb(91, 97, 103)");
  // The note is a loose number: the pin exists and nothing paints behind it.
  expect(m.readNote).toMatch(/^\d/);
  expect(m.noteBackground, "the crew note gained a pill").toBe("rgba(0, 0, 0, 0)");
  // The neighborhood pin stays in the dark gold, which measures 3.92 over the white.
  expect(m.pinColor, "the pin left the dark gold").toBe("rgb(176, 116, 15)");
});

// The three photos of the steps in the compact layout. Below 840 px the card photo was stretching the
// card, because there was only a cap on the desktop (`md:max-h-[11rem]`) and in the compact layout the `aspect-[4/3]` with `w-full`
// gave the height of the whole column in proportion. Measured before, at 390 px: 233 px of height per photo.
test.describe("the step photo in the compact layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the photo has a height cap and keeps the crop", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(400);
    const m = await page.evaluate(() =>
      [...document.querySelectorAll("#steps img")].map((i) => ({
        height: Math.round(i.getBoundingClientRect().height),
        width: Math.round(i.getBoundingClientRect().width),
        recorte: getComputedStyle(i).objectFit,
      })),
    );
    expect(m, "the steps block does not have three photos").toHaveLength(3);
    for (const photo of m) {
      // 10 rem is 160 px, plus 1 px of tolerance for the browser rounding.
      expect(photo.height, `the photo went past the 10 rem cap: ${photo.height} px`).toBeLessThanOrEqual(161);
      expect(photo.width, "the photo lost the column width").toBeGreaterThan(200);
      expect(photo.recorte, "the photo lost the cover crop").toBe("cover");
    }
  });
});

// The desktop keeps the 11 rem cap that already existed: the cut is only the compact layout.
test.describe("the step photo on the desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the photo keeps the 11 rem cap", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(400);
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll("#steps img")].map((i) => Math.round(i.getBoundingClientRect().height)),
    );
    // 11 rem is 176 px, plus 1 px of tolerance.
    expect(heights.every((a) => a <= 177), `heights on the desktop: ${heights.join(", ")}`).toBe(true);
  });
});
