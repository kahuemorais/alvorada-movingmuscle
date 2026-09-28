import type { City } from "@/lib/city";
import { siteUrl } from "@/lib/urls";
import { graphSchema } from "@/lib/structured";

// The JSON-LD comes in as text in the HTML, not as data built on the client: whoever searches and whoever answers
// a question read the served HTML, not what React would do afterwards.
export default function StructuredData({ city }: { city: City }) {
  const json = JSON.stringify(graphSchema(city, siteUrl())).replace(/</g, "\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
