import { IconeBlog, IconeCalculadora, IconeCasa, IconeMarca, IconePassos, IconeTelefone } from "@/components/icons";
import { blogPath } from "@/lib/urls";

// Navegação no padrão que o Vexor usa e que vem do kahue-site: duas barras com a mesma lista de
// destinos.
//
// A de cima é a linha de identidade, que rola junto com a página. A de baixo é a barra de links e fica
// fixa: no celular encosta na borda de baixo, onde o polegar alcança, e da classe de janela média (600 px)
// para cima cola no topo.
//
// O quarto item levava o telefone no próprio endereço, para discar de qualquer ponto da página. Agora
// ele leva à seção onde a visita é agendada, que é onde o telefone está escrito. O canal
// continua a um toque, e o item deixa de ser atalho que tira a pessoa da página sem passar pela decisão.
//
// Os destinos são âncoras desta página, não outra página: nada de link competindo com a ação, que é o
// que a disciplina de landing page proíbe. O primeiro é o caminho de volta ao topo para quem rolou até
// o fim: sem ele, voltar depende de gesto do sistema. Reviews e FAQ saíram do menu:
// não são destino de quem chega de anúncio, e a página tem seis blocos, então a barra fica com o que
// leva à decisão.
//
// O blog é a exceção, e é exceção declarada em vez de descuido: o guia é página deste
// site, não caminho de fuga, e quem lê o guia chega à decisão depois. Ele entra ANTES do item de
// conversão, e não no fim, porque o item de conversão é o último da barra, e é isso que o teste de
// navegação guarda. São cinco itens.
//
// O endereço do blog sai de `blogPath`, o compositor único do módulo de endereço: escrito à mão aqui,
// ele seria mais uma cópia do mesmo caminho, e é essa divergência que o módulo existe para impedir.
const DESTINOS = [
  { href: "#topo", rotulo: "Home", icone: <IconeCasa /> },
  { href: "#simulator", rotulo: "Estimate", icone: <IconeCalculadora /> },
  { href: "#steps", rotulo: "Steps", icone: <IconePassos /> },
  { href: blogPath(), rotulo: "Blog", icone: <IconeBlog /> },
  { href: "#agendar", rotulo: "Call", icone: <IconeTelefone /> },
];

// A base é o caminho da cidade onde as âncoras moram, e ela existe por causa do blog: as quatro âncoras
// da barra são seções da página de cidade, e numa página do blog elas apontariam para lugar nenhum. Sem
// base, o que sai é o de hoje, byte a byte, e é isso que a página de cidade usa; com base, só as âncoras
// ganham o caminho na frente (`/phoenix-az#simulator`) e o item do blog continua absoluto, porque ele já
// é outra página. A alternativa era um cabeçalho próprio do blog, menor, e ela foi recusada: duas barras
// com a mesma lista de destinos divergem na primeira revisão, e a lista é a decisão sobre o
// que entra no menu.
//
// A base chega de fora, resolvida por quem chama a partir de `listCitySlugs()[0]`, e não de um slug
// escrito aqui: cidade no código é o que a pasta de dados existe para evitar.
function comBase(href: string, base?: string): string {
  if (!base || !href.startsWith("#")) return href;
  return `${base}${href}`;
}

export default function SiteHeader({ base, marcaNoHero }: { base?: string; marcaNoHero?: boolean }) {

  return (
    <>
      {/* O respiro que limpa a barra fixa vive aqui, e não no `body`: com o padding no body, a âncora do
          topo da página fica 64 px abaixo do início do documento, e o salto do item Home parava nessa
          altura. No conteúdo, a âncora alcança a posição zero. 96 px é o respiro da marca (32) mais a
          altura da barra fixa (56) arredondada para o degrau seguinte. */}
      {/* Linha de identidade: no blog ela continua sendo o lar da marca no celular. Na página de cidade ela não
          existe, porque a marca passa a viver DENTRO da abertura (`marcaNoHero`), e aí o topo
          da página deixa de ter faixa separada acima do bloco de tinta. */}
      {!marcaNoHero && (
      <nav
        aria-label="Brightfield Solar"
        className="mx-auto flex w-full max-w-5xl items-center gap-sm px-lg pt-xxl sm:pt-[6rem] md:pt-0"
      >
        <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary md:hidden">
          <IconeMarca />
        </span>
        {/* Só a marca. A cidade não entra aqui: a primeira frase da página já diz cidade
            e estado, então repetir no topo era eco. */}
        <span className="type-lead text-ink md:hidden">Brightfield Solar</span>
      </nav>
      )}

      {/* Barra encostada na borda de baixo, largura toda, canto reto: nada de pílula solta com vão em volta. O vidro continua, branco a 58% com desfoque de 20 px e saturação
          de 180%, que é o valor da barra do Vexor. Do tamanho médio para cima ela sobe para o topo e
          centraliza os itens.
          O respiro da área segura entrou para dentro da barra, e não como vão de flutuação: encostada na
          borda, ela é quem precisa subir acima do indicador do iPhone.
          Se alguém voltar a limitar a largura desta barra, use valor explícito como `max-w-[34rem]` e não
          `max-w-lg`: os nossos degraus de espaço têm os mesmos nomes da escala de contêiner do Tailwind v4,
          e `max-w-lg` resolve para 24 px, que é o que já colapsou esta barra uma vez.
          O rótulo de acessibilidade deixou de ser `Sections of this page`: com o item do blog, a barra
          carrega um destino que não é seção desta página, e rótulo que descreve o que a barra não é
          atrapalha quem navega por leitor de tela. Passa a `Main navigation`, que é o que ela é: a
          navegação principal, com as âncoras da página e um destino fora dela. Nas páginas do blog a
          proporção se inverte, com quatro destinos fora e um dentro, e o rótulo continua valendo pelo
          mesmo motivo: ele descreve a barra, que é a navegação principal do site, e não a página. */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-10 flex items-stretch gap-xs rounded-none bg-surface/58 p-xs pb-[calc(var(--spacing-xs)_+_env(safe-area-inset-bottom))] backdrop-blur-[20px] backdrop-saturate-[180%] sm:top-0 sm:bottom-auto sm:pb-xs print:hidden"
      >
        {/* A barra ocupa a largura toda, mas o conteúdo dela vive na mesma faixa dos itens da página, com o mesmo
            limite de largura que o cabeçalho e o conteúdo usam. Sem isso, marca e destinos vão para as bordas da
            janela e ficam soltos da coluna de leitura. */}
        <div className="mx-auto flex w-full max-w-5xl items-stretch gap-xs px-lg sm:items-center sm:justify-between">
        {/* A marca entra na barra do tamanho médio para cima, à esquerda, com os destinos à direita pelo
            `justify-between`. No celular ela sai da barra de propósito: a barra do celular é curta, com itens de
            largura igual, e a marca lá aperta os rótulos. No celular ela continua na linha de identidade acima. */}
        <span className="hidden items-center gap-xs sm:flex">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <IconeMarca />
          </span>
          <span className="type-label text-ink">Brightfield Solar</span>
        </span>
        {DESTINOS.map((destino) => (
          <a
            key={destino.href}
            href={comBase(destino.href, base)}
            className="group flex min-h-touch flex-1 flex-col items-center justify-center gap-xs rounded-full px-xs py-xs type-label text-ink transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none sm:flex-none sm:px-md"
          >
            {/* Ícone escuro em repouso e dourado no cursor: a cor entra só no ícone, então o rótulo ao
                lado continua tinta em qualquer estado. */}
            <span className="flex text-ink transition-colors group-hover:text-primary-light">{destino.icone}</span>
            <span data-rotulo className="text-center leading-tight">
              {destino.rotulo}
            </span>
          </a>
        ))}
        </div>
      </nav>
    </>
  );
}
