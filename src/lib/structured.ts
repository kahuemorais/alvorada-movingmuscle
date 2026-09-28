import type { City } from "./city";
import { cidadeNoSite } from "./urls";

// JSON-LD da pagina. Dois nos: o servico com o prestador e o endereco atendido, que e o que descreve
// a pagina, e o FAQPage, porque metade da visita vem de busca e de assistente de IA, e as perguntas
// precisam estar em dado estruturado. Os valores saem do arquivo da cidade, nunca escritos aqui.
type No = Record<string, unknown>;

// Endereço declarado no dado estruturado, pelo mesmo compositor do canônico. Existe como função exposta
// para o teste conferir o endereço sem montar o objeto inteiro, e para o formato ficar em um lugar só.
export function urlDoSchema(city: City, site: string): string {
  return cidadeNoSite(site, city.slug);
}

export function graphSchema(city: City, site: string): { "@context": string; "@graph": No[] } {
  const url = urlDoSchema(city, site);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: `Residential solar installation in ${city.city}, ${city.state}`,
        serviceType: "Solar panel installation",
        url,
        areaServed: `${city.city}, ${city.state}`,
        provider: {
          "@type": "LocalBusiness",
          name: "Brightfield Solar",
          telephone: city.phone,
          areaServed: city.metroArea,
          address: { "@type": "PostalAddress", addressLocality: city.city, addressRegion: city.state },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: city.avgRating,
            reviewCount: city.installsCompleted,
          },
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: city.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
}
