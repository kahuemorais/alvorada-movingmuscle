import { describe, expect, it } from "vitest";
import { getCity } from "./city";
import { graphSchema } from "./structured";

const phoenix = getCity("phoenix-az");
const base = "https://exemplo.test";

type FaqNode = {
  mainEntity: { name: string; acceptedAnswer: { text: string } }[];
};
type ServiceNode = {
  areaServed: string;
  provider: { telephone: string; aggregateRating: { ratingValue: number } };
};

function nodeOf<T>(type: string): T {
  const found = graphSchema(phoenix, base)["@graph"].find((n) => n["@type"] === type);
  if (!found) throw new Error(`missing the ${type} node in the graph`);
  return found as T;
}

describe("structured data", () => {
  it("generates FAQPage with one question per file item", () => {
    const faq = nodeOf<FaqNode>("FAQPage");
    expect(faq.mainEntity).toHaveLength(phoenix.faq.length);
    expect(faq.mainEntity[0].acceptedAnswer.text.length).toBeGreaterThan(40);
  });

  it("generates the service with city, provider and average rating", () => {
    const service = nodeOf<ServiceNode>("Service");
    expect(service.areaServed).toBe("Phoenix, AZ");
    expect(service.provider.aggregateRating.ratingValue).toBe(4.8);
    expect(service.provider.telephone).toContain("555-0147");
  });

  it("uses the site address in the url and in the id, without inventing a domain", () => {
    const g = graphSchema(phoenix, base);
    const service = g["@graph"][0] as { url: string; "@id": string };
    expect(service.url).toBe(`${base}/phoenix-az`);
    expect(service["@id"]).toBe(`${base}/phoenix-az#service`);
  });

  it("serializes as valid JSON", () => {
    const json = JSON.stringify(graphSchema(phoenix, base)).replace(/</g, "\\u003c");
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
