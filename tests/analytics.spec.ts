import { expect, test } from "@playwright/test";

// The business requirement: on Monday, whoever runs the campaigns needs to know which ads
// generated savings simulations. Pageview does not answer that, so the event carries the origin together with the numbers.
//
// This test exists because the defect lived exactly in the gap between the two halves: the analytics module knew how to
// read the tag from the search, and its unit test proves that with the search in hand. But the simulator rewrites the URL
// on every adjustment (`replaceState` with bill and coverage), and the events read `window.location.search` at the moment of
// firing, when the tags had already been erased. The function was right and the event arrived empty. It is the kind of
// defect that only shows up with the whole page running, which is what this file does.
const WITH_CAMPAIGN = "/phoenix-az?utm_source=google&utm_medium=cpc&utm_campaign=phoenix-solar&gclid=abc123";

async function withQueue(page: import("@playwright/test").Page) {
  // The `va` queue is the same gate that @vercel/analytics uses; the page does not serve its script in the
  // local environment, so the queue becomes ours and the test reads what the application sent.
  await page.addInitScript(() => {
    (window as unknown as { __va: unknown[] }).__va = [];
    (window as unknown as { va: (cmd: string, data: unknown) => void }).va = (cmd, data) => {
      (window as unknown as { __va: unknown[] }).__va.push({ cmd, data });
    };
  });
}

const eventos = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __va: { cmd: string; data: { name?: string; data?: Record<string, unknown> } }[] })
        .__va ?? [],
  );

async function touchesSimulator(page: import("@playwright/test").Page, bill: number) {
  const campo = page.locator("#simulator input#bill");
  await campo.click();
  await campo.fill(String(bill));
  await campo.blur();
  // The wait is the one from the code itself: the event only goes out after the person stops touching it, so as not to count every
  // step of the control as a simulation in the media team report.
  await page.waitForTimeout(1800);
}

test("the simulation event carries the campaign, even after the URL loses the tags", async ({ page }) => {
  await withQueue(page);
  await page.goto(WITH_CAMPAIGN);
  await page.waitForTimeout(600);
  await touchesSimulator(page, 310);

  const queue = await eventos(page);
  const completed = queue.filter((e) => e.cmd === "event" && e.data?.name === "simulation_completed").pop();
  expect(completed, "no simulation_completed event").toBeTruthy();

  const data = completed!.data.data ?? {};
  // The four simulation numbers stay in the event: it is what the team uses to decide what to pause.
  expect(data.panels).toBe(24);
  expect(data.bill).toBe(310);
  // And the origin, which is the point of the requirement.
  expect(data.utm_source, "event without utm_source").toBe("google");
  expect(data.utm_medium, "event without utm_medium").toBe("cpc");
  expect(data.utm_campaign, "event without utm_campaign").toBe("phoenix-solar");
  expect(data.gclid, "event without gclid").toBe("abc123");

  // The URL lost the tags when the control was adjusted, and that is on purpose: the shared link carries the simulation.
  expect(await page.evaluate(() => window.location.search)).not.toContain("utm_source");
});

test("the campaign survives a second visit in the same session", async ({ page }) => {
  // The module stores the origin in the session precisely because the person scrolls the page and touches the simulator afterwards. Without
  // this guard, the second visit within the same session would send the event with no tag, and the agency report
  // would count the simulation as direct traffic.
  await withQueue(page);
  await page.goto(WITH_CAMPAIGN);
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForTimeout(600);
  await touchesSimulator(page, 430);

  const queue = await eventos(page);
  const completed = queue.filter((e) => e.cmd === "event" && e.data?.name === "simulation_completed").pop();
  const data = completed?.data.data ?? {};
  expect(data.utm_campaign, "the campaign got lost on the reload").toBe("phoenix-solar");
});

test("with no campaign in the URL, the event does not invent an origin", async ({ page }) => {
  await withQueue(page);
  await page.goto("/phoenix-az");
  await page.waitForTimeout(600);
  await touchesSimulator(page, 310);

  const queue = await eventos(page);
  const completed = queue.filter((e) => e.cmd === "event" && e.data?.name === "simulation_completed").pop();
  const data = completed?.data.data ?? {};
  expect(data.panels).toBe(24);
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "gclid", "fbclid"]) {
    expect(data[key], `event with no campaign gained ${key}`).toBeUndefined();
  }
});
