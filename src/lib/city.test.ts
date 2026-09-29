import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findOptionalCity, loadCityFrom, getCity, listCitySlugs } from "./city";
import { citySchema } from "./schema";

// The schema is the single source of the City type. The two cases below exist because a
// file with a zero rate makes the calculation go to infinity and the screen show a broken number in silence.
const realCity = JSON.parse(readFileSync("src/data/cities/phoenix-az.json", "utf8"));

describe("city data", () => {
  it("lists the published slug", () => {
    expect(listCitySlugs()).toContain("phoenix-az");
  });

  it("brings the fields the calculation uses", () => {
    const c = getCity("phoenix-az");
    expect(c.utilityRatePerKwh).toBe(0.15);
    expect(c.panelWatts).toBe(450);
    expect(c.minPanels).toBe(8);
    expect(c.householdProfiles).toHaveLength(4);
    expect(c.faq).toHaveLength(6);
  });

  it("refuses a slug with a path traversal", () => {
    // A JSON from outside src/data/cities with a `..` slug went straight into the file path. The shape
    // became closed in the loader itself.
    expect(() => getCity("../../../../../../../tmp/alvo")).toThrow(/invalid slug/);
    expect(() => getCity("/tmp/alvo")).toThrow(/invalid slug/);
    expect(() => getCity("../package")).toThrow(/invalid slug/);
  });

  it("names the file and the field when the data is wrong", () => {
    const folder = mkdtempSync(path.join(tmpdir(), "city-"));
    writeFileSync(path.join(folder, "broken.json"), JSON.stringify({ ...realCity, utilityRatePerKwh: 0 }));
    expect(() => loadCityFrom(folder, "broken")).toThrow(/broken\.json/);
    expect(() => loadCityFrom(folder, "broken")).toThrow(/utilityRatePerKwh/);
  });

  it("optional city returns null instead of throwing", () => {
    // It exists for the metadata: generateMetadata called the loader directly, without the check that the
    // page body did, so an invalid slug became a rendering error instead of a 404.
    expect(findOptionalCity("not-existe")).toBeNull();
    expect(findOptionalCity("../../../../etc/hosts")).toBeNull();
    expect(findOptionalCity("phoenix-az")?.slug).toBe("phoenix-az");
  });

  it("refuses a city with a zero rate, which is what breaks the bill", () => {
    expect(citySchema.safeParse({ ...realCity, utilityRatePerKwh: 0 }).success).toBe(false);
  });

  it("refuses rate, sun and cost outside the plausible band", () => {
    expect(citySchema.safeParse({ ...realCity, peakSunHoursPerDay: 30 }).success).toBe(false);
    expect(citySchema.safeParse({ ...realCity, performanceRatio: 1.5 }).success).toBe(false);
    expect(citySchema.safeParse({ ...realCity, costPerWattInstalled: -1 }).success).toBe(false);
    expect(citySchema.safeParse({ ...realCity, minPanels: 0 }).success).toBe(false);
    expect(citySchema.safeParse({ ...realCity, federalCreditRate: 1.2 }).success).toBe(false);
  });

  it("refuses an empty list and a text field where a number is expected", () => {
    expect(citySchema.safeParse({ ...realCity, faq: [] }).success).toBe(false);
    expect(citySchema.safeParse({ ...realCity, panelWatts: "450" }).success).toBe(false);
  });

  it("refuses a non-finite number, which is what the formatting cannot take", () => {
    expect(citySchema.safeParse({ ...realCity, utilityRatePerKwh: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(citySchema.safeParse({ ...realCity, utilityRatePerKwh: Number.NaN }).success).toBe(false);
  });

  it("accepts the real city file, whole", () => {
    const r = citySchema.safeParse(realCity);
    expect(r.success, r.success ? "" : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ")).toBe(true);
  });

  it("does not invent a value, only reads the city file", () => {
    const c = getCity("phoenix-az");
    expect(c.city).toBe("Phoenix");
    expect(c.utilityName).toBe("Arizona Public Service");
    expect(c.installsCompleted).toBe(1840);
    expect(c.avgPermitDays).toBe(21);
    expect(c.crews).toHaveLength(3);
    expect(c.testimonials).toHaveLength(3);
    expect(c.popularNeighborhoods.length).toBeGreaterThan(3);
  });
});
