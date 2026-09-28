// Mapa do site, montado a partir da mesma lista de cidades que gera as páginas.
//
// Duas decisões que valem registro:
//
// 1. A data de modificação vem do arquivo da cidade, não da data do build. Data do build ensina o
//    buscador a desconfiar do campo: ele vê o mapa inteiro mudando a cada publicação, sem que uma linha
//    das cento e vinte páginas tenha mudado. A data do arquivo é factual: mudou o dado, mudou a data.
// 2. O endereço sai do mesmo compositor do canônico (`cidadeNoSite`), então mapa, canônico e dado
//    estruturado não podem divergir, que foi o defeito encontrado.
import type { MetadataRoute } from "next";
import { cidadeNoSite } from "./urls";

export type EntradaDoMapa = { slug: string; lastModified: Date };

export function enderecosDoMapa(entradas: EntradaDoMapa[], site: string): MetadataRoute.Sitemap {
  return entradas.map(({ slug, lastModified }) => ({
    url: cidadeNoSite(site, slug),
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
}
