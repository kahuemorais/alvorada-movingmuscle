import { describe, expect, it } from "vitest";
import { getCity } from "./city";
import { simulate } from "./solar";

const phoenix = getCity("phoenix-az");
const profile = (i: number) => phoenix.householdProfiles[i].typicalBill;

// The six states of the reference table, in the same order as the numbered lines below.
//
// The fourth line is the one that reveals how the table is read: it asks for 7 panels, and 7 only comes out with 80% coverage.
// That is, the table is read PER STATE, with bill and coverage given on each line, and not as a
// sequence in which the coverage of the third line survives. That reading is what closed the six lines.
//
// CAREFUL with the old reading of this comment: it once claimed that "choosing a profile returns the
// coverage to the 80 default, so the simulator has to do the same". That does not hold: the simulator
// does not touch the coverage when a profile is chosen, on purpose, and the reason is in the decision told in
// the README: a silent reset would discard the choice of whoever is using the page.
const lines = [
  { bill: 220, coverage: 80, panels: 17, invest: 14726.25, savings: 179.01, payback: 6.9 },
  { bill: profile(3), coverage: 80, panels: 33, invest: 28586.25, savings: 347.49, payback: 6.9 },
  { bill: profile(3), coverage: 100, panels: 41, invest: 35516.25, savings: 430.0, payback: 6.9 },
  { bill: profile(0), coverage: 80, panels: 8, invest: 6930.0, savings: 84.24, payback: 6.9 },
  { bill: 60, coverage: 80, panels: 8, invest: 6930.0, savings: 60.0, payback: 9.6 },
  { bill: 60, coverage: 50, panels: 8, invest: 6930.0, savings: 60.0, payback: 9.6 },
];

describe("acceptance table", () => {
  for (const [i, line] of lines.entries()) {
    it(`line ${i + 1}: bill ${line.bill} with coverage ${line.coverage}%`, () => {
      const r = simulate(phoenix, { bill: line.bill, coverage: line.coverage });
      expect(r.panels).toBe(line.panels);
      expect(r.investmentAfterCredit).toBe(line.invest);
      expect(r.monthlySavings).toBe(line.savings);
      expect(r.paybackYears).toBe(line.payback);
    });
  }

  it("the fourth line asks for fewer panels than the city minimum", () => {
    const r = simulate(phoenix, { bill: profile(0), coverage: 80 });
    expect(Math.ceil(r.panelsRaw)).toBe(7);
    expect(r.flags.minPanelsApplied).toBe(true);
  });

  it("the third line generates more than the bill and therefore has a cap", () => {
    const r = simulate(phoenix, { bill: profile(3), coverage: 100 });
    expect(r.flags.savingsCapped).toBe(true);
    expect(r.flags.surplusValue).toBeGreaterThan(1);
  });
});
