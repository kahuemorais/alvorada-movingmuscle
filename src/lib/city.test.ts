import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buscarCidadeOpcional, carregarCidadeDe, getCity, listCitySlugs } from "./city";
import { esquemaCidade } from "./schema";

// O esquema é a fonte única do tipo City. Os dois casos abaixo existem porque um
// arquivo com tarifa zero faz a conta virar infinito e a tela mostrar número quebrado em silêncio.
const cidadeReal = JSON.parse(readFileSync("src/data/cities/phoenix-az.json", "utf8"));

describe("dados de cidade", () => {
  it("lista o slug publicado", () => {
    expect(listCitySlugs()).toContain("phoenix-az");
  });

  it("traz os campos que o calculo usa", () => {
    const c = getCity("phoenix-az");
    expect(c.utilityRatePerKwh).toBe(0.15);
    expect(c.panelWatts).toBe(450);
    expect(c.minPanels).toBe(8);
    expect(c.householdProfiles).toHaveLength(4);
    expect(c.faq).toHaveLength(6);
  });

  it("recusa slug com travessia de caminho", () => {
    // Um JSON de fora de src/data/cities com slug de `..` entrava direto no caminho do arquivo. A forma
    // passou a ser fechada no proprio carregador.
    expect(() => getCity("../../../../../../../tmp/alvo")).toThrow(/slug inválido/);
    expect(() => getCity("/tmp/alvo")).toThrow(/slug inválido/);
    expect(() => getCity("../package")).toThrow(/slug inválido/);
  });

  it("nomeia o arquivo e o campo quando o dado esta errado", () => {
    const pasta = mkdtempSync(path.join(tmpdir(), "cidade-"));
    writeFileSync(path.join(pasta, "quebrada.json"), JSON.stringify({ ...cidadeReal, utilityRatePerKwh: 0 }));
    expect(() => carregarCidadeDe(pasta, "quebrada")).toThrow(/quebrada\.json/);
    expect(() => carregarCidadeDe(pasta, "quebrada")).toThrow(/utilityRatePerKwh/);
  });

  it("cidade opcional devolve nulo em vez de lancar", () => {
    // Existe para os metadados: o generateMetadata chamava o carregador direto, sem a conferencia que o
    // corpo da pagina fazia, entao slug invalido virava erro de renderizacao em vez de 404.
    expect(buscarCidadeOpcional("nao-existe")).toBeNull();
    expect(buscarCidadeOpcional("../../../../etc/hosts")).toBeNull();
    expect(buscarCidadeOpcional("phoenix-az")?.slug).toBe("phoenix-az");
  });

  it("recusa cidade com tarifa zero, que e o que quebra a conta", () => {
    expect(esquemaCidade.safeParse({ ...cidadeReal, utilityRatePerKwh: 0 }).success).toBe(false);
  });

  it("recusa tarifa, sol e custo fora de faixa plausivel", () => {
    expect(esquemaCidade.safeParse({ ...cidadeReal, peakSunHoursPerDay: 30 }).success).toBe(false);
    expect(esquemaCidade.safeParse({ ...cidadeReal, performanceRatio: 1.5 }).success).toBe(false);
    expect(esquemaCidade.safeParse({ ...cidadeReal, costPerWattInstalled: -1 }).success).toBe(false);
    expect(esquemaCidade.safeParse({ ...cidadeReal, minPanels: 0 }).success).toBe(false);
    expect(esquemaCidade.safeParse({ ...cidadeReal, federalCreditRate: 1.2 }).success).toBe(false);
  });

  it("recusa lista vazia e campo em texto onde se espera numero", () => {
    expect(esquemaCidade.safeParse({ ...cidadeReal, faq: [] }).success).toBe(false);
    expect(esquemaCidade.safeParse({ ...cidadeReal, panelWatts: "450" }).success).toBe(false);
  });

  it("recusa numero nao finito, que e o que a formatacao nao aguenta", () => {
    expect(esquemaCidade.safeParse({ ...cidadeReal, utilityRatePerKwh: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(esquemaCidade.safeParse({ ...cidadeReal, utilityRatePerKwh: Number.NaN }).success).toBe(false);
  });

  it("aceita o arquivo real da cidade, inteiro", () => {
    const r = esquemaCidade.safeParse(cidadeReal);
    expect(r.success, r.success ? "" : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ")).toBe(true);
  });

  it("nao inventa valor, so le o arquivo da cidade", () => {
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
