import type { City } from "./city";

export type SimInput = { bill: number; coverage: number };
export type SimFlags = {
  minPanelsApplied: boolean;
  savingsCapped: boolean;
  surplusValue: number;
  generationValue: number;
};
export type SimResult = {
  monthlyUsageKwh: number;
  targetKwh: number;
  panelGenerationKwh: number;
  panelsRaw: number;
  panels: number;
  generationKwh: number;
  rawGenerationValue: number;
  investmentGross: number;
  investmentAfterCredit: number;
  monthlySavings: number;
  paybackYears: number;
  flags: SimFlags;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

// The order of the calculations is this one, and it rules in case of doubt:
//   monthly usage = bill / utility rate
//   usage to cover = monthly usage * coverage
//   generation of one panel = power in kW * sun hours * 30 * performance factor
//   number of panels = usage to cover / generation of one panel
//   investment = panels * power in W * installed cost per W, minus the federal rate
//   monthly savings = total generation * rate, capped at the bill
//   payback = investment after the incentive / 12 months of savings
//
// No number of the system comes from here: rate, sun, power, cost and minimum come from the city
// file. This function only applies the arithmetic.
export function simulate(city: City, input: SimInput): SimResult {
  const monthlyUsageKwh = input.bill / city.utilityRatePerKwh;
  const targetKwh = monthlyUsageKwh * (input.coverage / 100);

  const panelKw = city.panelWatts / 1000;
  const panelGenerationKwh = panelKw * city.peakSunHoursPerDay * 30 * city.performanceRatio;

  const panelsRaw = targetKwh / panelGenerationKwh;
  // Rule 1: a panel is a whole unit, so it always rounds up. The investment and the generation follow the
  // final number, never the broken intermediate.
  const panels = Math.max(city.minPanels, Math.ceil(panelsRaw));

  const generationKwh = panels * panelGenerationKwh;
  const rawGenerationValue = generationKwh * city.utilityRatePerKwh;

  const investmentGross = panels * city.panelWatts * city.costPerWattInstalled;
  const investmentAfterCredit = investmentGross * (1 - city.federalCreditRate);

  // Rule 3: what the system generates above the usage becomes a credit with the utility, and credit is not
  // money back. The savings stop at the size of the bill.
  const monthlySavings = Math.min(rawGenerationValue, input.bill);

  // Payback with one decimal, as the acceptance table (`src/lib/acceptance.test.ts`) shows (6,9 and 9,6).
  const paybackYears = round1(investmentAfterCredit / (monthlySavings * 12));

  return {
    monthlyUsageKwh: round2(monthlyUsageKwh),
    targetKwh: round2(targetKwh),
    panelGenerationKwh: round2(panelGenerationKwh),
    panelsRaw: round2(panelsRaw),
    panels,
    generationKwh: round2(generationKwh),
    rawGenerationValue: round2(rawGenerationValue),
    investmentGross: round2(investmentGross),
    investmentAfterCredit: round2(investmentAfterCredit),
    monthlySavings: round2(monthlySavings),
    paybackYears,
    flags: {
      // Rule 2: there is a minimum per installation, and the page needs to say when it entered.
      minPanelsApplied: panelsRaw < city.minPanels,
      savingsCapped: rawGenerationValue > input.bill,
      surplusValue: round2(Math.max(0, rawGenerationValue - input.bill)),
      generationValue: round2(rawGenerationValue),
    },
  };
}
