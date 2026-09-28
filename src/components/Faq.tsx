import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { City } from "@/lib/city";

// Fifth block: the questions of the city file, one per item. The shadcn accordion already delivers
// role, focus and aria-expanded, and the text comes from the data, so a new question comes in without touching code.
//
// The design is more striking than the library default: each question is a row of its own, with
// background and border, the question in Title Large (22 px) and the indicator in the action color. Before they were six
// 16 px rows separated by a hairline, and the person did not see that it could be opened.
export default function Faq({ city }: { city: City }) {
  return (
    // Band 4: the action color at 12%, the light band that separates the last two sections and leads to the close. The content
    // stays in the 64 rem column; the title column grew from 16 to 22 rem,
    // because at 16 rem the four-word title broke into four lines.
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
        {city.faq.map((item, index) => (
          <AccordionItem
            key={item.q}
            value={`item-${index}`}
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
