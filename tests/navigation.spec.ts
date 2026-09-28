// Measurement of the navigation, in the real browser.
//
// Why this file exists, and not a unit test over classes: the defect of the bar was not about
// logic, it was about geometry. The screen measurement caught both complaints: the Home item stopped below the
// top, and the phone bar floated with a rounded corner when it was not supposed to have either one nor
// the other. A class written in the code proves nothing of that; measuring the element box does.
import { expect, test } from "@playwright/test";

const BAR = 'nav[aria-label="Main navigation"]';

test.describe("navigation bar on mobile", () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test("touches the bottom edge and takes the whole width", async ({ page }) => {
    await page.goto("/phoenix-az");
    const box = (await page.locator(BAR).boundingBox())!;
    expect(Math.round(box.width)).toBe(393);
    expect(Math.round(box.y + box.height)).toBe(852);
  });

  test("has no rounded corner and keeps the glass", async ({ page }) => {
    await page.goto("/phoenix-az");
    const style = await page.locator(BAR).evaluate((n) => {
      const s = getComputedStyle(n);
      return { raio: s.borderTopLeftRadius, filtro: s.backdropFilter };
    });
    expect(style.raio).toBe("0px");
    expect(style.filtro).toContain("blur");
  });

  test("the Home item leads to the top of the document", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator(`${BAR} a[href="#top"]`).click();
    await page.waitForFunction(() => window.scrollY === 0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the content does not stay behind the bar at the end of the page", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      // The measurement started looking at the CONTENT of the last band, and not at its box: with the bands, the section ends at the end
      // of the document on purpose (it is the action color up to the edge), and what reserves space for the bar is the breathing room below it. What
      // has to be visible is the last text, which is the state incentive notice.
      const last = document.querySelector("main > section:last-of-type")!;
      const conteudo = last.lastElementChild!.lastElementChild!.getBoundingClientRect();
      const bar = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      return { conteudo: conteudo.bottom, bar: bar.top };
    });
    expect(Math.round(m.bar - m.conteudo)).toBeGreaterThan(8);
  });

  test("on mobile the hero and the simulator reserve the height of the bar", async ({ page }) => {
    // The bar lives fixed on the bottom edge, so it covers the bottom band of the window at ANY scroll
    // position. Measured before this change: on the first frame of the page the numbers band of the opening sat
    // 3 px behind the bar in an 852 window and 33 px in a 667 one, and the bill field, when the browser
    // brings it into the visible area, could land in the same band. The fix is to reserve the space of the bar at the end of
    // the two blocks that have a field and an action, and not only at the end of the document.
    await page.goto("/phoenix-az");
    const m = await page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      const hero = document.querySelector("section:has(#hero-title) > div")!;
      const simulador = document.querySelector("#simulator")!;
      const cta = document.querySelector("section:has(#hero-title) a[href='#simulator']")!.getBoundingClientRect();
      // What stayed behind the bar: the band of the three numbers and the provenance line, which
      // lives right below it. Measuring both pieces, and not the reserve alone, is what catches that complaint: the
      // reserve was the size of the bar, and the content of the opening went past it because of the two-sentence lead.
      const items = [...document.querySelectorAll("section:has(#hero-title) dl > div")];
      const lastNumber = items[items.length - 1].getBoundingClientRect();
      const procedencia = document.querySelector("section:has(#hero-title) dl + p")!.getBoundingClientRect();
      const lead = document.querySelector("section:has(#hero-title) p.type-body")!;
      return {
        barHeight: Math.round(bar.height),
        barTop: Math.round(bar.top),
        heroReserve: Math.round(parseFloat(getComputedStyle(hero).paddingBottom)),
        simulatorReserve: Math.round(parseFloat(getComputedStyle(simulador).paddingBottom)),
        ctaBackground: Math.round(cta.bottom),
        numbersBackground: Math.round(lastNumber.bottom),
        provenanceBackground: Math.round(procedencia.bottom),
        leadSentences: (lead.textContent ?? "").split(/[.!?]/).filter((t) => t.trim().length > 0).length,
      };
    });
    // The reserve is the height of the bar plus the breathing room that already existed around the content of the opening.
    expect(m.heroReserve).toBeGreaterThanOrEqual(m.barHeight + 24);
    expect(m.simulatorReserve).toBeGreaterThanOrEqual(m.barHeight);
    // And the action of the opening stays above the bar at the position where the page opens.
    expect(m.ctaBackground).toBeLessThan(m.barTop);
    // The social proof of the opening too: the three numbers and the utility line above the glass.
    expect(m.numbersBackground, "the three numbers fall behind the bar").toBeLessThan(m.barTop);
    expect(m.provenanceBackground, "the utility line falls behind the bar").toBeLessThan(m.barTop);
    // And the opening lead is one sentence: that is what gives back the space the numbers band was losing.
    expect(m.leadSentences, "the hero lead went back to having more than one sentence").toBe(1);

    // At the anchor destination, the FIRST control of the panel stays above the bar. Before, the anchor was
    // measured by the bill field, because that was what opened the column; with the four profile cards in front,
    // what the jump brings to the screen is the first card, and the bill field starts staying below the
    // fold on the phone (851 px in an 852 window, measured), behind the bar. That is not a defect of the jump: it is the
    // consequence of the requested order, and the field stays editable and visible, with its own measurement in
    // `tests/simulator.spec.ts`. What this test guards is that the jump does not end with a control UNDER the bar.
    await page.locator(`${BAR} a[href="#simulator"]`).click();
    await page.waitForTimeout(900);
    const target = await page.evaluate(() => {
      const card = document.querySelector("#simulator [data-profile]")!.getBoundingClientRect();
      const panel = document.querySelector("#simulator .grid")!.getBoundingClientRect();
      const bar = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      return {
        cardTop: Math.round(card.top),
        cardBackground: Math.round(card.bottom),
        panelTop: Math.round(panel.top),
        barTop: Math.round(bar.top),
      };
    });
    // The panel starts in the visible area and the first card stays whole above the bar.
    expect(target.panelTop).toBeGreaterThanOrEqual(0);
    expect(target.cardTop).toBeGreaterThanOrEqual(0);
    expect(target.cardBackground).toBeLessThan(target.barTop);
  });

  test("the Call item leads to the booking section, and does not dial", async ({ page }) => {
    // The call button of the menu leads to the section where the visit is scheduled. The phone
    // stays inside that section, written as a phone, so whoever wants to call calls from there.
    await page.goto("/phoenix-az");
    // The selector is explicit, and not `.last()`: the bar gained the blog item and what this test measures is the
    // conversion item, not "the last one in the bar". With `.last()` the test started pointing at the blog
    // on the day it entered the menu, and the wrong fix would be to loosen the assertion. What guards the
    // order, with the conversion item at the end, is the next test.
    const item = page.locator(`${BAR} a[href="#book"]`);
    await expect(item).toHaveText(/Call/i);
    const href = (await item.getAttribute("href"))!;
    expect(href.startsWith("#")).toBe(true);
    await item.click();
    // The anchor scroll is smooth, so the destination does not arrive at the same
    // instant as the click. The wait is for the section to enter the window, which is exactly what this test measures,
    // and the dry jump keeps holding for whoever asked for less motion in the system.
    await page.waitForFunction(
      (h) => {
        const box = document.querySelector(`${h} a[href^="tel:"]`)?.getBoundingClientRect();
        return Boolean(box && box.top < window.innerHeight && box.bottom > 0);
      },
      href,
      { timeout: 6000 },
    );
    // The measurement is visibility, and not distance from the top: this is the last section of the page, so the
    // browser cannot scroll further up and its top stops above zero. What matters is that the section
    // enters the window and that the phone, which is the channel, stays visible.
    const inViewport = await page.evaluate((h) => {
      const section = document.querySelector(h)!.getBoundingClientRect();
      const telefone = document.querySelector(`${h} a[href^="tel:"]`);
      const box = telefone?.getBoundingClientRect();
      return {
        height: window.innerHeight,
        top: Math.round(section.top),
        base: Math.round(section.bottom),
        telefoneVisivel: Boolean(box && box.top < window.innerHeight && box.bottom > 0),
      };
    }, href);
    expect(inViewport.top).toBeLessThan(inViewport.height);
    expect(inViewport.base).toBeGreaterThan(0);
    expect(inViewport.telefoneVisivel).toBe(true);
  });

  test("the conversion item closes the bar, with the blog before it", async ({ page }) => {
    // The order: the item that leads to the scheduling is the last one in the bar. The blog is a destination of
    // another page and enters before it. Before this, the order was measured sideways, by the `.last()` of the test
    // above, which, when the blog entered the menu, started pointing at the blog.
    await page.goto("/phoenix-az");
    const labels = (await page.locator(`${BAR} a`).allInnerTexts()).map((t) => t.trim());
    expect(labels.at(-1)).toBe("Call");
    // The blog exists in the menu, points to the blog page and is not the last item: the address with a leading
    // slash says it is another page, and not an anchor of this one, which is what the rest of the bar is.
    const blog = page.locator(`${BAR} a[href="/blog"]`);
    await expect(blog).toHaveText(/Blog/i);
    expect(labels.indexOf("Blog")).toBeGreaterThan(-1);
    expect(labels.indexOf("Blog")).toBeLessThan(labels.length - 1);
  });

  test("the five labels fit in one line each", async ({ page }) => {
    // The bar uses `flex-1` on the phone, so each new item squeezes the column of the others. A long label
    // breaks into two lines, and breaking does not change the height of the touch target: the 48 px test does not reveal it.
    // What reveals it is the label height going past one line-height. If any of them breaks, the fix is a shorter
    // label, and not a smaller font.
    await page.goto("/phoenix-az");
    // It waits for the font to swap, and not for a fixed time: the widest label is measured with the font the visitor
    // sees, and the system font is narrower than the site one, so measuring before the swap would measure the
    // easy case.
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    // The selector became the label hook, and not "any span of the item": the item gained a wrapper
    // around the icon (for the cursor gold), and "any span" started counting ten elements in five items.
    const lines = await page.locator(`${BAR} a [data-label]`).evaluateAll((labels) =>
      labels.map((label) => {
        const height = label.getBoundingClientRect().height;
        const line = parseFloat(getComputedStyle(label).lineHeight);
        return Math.round(height / line);
      }),
    );
    expect(lines).toHaveLength(5);
    for (const n of lines) expect(n).toBe(1);
  });

  test("on mobile the brand lives inside the hero, and only once", async ({ page }) => {
    // The brand at the start of the page, on the phone, sits INSIDE the opening. Before it lived in an identity
    // line above the ink block, and that line no longer exists on the city page: the test that
    // guarded its content (no city and no abbreviation) went away with it, because its subject was the line, which is not there.
    // What is guarded now are the two halves of the new arrangement: the brand inside the opening, once only, and outside the
    // bottom bar, which is short and squeezes the labels.
    await page.goto("/phoenix-az");
    const hero = page.locator("section:has(#hero-title)");
    await expect(hero).toContainText("Brightfield Solar");
    await expect(page.locator('nav[aria-label="Brightfield Solar"]')).toHaveCount(0);
    // The bottom bar carries the brand in the DOM (the item is hidden by class from the medium size up), so the
    // guard is about VISIBILITY, and not about text: `toContainText` reads the DOM and failed a brand that nobody sees.
    const visiveis = await page.evaluate(() =>
      [...document.querySelectorAll("span, a, p")].filter(
        (el) =>
          el.children.length === 0 &&
          (el.textContent ?? "").trim() === "Brightfield Solar" &&
          el.getBoundingClientRect().width > 0,
      ).length,
    );
    expect(visiveis, `the brand shows up ${visiveis} times visible on the phone`).toBe(1);
  });

  test("the touch target of each item has at least 48 px", async ({ page }) => {
    await page.goto("/phoenix-az");
    const heights = await page.locator(`${BAR} a`).evaluateAll((items) =>
      items.map((i) => Math.round(i.getBoundingClientRect().height)),
    );
    expect(heights.length).toBeGreaterThan(0);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(48);
  });
});

test.describe("navigation bar from the medium size up", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("stays at the top, takes the width and carries the brand on the left", async ({ page }) => {
    // This measurement guarded the previous rule: the bar could not reach the brand, because the brand lived outside it, in the
    // identity line. In the current arrangement the brand is inside the bar, so what is guarded is that it is contained
    // in the bar and before the destinations.
    await page.goto("/phoenix-az");
    const m = await page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      const inside = [...document.querySelectorAll('nav[aria-label="Main navigation"] span')].find(
        (s) => (s.textContent ?? "").trim() === "Brightfield Solar",
      );
      const destination = document.querySelector('nav[aria-label="Main navigation"] a')!.getBoundingClientRect();
      const rb = inside?.getBoundingClientRect();
      return {
        top: Math.round(bar.top),
        width: Math.round(bar.width),
        base: Math.round(bar.bottom),
        insideBar: rb ? Math.round(rb.top) >= Math.round(bar.top) && Math.round(rb.bottom) <= Math.round(bar.bottom) : false,
        beforeDestinations: rb ? Math.round(rb.right) <= Math.round(destination.left) + 1 : false,
      };
    });
    expect(m.top).toBe(0);
    expect(m.width).toBe(1280);
    expect(m.insideBar, "the brand is not contained in the bar").toBe(true);
    expect(m.beforeDestinations, "the brand is not on the left of the destinations").toBe(true);
  });

  test("the section anchor stops below the bar, without hiding the title", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.locator(`${BAR} a[href="#steps"]`).click();
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => {
      const section = document.querySelector("#steps")!.getBoundingClientRect();
      const bar = document.querySelector('nav[aria-label="Main navigation"]')!.getBoundingClientRect();
      return { section: Math.round(section.top), bar: Math.round(bar.bottom) };
    });
    expect(m.section).toBeGreaterThanOrEqual(m.bar);
  });
});
