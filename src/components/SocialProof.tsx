/* eslint-disable @next/next/no-img-element */
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { City } from "@/lib/city";
import { nota, num } from "@/lib/format";
import { IconeBairro, IconeCitacao, IconeEquipe, IconeEstrela } from "@/components/icons";

// Quarto bloco: prova social da cidade. A foto da equipe podia ser um espaco reservado ou imagem gerada,
// e a decisao aqui foi nao inventar rosto: o circulo da equipe e um
// DESENHO de equipe (o capacete), e nao as iniciais do nome.
//
// As iniciais fizeram o papel de avatar, e a pergunta era se um icone nao seria
// melhor. Era: quem usa o circulo e uma EQUIPE ("Ray O. and team", "The Okafor brothers"), e nao uma
// pessoa, entao as iniciais liam como avatar de gente que nao existe — e davam monograma errado
// ("TO" para "The Okafor brothers", que pega o "The"). O capacete diz o que a coisa e, o nome ao lado
// diz qual equipe, e o desenho acompanha os outros dois circulos da secao, que ja sao icone (as aspas
// do depoimento em destaque e o pino dos bairros). O icone e decorativo: quem carrega o significado e
// o nome ao lado, e o leitor de tela nao anuncia o mesmo duas vezes.

export default function SocialProof({ city }: { city: City }) {
  return (
    // Faixa 3: `canvas`, o fundo da página. A faixa é da seção e o conteúdo vive na coluna de 64 rem por dentro.
    <section id="proof" aria-labelledby="proof-title" className="w-full bg-canvas py-xxl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-lg px-lg">
      {/* O título nomeia os dois grupos sem prometer ordem: a seção mostra os depoimentos primeiro, que é a
          ordem da página, e o título antigo anunciava o contrário. */}
      <p className="flex items-center gap-sm type-label text-support">
        <span aria-hidden className="h-px w-xl bg-support" />
        Local proof
      </p>
      <h2 id="proof-title" className="type-title text-ink md:max-w-[54rem]">
        Neighbors and crews
      </h2>

      {/* Rótulo de categoria em caixa alta com espaçamento de letra: é o recurso da referência do Zapier
          para separar grupos, e aqui existe categoria de verdade. Os dois trios de cartão usam ícones
          diferentes porque mostram coisas diferentes, citação de um lado e empresa do outro, e sem rótulo
          ninguém sabia por quê. Cada rótulo é h3 de verdade, para a hierarquia seguir h1, h2, h3. */}
      <h3 className="type-label tracking-[0.5px] text-support uppercase">What the neighbors say</h3>

      {/* Grade dos depoimentos: o destaque ocupa as DUAS COLUNAS da primeira linha
          (`md:col-span-2`) e os outros dois ficam lado a lado na linha de baixo. Antes o destaque ocupava duas
          LINHAS na coluna da esquerda (`md:row-span-2`), o que o deixava alto e estreito ao lado de dois cartões
          empilhados. Sem `row-span` e sem `items-start`: cada cartão vive numa linha só, e o `stretch` padrão da
          grade passa a ser o certo, porque iguala a altura dos dois da segunda linha entre si sem esticar o
          destaque, que está sozinho na linha dele. No compacto nada muda: uma coluna, os três empilhados. */}
      <div className="grid gap-md md:grid-cols-2">
        {city.testimonials.map((depoimento, indice) => (
          <Card
            key={depoimento.author}
            className={
              // Sem `h-full` no destaque: `height: 100%` resolve contra a área da grade, e em linha de duas
              // colunas isso volta a esticá-lo contra o vizinho. Os outros dois seguem com `h-full`, que é o que
              // iguala a altura deles dentro da própria linha.
              indice === 0 ? "ecoar sobe border-primary md:col-span-2" : "ecoar sobe h-full"
            }
            style={{ animationDelay: `${indice * 60}ms` }}
          >
            <CardContent
              className={
                indice === 0 ? "flex flex-1 flex-col justify-center gap-sm py-6" : "flex flex-col gap-sm py-6"
              }
            >
              {/* A foto que chegou a ficar dentro deste cartão (a casa) saiu: foto
                  sobre a lavagem âmbar do destaque (tinta da cor de ação a 25%) some com o telhado, e com ela fora a
                  casa vive num lugar só, que é o bloco dos bairros. Aqui o depoimento volta a ser o que era: a marca de
                  citação, a fala e o nome de quem falou. */}
              <span className="flex size-12 items-center justify-center rounded-full bg-ink text-primary-light">
                <IconeCitacao />
              </span>
              {/* O destaque carrega a citação num degrau acima (`type-lead`): o cartão é o argumento da seção, e
                  com o mesmo corpo dos outros dois a diferença entre ele e eles era só a borda. */}
              <blockquote className={indice === 0 ? "type-lead text-ink" : "type-body text-ink"}>
                &ldquo;{depoimento.quote}&rdquo;
              </blockquote>
              <p className="microcopy">
                {depoimento.author}, {depoimento.neighborhood} &middot;{" "}
                {new Date(depoimento.date).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="type-label tracking-[0.5px] text-support uppercase">Who did the work</h3>
      {/* A foto da equipe fica acima dos três cartões: é a equipe que faz o trabalho que os cartões descrevem, e o
          arquivo é o do time erguendo o módulo. */}
      <img
        src="/fotos/equipe-na-calcada.avif"
        alt="The Brightfield crew lifting a solar module into place"
        width={1600}
        height={1074}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-lg border border-outline object-cover md:max-h-[16rem]"
      />
      <div className="grid gap-md md:grid-cols-3">
        {city.crews.map((equipe, indice) => (
          <Card key={equipe.name} className="ecoar sobe h-full" style={{ animationDelay: `${indice * 60}ms` }}>
            <CardHeader className="flex flex-row items-center gap-sm">
              {/* O círculo de iniciais era o ÚLTIMO azul da página (`bg-secondary`) e virou tinta;
                  no lugar das letras entrou o capacete (`IconeEquipe`, do
                  Phosphor, o mesmo peso preenchido dos outros) no lugar das letras. A equipe tem nome, não rosto —
                  e o nome está ao lado, então o desenho é decorativo e o leitor de tela não repete nada.

                  O resto da seção está no lugar que ele pediu: o ícone da nota e o "since", a nota da equipe e o
                  número de instalações saem do `microcopy`, que é `support`; o pino dos bairros é `primary-dark`
                  (dourado escuro, medido em 3,92 sobre o branco); e o fundo dos cartões é `surface`, sem lavagem. */}
              <Avatar>
                <AvatarFallback className="bg-ink text-primary-light">
                  <IconeEquipe />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="type-label text-ink">{equipe.name}</CardTitle>
                <p className="microcopy">
                  <span className="inline-flex items-center gap-xs">
                    <IconeEstrela />
                    {nota(equipe.rating)}
                  </span>{" "}
                  &middot; {num(equipe.installs)} installs &middot; since {equipe.since}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="type-body text-support">{equipe.blurb}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* O dado da cidade carrega os bairros (`popularNeighborhoods`) e nao diz, em texto nenhum, o que eles
          sao nem para que servem. O rotulo anterior, "Crews cover", era invencao, em duas palavras, sem
          sujeito e sem proposito. O bloco passou a responder as duas perguntas: quais sao (os bairros onde a
          Brightfield mais instala) e para que servem aqui (sustentar a prova social, ligando as equipes acima ao
          lugar de quem le). Os chips ganharam fundo proprio, que os tira do papel de etiqueta fantasma. */}
      <div className="flex flex-col gap-md rounded-lg border border-primary bg-primary/25 p-lg">
        <div className="flex flex-wrap items-baseline justify-between gap-sm">
          {/* Degrau acima do rótulo e abaixo do título da seção: o bloco precisava de hierarquia própria, e é este
              degrau que dá destaque a ele. */}
          <h3 className="flex items-center gap-sm type-lead text-ink">
            <span className="flex size-7 items-center justify-center rounded-full bg-ink text-primary-light">
              <IconeBairro />
            </span>
            Where the crews work
          </h3>
          {/* A contagem responde "quantos", que era a terceira pergunta sem resposta: o dado traz a lista, e o
              número da lista não aparecia em lugar nenhum. */}
          <p className="type-label text-ink">
            {city.popularNeighborhoods.length} neighborhoods in {city.city}
          </p>
        </div>
        <p className="type-body max-w-measure text-ink">
          These are the {city.city} neighborhoods where Brightfield installs most. The crews above work here, and
          the site visit is free.
        </p>
        {/* Esta foto entra duas vezes: a mesma casa que abre o depoimento em destaque, aqui
            dentro do bloco dos bairros, para a lista de lugares ter endereço visual. O arquivo é o mesmo, então não
            custa bytes novos: o navegador baixa uma vez só. */}
        <img
          src="/fotos/casa-phoenix.avif"
          alt={`A single-story ${city.city} home with solar panels on the tiled roof`}
          width={1600}
          height={1074}
          loading="lazy"
          decoding="async"
          className="h-auto w-full rounded-md border border-outline object-cover md:max-h-[14rem]"
        />
        {/* Bairros em grade com o pino dourado, no lugar dos chips miúdos: a lista é uma relação de lugares, e
            cada item carrega o mesmo pino do título do bloco. O pino entra no dourado ESCURO (`primary-dark`),
            porque o dourado claro mede 1,86 para 1 sobre o branco e não identifica um desenho de 16 px; o escuro
            mede 3,92, que é o mínimo do Material para ícone, e é a mesma solução dos ícones da calculadora. */}
        <ul className="grid grid-cols-2 gap-x-lg gap-y-md md:grid-cols-3">
          {city.popularNeighborhoods.map((bairro) => (
            <li key={bairro} className="flex items-center gap-sm type-body text-ink">
              <span className="text-primary-dark">
                <IconeBairro />
              </span>
              {bairro}
            </li>
          ))}
        </ul>
      </div>
      </div>
    </section>
  );
}
