import { describe, expect, it } from "vitest";
import { getCity } from "./city";
import { simulate } from "./solar";

const phoenix = getCity("phoenix-az");

describe("regras do calculo", () => {
  it("arredonda painel para cima e o investimento acompanha o numero final", () => {
    const r = simulate(phoenix, { bill: 220, coverage: 80 });
    expect(r.panelsRaw).toBeGreaterThan(16);
    expect(r.panelsRaw).toBeLessThan(17);
    expect(r.panels).toBe(17);
    // investimento e geracao usam 17 paineis, nao os 16,71 do calculo intermediario
    expect(r.investmentGross).toBe(17 * phoenix.panelWatts * phoenix.costPerWattInstalled);
    expect(r.generationKwh).toBe(Number((17 * r.panelGenerationKwh).toFixed(2)));
  });

  it("respeita o minimo da cidade e sinaliza", () => {
    const r = simulate(phoenix, { bill: 60, coverage: 50 });
    expect(r.panelsRaw).toBeLessThan(phoenix.minPanels);
    expect(r.panels).toBe(phoenix.minPanels);
    expect(r.flags.minPanelsApplied).toBe(true);
  });

  it("nao deixa a economia passar da conta e sinaliza o excedente", () => {
    const r = simulate(phoenix, { bill: 430, coverage: 100 });
    expect(r.rawGenerationValue).toBe(431.73);
    expect(r.monthlySavings).toBe(430);
    expect(r.flags.savingsCapped).toBe(true);
    expect(r.flags.surplusValue).toBe(1.73);
  });
});
