// Mapa do site das cento e vinte páginas de cidade.
//
// A lista sai da pasta de dados, e não de uma lista escrita à mão aqui: publicar a cidade número 121 é
// soltar o arquivo dela em `src/data/cities`, e o mapa acompanha no build seguinte.
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { enderecosDoMapa, type EntradaDoMapa } from "@/lib/mapa-sitemap";
import { siteUrl } from "@/lib/urls";

// Estático, como as páginas: o mapa é montado no build, e não a cada visita.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pasta = path.join(process.cwd(), "src", "data", "cities");
  const entradas: EntradaDoMapa[] = readdirSync(pasta)
    .filter((nome) => nome.endsWith(".json"))
    .map((nome) => ({
      slug: nome.replace(/\.json$/, ""),
      // Data do arquivo, não do build: é o que faz o campo significar alguma coisa para o buscador.
      lastModified: statSync(path.join(pasta, nome)).mtime,
    }));

  return enderecosDoMapa(entradas, siteUrl());
}
