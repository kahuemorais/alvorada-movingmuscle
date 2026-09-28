import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { City } from "@/lib/city";

// Quinto bloco: as perguntas do arquivo da cidade, uma por item. O acordeao do shadcn ja entrega
// papel, foco e aria-expanded, e o texto sai do dado, entao pergunta nova entra sem tocar no codigo.
//
// O desenho e mais chamativo do que o padrao da biblioteca: cada pergunta e uma linha propria, com
// fundo e borda, a pergunta em Title Large (22 px) e o indicador com a cor de acao. Antes eram seis
// linhas de 16 px separadas por fio, e a pessoa nao via que dava para abrir.
export default function Faq({ city }: { city: City }) {
  return (
    // Faixa 4: a cor de ação a 12%, a faixa clara que separa as duas últimas seções e leva ao fecho. O conteúdo
    // continua na coluna de 64 rem; a coluna do título cresceu de 16 para 22 rem,
    // porque em 16 rem o título de quatro palavras quebrava em quatro linhas.
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="w-full bg-primary/12 py-xxl"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-lg px-lg md:grid md:grid-cols-[22rem_minmax(0,1fr)] md:items-start md:gap-xl">
      <div className="flex flex-col gap-md">
        <p className="flex items-center gap-sm type-label text-support">
          <span aria-hidden className="h-px w-xl bg-support" />
          Straight answers
        </p>
        <h2 id="faq-title" className="type-title text-ink">
          Questions people ask before signing
        </h2>
      </div>
      <Accordion type="single" collapsible className="flex w-full flex-col gap-sm">
        {city.faq.map((item, indice) => (
          <AccordionItem
            key={item.q}
            value={`item-${indice}`}
            className="rounded-lg border border-outline bg-surface px-lg transition-colors data-[state=open]:border-primary"
          >
            <AccordionTrigger className="min-h-touch items-center py-md text-left type-lead text-ink no-underline hover:no-underline **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-primary">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="pb-md type-body text-support">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      </div>
    </section>
  );
}
