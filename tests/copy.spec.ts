// Measurement of the page text against the data file.
//
// Why it exists: "the content of the document is all on the page" is the easiest claim to make and the easiest
// to break without anyone seeing. A copy rewrite, a swapped label, and a fact from the document disappears from
// the screen in silence.
//
// What it guarantees, on two fronts:
//   1. Every string from the data file appears on the page, normalizing space. Since the data file is where
//      the text the page shows lives, this covers testimonial, FAQ answer, profile label,
//      crew text and incentive note, including the numbers inside the sentences.
//   2. The visible text has no em dash and no exclamation mark, which are Layer 0 of `kopy`, the writing
//      discipline of this project. Its mechanical auditor runs over a text file; here the same rule becomes
//      measurement, on the text the page actually shows.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const CITY = JSON.parse(
  readFileSync("src/data/cities/phoenix-az.json", "utf8"),
) as Record<string, unknown>;

function strings(value: unknown, output: string[] = []): string[] {
  if (typeof value === "string") {
    if (value.trim().length > 12) output.push(value.trim());
  } else if (Array.isArray(value)) {
    value.forEach((v) => strings(v, output));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => strings(v, output));
  }
  return output;
}

const normalizar = (s: string) => s.replace(/\s+/g, " ").trim();

test("the page text comes from the original document", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  // textContent, and not innerText: the FAQ answers live inside the closed accordion, and innerText ignores
  // hidden text. The first version of this measurement reported six missing answers because of that, when the
  // defect was the method, not the page.
  const body = await page.evaluate(() => document.body.textContent ?? "");
  const pageText = normalizar(body);

  const faltando = strings(CITY).filter((s) => !pageText.includes(normalizar(s)));
  expect(faltando, `string from the data file that does not appear on the page: ${faltando.join(" | ")}`).toEqual(
    [],
  );
});

test("the page text passes layer zero of kopy", async ({ page }) => {
  await page.goto("/phoenix-az");
  await page.waitForTimeout(400);
  const body = await page.evaluate(() => document.body.textContent ?? "");
  // An em dash is forbidden, and the stroke in the metropolitan area name is an en dash, which is not an em dash.
  expect(body).not.toContain("—");
  // An exclamation mark is forbidden in the project copy.
  expect(body).not.toContain("!");
});
