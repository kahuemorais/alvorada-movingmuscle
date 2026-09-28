import { describe, expect, it } from "vitest";
import { getCity } from "./city";
import { simulate } from "./solar";

const phoenix = getCity("phoenix-az");

describe("calculation rules", () => {
  it("rounds panels up and the investment follows the final number", () => {
    const r = simulate(phoenix, { bill: 220, coverage: 80 });
    expect(r.panelsRaw).toBeGreaterThan(16);
    expect(r.panelsRaw).toBeLessThan(17);
    expect(r.panels).toBe(17);
    // investment and generation use 17 panels, not the 16.71 of the intermediate calculation
    expect(r.investmentGross).toBe(17 * phoenix.panelWatts * phoenix.costPerWattInstalled);
    expect(r.generationKwh).toBe(Number((17 * r.panelGenerationKwh).toFixed(2)));
  });

  it("respects the city minimum and flags it", () => {
    const r = simulate(phoenix, { bill: 60, coverage: 50 });
    expect(r.panelsRaw).toBeLessThan(phoenix.minPanels);
    expect(r.panels).toBe(phoenix.minPanels);
    expect(r.flags.minPanelsApplied).toBe(true);
  });

  it("does not let the savings go past the bill and flags the surplus", () => {
    const r = simulate(phoenix, { bill: 430, coverage: 100 });
    expect(r.rawGenerationValue).toBe(431.73);
    expect(r.monthlySavings).toBe(430);
    expect(r.flags.savingsCapped).toBe(true);
    expect(r.flags.surplusValue).toBe(1.73);
  });
});
