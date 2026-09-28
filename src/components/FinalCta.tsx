import { Button } from "@/components/ui/button";
import type { City } from "@/lib/city";
import { IconeTelefoneVazado } from "@/components/icons";

// Sexto bloco: a chamada final. Repete a acao do topo porque quem chegou ate aqui ja simulou, e o
// proximo passo agora e uma visita tecnica. O aviso do incentivo estadual fica aqui, onde ele nao
// contamina a conta do simulador.
//
// O cliente disse que a pagina estava parada. A sobrancelha em cima do titulo continua, e o veu em gradiente da
// cor de acao (`veu-acao`) e a base da faixa. A marca d'agua do sol que sangrava no canto saiu,
// junto com o brilho de canto (`brilho-sol`): a faixa passou a ter a foto dos paineis no deserto com o veu em cima,
// e os dois enfeites de tinta ficavam competindo com ela no mesmo canto.
export default function FinalCta({ city }: { city: City }) {
  return (
    // Âncora desta seção, porque o item Call do menu leva aqui: é aqui que a visita é agendada, e o
    // telefone da distribuidora está escrito logo abaixo do convite.
    // Faixa 5: a cor de ação cheia, agora na largura da janela e sem canto — o canto arredondado saiu com a
    // faixa, porque bloco arredondado sangrando nas duas pontas lê como defeito de recorte (a regra que a
    // abertura já segue). O respiro de baixo reserva a barra fixa do celular mais a área segura, já que a
    // cor chega até o fim do documento.
    <section
      id="agendar"
      aria-labelledby="final-cta-title"
      className="veu-acao relative w-full overflow-hidden bg-primary py-xxl pb-[calc(var(--spacing-xxl)_+_var(--spacing-lg)_+_env(safe-area-inset-bottom))] sm:pb-[calc(var(--spacing-xxl)_+_var(--spacing-lg))]"
    >
      {/* A foto no fundo e o véu por cima: o véu do fecho é o mesmo desenho da abertura, com o alfa mais leve
          (`.veu-foto-fecho`, medido), porque o deserto ficava apagado atrás do véu da abertura, e a foto
          precisa aparecer. A cor de ação continua sendo a base da faixa — se o arquivo não carregar, a faixa fica na cor de
          ação com o gradiente do `veu-acao`, sem ficar sem fundo. Com foto atrás, o texto da faixa é o claro, que é o
          par que o véu garante: as três peças medidas ficam entre 4,9 e 7,8 nos dois tamanhos. */}
      <div aria-hidden className="fundo-fecho pointer-events-none absolute inset-0" />
      <div aria-hidden className="veu-foto-fecho pointer-events-none absolute inset-0" />

      {/* A marca d'água e o brilho de canto que ficavam aqui saíram. A foto, o véu, o texto e o
          botão ficam como estavam. */}

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-md px-lg">
        <p className="flex items-center gap-sm type-label text-canvas">
          <span aria-hidden className="h-px w-xl bg-canvas/60" />
          Next step
        </p>
        <h2 id="final-cta-title" className="type-title text-canvas md:max-w-[54rem]">
          Book the site visit for {city.city}
        </h2>
        <p className="type-body max-w-measure text-canvas/85">
          A technician measures the roof, checks the panel layout against your actual usage and confirms
          the number you just saw. The visit costs nothing and does not commit you to anything.
        </p>
        <div className="flex flex-wrap items-center gap-md">
          {/* Sobre o véu escuro o botão volta a ser o claro da cor de ação, com o texto em tinta: era o escuro
              enquanto o fundo era a cor de ação cheia, porque botão da cor de ação sobre cor de ação desaparece.
              Com a foto e o véu, o botão de ação é o que identifica a ação. */}
          <Button asChild size="lg">
            <a href={`tel:${city.phone.replace(/[^0-9+]/g, "")}`}>
              <IconeTelefoneVazado />
              Call {city.phone}
            </a>
          </Button>
        </div>
        <p className="microcopy text-canvas/80">{city.stateIncentiveNote}</p>
      </div>
    </section>
  );
}
