import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/BlogCard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { IconeTempo, IconeVoltar } from "@/components/icons";
import {
  buscarTextoOpcional,
  listBlogSlugs,
  listarTextos,
  minutosDeLeitura,
  type Bloco,
  type BlogPost,
} from "@/lib/blog";
import { listCitySlugs } from "@/lib/city";
import { blogNoSite, blogPath, blogUrl, cityPath, siteUrl } from "@/lib/urls";

// Uma rota por texto: o parametro e o slug, e a lista de caminhos sai da pasta de conteudo, igual a
// pagina de cidade sai da pasta de dados. Publicar o guia seguinte e soltar o arquivo em
// src/content/blog e refazer o build, sem tocar em codigo.
export function generateStaticParams() {
  return listBlogSlugs().map((slug) => ({ slug }));
}

// A pagina so existe para slug que tem arquivo: qualquer outro caminho cai em 404 de verdade, em vez
// de pagina vazia que o buscador indexa.
export const dynamicParams = false;

// Data legivel. O fuso entra explicito pelo mesmo motivo do indice: `new Date("2026-09-23")` e
// meia-noite em UTC, e formatada no fuso do visitante ela volta um dia no oeste dos Estados Unidos,
// o que faria a data impressa discordar do `datePublished` que o dado estruturado declara.
const FORMATO_DA_DATA = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

function dataLegivel(iso: string): string {
  return FORMATO_DA_DATA.format(new Date(`${iso}T00:00:00Z`));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // Caminho seguro, e nao o carregador direto: slug de forma invalida ou texto sem arquivo devolve
  // nulo e a resposta e 404, em vez de erro de renderizacao.
  const texto = buscarTextoOpcional(slug);
  if (!texto) notFound();
  // Sem barra no fim: e o endereco que a hospedagem serve, e canonico precisa ser o endereco servido,
  // nao um que redireciona. O compositor e o mesmo do indice, para os dois nao divergirem de forma.
  const url = blogUrl(texto.slug);

  // O sufixo da marca fecha o title em 51 caracteres para o texto de hoje, dentro da faixa de 50 a 60
  // que a kopy pede, e a description vem do cabecalho ja medida entre 150 e 160.
  return {
    title: `${texto.title} | Brightfield Solar`,
    description: texto.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Brightfield Solar",
      title: texto.title,
      description: texto.description,
      publishedTime: texto.publishedAt,
      modifiedTime: texto.updatedAt,
    },
  };
}

type No = Record<string, unknown>;

// Imagem declarada no `BlogPosting`. Ainda nao existe cartao de compartilhamento por texto, e inventar
// endereco de imagem que nao responde e pior do que nao declarar: enquanto a rota propria nao existe,
// a imagem declarada e a que o site ja serve, e o ajuste fica em um lugar so quando o cartao chegar.
function imagemDoSite(site: string): string {
  return `${site}/icon.svg`;
}

// Nome do indice na trilha. E o mesmo rotulo do item de blog no menu, e nao uma segunda frase sobre a
// mesma pagina: texto escrito duas vezes diverge na primeira revisao.
const NOME_DO_INDICE = "Blog";

// Dado estruturado do texto, no mesmo desenho do indice: um grafo montado aqui e servido como texto no
// HTML, e nao no cliente. O `url` do texto e o mesmo do canonico, pelo mesmo compositor, e o `isPartOf`
// aponta para o no `#collection` que o indice declara, em vez de criar um no novo para a mesma lista.
function esquemaDoTexto(texto: BlogPost, site: string): { "@context": string; "@graph": No[] } {
  const url = blogNoSite(site, texto.slug);
  const indice = blogNoSite(site);

  const grafo: No[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#post`,
      headline: texto.title,
      description: texto.description,
      url,
      image: [imagemDoSite(site)],
      datePublished: texto.publishedAt,
      dateModified: texto.updatedAt,
      // Organizacao, e nao pessoa: o `author` do cabecalho do texto e a marca que assina a
      // pagina. Quando um texto for assinado por alguem, o campo do cabecalho muda junto com isto.
      author: { "@type": "Organization", name: texto.author },
      inLanguage: "en-us",
      isPartOf: { "@type": "CollectionPage", "@id": `${indice}#collection`, url: indice },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: NOME_DO_INDICE, item: indice },
        { "@type": "ListItem", position: 2, name: texto.title, item: url },
      ],
    },
  ];

  // FAQPage so entra quando o cabecalho do texto declara perguntas, e a resposta e a do cabecalho,
  // literal, que e a que o corpo ja afirma. Resumo escrito aqui seria afirmacao nova sem origem.
  if (texto.faq?.length) {
    grafo.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: texto.faq.map((item) => ({
        "@type": "Question",
        name: item.pergunta,
        acceptedAnswer: { "@type": "Answer", text: item.resposta },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": grafo };
}

// Corpo em blocos. Sao os tres unicos tipos que o leitor de markdown do `blog.ts` produz: titulo de
// secao, paragrafo e lista. Tipo novo no leitor entra aqui junto, e nao antes: o `switch` sem saida
// para um tipo inventado e o que garante que nada apareca vazio na pagina.
function Blocos({ blocos }: { blocos: Bloco[] }) {
  return (
    // Largura de leitura explicita, em valor e nao em degrau de container: os nossos degraus de espaco
    // usam os mesmos nomes da escala de container do Tailwind, e `max-w-lg` resolve para 24 px.
    <div className="flex max-w-[52rem] flex-col gap-lg">
      {blocos.map((bloco, posicao) => {
        if (bloco.tipo === "titulo") {
          // A numeração sai da POSIÇÃO, e não de um contador que soma durante a renderização: em desenvolvimento
          // o React renderiza duas vezes, e o contador viraria 2, 4, 6. O texto da seção é o que carrega o
          // significado; o número é orientação, então ele é decorativo para o leitor de tela.
          const numero = blocos.slice(0, posicao + 1).filter((b) => b.tipo === "titulo").length;
          return (
            <h2 key={`titulo-${posicao}`} className="flex items-start gap-sm type-title text-ink">
              {/* O número saiu do círculo escuro com fonte dourada: pesado para uma numeração, e numeração é
                  orientação, não destaque. Ficou claro com fundo de cartão, número em tinta e a borda
                  de limite que os outros cartões já usam — o mesmo peso visual de um rótulo, e não de um selo. */}
              <span
                aria-hidden="true"
                className="mt-xs flex size-9 shrink-0 items-center justify-center rounded-full border border-outline bg-surface type-label text-ink"
              >
                {numero}
              </span>
              {bloco.texto}
            </h2>
          );
        }
        if (bloco.tipo === "lista") {
          return (
            <ul key={`lista-${posicao}`} className="flex list-disc flex-col gap-sm pl-lg">
              {bloco.itens.map((item, indice) => (
                <li key={`item-${indice}`} className="type-body text-ink">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`paragrafo-${posicao}`} className="type-body text-ink">
            {bloco.texto}
          </p>
        );
      })}
    </div>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const texto = buscarTextoOpcional(slug);
  // Três outros guias, dos mais recentes. A lista já vem ordenada, então não há reordenação aqui.
  const outros = listarTextos()
    .filter((outro) => outro.slug !== slug)
    .slice(0, 3);

  if (!texto) notFound();

  const site = siteUrl();
  // A data de revisao so entra quando ela existe de verdade. O campo e obrigatorio no esquema e repete
  // a data de publicacao quando o texto nao foi revisto, entao imprimir sempre diria que todo guia foi
  // revisto no dia em que saiu.
  const revisado = texto.updatedAt !== texto.publishedAt;

  // Base do cabecalho: a primeira cidade publicada, e nao um slug escrito no codigo, pelo mesmo motivo
  // que a raiz do site usa essa lista. E o mesmo caminho que o fecho do texto usa para chegar ao
  // simulador, composto uma vez so: duas composicoes do mesmo endereco divergem na primeira mudanca de
  // cidade de entrada.
  const [primeira] = listCitySlugs();
  if (!primeira) throw new Error("nenhuma cidade publicada em src/data/cities");
  const base = cityPath(primeira);
  const calculadora = `${base}#simulator`;

  return (
    <>
      {/* Ponto zero desta pagina, declarado aqui e nao no `main`: o `main` tem margem por ser alvo de
          ancora de secao, e quem entra nele e alvo faz o navegador parar no comeco do bloco, abaixo do
          topo. Esta ancora e um elemento sem altura, primeiro filho do documento, entao o salto vai a
          posicao zero de verdade. O `#topo` da barra nao serve para isto: ele sai daqui com a base da
          cidade na frente e leva ao topo da pagina de cidade. */}
      <span id="topo" aria-hidden="true" />
      {/* Mesmo cabecalho da pagina de cidade, com a base do caminho dela: e ele que da a volta ao
          site inteiro, e sem ele quem entra no guia por busca so voltaria pelo botao do navegador. */}
      <SiteHeader base={base} />
      {/* O respiro de baixo e o da pagina de cidade: no celular a barra fica encostada na borda e o
          espaco dela precisa estar reservado, senao o fim do texto fica atras do vidro. Do tamanho
          medio para cima a barra sobe para o topo e quem reserva o espaco e o respiro do bloco. */}
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-xl px-lg py-xxl pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] sm:pb-xxl">
        {/* O JSON-LD entra como texto no HTML servido, e nao montado no cliente: quem busca e quem
            responde pergunta leem o HTML, nao o que o React faria depois. O `<` escapado impede que um
            titulo com essa forma feche a tag antes da hora. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(esquemaDoTexto(texto, site)).replace(/</g, "\\u003c") }}
        />

        <article className="flex flex-col gap-xl">
          <header className="flex flex-col gap-md">
            {/* Volta ao indice no rotulo do menu, e nao em frase nova: quem chegou de busca precisa do
                caminho de volta sem que a pagina invente um segundo nome para a mesma lista. */}
            <nav aria-label="Breadcrumb" className="microcopy">
              <a
                href={blogPath()}
                className="inline-flex min-h-touch items-center gap-xs underline decoration-outline underline-offset-4 transition-colors hover:decoration-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {/* O rótulo visível é Back, e não o nome do índice: quem chegou de busca quer voltar, e o
                    destino já é o índice. A constante continua valendo para o dado estruturado, que precisa
                    nomear a seção e não a ação. */}
                <IconeVoltar />
                Back
              </a>
            </nav>

            <h1 className="type-display max-w-[52rem] text-ink">{texto.title}</h1>
            <p className="type-body max-w-[52rem] text-support">{texto.description}</p>

            <p className="microcopy flex flex-wrap items-center gap-x-xs gap-y-0">
              <span className="inline-flex items-center gap-1">
                <IconeTempo />
                {minutosDeLeitura(texto)} min read
              </span>
              <span aria-hidden>·</span>
              <span>By {texto.author}</span>
              <span aria-hidden>·</span>
              <span>
                Published <time dateTime={texto.publishedAt}>{dataLegivel(texto.publishedAt)}</time>
              </span>
              {revisado && (
                <>
                  {" · Updated "}
                  <time dateTime={texto.updatedAt}>{dataLegivel(texto.updatedAt)}</time>
                </>
              )}
            </p>
          </header>

          <Blocos blocos={texto.blocos} />

          {/* Fontes so quando existem: o esquema exige fonte para texto que cita numero, e o guia sem
              numero nao tem fonte para listar. Titulo de secao entra como `h2` para a pagina ter uma
              hierarquia so, e nao dois segundo nivel competindo. */}
          {texto.sources.length > 0 && (
            <section aria-labelledby="fontes-titulo" className="flex max-w-[52rem] flex-col gap-md">
              <h2 id="fontes-titulo" className="type-lead text-ink">
                Sources
              </h2>
              <ul className="flex flex-col gap-sm">
                {texto.sources.map((fonte) => (
                  <li key={fonte.url} className="type-body text-support">
                    <a
                      href={fonte.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-outline underline-offset-4 transition-colors hover:decoration-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {fonte.nome}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Fecho do texto: o guia explica a leitura da conta, e o proximo passo e a conta do proprio
              telhado. O endereco sai de `cityPath`, o mesmo compositor do canonico de cidade. */}
          <section className="flex flex-col gap-md rounded-lg border border-primary bg-primary/25 px-lg py-md">
            <p className="flex items-center gap-sm type-label text-ink">
              <span aria-hidden className="h-px w-xl bg-primary-light" />
              Next step
            </p>
            <h2 className="type-lead text-ink">Run the numbers for your own roof</h2>
            <p className="type-body max-w-[52rem] text-support">
              The city page computes the estimate from the data of that city: the utility tariff, the
              sunlight hours, the panel used and the installed cost per watt.
            </p>
            <a
              href={calculadora}
              className="type-label text-ink underline decoration-outline underline-offset-4 transition-colors hover:decoration-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Open the calculator
            </a>
          </section>

          {/* Volta ao topo. Fica no corpo e no fim do texto, e nao na barra: a barra do celular tem
              cinco itens com largura igual e rotulo medido, e um sexto item aperta isso de novo; alem
              disso voltar ao topo e gesto de fim de leitura, e nao destino de navegacao, que e o que
              justifica ele aparecer so depois das fontes e do fecho. Ancora pura, sem JavaScript: o
              alvo e o `#topo` desta pagina, e nao a base de cidade que a barra usa nos itens dela. */}
          <a
            href="#topo"
            className="type-label inline-flex min-h-touch items-center gap-xs self-start rounded-sm text-ink underline decoration-outline underline-offset-4 transition-colors hover:decoration-primary-light focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <IconeVoltar />
            Back to top
          </a>
        </article>
              {/* Fim do texto: três outros guias e o caminho para o índice. Os três são os mais recentes que não são
            este, e não uma escolha por assunto, porque a lista já vem ordenada de uma fonte só e reordenar aqui
            seria uma segunda verdade sobre a mesma lista. O botão existe porque quem chegou de busca e quer seguir
            lendo precisa de caminho, e três cards não cobrem a lista. Sem linha divisória em cima: quem
            separa é o respiro do bloco. */}
        {outros.length > 0 && (
          <section aria-labelledby="outros-titulo" className="flex flex-col gap-lg pt-xl">
            <h2 id="outros-titulo" className="type-lead text-ink">
              Keep reading
            </h2>
            <ul className="flex flex-col gap-md md:grid md:grid-cols-3 md:items-stretch">
              {outros.map((outro) => (
                <BlogCard key={outro.slug} texto={outro} />
              ))}
            </ul>
            <div className="flex justify-center">
              <Button asChild variant="outline" size="lg">
                <a href={blogPath()}>See all guides</a>
              </Button>
            </div>
          </section>
        )}

</main>
    </>
  );
}
