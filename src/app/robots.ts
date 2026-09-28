// Robôs do site. Libera tudo e aponta o mapa, e não tenta esconder caminho nenhum: a página é pública, e
// o que não deve ser indexado ou não existe ou está atrás da proteção de acesso da hospedagem.
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/urls";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Endereço absoluto do mapa, pelo mesmo compositor do resto, sem barra no fim.
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
