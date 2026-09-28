import { describe, expect, it } from "vitest";
import { getCity } from "./city";
import { simulate } from "./solar";

const phoenix = getCity("phoenix-az");
const perfil = (i: number) => phoenix.householdProfiles[i].typicalBill;

// Os seis estados da tabela de referencia, na mesma ordem das linhas numeradas abaixo.
//
// A quarta linha e a que revela a leitura da tabela: ela pede 7 paineis, e 7 so sai com cobertura de 80%.
// Ou seja, a tabela e lida POR ESTADO, com conta e cobertura informadas em cada linha, e nao como uma
// sequencia em que a cobertura da terceira linha sobrevive. Foi essa a leitura que fechou as seis linhas.
//
// CUIDADO com a leitura antiga deste comentario: ele ja afirmou que "escolher um perfil devolve a
// cobertura ao padrao de 80, entao o simulador tem de fazer igual". Isso nao vale — o simulador nao
// mexe na cobertura quando um perfil e escolhido, de proposito, e o motivo esta na decisao contada no
// README: um reset silencioso descartaria a escolha de quem esta usando a pagina.
const linhas = [
  { bill: 220, coverage: 80, panels: 17, invest: 14726.25, savings: 179.01, payback: 6.9 },
  { bill: perfil(3), coverage: 80, panels: 33, invest: 28586.25, savings: 347.49, payback: 6.9 },
  { bill: perfil(3), coverage: 100, panels: 41, invest: 35516.25, savings: 430.0, payback: 6.9 },
  { bill: perfil(0), coverage: 80, panels: 8, invest: 6930.0, savings: 84.24, payback: 6.9 },
  { bill: 60, coverage: 80, panels: 8, invest: 6930.0, savings: 60.0, payback: 9.6 },
  { bill: 60, coverage: 50, panels: 8, invest: 6930.0, savings: 60.0, payback: 9.6 },
];

describe("tabela de aceitacao", () => {
  for (const [i, linha] of linhas.entries()) {
    it(`linha ${i + 1}: conta ${linha.bill} com cobertura ${linha.coverage}%`, () => {
      const r = simulate(phoenix, { bill: linha.bill, coverage: linha.coverage });
      expect(r.panels).toBe(linha.panels);
      expect(r.investmentAfterCredit).toBe(linha.invest);
      expect(r.monthlySavings).toBe(linha.savings);
      expect(r.paybackYears).toBe(linha.payback);
    });
  }

  it("a quarta linha pede menos paineis do que o minimo da cidade", () => {
    const r = simulate(phoenix, { bill: perfil(0), coverage: 80 });
    expect(Math.ceil(r.panelsRaw)).toBe(7);
    expect(r.flags.minPanelsApplied).toBe(true);
  });

  it("a terceira linha gera mais do que a conta e por isso tem teto", () => {
    const r = simulate(phoenix, { bill: perfil(3), coverage: 100 });
    expect(r.flags.savingsCapped).toBe(true);
    expect(r.flags.surplusValue).toBeGreaterThan(1);
  });
});
