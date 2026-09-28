import { describe, expect, it } from "vitest";
import { getCity } from "./city";
import { graphSchema } from "./structured";

const phoenix = getCity("phoenix-az");
const base = "https://exemplo.test";

type NoFaq = {
  mainEntity: { name: string; acceptedAnswer: { text: string } }[];
};
type NoServico = {
  areaServed: string;
  provider: { telephone: string; aggregateRating: { ratingValue: number } };
};

function no<T>(tipo: string): T {
  const achado = graphSchema(phoenix, base)["@graph"].find((n) => n["@type"] === tipo);
  if (!achado) throw new Error(`faltou o no ${tipo} no grafo`);
  return achado as T;
}

describe("dados estruturados", () => {
  it("gera FAQPage com uma pergunta por item do arquivo", () => {
    const faq = no<NoFaq>("FAQPage");
    expect(faq.mainEntity).toHaveLength(phoenix.faq.length);
    expect(faq.mainEntity[0].acceptedAnswer.text.length).toBeGreaterThan(40);
  });

  it("gera o servico com cidade, fornecedor e nota media", () => {
    const servico = no<NoServico>("Service");
    expect(servico.areaServed).toBe("Phoenix, AZ");
    expect(servico.provider.aggregateRating.ratingValue).toBe(4.8);
    expect(servico.provider.telephone).toContain("555-0147");
  });

  it("usa o endereco do site no url e no id, sem inventar dominio", () => {
    const g = graphSchema(phoenix, base);
    const servico = g["@graph"][0] as { url: string; "@id": string };
    expect(servico.url).toBe(`${base}/phoenix-az`);
    expect(servico["@id"]).toBe(`${base}/phoenix-az#service`);
  });

  it("serializa como JSON valido", () => {
    const json = JSON.stringify(graphSchema(phoenix, base)).replace(/</g, "\\u003c");
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
