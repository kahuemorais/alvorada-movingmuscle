import { IconeTempo } from "@/components/icons";
import { minutosDeLeitura, type BlogPost } from "@/lib/blog";
import { blogPath } from "@/lib/urls";

// Data legível. O fuso entra explícito porque `new Date("2026-09-23")` é meia-noite em UTC: formatada no fuso do
// visitante, ela volta um dia no oeste dos Estados Unidos, e a data impressa passa a discordar do `datePublished`
// que o dado estruturado declara.
const FORMATO_DA_DATA = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

function dataLegivel(iso: string): string {
  return FORMATO_DA_DATA.format(new Date(`${iso}T00:00:00Z`));
}

// O card de texto do blog, usado no índice e no fim de cada texto. Existe para não haver duas verdades sobre a mesma
// peça: o card precisa ser clicável por inteiro e mudar a borda no hover, e isso tem que valer nos dois lugares.
//
// O link continua só no título, e o card inteiro vira área de clique pelo padrão de link esticado: o `before` do
// próprio link cobre o card, com z-index para ficar acima do conteúdo, senão o clique no rodapé do card bate no texto
// de data. O foco de teclado segue no link de verdade, que é o que leitor de tela e a tecla Tab enxergam.
export function BlogCard({ texto, destaque = false }: { texto: BlogPost; destaque?: boolean }) {
  // A data de revisão só entra quando ela existe de verdade. O campo é obrigatório no esquema e repete a data de
  // publicação quando o texto não foi revisto.
  const revisado = texto.updatedAt !== texto.publishedAt;
  // O tempo de leitura vem do corpo do texto, e não do cabeçalho: é o único dado desta linha que não
  // envelhece sozinho se alguém editar o texto.
  const minutos = minutosDeLeitura(texto);

  return (
    // O cartão em destaque ocupa as duas colunas no tamanho médio: hierarquia sem inventar cor nem tamanho
    // de fonte novo — o guia mais novo é o que a maioria veio ler, e a grade diz isso antes do texto.
    <li
      className={`group relative rounded-lg border border-outline bg-surface px-lg py-md transition-colors hover:border-primary-light focus-within:border-primary${
        destaque ? " md:col-span-2" : ""
      }`}
    >
      <article className="flex flex-col gap-sm">
        <h2 className="type-lead text-ink">
          <a
            href={blogPath(texto.slug)}
            className="underline decoration-outline underline-offset-4 transition-colors before:absolute before:inset-0 before:z-10 before:content-[''] group-hover:decoration-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {texto.title}
          </a>
        </h2>

        <p className="type-body max-w-[34rem] text-support">{texto.description}</p>

        <p className="microcopy flex flex-wrap items-center gap-x-xs gap-y-0">
          <span className="inline-flex items-center gap-1">
            <IconeTempo />
            {minutos} min read
          </span>
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
      </article>
    </li>
  );
}
