<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## O que é este projeto

Página de cidade para a Brightfield Solar. Next.js com App Router, uma página por cidade, gerada a partir
de arquivo de dados.

## Comandos

- Instalar: `pnpm install`
- Desenvolvimento: `pnpm dev`
- Build: `pnpm build`
- Testes: `pnpm test`
- Lint: `pnpm lint`

## Estrutura

- `src/app/[city]/page.tsx`: rota por cidade, com `generateStaticParams` lendo `src/data/cities`
- `src/data/cities/*.json`: TODO o conteúdo que muda de cidade vive aqui
- `src/app/blog/page.tsx`: índice do blog, com os textos lidos de `src/content/blog`
- `src/app/blog/[slug]/page.tsx`: uma página por texto, com `generateStaticParams` lendo a pasta e 404 de verdade
- `src/content/blog/*.md`: os textos do blog, com cabeçalho em JSON entre cercas e corpo em markdown
- `src/lib/blog.ts`: leitura, validação e ordenação dos textos, no mesmo desenho de `src/lib/city.ts`
- `src/components/BlogCard.tsx`: o cartão de texto, usado no índice e no fim de cada texto
- `src/lib/solar.ts`: cálculo do sistema, função pura, sem React
- `src/lib/city.ts`: tipo `City` e leitura dos arquivos de cidade
- `src/components/`: os seis blocos da página
- `src/components/ui/`: componentes do shadcn, versionados e editáveis
- `DESIGN.md`: tokens e regras de design, fonte única de cor, raio, tipo e espaçamento

## Regras que não se negociam

- **Nenhum valor de cidade nasce no componente.** Todo número que muda de cidade (tarifa, sol, preço,
  mínimo de painéis, alíquota) vem de `src/data/cities/*.json`. Constante no componente é permitida só
  para trilho de entrada, ou seja, o intervalo e o passo dos controles do simulador, que são iguais em
  todas as cidades, e nesse caso ela é nomeada e com o motivo escrito ao lado. Hoje são
  quatro: os limites da conta, o passo da conta, o intervalo da cobertura e o passo da cobertura.
- **O cálculo não mora no React.** `src/lib/solar.ts` é função pura e é ele que os testes
  exercitam. As três regras do cálculo (painel inteiro, mínimo da cidade, teto da economia) têm teste
  próprio.
- **Nada de estilo solto.** Cor, raio, espaçamento e escala de tipo saem do `DESIGN.md` para o
  `@theme` do `globals.css`. Componente novo não escreve hex na mão.
- **Degrau de tipo se escreve `type-<degrau>`, nunca `text-<degrau>` junto de `font-<degrau>`.**
  Cada utilitário `type-*` aplica tamanho, altura de linha e peso de uma vez. O motivo é medido: o
  `cn` usa tailwind-merge, que não conhece degrau customizado, classifica `text-<degrau>` como cor
  ou alinhamento e descarta a classe em silêncio quando ela convive com `text-ink` ou `text-left`. A
  pergunta do FAQ saía com 16 px quando o código pedia 22, e o H1 saía com peso 400 quando pedia 700.
- **Borda que carrega significado usa `border-outline`, não um cinza claro.** O Material pede 3 para 1 de
  contraste em limite de componente, e `ink` a 15% mede 1,37: não identifica nada. Vale para campo de
  formulário, controle de escolha, item clicável e qualquer coisa cujo limite precise ser percebido.
  Borda de agrupamento, como a do cartão, é decorativa e fica clara.
- **Largura não se escreve com `w-lg`, `max-w-md` e afins.** Os nossos degraus de espaço se chamam
  `xs`, `sm`, `md`, `lg`, `xl` e `xxl`, e no Tailwind v4 esses mesmos nomes definem a escala de
  contêiner, então `max-w-lg` resolve para `var(--spacing-lg)`, que são 24 px em vez dos 32 rem do
  Tailwind. Largura vai em valor explícito (`max-w-[34rem]`) ou em nome que não declaramos (`2xl` para
  cima). Custou uma pílula de navegação colapsada para 24 px de largura no celular.
- **`calc()` dentro de classe do Tailwind precisa de `_` no lugar do espaço.** `w-[calc(100vw-2rem)]`
  vira CSS inválido e a propriedade é ignorada em silêncio; o certo é
  `bottom-[calc(1rem_+_env(safe-area-inset-bottom))]`. O exemplo precisa ser uma classe de verdade, com o
  argumento do `env` escrito: o Tailwind varre os `.md` do projeto como fonte de classe, então exemplo com
  reticências no lugar do argumento gera CSS inválido, e isso derruba o `pnpm dev` com 500 em toda rota — o build
  de produção engole, o pipeline de desenvolvimento não.
- **Sem dado de cliente, sem credencial, sem código de empregador.**
- **Acessibilidade não é polimento de fim.** Se mexer no simulador, conferir teclado e leitor de
  tela antes de commitar.

## Antes de terminar qualquer mudança

`pnpm verify`

Um comando só: build, testes, lint, desenho e varredura de segurança, nesta ordem, parando no primeiro que
falhar. A varredura cobre quatro frentes e cada uma pega uma classe diferente: `pnpm audit` para
dependência publicada com vulnerabilidade conhecida, `gitleaks` para segredo no código e no histórico,
`semgrep` para padrão de código inseguro em TypeScript, e `osv-scanner` para dependência contra a base do
OSV pelo arquivo de travamento. Ferramenta ausente reprova a varredura com o comando de instalação, e não
passa como aviso.

A rede de verdade é rodar o comando na máquina antes de cada commit: o hook de pré-commit
(`git config core.hooksPath .githooks`, uma vez por clone) roda a varredura de segredo e o lint, e o
`pnpm verify` completo é o portão de cada mudança.

Ferramentas exigidas na máquina:

```
brew install semgrep gitleaks osv-scanner
git config core.hooksPath .githooks   # ativa o hook de pré-commit, uma vez por clone
```

`pnpm design` confere que as cores, os degraus de tipo, os pesos e os cantos do `DESIGN.md` são os
mesmos do `@theme`, que nenhum componente escreve cor em hexadecimal nem tamanho fora da escala, e
imprime a tabela de contraste de todo par de cor usado, com o mínimo do Material Design.
