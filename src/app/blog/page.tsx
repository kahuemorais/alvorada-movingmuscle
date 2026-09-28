import type { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import SiteHeader from "@/components/SiteHeader";
import { listarTextos, type BlogPost } from "@/lib/blog";
import { listCitySlugs } from "@/lib/city";
import { blogNoSite, cityPath, siteUrl } from "@/lib/urls";

// Índice do blog: a lista, e nada mais. Publicar o guia seguinte é soltar o arquivo em
// src/content/blog e refazer o build, sem tocar aqui, que é a mesma escala da página de cidade.
//
// A ordem não é decisão desta página. `listarTextos` já devolve do mais novo para o mais antigo, com o
// slug desempatando dois textos do mesmo dia, e reordenar aqui seria uma segunda verdade sobre a mesma
// lista: foi assim que o canônico e o dado estruturado passaram a discordar no módulo de endereço.

// Data legível. O fuso entra explícito porque `new Date("2026-09-23")` é meia-noite em UTC: formatada no
// fuso do visitante, ela volta um dia no oeste dos Estados Unidos, e a data impressa passa a discordar do
// `datePublished` que o dado estruturado declara.
// Título em 57 caracteres e descrição em 155, medidos: a kopy pede de 50 a 60 no título e de 150 a 160 na
// descrição. Ficam em constante porque o dado estruturado declara os dois de novo, e texto escrito duas
// vezes diverge na primeira revisão.
const TITULO = "Solar guides on estimates and payback | Brightfield Solar";
const DESCRICAO =
  "Plain answers about reading a solar estimate, how many panels a roof holds, and what a utility rate does to payback, written by the crews who install them.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: blogNoSite(siteUrl()) },
};

// Dado estruturado de coleção. O nó é `CollectionPage`, que é o que descreve uma página cujo conteúdo é
// uma lista, e não `BlogPosting`, que descreve um texto e mora na página do texto: o índice não afirma
// ser um guia, ele afirma listar guias. Cada guia entra em `hasPart` com título, endereço e as duas datas,
// e o endereço sai de `blogNoSite`, o mesmo compositor do canônico, para os dois não divergirem de forma.
function esquemaDaColecao(textos: BlogPost[], site: string) {
  const url = blogNoSite(site);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: TITULO,
    description: DESCRICAO,
    inLanguage: "en-us",
    hasPart: textos.map((texto) => {
      const endereco = blogNoSite(site, texto.slug);
      return {
        "@type": "WebPage",
        "@id": `${endereco}#webpage`,
        url: endereco,
        name: texto.title,
        description: texto.description,
        datePublished: texto.publishedAt,
        dateModified: texto.updatedAt,
      };
    }),
  };
}

export default function BlogIndexPage() {
  const textos = listarTextos();
  const site = siteUrl();

  // Base do cabeçalho: a primeira cidade publicada, e não um slug escrito no código. É o mesmo motivo da
  // raiz do site, que usa essa lista como fonte, e é o que faz as quatro âncoras da barra apontarem para
  // a página de cidade em vez de para uma seção que aqui não existe.
  const [primeira] = listCitySlugs();
  if (!primeira) throw new Error("nenhuma cidade publicada em src/data/cities");
  const base = cityPath(primeira);

  return (
    <>
      {/* O mesmo cabeçalho da página de cidade, com a base do caminho dela: a barra é a mesma em
          todo o site, e é ela que dá o caminho de volta a quem entrou no blog por busca. */}
      <SiteHeader base={base} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-xl px-lg py-xxl pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] sm:pb-xxl">
        {/* O JSON-LD entra como texto no HTML servido, e não montado no cliente: quem busca e quem
            responde pergunta leem o HTML, não o que o React faria depois. O `<` escapado impede que um
            título com essa forma feche a tag antes da hora. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(esquemaDaColecao(textos, site)).replace(/</g, "\\u003c") }}
        />

        {/* O cabeçalho do índice usa a MESMA faixa da abertura da página de cidade: a foto dos instaladores com
            o véu de tinta, que é o que dá à lista a cor e a imagem que ela não tinha. O texto aqui é claro como lá,
            e o contraste é medido no mesmo lugar — sobre os pixels da foto com o véu, e não sobre uma cor de fundo
            que não existe. O filete da sobrancelha sai em dourado porque é sobre a foto escura, e não sobre o fundo
            claro das outras seções. */}
        <header className="fundo-abertura relative isolate flex flex-col gap-md overflow-hidden rounded-xl bg-ink p-lg md:p-xl">
          <div data-fundo="abertura" aria-hidden="true" className="veu-foto-faixa pointer-events-none absolute inset-0 z-0" />
          <div className="relative z-10 flex flex-col gap-md">
            <p className="flex items-center gap-sm type-label text-canvas">
              <span aria-hidden className="h-px w-xl bg-primary-light" />
              Solar guides
            </p>
            <h1 className="type-display max-w-[34rem] text-canvas">Solar, in the order you ask about it</h1>
            <p className="type-body max-w-[34rem] text-canvas/85">
              One question per guide: what the estimate means, how many panels a roof holds, and what the
              utility rate does to the number at the end. Newest first.
            </p>
          </div>
        </header>

        <ul className="flex flex-col gap-md md:grid md:grid-cols-2 md:items-stretch">
          {textos.map((texto, indice) => {
            // O primeiro da lista é o guia mais novo, e é o único que ocupa as duas colunas: quem chegou de busca
            // veio atrás dele, e a grade diz isso antes de o olho ler o título.
            return <BlogCard key={texto.slug} texto={texto} destaque={indice === 0} />;
          })}
        </ul>
      </main>
    </>
  );
}
