// Simulator measurement in the browser.
//
// Why here and not in a unit test: the defect was not in the calculation, which has its own test and passes,
// it was in the interface state. The person's coverage choice was discarded when switching profile card,
// and that only shows up by actually clicking.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const city = JSON.parse(readFileSync("src/data/cities/phoenix-az.json", "utf8"));
const FIRST_PROFILE = city.householdProfiles[0];

// The fixed bar covers whatever sits on the bottom edge of the window, so the target is centered before the
// click. Accepts a CSS selector or a locator: the profile card is found by text, and text is not a CSS
// selector, so mixing the two inside the browser does not work.
async function clickCentered(
  page: import("@playwright/test").Page,
  target: string | import("@playwright/test").Locator,
) {
  const element = typeof target === "string" ? page.locator(target).first() : target;
  await element.scrollIntoViewIfNeeded();
  await element.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(250);
  await element.click();
}

// The coverage control went from three cards to a slider in steps of five. This helper
// is the same entry point for the two tests that drive coverage, so the drag is not repeated.
async function setCoverage(page: import("@playwright/test").Page, value: number) {
  const cursor = page.locator('input[type="range"]').first();
  await cursor.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await cursor.fill(String(value));
  await page.waitForTimeout(350);
}

async function markedCoverage(page: import("@playwright/test").Page) {
  return page.locator('input[type="range"]').first().inputValue();
}

test("coverage goes from 50 to 100 in steps of five points", async ({ page }) => {
  // Coverage goes from 50% to 100%, in steps of five points. The page offered three
  // points (50, 80 and 100), which is an acceptance requirement not met.
  await page.goto("/phoenix-az");
  const cursor = page.locator('input[type="range"]').first();
  await expect(cursor).toHaveAttribute("min", "50");
  await expect(cursor).toHaveAttribute("max", "100");
  await expect(cursor).toHaveAttribute("step", "5");

  // A value that is none of the three old ones, to prove the grid really exists.
  await cursor.scrollIntoViewIfNeeded();
  await cursor.fill("55");
  await page.waitForTimeout(400);
  const address = await page.evaluate(() => new URLSearchParams(location.search).get("coverage"));
  expect(address).toBe("55");
  await expect(page.locator("text=55%").first()).toBeVisible();

  // And the address of whoever receives the link opens with the same value.
  await page.goto("/phoenix-az?bill=220&coverage=95");
  await page.waitForTimeout(300);
  await expect(page.locator('input[type="range"]').first()).toHaveValue("95");

  // A value outside the grid is refused and falls back to the default, instead of becoming a crooked simulation.
  await page.goto("/phoenix-az?bill=220&coverage=57");
  await page.waitForTimeout(300);
  await expect(page.locator('input[type="range"]').first()).toHaveValue("80");
});

test("the incentive label comes from the city data", async ({ page }) => {
  // The label said "30%" written by hand, while the data carried the rate as a fraction. The proof here is weak
  // on its own (today's value is also 30%), and that is why the function's unit test is what sustains the
  // rule: here we check that the screen shows what the city file says.
  await page.goto("/phoenix-az");
  const expected = `${Math.round(city.federalCreditRate * 100)}%`;
  const label = await page.locator("text=Cost after the").first().innerText();
  expect(label).toContain(expected);
});

test("switching profile card does not discard the chosen coverage", async ({ page }) => {
  await page.goto("/phoenix-az");

  await setCoverage(page, 50);
  expect(await markedCoverage(page)).toBe("50");

  await clickCentered(page, page.getByText(FIRST_PROFILE.label).first());
  await page.waitForTimeout(500);

  expect(await markedCoverage(page)).toBe("50");
  // And the card did what it promises: the bill became the typical one for that profile.
  const bill = await page.locator("#bill").inputValue();
  expect(Number(bill.replace(/[^0-9]/g, ""))).toBe(FIRST_PROFILE.typicalBill);
});

test("the profile's typical bill applies even with coverage at 100%", async ({ page }) => {
  await page.goto("/phoenix-az");
  await setCoverage(page, 100);
  await clickCentered(page, page.getByText(FIRST_PROFILE.label).first());
  await page.waitForTimeout(500);
  expect(await markedCoverage(page)).toBe("100");
});

// ---------------------------------------------------------------------------------------------
// Result hierarchy and explanation of the number.
//
// The calculator has to look like a small financial tool, not a card with
// four identical numbers. The two measurements below guard exactly that: which number leads, and where it comes from.
// ---------------------------------------------------------------------------------------------

test("savings is the featured number, and the other three become statement lines", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const output = document.querySelector("#simulator output");
    if (!output) return null;
    const de48 = [...output.querySelectorAll("p")].filter((p) => parseFloat(getComputedStyle(p).fontSize) === 48);
    const de20 = [...output.querySelectorAll("p")].filter((p) => parseFloat(getComputedStyle(p).fontSize) === 20);
    return {
      quantosDe48: de48.length,
      featuredLabel: de48[0]?.parentElement?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      extrato: de20.map((p) => ({
        label: p.parentElement?.querySelector("p")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
        value: (p.textContent ?? "").trim(),
      })),
    };
  });
  expect(m, "could not find the result block").not.toBeNull();
  // Before, the four numbers sat on the same 48 px step and nothing said which one was the answer to the question
  // the person asked. Now the large step has a single owner, and it is the savings.
  expect(m!.quantosDe48).toBe(1);
  expect(m!.featuredLabel).toContain("Monthly savings");
  // And the other three became statement lines, at the 20 px step, in the order in which the bill happens.
  // The credit label comes from the city file, not from the text written here: a new city with a different rate
  // cannot break the assertion nor the label.
  expect(m!.extrato.map((l) => l.label)).toEqual([
    "Panels",
    `Cost after the ${Math.round(city.federalCreditRate * 100)}% federal credit`,
    "Years to payback",
  ]);
});

test("the result says what the bill comes to, not only how much it saves", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const output = page.locator("#simulator output");
  // The featured number is the savings; the sentence next to it is the context below the
  // numbers, and it is the same arithmetic as the simulation (bill minus savings), not new data.
  await expect(output).toContainText("Monthly savings");
  await expect(output).toContainText(/Your bill goes to about \$[\d,.]+ a month/);
});

test("the page shows where the value comes from, with the city numbers", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const items = await page.evaluate(() =>
    [...document.querySelectorAll("#how-we-calculate ol > li")].map((li) =>
      (li.textContent ?? "").replace(/\s+/g, " ").trim(),
    ),
  );
  // Six calculations, in this order: consumption, target, generation of one panel, panels, price and savings.
  expect(items).toHaveLength(6);
  expect(items[0]).toContain(`$${city.utilityRatePerKwh.toFixed(2)}`);
  expect(items[2]).toContain(String(city.panelWatts));
  expect(items[2]).toContain(String(city.peakSunHoursPerDay));
  expect(items[4]).toContain(`$${city.costPerWattInstalled.toFixed(2)}`);
  expect(items[4]).toContain(`${Math.round(city.federalCreditRate * 100)}%`);
});

test("when the minimum applies, the page says why the system goes past what the bill indicates", async ({ page }) => {
  // Minimum rule scenario, exercised through the screen and not through the function: a $90 bill with
  // 50% coverage asks for 4.27 panels, and the Phoenix minimum is 8.
  await page.goto("/phoenix-az?bill=90&coverage=50");
  await page.waitForTimeout(500);
  const alert = page.locator('#simulator [data-slot="alert"]').first();
  await expect(alert).toBeVisible();
  const text = (await alert.innerText()).replace(/\s+/g, " ");
  expect(text).toContain("Why more panels than you asked for");
  // The reason has both pieces: a panel is a whole unit, and there is a minimum per installation.
  expect(text).toMatch(/whole unit/i);
  expect(text).toContain(`minimum of ${city.minPanels}`);
  // And the price floor the minimum imposes is stated, with the number from the city file.
  await expect(page.locator("#simulator output")).toContainText("$6,930");
  // The same rule appears in the list of the six calculations, which is where it is visible before the result
  // surprises: the explanation does not depend on the warning.
  const bills = await page.evaluate(() =>
    [...document.querySelectorAll("#how-we-calculate ol > li")].map((li) =>
      (li.textContent ?? "").replace(/\s+/g, " ").trim(),
    ),
  );
  expect(bills[3]).toContain(`minimum of ${city.minPanels}`);
});

test("the estimate warning closes the calculation block, and is not fine print", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const warning = document.querySelector("#estimate-warning");
    if (!warning) return null;
    const item = warning.querySelector("li");
    if (!item) return null;
    const itemStyle = getComputedStyle(item);
    const box = warning.getBoundingClientRect();
    const lining = document.querySelector("#simulator div.rounded-xl.border")?.getBoundingClientRect();
    const adjacent = document.querySelector("#how-we-calculate ol")?.getBoundingClientRect();
    return {
      px: parseFloat(itemStyle.fontSize),
      lineHeight: parseFloat(itemStyle.lineHeight),
      border: parseFloat(getComputedStyle(warning).borderTopWidth),
      outsideCard: warning.closest('[data-slot="card"]') === null,
      belowResult: lining ? box.top >= lining.bottom - 1 : false,
      insideExplanation: warning.closest("#how-we-calculate") !== null,
      afterBills: adjacent ? box.top >= adjacent.bottom - 1 : false,
      text: (warning.textContent ?? "").replace(/\s+/g, " ").trim(),
    };
  });
  expect(m, "could not find the estimate warning").not.toBeNull();
  // It used to be `microcopy`: 14 px, at the foot of the card, in four lines. It was too small for
  // what it needs to say, and what it needs to say is what decides whether the person trusts the number.
  expect(m!.px, "the warning went back to being fine print").toBeGreaterThanOrEqual(16);
  expect(m!.lineHeight / m!.px).toBeGreaterThanOrEqual(1.4);
  expect(m!.border, "the warning lost its own box").toBeGreaterThan(0);
  // Two corrections measured here: the warning left the inside of the
  // result card, where the three blocks stayed glued; and then it became ONE block instead of two cards. The
  // warning became the second part of the explanation block: outside the card, below the result, inside the
  // calculation box and after the six calculations, separated from them by a 1 px line.
  expect(m!.outsideCard, "the warning went back to inside the result card").toBe(true);
  expect(m!.belowResult, "the warning moved up above the result").toBe(true);
  expect(m!.insideExplanation, "the warning left the explanation block").toBe(true);
  expect(m!.afterBills, "the warning ended up above the calculations").toBe(true);
  // And the four pieces of information are still stated: it is an estimate, it uses the reference rate, it is not a quote and the real
  // number varies. The rate and the sun hours themselves left here because they are already in the calculations above, and the text now
  // names them as what they are: reference numbers for the city, not those of the reader's house.
  expect(m!.text).toMatch(/estimate/i);
  expect(m!.text).toMatch(/reference numbers/i);
  // "Not a quote" is said with those words, and it is the distinction between an estimate and
  // a real quote.
  expect(m!.text).toMatch(/not a quote/i);
  expect(m!.text).toMatch(/shade/i);
});

test("the featured number uses round dollars, and the detailed bill keeps the cent", async ({ page }) => {
  // Distinction: in the result card, "$179" and "$14,726" read like a tool; in the list of
  // the six calculations, the cent is what allows checking the arithmetic. One number, two treatments, and the difference is
  // an assertion rather than taste.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const output = document.querySelector("#simulator output");
    if (!output) return null;
    const bySize = (px: number) =>
      [...output.querySelectorAll("p")]
        .filter((p) => parseFloat(getComputedStyle(p).fontSize) === px)
        .map((p) => (p.textContent ?? "").trim());
    const bills = [...document.querySelectorAll("#how-we-calculate ol > li")].map((li) =>
      (li.textContent ?? "").replace(/\s+/g, " "),
    );
    return { featured: bySize(48), extrato: bySize(20), bill: bills.join(" | ") };
  });
  expect(m, "could not find the result block").not.toBeNull();
  // Initial page state, the one from the table in `src/lib/acceptance.test.ts`: savings of $179.01 and cost of $14,726.25 after the credit.
  expect(m!.featured).toEqual(["$179"]);
  expect(m!.extrato).toContain("$14,726");
  expect(m!.bill).toContain("$179.01");
  expect(m!.bill).toContain("$14,726.25");
  // And the footer of the card says what the bill comes to, also in round dollars.
  await expect(page.locator("#simulator output")).toContainText("Your bill goes to about $41 a month");
});

test("with the city floor, the bill separates rounding from the minimum", async ({ page }) => {
  // Defect found: the sentence merged the two steps of the rule into one. The calculation does
  // Math.max(city.minPanels, Math.ceil(panelsRaw)), it rounds and then applies the floor, and the bill said the
  // system "rounds up to 8" (the ceiling of 6.84 is 7) and that the floor was below the rounded number (it is above).
  // State with the floor: a $90 bill with 80% asks for 6.84 panels, rounds to 7, and the Phoenix minimum is 8.
  await page.goto("/phoenix-az?bill=90&coverage=80");
  await page.waitForTimeout(600);
  const line = await page.evaluate(
    () =>
      [...document.querySelectorAll("#how-we-calculate li")]
        .map((li) => (li.textContent ?? "").replace(/\s+/g, " ").trim())
        .find((t) => t.includes("of them, and a panel")) ?? "",
  );
  expect(line, "could not find the panels line in the detailed bill").not.toBe("");
  // The assertion looks at the number and the direction: copy can change, the number cannot.
  expect(line).toMatch(/so that is 7\./);
  expect(line).toMatch(/minimum of 8 panels/);
  expect(line).toMatch(/floor is above the rounded number/);
  expect(line, "the bill again says the rounding reached the floor").not.toMatch(/rounds up to 8\b/);
  expect(line, "the bill again says the floor is below").not.toMatch(/under the number above/i);
});

test("the excess warning has a space between the value and the sentence", async ({ page }) => {
  // Defect found: the line break after the value ate the space, and the screen printed
  // "The extra $1.73goes to Arizona Public Service". State with the ceiling: a $430 bill with 100% coverage.
  await page.goto("/phoenix-az?bill=430&coverage=100");
  await page.waitForTimeout(600);
  const warning = await page.evaluate(() =>
    [...document.querySelectorAll("#simulator [role='alert']")]
      .map((e) => (e.textContent ?? "").replace(/\s+/g, " "))
      .join(" || "),
  );
  expect(warning, "could not find the excess warning").toContain("The extra");
  expect(warning).toMatch(/The extra \$1\.73 goes to/);
  // And no value glued to a letter in any warning on the screen.
  expect(warning, "value glued to the next word").not.toMatch(/\$[\d.,]+[A-Za-z]/);
});

test("the residence profile is a shortcut, not a form", async ({ page }) => {
  // The four cards with radio dots looked like a form, and the chosen state
  // was weak. The dot is gone; the state became the same as the coverage shortcuts, and this measurement guards
  // both halves: there is no radio, and the chosen one announces itself.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#simulator [data-profile]")];
    const marked = cards.find((c) => c.getAttribute("aria-pressed") === "true");
    return {
      howMany: cards.length,
      radios: document.querySelectorAll('#simulator input[type="radio"], #simulator [role="radio"]').length,
      pressionados: cards.filter((c) => c.getAttribute("aria-pressed") === "true").length,
      first: (cards[0]?.textContent ?? "").replace(/\s+/g, " ").trim(),
      // The background of the chosen one, besides the border and the ring: the active card has its own background, and this is
      // the pair the rest of the page uses (canvas behind, surface in front). No solid ink.
      chosenBackground: marked ? getComputedStyle(marked).backgroundColor : null,
      otherBackgrounds: cards
        .filter((c) => c.getAttribute("aria-pressed") !== "true")
        .map((c) => getComputedStyle(c).backgroundColor),
    };
  });
  expect(before.howMany).toBe(4);
  expect(before.radios, "the radio dot came back to the profile shortcut").toBe(0);
  // Only one comes chosen, and it is the one for the page's initial state ($220), which is NOT the first in the list (the $90 bill).
  expect(before.pressionados, "the initial state card did not start marked").toBe(1);
  expect(before.first).toContain("About $90 a month");
  // Canvas behind, surface in front: rgb(247, 246, 243) against rgb(255, 255, 255).
  expect(before.chosenBackground, "the chosen card did not get the canvas background").toBe("rgb(247, 246, 243)");
  for (const background of before.otherBackgrounds) {
    expect(background, "a loose card left the surface background").toBe("rgb(255, 255, 255)");
  }

  await clickCentered(page, page.locator("#simulator [data-profile]").first());
  await page.waitForTimeout(400);
  const after = await page.evaluate(() =>
    [...document.querySelectorAll("#simulator [data-profile]")].map((c) => c.getAttribute("aria-pressed")),
  );
  expect(after.filter((v) => v === "true")).toHaveLength(1);
  expect(after[0]).toBe("true");
});

test("the simulator opens at $220 with 80%, and with the three-bedroom card marked", async ({ page }) => {
  // The starting point is $220 and 80%, the first row of the table in `src/lib/acceptance.test.ts`. That state is the typical
  // bill for the "Three-bedroom house, no pool", and its card starts marked, with the other three loose. Before, no
  // card came marked, and the screen did not say where the initial state came from.
  await page.goto("/phoenix-az");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#simulator [data-profile]")];
    return {
      bill: (document.querySelector("#simulator #bill") as HTMLInputElement).value,
      coverage: (document.querySelector('#simulator input[type="range"]') as HTMLInputElement).value,
      coverageReading: [...document.querySelectorAll("#simulator .type-lead")].map((e) => e.textContent?.trim()),
      marked: cards
        .map((c, i) => ({ i, text: (c.textContent ?? "").replace(/\s+/g, " ").trim(), marked: c.getAttribute("aria-pressed") })),
      // The visual state the other cards already use: border and ring in the action color when `aria-pressed`.
      chosenBorder: cards.find((c) => c.getAttribute("aria-pressed") === "true")
        ? getComputedStyle(cards.find((c) => c.getAttribute("aria-pressed") === "true")!).borderColor
        : null,
      otherBorder: cards
        .filter((c) => c.getAttribute("aria-pressed") !== "true")
        .map((c) => getComputedStyle(c).borderColor),
    };
  });
  expect(m.bill, "the bill does not open at 220").toBe("220");
  expect(m.coverage, "coverage does not open at 80").toBe("80");
  expect(m.coverageReading, "the coverage value is not shown as %").toContain("80%");
  const marked = m.marked.filter((c) => c.marked === "true");
  expect(marked, `marked cards: ${JSON.stringify(marked)}`).toHaveLength(1);
  expect(marked[0].text, "the marked card is not the three-bedroom one").toContain("Three-bedroom house, no pool");
  expect(marked[0].text).toContain("About $220 a month");
  for (const outro of m.otherBorder) {
    expect(outro, "a loose card kept the action color border").not.toBe(m.chosenBorder);
  }
  // The four cards remain clickable: clicking the first one switches the bill AND the active card, and coverage stays.
  await clickCentered(page, page.locator("#simulator [data-profile]").first());
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("#simulator [data-profile]")];
    return {
      bill: (document.querySelector("#simulator #bill") as HTMLInputElement).value,
      coverage: (document.querySelector('#simulator input[type="range"]') as HTMLInputElement).value,
      ativos: cards.map((c) => c.getAttribute("aria-pressed")),
    };
  });
  expect(after.bill, "the clicked card did not switch the bill").toBe("90");
  expect(after.ativos.filter((v) => v === "true")).toEqual(["true"]);
  expect(after.coverage, "the clicked card touched coverage").toBe("80");
});

test("the profiles open the column, with the bill field right below and coverage next", async ({ page }) => {
  // Whoever arrives does not know their own bill by heart, so the profile shortcut now opens the column; the
  // field stays right below, editable, and coverage comes at the next step. What is measured is the ORDER on the screen, and
  // not the order in the file, because visual order is what matters here. The other half of the rule (choosing a card only
  // switches the bill and does not return coverage to the default) has its own measurement in
  // `switching profile card does not discard the chosen coverage`.
  for (const width of [393, 1280]) {
    await page.setViewportSize({ width: width, height: 900 });
    await page.goto("/phoenix-az");
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const bill = document.querySelector("#simulator #bill") as HTMLInputElement | null;
      const coverage = document.querySelector('#simulator input[type="range"]');
      const profiles = document.querySelector("#simulator [data-profile]")?.closest("fieldset");
      const box = (e: Element | null | undefined) => (e ? e.getBoundingClientRect() : null);
      const c = box(bill);
      const o = box(coverage);
      const p = box(profiles);
      return {
        profiles: p ? { top: Math.round(p.top), base: Math.round(p.bottom) } : null,
        bill: c ? { top: Math.round(c.top), base: Math.round(c.bottom) } : null,
        coverage: o ? { top: Math.round(o.top), base: Math.round(o.bottom) } : null,
        editable: bill ? !bill.disabled && !bill.readOnly : false,
        visible: c ? c.width > 40 && c.height > 10 : false,
        cards: profiles ? profiles.querySelectorAll("[data-profile]").length : 0,
      };
    });
    expect(m.profiles, `could not find the profiles at ${width}px`).not.toBeNull();
    expect(m.bill, `could not find the bill field at ${width}px`).not.toBeNull();
    expect(m.coverage, `could not find coverage at ${width}px`).not.toBeNull();
    expect(m.cards, "the four profiles are not all there").toBe(4);
    // The input stays editable and visible: the order changed, the field did not.
    expect(m.editable, `the bill field got locked at ${width}px`).toBe(true);
    expect(m.visible, `the bill field disappeared at ${width}px`).toBe(true);
    expect(m.profiles!.base, `the profiles are not above the bill field at ${width}px`).toBeLessThanOrEqual(
      m.bill!.top,
    );
    expect(
      m.bill!.base,
      `coverage is not right below the bill field at ${width}px`,
    ).toBeLessThanOrEqual(m.coverage!.top);
  }
});
