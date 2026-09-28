import { describe, expect, it } from "vitest";
import { campaignTags, simulationPayload } from "./analytics";
import { getCity } from "./city";
import { simulate } from "./solar";

const phoenix = getCity("phoenix-az");
const resultado = simulate(phoenix, { bill: 220, coverage: 80 });

function fakeStore(inicial: Record<string, string> = {}) {
  const dados = { ...inicial };
  return {
    getItem: (k: string) => dados[k] ?? null,
    setItem: (k: string, v: string) => {
      dados[k] = v;
    },
    dump: () => dados,
  };
}

describe("tags de campanha", () => {
  it("le os parametros da URL", () => {
    const store = fakeStore();
    const tags = campaignTags("?utm_source=meta&utm_campaign=phoenix-julho&gclid=abc123", store);
    expect(tags).toEqual({ utm_source: "meta", utm_campaign: "phoenix-julho", gclid: "abc123" });
  });

  it("guarda na sessao e devolve depois, porque a pessoa mexe no simulador depois de rolar", () => {
    const store = fakeStore();
    campaignTags("?utm_source=meta&utm_campaign=phoenix-julho", store);
    const depois = campaignTags("", store);
    expect(depois).toEqual({ utm_source: "meta", utm_campaign: "phoenix-julho" });
  });

  it("sem URL e sem sessao devolve vazio, e nao quebra", () => {
    expect(campaignTags("", fakeStore())).toEqual({});
    expect(campaignTags("", null)).toEqual({});
  });

  it("ignora parametro desconhecido", () => {
    expect(campaignTags("?foo=bar&utm_source=google", fakeStore())).toEqual({ utm_source: "google" });
  });
});

describe("evento de simulacao concluida", () => {
  const payload = simulationPayload(resultado, { bill: 220, coverage: 80 }, { utm_source: "meta" }, "3");

  it("leva a origem da campanha junto dos numeros", () => {
    expect(payload.name).toBe("simulation_completed");
    expect(payload.data.utm_source).toBe("meta");
  });

  it("leva os numeros que a equipe precisa para decidir o que pausar", () => {
    expect(payload.data.panels).toBe(17);
    expect(payload.data.monthly_savings).toBe(179.01);
    expect(payload.data.cost_after_credit).toBe(14726.25);
    expect(payload.data.payback_years).toBe(6.9);
    expect(payload.data.coverage).toBe(80);
  });

  it("diz quando uma regra entrou em acao, para ninguem ler o numero como erro de conta", () => {
    const comMinimo = simulate(phoenix, { bill: 60, coverage: 50 });
    const p = simulationPayload(comMinimo, { bill: 60, coverage: 50 }, {}, null);
    expect(p.data.min_panels_applied).toBe(true);
    expect(p.data.profile).toBe("none");
  });
});
