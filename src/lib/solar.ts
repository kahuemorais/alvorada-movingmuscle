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

// A ordem das contas e esta, e ela manda em caso de duvida:
//   consumo mensal = conta / tarifa da distribuidora
//   consumo a cobrir = consumo mensal * cobertura
//   geracao de um painel = potencia em kW * horas de sol * 30 * fator de desempenho
//   numero de paineis = consumo a cobrir / geracao de um painel
//   investimento = paineis * potencia em W * custo por W instalado, menos a aliquota federal
//   economia mensal = geracao total * tarifa, limitada a conta
//   retorno = investimento depois do incentivo / economia de 12 meses
//
// Nenhum numero do sistema vem daqui: tarifa, sol, potencia, custo e minimo saem do arquivo da
// cidade. Esta funcao so aplica a aritmetica.
export function simulate(city: City, input: SimInput): SimResult {
  const monthlyUsageKwh = input.bill / city.utilityRatePerKwh;
  const targetKwh = monthlyUsageKwh * (input.coverage / 100);

  const panelKw = city.panelWatts / 1000;
  const panelGenerationKwh = panelKw * city.peakSunHoursPerDay * 30 * city.performanceRatio;

  const panelsRaw = targetKwh / panelGenerationKwh;
  // Regra 1: painel e unidade inteira, entao sobe sempre. O investimento e a geracao acompanham o
  // numero final, nunca o intermediario quebrado.
  const panels = Math.max(city.minPanels, Math.ceil(panelsRaw));

  const generationKwh = panels * panelGenerationKwh;
  const rawGenerationValue = generationKwh * city.utilityRatePerKwh;

  const investmentGross = panels * city.panelWatts * city.costPerWattInstalled;
  const investmentAfterCredit = investmentGross * (1 - city.federalCreditRate);

  // Regra 3: o que o sistema gera acima do consumo vira credito na distribuidora, e credito nao e
  // dinheiro de volta. A economia para no tamanho da conta.
  const monthlySavings = Math.min(rawGenerationValue, input.bill);

  // Retorno com uma casa decimal, como a tabela de aceitacao (`src/lib/aceitacao.test.ts`) mostra (6,9 e 9,6).
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
      // Regra 2: existe um minimo por instalacao, e a pagina precisa dizer quando ele entrou.
      minPanelsApplied: panelsRaw < city.minPanels,
      savingsCapped: rawGenerationValue > input.bill,
      surplusValue: round2(Math.max(0, rawGenerationValue - input.bill)),
      generationValue: round2(rawGenerationValue),
    },
  };
}
