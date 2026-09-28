import type { City } from "./city";
import { cityPageUrl } from "./urls";

// JSON-LD of the page. Two nodes: the service with the provider and the served address, which is what describes
// the page, and the FAQPage, because half of the visit comes from search and from AI assistants, and the questions
// need to be in structured data. The values come from the city file, never written here.
type Node = Record<string, unknown>;

// Address declared in the structured data, through the same composer as the canonical. It exists as an exposed function
// so the test checks the address without building the whole object, and so the format stays in a single place.
export function schemaUrl(city: City, site: string): string {
  return cityPageUrl(site, city.slug);
}

export function graphSchema(city: City, site: string): { "@context": string; "@graph": Node[] } {
  const url = schemaUrl(city, site);

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
