// Eventos de simulacao. A pergunta que eles respondem: na segunda-feira, quem cuida das campanhas
// precisa saber quais anuncios geraram simulacoes de economia, para decidir o que pausar e o que
// ampliar. Pageview nao responde isso, entao a pagina manda um evento com a origem da campanha
// junto dos numeros simulados.
//
// A origem e lida da URL na primeira visita e guardada na sessao, porque metade do trafego vem de
// campanha e a pessoa costuma rolar a pagina e mexer no simulador depois: sem guardar, o evento
// chegaria sem a tag que o time precisa.
import { track } from "@vercel/analytics";
import type { SimInput, SimResult } from "./solar";

const CHAVE = "brightfield-campanha";

// Os parametros que os anuncios carregam. utm_* e o padrao, gclid e do Google e fbclid do Meta.
const PARAMETROS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

export type Tags = Record<string, string>;
export type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void };

function armazem(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // sessao bloqueada por privacidade: o evento ainda funciona, so sem a tag
    return null;
  }
}

// Le as tags da busca; se nao vier nada, devolve o que ja estava guardado na sessao.
export function campaignTags(search: string, store: Store | null = armazem()): Tags {
  const params = new URLSearchParams(search);
  const daUrl: Tags = {};
  for (const nome of PARAMETROS) {
    const valor = params.get(nome);
    if (valor) daUrl[nome] = valor;
  }

  if (Object.keys(daUrl).length > 0) {
    try {
      store?.setItem(CHAVE, JSON.stringify(daUrl));
    } catch {
      // sem armazenamento, a tag vale so para esta pagina
    }
    return daUrl;
  }

  try {
    const guardado = store?.getItem(CHAVE);
    return guardado ? (JSON.parse(guardado) as Tags) : {};
  } catch {
    return {};
  }
}

export type EventoSimulacao = {
  name: "simulation_completed";
  data: {
    bill: number;
    coverage: number;
    panels: number;
    cost_after_credit: number;
    monthly_savings: number;
    payback_years: number;
    min_panels_applied: boolean;
    savings_capped: boolean;
    profile: string;
  } & Record<string, string | number | boolean>;
};

// O que vai no evento de simulacao concluida. Separado da chamada de rede para poder ser conferido
// por teste, e nao so por olhada no painel.
export function simulationPayload(
  result: SimResult,
  input: SimInput,
  tags: Tags,
  perfil: string | null,
): EventoSimulacao {
  return {
    name: "simulation_completed",
    data: {
      ...tags,
      bill: input.bill,
      coverage: input.coverage,
      panels: result.panels,
      cost_after_credit: result.investmentAfterCredit,
      monthly_savings: result.monthlySavings,
      payback_years: result.paybackYears,
      min_panels_applied: result.flags.minPanelsApplied,
      savings_capped: result.flags.savingsCapped,
      profile: perfil ?? "none",
    },
  };
}

export function trackSimulationStarted(search: string, perfil: string | null) {
  track("simulation_started", { ...campaignTags(search), profile: perfil ?? "none" });
}

export function trackSimulationCompleted(
  result: SimResult,
  input: SimInput,
  search: string,
  perfil: string | null,
) {
  const { name, data } = simulationPayload(result, input, campaignTags(search), perfil);
  track(name, data);
}
