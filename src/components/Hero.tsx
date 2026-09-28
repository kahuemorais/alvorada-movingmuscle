import { Button } from "@/components/ui/button";
import { Contador } from "@/components/Contador";
import type { City } from "@/lib/city";
import { IconeDescer, IconeMarca, IconeTelefoneVazado } from "@/components/icons";

// Primeiro bloco: proposta e uma unica acao. A promessa do topo tem que ser a mesma coisa que a
// pagina entrega logo abaixo, que e a conta, entao o CTA leva direto ao simulador.
//
// Composicao: coluna centrada sobre o painel de tinta. Antes eram duas pecas lado a lado
// (texto de um lado, foto na outra metade), e depois uma coluna com a foto em faixa abaixo; a faixa saiu
// porque atrapalhava o desenho novo. A abertura hoje e SO o painel: sobrancelha em chip,
// titulo, promessa, acao e a faixa de numeros, centrados. O que a referencia externa trouxe foi a ORGANIZACAO
// — coluna centrada, sobrancelha em chip, grade fina e brilho no fundo — e nao a pele dela: gradiente no
// titulo, degraus de tipo do Tailwind, hex solto e `-z-10` ficaram de fora.
//
// O fundo passou por tres desenhos, e o atual e uma foto no lugar do efeito. A imagem entrou
// (dois instaladores no telhado, ceu claro em cima e telhado escuro embaixo), e ela aposentou a
// grade fina e o veu amarelo — a foto ja tem a luz que o veu imitava. O que sobra e o veu de tinta (`.veu-foto`),
// que nao e enfeite: e o que garante o contraste do texto claro, e o alfa dele e medido, nao escolhido no olho.
//
// O fundo decorativo mora DENTRO do painel, e nao como primeiro filho da secao: o teste de contraste amostra
// o primeiro `> div` da abertura, e ali a amostra tem que ser tinta, nao o desenho.
//
// A regra da casa continua valendo: o texto vive sobre cor solida, que e verificavel no pixel, e nada anima
// largura, altura ou topo. A foto do servico da pagina vive na prova social, onde ela prova o que a secao diz.
//
// Sem borda e sem canto: a abertura pega a largura toda da janela desde que saiu do conteiner de 64 rem do
// `main`, e caixa com borda e canto arredondado sangrando nas duas pontas le como defeito de recorte.
//
// `overflow-hidden` continua: a foto do fundo e recortada pelo painel, e nada decorativo pode vazar para fora da
// abertura: foi assim que um halo virou degrade solto em cima do bloco.
export default function Hero({ city }: { city: City }) {
  return (
    <section aria-labelledby="hero-title" className="w-full overflow-hidden">
      {/* `bg-ink` fica: ele pinta atras da foto, entao e o fundo de reserva se a imagem nao carregar. */}
      {/* A altura minima do desktop subiu de 34 para 42 rem: o painel antigo nunca chegava aos 34,
          porque o conteudo o ultrapassava, e a abertura acabava com a altura do conteudo (~561 px numa tela de 900).
          42 rem dao 672 px, e como o conteudo tem ~497, o `justify-center` passa a ter folga para distribuir em cima e
          embaixo — que e o que faz a abertura parecer abertura, e nao uma faixa. */}
      {/* A reserva de baixo no compacto é a altura da barra MAIS o respiro que o painel já tinha (`p-lg`), e não
          só a barra: com a reserva do tamanho exato do vidro, a faixa dos três números e a linha da distribuidora
          ficavam atrás dela (medido em 393x852: procedência 797 contra topo da barra 787). O `sm:pb-lg` e o
          `md:p-xl md:pb-xl` do desktop seguem como estavam. */}
      <div className="fundo-abertura relative isolate flex flex-col items-center gap-lg bg-ink p-lg pb-[calc(var(--spacing-barra)_+_var(--spacing-lg)_+_env(safe-area-inset-bottom))] text-center sm:pb-lg md:min-h-[42rem] md:justify-center md:p-xl md:pb-xl">
        {/* A unica camada decorativa agora e o veu: a foto vive no fundo do painel, e o veu por cima dela. */}
        <div
          data-fundo="abertura"
          aria-hidden="true"
          className="veu-foto pointer-events-none absolute inset-0 z-0"
        />

        {/* O respiro entre as pecas e MENOR no celular, e isso e desenho, nao descuido: com sete linhas de titulo e
            cinco de promessa, o vao de 24 px entre as seis pecas somava 120 px de ar num painel que ja e mais alto que
            uma tela (medido: 953 px de painel em 900 px de tela, mais alto que a tela). O
            degrau de 32 px continua no desktop, que e onde a folga existe. */}
        <div className="relative z-10 flex w-full flex-col items-center gap-md md:gap-xl">
          {/* No celular a marca vive AQUI, dentro do painel, e nao numa linha de identidade acima: a abertura carrega a identidade, e o topo da pagina deixou de ter faixa separada. Do tamanho medio para
              cima quem carrega a marca e a barra, e este bloco sai de cena. */}
          <span className="entrada flex items-center gap-sm md:hidden" style={{ animationDelay: "0ms" }}>
            {/* A marca é clara aqui, e não na cor de ação: com o sol batendo de cima, o amarelo do ícone caía sobre
                a faixa amarela do painel e sumia. Tinta clara sobre a faixa mede 7,7 para 1. */}
            <span className="flex size-10 items-center justify-center rounded-md bg-canvas/10 text-canvas">
              <IconeMarca />
            </span>
            <span className="type-lead text-canvas">Brightfield Solar</span>
          </span>

          {/* O rotulo nao vai em caixa alta: a regra da casa trata caixa alta como defeito em rotulo longo, e
              "Residential solar in Phoenix, AZ" tem trinta caracteres.
              Ele e o unico texto da abertura com fundo proprio, e a tinta de acao a 70 por cento sobre o veu do sol
              media 4,09 para 1, abaixo dos 4,5 exigidos: agora a pilula tem fundo escuro (tinta a 35 por cento) e o
              texto vai em tinta clara CHEIA, entao o contraste nao depende de onde o amarelo esta naquele ponto. */}
          <p
            className="entrada type-label flex items-center gap-sm rounded-md border border-canvas/20 bg-ink/35 px-md py-sm tracking-wide text-canvas"
            style={{ animationDelay: "60ms" }}
          >
            Residential solar in {city.city}, {city.state}
          </p>

          {/* O titulo desce um degrau no celular, e a medida e propria no desktop. As duas coisas sairam de medida, nao
              de gosto: a 3,5 rem em 345 px de coluna o titulo quebrava em SETE linhas (372 px de bloco, medido), e a
              40 px ele quebra em cinco (212 px). No desktop, a medida de leitura de 40 rem dava TRES linhas para um
              titulo de 70 caracteres; em 54 rem ele fecha em duas, que e o que a medida exige. A medida de 40 rem
              continua sendo a do texto corrido da pagina. */}
          <h1
            id="hero-title"
            className="entrada type-title text-canvas md:type-display md:max-w-[54rem]"
            style={{ animationDelay: "120ms" }}
          >
            Know what solar costs on your roof before anyone knocks on your door.
          </h1>

          {/* O lead voltou a ser UMA frase: com duas frases ele empurrava a faixa dos três
              números e a linha da distribuidora para trás da barra fixa no celular, que é o defeito medido. O
              que saiu foi a procedência da tarifa, que a linha `From Brightfield's own jobs with ...` logo abaixo
              já diz com o nome da distribuidora e a região. O que ficou é a promessa (painéis, preço depois do
              crédito, economia e retorno), a cidade e o "sem formulário". */}
          <p className="entrada type-body max-w-measure text-canvas/85" style={{ animationDelay: "180ms" }}>
            Panels, price after the federal credit, savings and payback for a {city.city}, {city.state} roof, with
            no form and no lead sold to three installers.
          </p>

          <div
            className="entrada flex flex-wrap items-center justify-center gap-md"
            style={{ animationDelay: "240ms" }}
          >
            <Button asChild size="lg">
              <a href="#simulator">
                Estimate my savings
                <IconeDescer />
              </a>
            </Button>
            <a className="inline-flex min-h-touch items-center type-body text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas" href={`tel:${city.phone.replace(/[^0-9+]/g, "")}`}>
              <IconeTelefoneVazado />
              Or call {city.phone}
            </a>
          </div>

          {/* Faixa de numeros na base do bloco, com divisorias finas. A contagem pintava
              valor parcial sobre o numero que o HTML ja entrega certo — a nota de 4,8 aparecia como 0,3 no
              comeco da animacao, medido quadro a quadro. A correcao: a contagem continua, mas
              comeca em 90% do valor e sobe ate ele, sem passar pelo zero (o piso esta em `Contador.tsx`, com o
              motivo ao lado). */}
          {/* No celular os três ficam em UMA linha de verdade, e não em duas: com `flex-wrap` e vão de 24 px os
              rótulos somavam mais que os 345 px úteis do painel e o terceiro caía para baixo, que foi o defeito
              relatado. A grade de três divide a linha em partes iguais e o rótulo quebra dentro da própria coluna. */}
          {/* A procedência vive colada na faixa, e não solta no vão de 32 px: ela explica os três números acima, então
              entra como uma peça do mesmo bloco (`gap-sm`), com a mesma entrada escalonada das outras. */}
          <div className="entrada flex w-full flex-col gap-sm" style={{ animationDelay: "300ms" }}>
          <dl
            className="grid w-full grid-cols-3 gap-md border-t border-canvas/20 pt-lg md:flex md:flex-wrap md:items-start md:justify-center md:gap-lg"
          >
            <div className="flex flex-col gap-xs">
              <dt className="microcopy text-canvas/70">Installs completed</dt>
              <dd className="type-lead text-canvas tabular-nums">
                <Contador valor={city.installsCompleted} />
              </dd>
            </div>
            <div className="flex flex-col gap-xs border-l border-canvas/20 pl-md md:pl-lg">
              {/* O rótulo diz "Average customer rating", e não só "rating": a nota sozinha não diz de quem é, e
                  prova social que se possa conferir precisa dizer de quem é a nota. O número não muda: 4,8 é o do arquivo. */}
              <dt className="microcopy text-canvas/70">Average customer rating</dt>
              <dd className="type-lead text-canvas tabular-nums">
                <Contador valor={city.avgRating} casas={1} />
              </dd>
            </div>
            <div className="flex flex-col gap-xs border-l border-canvas/20 pl-md md:pl-lg">
              <dt className="microcopy text-canvas/70">Crews in the area</dt>
              <dd className="type-lead text-canvas tabular-nums">
                <Contador valor={city.crewsAvailable} />
              </dd>
            </div>
          </dl>

          {/* Procedencia dos tres numeros acima. A prova social tem de ser conferivel, e a alternativa descartada foi
              inventar contexto: aqui nao entra data de coleta, percentual de satisfacao nem "familias
              atendidas", porque nada disso existe no arquivo da cidade. O que existe e o nome da distribuidora e a
              regiao metropolitana, e sao eles que dizem de onde vem o numero. */}
          <p className="type-label text-canvas/80">
            From Brightfield&apos;s own jobs with {city.utilityName} in the {city.metroArea} area.
          </p>
          </div>
        </div>
      </div>
    </section>
  );
}
