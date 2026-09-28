import type { City } from "@/lib/city";
import { siteUrl } from "@/lib/urls";
import { graphSchema } from "@/lib/structured";

// O JSON-LD entra como texto no HTML, nao como dado montado no cliente: quem busca e quem responde
// pergunta leem o HTML servido, nao o que o React faria depois.
export default function StructuredData({ city }: { city: City }) {
  const json = JSON.stringify(graphSchema(city, siteUrl())).replace(/</g, "\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
