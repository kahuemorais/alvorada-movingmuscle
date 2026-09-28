// Measurement of the social proof.
//
// The section had three cards of one kind and three of another, with different icons, and nothing
// saying why they are two groups. The cause was not the icon, it was the absence of a label and a title that
// promised the reverse order of the one the page shows.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// A single selector: with a comma the CSS creates two selectors, and `${SECAO} h2` also started matching the
// whole section, which made the first version of this test compare the text of everything.
const SECTION = "section#proof";

test("each trio has a label, in the order of the page", async ({ page }) => {
  await page.goto("/phoenix-az");
  // Three labels now, and not two: the covered neighborhoods block gained a title of its own because
  // "Crews cover" did not say what it was nor what it was for. It is a real third group, so it enters the
  // count instead of becoming loose text.
  const labels = await page.locator(`${SECTION} h3`).allInnerTexts();
  expect(labels.map((r) => r.trim().toLowerCase())).toEqual([
    "what the neighbors say",
    "who did the work",
    "where the crews work",
  ]);

  // Each label sits above its trio: the first above the first quote, the second above the
  // first crew card. That is what separates one trio from the other.
  const posicoes = await page.evaluate((seletor) => {
    const section = document.querySelector(seletor)!;
    const y = (el: Element) => Math.round(el.getBoundingClientRect().top + window.scrollY);
    const labels = Array.from(section.querySelectorAll("h3")).map(y);
    const citacao = section.querySelector("blockquote");
    const crew = Array.from(section.querySelectorAll("p, span")).find((e) =>
      e.textContent?.includes("installs"),
    );
    return { labels, citacao: citacao ? y(citacao) : null, crew: crew ? y(crew) : null };
  }, SECTION);
  expect(posicoes.citacao).not.toBeNull();
  expect(posicoes.crew).not.toBeNull();
  expect(posicoes.labels[0]).toBeLessThan(posicoes.citacao!);
  expect(posicoes.labels[1]).toBeLessThan(posicoes.crew!);
  expect(posicoes.labels[1]).toBeGreaterThan(posicoes.citacao!);
  // The third label closes the section, after the crews: it talks about the places, and the places come after whoever
  // works in them.
  expect(posicoes.labels[2]).toBeGreaterThan(posicoes.crew!);
});

test("the section title does not promise an order the page does not follow", async ({ page }) => {
  await page.goto("/phoenix-az");
  const title = (await page.locator(`${SECTION} h2`).innerText()).toLowerCase();
  // The old title said "who did the work, and what the neighbors say" and the section shows the opposite.
  expect(title).not.toContain("who did the work, and");
});

test("the featured testimonial does not stretch to the height of the two on the right", async ({ page }) => {
  // Defect measured before: without the photo, the featured one followed the height of the two cards
  // on the right and became a white rectangle with the quote in the middle, because it took two lines with the default
  // `align-items: stretch` of the grid. In the new grid it is alone on the first line, and there is no neighbor to
  // stretch it: the measurement stays as a guard, together with the type step of the quote, which remains one above the others.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate((seletor) => {
    const grid = document.querySelector(`${seletor} .grid`)!;
    const cards = [...grid.children];
    const height = (el: Element) => Math.round(el.getBoundingClientRect().height);
    const citacoes = [...document.querySelectorAll(`${seletor} blockquote`)];
    return {
      howMany: cards.length,
      featured: height(cards[0]),
      dois: height(cards[1]) + height(cards[2]),
      sizeDestaque: parseFloat(getComputedStyle(citacoes[0]).fontSize),
      sizeOutras: parseFloat(getComputedStyle(citacoes[1]).fontSize),
    };
  }, SECTION);
  expect(m.howMany, "the testimonials grid changed size").toBe(3);
  expect(m.featured, "the featured one followed the height of the two on the right").toBeLessThan(m.dois);
  expect(m.sizeDestaque, "the quote of the featured one did not go up to type-lead").toBe(20);
  expect(m.sizeOutras, "the quote of the other two changed step").toBe(16);
});

// The testimonial grid on the desktop. The featured one stops taking two ROWS in the left
// column and starts taking the two COLUMNS of the first row, with the other two side by side on the second. The
// measurement guards the geometry, and not the class: the width of each card against the width of the grid, and the top of each
// one, which is what says in which row it fell.
test("on the desktop the featured one takes the whole first row and the other two split the second", async ({
  page,
}) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate((seletor) => {
    const grid = document.querySelector(`${seletor} .grid`)!;
    const boxes = [...grid.children].map((el) => el.getBoundingClientRect());
    return {
      gridWidth: Math.round(grid.getBoundingClientRect().width),
      widths: boxes.map((r) => Math.round(r.width)),
      topos: boxes.map((r) => Math.round(r.top)),
    };
  }, SECTION);
  expect(m.widths, "the testimonials grid changed size").toHaveLength(3);
  expect(m.widths[0], "the featured one does not take the two columns").toBeGreaterThan(m.gridWidth - 2);
  // Each of the other two with half the grid, minus the 16 px gap between the columns.
  const meia = (m.gridWidth - 16) / 2;
  expect(Math.abs(m.widths[1] - meia), `width of the second: ${m.widths[1]} against ${meia}`).toBeLessThanOrEqual(2);
  expect(Math.abs(m.widths[2] - meia), `width of the third: ${m.widths[2]} against ${meia}`).toBeLessThanOrEqual(2);
  // First row with the featured one only, and the second with the two starting from the same top.
  expect(m.topos[0], "the featured one did not stay above the other two").toBeLessThan(m.topos[1]);
  expect(m.topos[1], "the two of the second row do not start together").toBe(m.topos[2]);
});

// And in the compact layout nothing changes: one column, the three stacked, with Marta first, which is the file order.
test.describe("the testimonials grid in the compact layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the three stay stacked with Marta first", async ({ page }) => {
    await page.goto("/phoenix-az");
    await page.waitForTimeout(400);
    const m = await page.evaluate((seletor) => {
      const grid = document.querySelector(`${seletor} .grid`)!;
      const boxes = [...grid.children].map((el) => el.getBoundingClientRect());
      return {
        gridWidth: Math.round(grid.getBoundingClientRect().width),
        widths: boxes.map((r) => Math.round(r.width)),
        topos: boxes.map((r) => Math.round(r.top)),
        firstLine: (grid.children[0].textContent ?? "").replace(/\s+/g, " "),
      };
    }, SECTION);
    expect(m.widths).toEqual([m.gridWidth, m.gridWidth, m.gridWidth]);
    expect(m.topos[0]).toBeLessThan(m.topos[1]);
    expect(m.topos[1]).toBeLessThan(m.topos[2]);
    // The first of the stack is Marta's testimonial, which is the order of the city file.
    const first = JSON.parse(
      readFileSync("src/data/cities/phoenix-az.json", "utf8"),
    ).testimonials[0].author as string;
    expect(m.firstLine, "the first of the stack is not the one by Marta").toContain(first);
  });
});
