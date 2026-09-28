---
version: alpha
name: Brightfield Solar
description: Sol do deserto em fundo quente, com a economia sempre em verde, no esqueleto do Zapier.
colors:
  ink: "#16181A"
  support: "#5B6167"
  primary: "#E8882A"
  secondary: "#1E5FBF"
  primary-light: "#F5A623"
  primary-dark: "#B0740F"
  savings: "#1F7A4D"
  canvas: "#F7F6F3"
  surface: "#FFFFFF"
  outline: "#7F8081"
typography:
  display:
    fontSize: 3.5rem
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  number:
    fontSize: 3rem
    fontWeight: 500
    lineHeight: 1
  title:
    fontSize: 2.5rem
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  lead:
    fontSize: 1.25rem
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.43
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 14px
  4xl: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 64px
  touch: 48px
components:
  pagina:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
  cta-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    height: 56px
  cta-button-hover:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    height: "{spacing.touch}"
  result-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  savings-value:
    textColor: "{colors.savings}"
    typography: "{typography.number}"
  microcopy:
    textColor: "{colors.support}"
    typography: "{typography.label}"
  profile-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  nav-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  nav-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
---

## Overview

Página de aterrissagem de campanha para quem está no quintal olhando o próprio telhado, no
celular. Fundo quente e claro, contraste alto, nada decorativo: cada bloco ou mostra número, ou
explica o número.

O esqueleto vem do sistema do Zapier, escolhido por ser o mais denso em chamada para ação e o mais próximo
em temperatura da marca.
A paleta é da Brightfield e não muda: o que veio do Zapier foi tipo, canto, profundidade e ritmo.

## De onde vem este desenho

O que veio do Zapier, e por quê:

- **Tipo comprimido no topo.** A abertura usa linha de 0,95 com entrelinha negativa, que dá o bloco
  compacto de quem não precisa gritar. O peso desce de 700 para 600: com a Archivo, grotesco de traço
  robusto, o 500 do original fica fraco no celular, e 600 é o peso que o próprio Zapier usa no texto de
  botão grande.
- **Número grande e leve.** O valor em dinheiro é o contador de estatística deles: 48 px de peso 500, no
  lugar de 36 px de peso 700. Algarismo tabular junto, porque os quatro números mudam ao vivo enquanto a
  pessoa mexe no controle.
- **Canto apertado.** A escala cai de 8, 12, 16 e 28 para 4, 6, 8 e 14. É o traço que mais muda a cara da
  página, e é barato: botão 8, cartão 14, campo e etiqueta 4 a 6.
- **Borda no lugar de sombra.** Já era assim aqui, e continua: profundidade vem de borda e de tom de
  fundo, nunca de sombra.

O que ficou de fora, com motivo:

- **A paleta deles.** Laranja `#ff4f00` sobre creme `#fffefb` é bonito e não é a nossa marca.
- **Entrelinha curta no corpo.** O Zapier usa 1,20 a 1,25 no corpo porque escreve texto curto e funcional;
  aqui as perguntas frequentes são texto corrido no celular, e 1,5 lê melhor. Divergência declarada.
- **Alternância de seção clara e escura.** Eles trocam o ambiente da página no meio; aqui a página inteira
  é a mesma luz, e o contraste fica para o cartão de resultado.
- **Alvo de toque de 44 px.** O deles é 44; aqui é 48, que é a regra do projeto e é melhor no polegar.
- **Texto em caixa alta com espaçamento.** Existe no Zapier para rótulo de categoria. Entra só onde há
  categoria de verdade, não em todo rótulo.

Os tokens deste desenho vivem no `@theme` de `src/app/globals.css`, que é gerado deste arquivo, e em
`src/lib/palette.ts`, que é conferido contra este arquivo por `scripts/audit-design.mjs`. Os números de
contraste e os mínimos de cada uso estão neste arquivo, seção Colors, e a execução que reprova o que cai
abaixo do mínimo do Material é `pnpm design`.

## Colors

- **primary (#E8882A):** o sol, e a cor de AÇÃO. Ela fica nas duas ações principais da página — `Estimate my
  savings` e `Book the site visit` —, na faixa final, que fica só em laranja, nas **tintas de
  destaque** dos dois blocos com trabalho de decisão (a chamada do meio, no simulador, e o bloco dos bairros) e na
  **opção escolhida**
  dos controles do simulador, e no acordeão do FAQ — a seta e a borda do item aberto. O azul chegou a tomar esses
  lugares e saiu deles: fundo de bloco grande não é lugar de cor de destaque, opção escolhida continua
  sendo laranja, e o acordeão lê melhor no laranja do que no azul, tanto no hover quanto aberto. **A faixa do fecho
  passou a ter a foto dos painéis no deserto por cima da cor de ação, com o mesmo véu da abertura**, e o laranja
  continua sendo o que a faixa é: a cor de base (é ela que aparece se a foto não carregar, junto com o gradiente do
  `veu-acao`) e a cor do botão de ligar, que com o véu escuro voltou a ser o claro de ação, com o texto em tinta.
- **primary-dark (#B0740F):** o dourado escuro, e ele existe por medição, não por gosto: o dourado claro sobre o
  branco mede 1,86 e não identifica um desenho de 20 px. Ele mede **3,92** sobre o branco e **3,63** sobre o fundo da
  página, que é o mínimo do Material para ícone. Vive nos ícones da calculadora, que ficam sobre cartão branco; os
  ícones com **círculo escuro** atrás — três passos, localização dos bairros, aspas do depoimento e o capacete das
  equipes — continuam no dourado claro, que sobre a tinta mede 8,78.
- **secondary (#1E5FBF):** o azul, e ele é **acento, nunca fundo de bloco**. **A página não usa mais
  esta cor**: a última aparição era o círculo de iniciais das equipes, que passou para tinta, e o token fica no tema
  porque as variantes `secondary` dos componentes do shadcn continuam
  escritas (`ui/button.tsx`, `ui/badge.tsx`), sem consumidor na página. O caminho até aqui foi todo de remoção: o azul saiu do menu (o hover voltou a ser só o fundo), da abertura inteira, dos ícones
  (que passaram a ser preenchidos e dourados), do rótulo dos três passos (que voltou a tinta), do foco do campo de
  conta (que voltou à cor de ação, porque azul não é cor de controle aqui), do filete do box de números e, por último,
  das equipes. Mede
  **5,64** sobre o fundo da página e **6,10** sobre o branco, então serviria para texto — ao contrário do âmbar —, e
  é isso que está no `DESIGN.md` como referência de contraste, não como uso. A variante clara (`secondary-light`)
  existiu para ler sobre a foto
  escura da abertura, e saiu quando o branco voltou lá: token sem uso não fica no tema.
- **primary-light (#F5A623):** o amarelo dourado, derivado do âmbar: mais claro e mais vibrante
  que ele, e claramente outro tom — o matiz sai de ~28 para ~42 graus. O hexadecimal é o do dourado, o mesmo
  que a página consome. Ele tem dois papéis, e por isso o nome fala da cor e não de um uso só: é o **hover** dos
  botões de ação e dos cards do blog, e é a cor dos **ícones preenchidos** dos três passos, das aspas dos depoimentos
  e do ícone de localização dos bairros. O par dele com a tinta mede **8,78** nos dois sentidos. Ele não entra no véu
  da faixa final: o fecho fica só em laranja, e o véu escurece o próprio âmbar por `color-mix`,
  sem token novo. O token existe desde antes, por um motivo que continua valendo: o hover era o âmbar com opacidade,
  e opacidade nenhum verificador consegue medir.
- **savings (#1F7A4D):** exclusiva do dinheiro economizado. Verde aqui é o que a pessoa deixa de pagar.
- **ink e support:** texto e texto de apoio. O cinza de apoio só aparece em corpo pequeno, nunca em número.
- **canvas e surface:** fundo da página e fundo de cartão. Cartão é branco sobre o fundo quente, e é essa
  diferença de dois tons que separa o resultado do simulador do resto da página sem precisar de sombra.
- **outline (#7F8081):** cinza de limite, e existe por medição. Com `ink` a 15 por cento a borda media
  1,37 para 1 contra o branco, e o Material pede 3 para 1 em limite de componente, que é o que faz um
  campo ou um item clicável ser percebido como clicável. Com este token mede 3,96 sobre o branco e 3,66
  sobre o fundo da página. Borda de agrupamento, como a do cartão, continua clara de propósito: ela não
  precisa ser percebida, o conteúdo é que agrupa.

O contraste de todo par de cor usado está em `pnpm design`, que reprova quando algum par cai abaixo do
mínimo do Material. Os números de hoje: tinta sobre o fundo 16,47, tinta sobre o branco 17,80, apoio
sobre o branco 6,27, economia sobre o branco 5,32, tinta sobre a cor de ação 6,77, limite sobre o branco
3,96, tinta sobre o dourado `primary-light` 8,78 (e o mesmo 8,78 no dourado sobre a tinta, que é o caso do ícone no
círculo escuro), `primary-dark` sobre o branco 3,92 e sobre o fundo 3,63, e os da cor nova — azul sobre o fundo 5,64, azul sobre o branco 6,10 e
tinta clara sobre azul 5,64. A cor de ação sobre o branco mede 2,63, e por isso ela não serve como texto: onde aparece é ícone
decorativo, fundo com tinta por cima, ou borda de estado escolhido, que tem o texto e o rádio como
segundo sinal.

## Typography

Archivo em tudo, porque a página vive no celular, e a família é a mesma registrada na seção Tipografia,
no fim deste arquivo: Inter é fonte gasta, e Archivo é
grotesco robusto, de numeral tabular, que é o que alinha os números da página. Uma família só, e três
pesos: 400 no corpo, 500 nos rótulos, títulos e números, 600 no H1. O display é reservado ao H1, com entrelinha apertada de propósito,
e o número de resultado usa o degrau `number`, nunca o de corpo, para o valor ser lido de relance e sem
trocar de largura enquanto muda.

**A medida de 40 rem é a do texto corrido, e o título tem a dele.** O headline da abertura precisa de 54 rem para
fechar em duas linhas no desktop: com os 40 rem do corpo ele ocupava três, medido, e três linhas num display é excesso
visual. O texto corrido continua com 40 rem, e as duas medidas convivem porque têm trabalhos diferentes: uma governa
leitura, a outra governa quebra de linha de display. **Os títulos de seção usam a mesma medida de 54 rem** no desktop
(`md:max-w-[54rem]`), e a coluna do título do FAQ cresceu de 16 para 22 rem: em 16 rem o título de quatro palavras
quebrava em quatro linhas, e o título que quebra demais não se lê como título.

**No celular o título desce um degrau de tipo, e é o que decide a altura da abertura.** A 56 px, na coluna de 345 px,
o headline de 70 caracteres quebrava em sete linhas (372 px de bloco) e levava o painel a 953 px, mais alto que uma
tela de 900. Com o degrau `title` (40 px) ele quebra em cinco linhas e o bloco cai para 212 px. O degrau é declarado
no componente (`type-title md:type-display`), então os dois tamanhos continuam saindo da escala deste documento, e a
medida de navegador guarda os dois lados.

## Layout

Escala de espaço na grade de 4 px, com os degraus 4, 8, 16, 24, 32 e 64, mais 48 para o alvo de toque.
Cada bloco respira no degrau de 64. Nenhuma margem inventada por bloco, e nada abaixo de 4 px fora de
borda de 1 px.

## Shapes

Escala de canto apertada, herdada do Zapier: 4, 6, 8 e 14. O que é de ação usa 8, o cartão usa 14, e campo
e etiqueta usam 4 a 6. Ficou mais reto que a escala do Material que estava aqui antes, e é de propósito: o
canto apertado é o que dá o ar de ferramenta quente, e é o traço que mais se nota de longe. Círculo
aparece só onde o objeto é redondo, que é botão de rádio, avatar e item da barra de navegação.

A pílula é exceção declarada, com motivo: a forma "full" existe para item de barra de navegação, e é usada
nos itens da barra. A barra em si não é pílula: ela encosta na borda de baixo no celular, ocupa a largura
toda e tem canto reto, e no tamanho médio para cima cola no topo, também reta. Isso já foi pílula flutuante
e foi removido.

Borda que carrega significado usa o token `outline`, com 3,96 para 1 contra o branco: é o caso de campo
de formulário, controle de escolha e item clicável. Borda de agrupamento, como a do cartão, fica clara de
propósito. Separação vem de tom de fundo e de borda, nunca de sombra, e a página não usa nenhuma sombra.

## Components

- `microcopy` é o texto de apoio sob um controle: explica de onde vem o número, em corpo pequeno.
- A chamada principal é o `Button` do shadcn no tamanho grande, com 56 px de altura, canto de 8 px e tinta
  escura sobre o âmbar, e não branco: branco sobre esse âmbar fica em 2,6:1 e reprova em contraste. Os 56 px
  vêm da referência, que usa botão grande mais alto que o mínimo de toque, e ficam acima dos 48 px que a
  regra do projeto exige.
- O resultado do simulador é o `Card` branco sobre o fundo quente, com canto de 8 px, que é o canto de
  cartão destacado da referência.
- **O resultado é um extrato com a economia no posto de cartaz, e não quatro números do mesmo tamanho.** A economia
  manda: é o único valor no degrau `number` (48 px, em `savings`), com o rótulo e a frase de contexto que diz em quanto
  a conta fica (conta menos economia, aritmética da própria simulação). O filete âmbar que atravessava a coluna acima do
  rótulo **saiu**: com ele o bloco tinha duas aberturas — o
  filete e o rótulo — e o valor perdia o posto de começo do cartaz. Abaixo, painéis em
  uma linha de extrato (rótulo em `label` de um lado, valor em `lead` de 20 px do outro) e, numa linha de dois, **custo
  depois do crédito federal e anos de retorno lado a lado**. Antes os quatro estavam no mesmo degrau
  e nada dizia qual era a resposta da pergunta que a pessoa fez.
- **A explicação do valor e o aviso de estimativa são UM bloco só** (`How this estimate is built`,
  `#como-calculamos`), logo abaixo do forro do simulador, e ele é **linha numerada, não parágrafo**: cada uma das
  seis contas é uma linha com o número em etiqueta de contorno sobre o fundo da página (numeração é orientação, não
  destaque, como no blog), o termo em tinta no degrau `label` e a frase em apoio no corpo, em duas colunas no
  desktop e uma no celular. Cada valor sai de `simulate()` ou do arquivo da cidade, então nenhum é número novo, e é
  onde a regra do mínimo de painéis fica visível sempre, e não apenas quando ela entra. O bloco entra na rolagem
  como as outras seções (`Aparecer`) e as seis linhas chegam escalonadas de 60 em 60 ms, o mesmo recurso dos
  cartões dos três passos: esta parte tinha de ser mais bonita e mais
  dinâmica. O bloco passou por quatro arranjos: começou dentro do cartão do resultado (os três
  blocos ficavam grudados), passou a dois cards abaixo dele (ainda era conteúdo demais), virou um só com a lista em
  duas colunas, e terminou em linhas numeradas com entrada escalonada.
- **O aviso de estimativa é a segunda parte desse bloco** (`Estimate, not a proposal`, `#aviso-estimativa`), no
  corpo de 16 px, e não `microcopy`: ele era 14 px no pé do cartão do resultado, pequeno demais para o que
  decide se a pessoa confia no número. Ficaram duas linhas, e o que saiu foi o que as
  contas acima já dizem: a tarifa e as horas de sol estão na conta 1 e na 3, e o crédito federal está na 5. O que
  ele diz, e as contas não dizem, é o que o aviso existe para dizer: aqueles são os números de referência da
  cidade e não os da casa de quem lê, produção varia com sombra, inclinação, modelo do painel e tempo, e o número
  que vale é o que o técnico confirma depois de medir o telhado.
- **O destaque usa dólar redondo, e a conta detalhada guarda o centavo.** `usdRedondo` em `src/lib/format.ts`
  é só de apresentação: o cartão do resultado, o rodapé dele, a chamada do meio, o piso de preço que o mínimo
  impõe e a conta típica dos perfis mostram `$179` e `$14,726`, porque número redondo lê como ferramenta; a lista
  das seis contas e o aviso de excedente mostram `$179.01` e `$14,726.25`, porque é ali que a pessoa confere a
  aritmética. `simulate()` continua devolvendo o centavo nos dois casos, e não muda.
- **O atalho de perfil de residência não é formulário.** Os quatro cartões perderam a bolinha de rádio e passaram
  a ser botões com `aria-pressed` (`data-perfil` como gancho), marcados pela borda e pelo anel da cor de ação, o
  mesmo recurso que os atalhos Half, Most e All já usam um degrau acima. O cartão com rádio
  lia como formulário, e o estado escolhido estava fraco. O nome acessível e o estado continuam anunciados; o
  `radio-group.tsx` do shadcn continua na pasta `ui/`, sem consumidor, como o `separator.tsx` que já estava lá.
  **E os quatro cartões abrem a coluna, acima do campo da conta**: quem chega não sabe
  a própria conta de cor, então o caminho mais rápido é o primeiro. A ordem da coluna é: perfis, campo da conta
  (editável, com o passo de cada lado) e a cobertura logo abaixo. Escolher um cartão troca a CONTA e nada mais — a
  cobertura escolhida fica onde está, e a conta do perfil entra até com a cobertura em 100%, porque conta e cobertura
  são decisões independentes. Duas medidas guardam isso: a ordem na tela, nas duas larguras, e a cobertura preservada
  ao trocar de cartão. **No carregamento um cartão já vem marcado**: o estado inicial é a tabela de referência ($220 com
  80%), e $220 é a conta típica da "Three-bedroom house, no pool" — a marcação é derivada desse estado, então o mesmo
  cartão se acende num link compartilhado com $220 / 80% e nenhum se acende quando o link traz outro estado.
- **A chamada do meio pede a visita, e não uma estimativa.** O rótulo é `Book the site visit`, e não
  `Get my roof estimate`, porque o `Estimate my savings` do topo já pede a conta: dois botões falando de
  estimativa em pontos diferentes da página disputam o mesmo papel. A seta continua sendo a de descer, que é
  para onde o link leva (`#agendar`, nesta mesma página).
- **O telefone da abertura é texto, e não link sublinhado.** O sublinhado ao lado de um botão de 56 px dava dois
  pesos ao mesmo bloco de ação. O ícone do telefone continua sendo a pista de que ele é clicável, e o foco de
  teclado continua com contorno visível.
- A economia mensal é o único número em verde da página, em `type-number`, e o verde só aparece quando é
  dinheiro que a pessoa deixa de pagar.
- A navegação é a barra de `SiteHeader`: vidro, destinos com ícone sobre o rótulo e a chamada para agendar
  fechando a barra, sem nenhum item com fundo próprio. São cinco itens, e o do blog é o único que não é âncora
  desta página: ele leva para outra página do site (`src/components/SiteHeader.tsx:28-34`).
- Rótulo de categoria, para separar grupos dentro de um bloco, é `h3` em caixa alta com 0,5 px de
  espaçamento de letra, no degrau `label` e na cor de apoio. É o recurso de rótulo da referência do Zapier,
  usado só onde existe categoria de verdade (a prova social tem duas: o que os vizinhos dizem e quem fez o
  trabalho). Em caixa alta, o rótulo nunca é texto corrido.
- **O filete da sobrancelha tem a cor do próprio rótulo, e não a cor secundária.** O
  traço antes de `The calculator` e `Your estimate` sai na cor do rótulo, e não no azul. O filete é
  enfeite de hierarquia do rótulo, então ele acompanha o rótulo — na cor de apoio quando o rótulo é a cor de
  apoio (`bg-support`), e em tinta a 60% quando o rótulo é tinta, que é o caso das duas sobrancelhas sobre faixa
  colorida (a do bloco do meio e a do fecho). O azul continua no `secondary` para o que ele marca de fato: o
  filete do box de números, o círculo de iniciais das equipes e o contorno da etiqueta de bairro. No blog o
  filete da faixa da foto continua dourado, porque ali o rótulo é claro sobre a foto escura e a cor do rótulo não
  teria contraste. A medida vive em `tests/acabamento.spec.ts`.
- O valor dentro de campo de formulário usa o degrau `lead`, e não o `number`: o `number` é para número de
  resultado, que fica fora de caixa, e dentro de campo ele passa da altura da caixa e corta o valor. Foi
  defeito observado depois da troca de escala de tipo.

## Do's and Don'ts

- Do: um CTA por bloco de decisão, sempre com o mesmo peso visual e a mesma altura de toque.
- Do: entrelinha apertada em título, e entrelinha folgada em texto corrido. São públicos diferentes.
- Do: o verde só quando é dinheiro que a pessoa deixa de pagar.
- Don't: usar o âmbar em texto sobre fundo claro, porque o contraste cai abaixo do mínimo.
- Don't: sombra pesada, gradiente com cor solta ou ilustração decorativa. O gradiente que existe é o véu dos
  dois blocos coloridos, com as duas paradas saindo de token, e ele está registrado abaixo.
- Don't: importar o laranja do Zapier, nem o creme dele. A referência é o esqueleto, não a cor.

- A abertura é uma **coluna centrada** sobre o painel de tinta (`src/components/Hero.tsx`), e não duas peças
  lado a lado: a marca (no celular), a sobrancelha em chip, o título, a promessa, a ação e a faixa de números,
  todos centrados, com `md:min-h-` e `md:justify-center` no desktop. Ela **pega a largura toda da janela**, e por
  isso é renderizada antes do `main`, fora do contêiner de 64 rem: bloco de largura cheia, sem borda e sem canto.
  Não tem imagem — a que ficava em faixa abaixo do painel saiu, e a foto do serviço da página
  vive na prova social, onde ela prova o que a seção diz. O texto fica sobre cor sólida, que é verificável, e o
  teste de contraste amostra os pixels à direita do título dentro do painel.
- **O fundo da abertura é uma foto, no lugar do efeito.** A imagem — dois instaladores no telhado,
  céu claro em cima e telhado escuro embaixo — aposentou a grade fina e o véu amarelo: a foto já tem a luz que
  o véu imitava. O arquivo é `public/fotos/instaladores-no-telhado.avif`, 2048 por 1365, 100 kB, servido do próprio
  domínio e não pelo otimizador do Next, como as outras fotos. Ele é a LCP da página, e o peso medido ficou em
  **363 kB** no desktop e **330 kB** no celular. A imagem vem de banco público (Unsplash) e a licença de uso é o
  mesmo ponto pendente das outras.
- **O véu da foto não é enfeite, é o que garante o contraste.** Ele começa escuro EM CIMA, que é onde a foto é clara:
  no celular a marca e a sobrancelha caem justamente na faixa do céu. O alfa é medido — o texto da abertura é claro
  (`canvas`, luminância 0,90) e precisa de 4,5 para 1; sobre o telhado (0,03) qualquer alfa passa, e sobre o céu
  (0,72) só passa a partir de ~78% de tinta. Medido com a foto no ar: título **5,36**, frase **10,60** e sobrancelha
  **10,38** no desktop; no celular, **10,12**, **11,67** e **10,17**. A margem menor é a do título, e é ela que
  denuncia primeiro se a foto for trocada por uma mais clara.
- No tamanho médio para cima a abertura começa logo abaixo da barra fixa, e não atrás dela: `md:mt-[3.5rem]` na
  caixa da abertura reserva a altura da barra (`src/app/[city]/page.tsx`), e a medida confere a folga. Os cantos
  são retos nos dois tamanhos, porque o bloco não tem canto nem borda.
- **As faixas de fundo, na largura da janela.** Mais presença visual sem linguagem nova, e a resposta foi
  alternar o fundo das seções: abertura (painel de tinta com foto) e depois, na ordem, `#simulator` no fundo da página
  (`canvas`), `#steps` em `surface` — a faixa branca inteira —, `#proof` de volta no `canvas`, `#faq` na cor de ação a
  12% e `#agendar` na cor de ação cheia. O fundo é da `<section>`, que passa a pegar a largura da janela, e o conteúdo
  vive num invólucro de 64 rem por dentro dela (`mx-auto max-w-5xl px-lg`), que é o arranjo que a abertura já usava:
  com o respiro lateral no invólucro, e não na faixa, os itens da barra continuam alinhados com a coluna de conteúdo. As
  faixas encostam uma na outra — o `gap-xxl` do `main` saiu e o respiro passou a ser `py-xxl` de cada faixa —, porque
  faixa com vão do fundo entre elas lê como bloco solto. O fecho perdeu o canto arredondado junto, pela regra que a
  abertura já seguia: bloco com canto sangrando nas duas pontas lê como defeito de recorte. A faixa dos passos ganhou
  as fotos dentro dos três cartões e a das equipes, a foto acima dos cartões; a do fecho ganhou a foto no fundo, com o
  véu da abertura e o texto em claro. A medida em
  `tests/visual.spec.ts` guarda a ordem, a cor de cada faixa, o encosto entre elas e o contraste de todo texto contra o
  fundo que está atrás dele (composto pelos ancestrais, porque a faixa de 12% tem alfa e os cartões brancos ficam por
  cima dela; texto sobre foto fica de fora dessa conta e é medido no pixel, como o da abertura e o do fecho).
- **A faixa de números da abertura conta do piso, e não de zero.** Ela contava de zero até o valor, e imprimir a faixa
  quadro a quadro mostrou o defeito: 24 valores distintos para três números, com a nota de 4,8 aparecendo como `0.3` no
  começo. Número que o servidor entrega certo e regride na tela lê como dado errado. A correção foi manter a
  contagem começando em 90% do valor (`PISO`, em `src/components/Contador.tsx`): 1.656 até 1.840, 4,3 até 4,8, 11 até
  12, sempre subindo e nunca passando pelo zero. O `tests/movimento.spec.ts` guarda as três metades disso: nenhum quadro
  abaixo do piso, a contagem nunca descendo e o último quadro igual ao valor do arquivo da cidade.
- **No celular a barra é reservada no FIM de dois blocos, e não só no fim do documento.** A barra vive colada na
  borda de baixo, então ela cobre a faixa de baixo da janela em qualquer posição de rolagem: medido antes da
  correção, a faixa de números da abertura ficava 33 px atrás dela numa janela de 667 px de altura, a linha de
  procedência 3 px atrás numa de 852, e o campo da conta caía na mesma faixa quando o navegador o trazia para a
  área visível. A abertura e o `#simulator`
  passam a reservar a altura da barra mais `env(safe-area-inset-bottom)` no `padding-bottom`, com a altura da
  barra saindo do token `--spacing-barra` (58 px, medido no navegador) em vez de número copiado em dois arquivos.
  A reserva vale só abaixo de 600 px, que é onde a barra mora embaixo: do tamanho médio para cima ela sobe para o
  topo e quem reserva o espaço dela é a margem da abertura. Depois da mudança, com a página aberta ou no destino
  da âncora `#simulator`, a ação da abertura e o campo da conta ficam acima da barra nas duas janelas medidas
  (393 por 852 e 375 por 667).
- **No celular a marca é clara, e a faixa de números ocupa uma linha.** O ícone da marca ia na cor de ação sobre
  um chip da própria cor de ação, e com o sol batendo em cima ele sumia: no celular ele passa a ser tinta clara
  sobre chip claro a 10% (a marca lê 6,21 para 1 sobre a faixa amarela, medido). E os três números ficam em grade
  de três colunas, e não em `flex-wrap`: com vão de 24 px os rótulos somavam mais que os 345 px úteis do painel e o
  terceiro caía para a linha de baixo.
- **A faixa de números diz de onde vem.** A regra é prova social que se possa conferir, sem contexto
  inventado, então o que entrou foi procedência, e não número novo: uma linha embaixo da faixa
  (`From Brightfield's own jobs with Arizona Public Service in the Phoenix–Mesa–Chandler area`) montada com os dois
  campos que já existem no arquivo da cidade, e o rótulo da nota passou a ser `Average customer rating`, que nomeia
  de quem é a nota. Não entram data de coleta, percentual de satisfação nem contagem de famílias, porque nada disso
  existe no dado. O respiro entre as peças da abertura também caiu de 24 para 16 px **só no celular** (`md:gap-xl`
  mantém os 32 px do desktop): com seis peças, o vão de 24 px somava 120 px de ar num painel que já era mais alto
  que a tela.
- **O bloco dos bairros usa o mesmo destaque da chamada do meio** — tinta da cor de ação a 25% com borda da mesma
  cor —, com o título um degrau acima do rótulo (`type-lead`) e a contagem de bairros ao lado dele. **A lista é grade
  com pino dourado, e não fila de chips**: cada bairro é um item de grade (duas colunas no celular,
  três no desktop) com o `IconeBairro`, o mesmo pino do título do bloco, em `primary-dark`. O dourado claro mede 1,86
  para 1 sobre o fundo claro e não identifica um desenho de 16 px; o dourado escuro mede 3,92, que é o mínimo do
  Material para ícone, e é a solução que os ícones da calculadora já usavam. O bloco do meio e este são os dois únicos
  com esse destaque na página, e os dois têm trabalho de decisão — um pede a visita, o outro prova presença local.
- **Os ícones são PREENCHIDOS.** O peso cheio fica no lugar do traço fino, com o tamanho e a posição de
  cada um intactos — quem decide isso continua sendo o `className` de 16, 20, 24 ou 28 px em `src/components/icons.tsx`.
  Duas exceções, e as duas têm motivo escrito no arquivo: o **telefone dentro de botão ou link** continua vazado
  (`IconeTelefoneVazado`), porque glifo cheio em botão estreito vira mancha; e a
  **marca do cabeçalho** continua vazada, porque não é ícone de interface e sim o desenho da identidade, que não
  engorda. A citação subiu um degrau de tamanho (28 px) junto com o peso, por "mais peso visual".
  E o dourado ganhou **fundo escuro circular** (`rounded-full bg-ink`): dourado sobre fundo claro
  media 1,86 e não dava para identificar o desenho. O preto #1A1A1A é a tinta que a página já tem
  (#16181A, quatro pontos de diferença no canal vermelho), então vale o token em vez de um segundo quase-preto no
  tema — o par dourado-sobre-tinta mede 8,78. Vale nos três passos, no ícone de localização e nas aspas; nos ícones
  do **menu** não há fundo nenhum: eles são escuros em repouso e dourados só sob o cursor. E onde o ícone fica sobre
  cartão branco sem círculo — os da calculadora — o dourado claro foi trocado pelo **dourado escuro**, que é o que
  mede 3,92 ali: o pouco contraste na tela pede correção de cor, e não de fundo.
- **O blog usa a linguagem da página de cidade, e não uma nova.** O índice abriu com mais enfeite: a
  **faixa da foto** da abertura, filete **dourado** na sobrancelha (dourado porque ali o fundo é a
  foto escura, e não o fundo claro das seções) e o **primeiro cartão ocupando as duas colunas** — hierarquia pela
  grade, sem inventar cor nem tamanho de fonte novo. Cada cartão ganhou o **tempo de leitura**, que é **calculado do
  corpo do texto** a 200 palavras por minuto: escrito à mão ele envelhece na primeira revisão, e ninguém lembra de
  recontar. No texto, as seções passaram a ser **numeradas**, e o box do fim entrou na tinta peach com o filete
  dourado. O número chegou em círculo escuro com fonte dourada, na linguagem dos três passos, e o número pesava demais:
  numeração é orientação, não destaque. Ficou **fundo de cartão, número em tinta e a borda de limite** que os outros
  cartões já usam — o peso de um rótulo, e não de um selo. A numeração sai da posição do bloco, e não de um
  contador que soma durante a renderização — em desenvolvimento o React renderiza duas vezes, e o contador viraria
  2, 4, 6.
- **A marca no celular vive dentro da abertura.** A linha de identidade continua existindo no blog; na página de
  cidade ela não é renderizada (`marcaNoHero` em `src/components/SiteHeader.tsx`), e a marca entra como primeira
  peça da coluna da abertura. Do tamanho médio para cima quem carrega a marca é a barra do topo: uma marca por
  tamanho de tela, e a medida guarda as duas metades disso.
- **A cor secundária é o azul `#1e5fbf`, e o papel dela é medido.** Ver a entrada dela na lista de cores acima: ela
  é acento, nunca fundo de bloco, e o alcance dela foi aparado em três passos — saiu do menu, saiu da abertura e
  devolveu o acordeão ao laranja.
- **Os véus em gradiente, e o teto medido de cada um.** São quatro, todos em `src/app/globals.css` (seção de
  enfeite), todos com as paradas saindo de token — `ink`, `primary` — e nenhum componente escreve
  hexadecimal: o **véu da foto** da abertura (`veu-foto`, escuro em cima, com o teto medido acima), o véu da faixa
  de ação do fecho (`veu-acao`), que é a base da faixa, e o véu da foto do fecho (`veu-foto-fecho`, com o alfa
  próprio medido abaixo). **A marca d'água do sol e o brilho de canto do fecho
  (`brilho-sol`) saíram**: com a foto no fundo da faixa, os dois enfeites de tinta ficavam
  competindo com ela no mesmo canto. A grade fina e o véu amarelo da
  abertura saíram quando a foto entrou, e o `globals.css` não guarda utilitário sem uso. O quarto é o **véu da faixa
  curta** (`veu-foto-faixa`), e ele existe por medição: o cabeçalho do blog usa a mesma foto em faixa baixa, então o
  texto pega a parte clara do quadro — com o véu da abertura o título media 4,70 no celular, e 4,70 é margem fina
  demais. Com o véu próprio ele mede 8,34, e a foto continua aparecendo. **O fecho entrou no mesmo desenho**: a foto
  dos painéis no deserto é o fundo da faixa (`.fundo-fecho`), o `veu-foto` cobre, e o texto da faixa passou de tinta
  para claro, que é o par que o véu existe para garantir. No fecho o véu é mais leve (`.veu-foto-fecho`, 0,70 / 0,52 /
  0,46 em vez de 0,80 / 0,60 / 0,55) por medição: com o véu da abertura o deserto aparecia apagado atrás do texto, e a foto
  tem de aparecer; com o alfa mais leve o texto fica entre 4,9 e 7,8 nos dois tamanhos, e um degrau
  abaixo disso o rótulo cai para 4,47 no desktop. Ali o contraste e a presença da foto também são medidos sobre os
  pixels, na sonda `o texto do fecho tem contraste medido sobre os pixels da foto`.
- **O teto do amarelo é medido, não escolhido no olho.** O texto do painel é claro (`canvas`, luminância 0,90):
  amarelo puro à mostra (`primary`, #e8882a, luminância 0,38) deixa esse texto em 2,2 para 1 e reprova os 4,5
  exigidos. A 55% sobre a tinta o pixel pinta por volta de #81532c e o mesmo texto mede 6,04 para 1 — medido no
  pixel atrás dos três números da abertura: **6,04 / 5,98 / 7,45**. O amarelo forte vive no pé do painel, e subir
  essa mistura é rodar antes o teste de contraste sobre pixels (`tests/visual.spec.ts`) e a conferência da faixa de
  números. A descrição anterior, de que não havia gradiente nenhum na página, valia para o desenho antigo.
- **A página usa sete fotos, e todas são arquivo estático, não o otimizador do Next.** O mapa completo, arquivo a arquivo:
  `instaladores-no-telhado.avif` no fundo da abertura, `tecnico-no-telhado.avif` no passo 1,
  `trilho-no-telhado.avif` no passo 2, `paineis-no-campo.avif` no passo 3, `casa-phoenix.avif` no bloco dos bairros,
  `equipe-na-calcada.avif` acima dos cartões de equipe e `paineis-no-deserto.avif` no fundo do fecho. **A casa chegou a
  ficar também dentro do depoimento em destaque e saiu**: foto sobre a lavagem âmbar do destaque
  (tinta da cor de ação a 25%) some com o telhado, e a regra ficou "uma casa, um lugar". **Com a foto fora, a
  lavagem do destaque saiu também**: ela era mancha sem trabalho, e quem distingue o cartão agora é a borda na cor de
  ação com a marca de citação dentro. As fotos dos três passos entram com `md:aspect-auto md:max-h-[11rem]` (o
  `aspect-[4/3]` fica no celular, onde o cartão é a coluna inteira) e a da equipe com `md:max-h-[16rem]`: sem o teto, as três fotos dos passos levavam a seção a uns 2.400 px no celular e a da equipe ficava larga
  demais no desktop. As cinco de conteúdo usam
  `loading="lazy"`; as duas de fundo (abertura e
  fecho) são `background-image` em `src/app/globals.css` e são o que a faixa mostra por trás do véu. O motivo de não
  passarem pelo otimizador está escrito no componente: os arquivos já estão em AVIF e otimizados, e o otimizador
  exigiria dependência nova de imagem no projeto sem ganho real de bytes. As fotos são de banco de imagem e a licença
  de uso continua pendente de confirmação. A medida de `tests/visual.spec.ts`
  guarda o mapa inteiro: cada arquivo no seu lugar, as duas de fundo lidas do CSS, e toda imagem com dimensão
  declarada, texto alternativo em inglês e 200 na requisição.
- A entrada das seções na rolagem anima opacidade e deslocamento, com curva de saída exponencial e sem quique,
  nunca largura, altura ou topo. Quem pediu menos movimento no sistema recebe a seção visível, sem animação.
- **O movimento do enfeite, com a medida de cada um.** A abertura entra em seis peças — a marca (no celular), a
  sobrancelha, o título, a promessa, a ação e a faixa de números — com espera escalonada de 60 ms (`entrada`, em
  `src/components/Hero.tsx`); os cartões de passos, de depoimentos e de equipe entram junto com
  a seção, 60 ms entre um e outro (`ecoar`); o número que muda no simulador dá um pulso de opacidade e escala, para
  a pessoa ver qual dos quatro respondeu ao que ela mexeu (`pulsou`, em `src/components/Simulator.tsx`); e as âncoras
  do menu rolam suave. **A trilha dos três passos saiu**: era a linha abaixo do título, com o
  trecho na cor de ação que crescia da esquerda para a direita (`trilha`, escala e nunca largura), e ela dizia
  "isto é uma sequência" — o que os três cartões numerados já dizem. Com ela saiu a regra do `globals.css`, porque
  utilitário sem uso não fica no arquivo. Medido no navegador: a caixa
  da seção não muda de tamanho durante a entrada (976 por 357 px antes, durante e depois), e com movimento reduzido
  a seção já vem visível, sem animação, com
  `scroll-behavior: auto`. O peso transferido ficou em 381 kB no desktop, contra 380 kB antes do enfeite; mais enfeite visual levou o peso
  a **503 kB** (a foto dos passos, 120 kB) e o conjunto de fotos a **725 kB** no desktop e no
  celular, com as quatro fotos novas — trilho, casa, equipe e deserto, 224 kB no total — e as duas de fundo (abertura
  e fecho) sempre no caminho crítico.
- **A faixa de números da abertura conta do piso, e não de zero.** A regra, o valor do piso e as três metades da
  medida estão na seção de Layout acima, junto com os números medidos quadro a quadro
  (`src/components/Contador.tsx`, `tests/movimento.spec.ts`).

## Tipografia

A família é **Archivo**, e não Inter. Motivo: Inter, Roboto, Geist,
Plus Jakarta e Space Grotesk são fontes gastas, justamente porque todo gerador de interface converge para elas,
e um site que quer passar solidez técnica não pode ter a mesma letra de tudo que existe. Archivo é grotesco
robusto, com numeral tabular, que é o que uma página cheia de quilowatt, dólar e prazo precisa para os números
alinharem na coluna. A hierarquia sai de tamanho e peso, não de família diferente no título.

## Blog

O blog é a segunda superfície do site, e reusa a mesma barra, os mesmos tokens e os mesmos degraus: o índice
fica em `/blog/` e cada guia em `/blog/<slug>/`, os dois gerados no build a partir de `src/content/blog/`
(`src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`). Não existe cor, canto nem tamanho novo: o que o blog
acrescenta é arranjo de lista e de texto.

- **O card do guia** é `BlogCard`, usado no índice e no fecho de cada texto, para não haver duas verdades sobre
  a mesma peça (`src/components/BlogCard.tsx:25`): item de lista com canto de 8 px (`rounded-lg`), borda
  `outline`, fundo `surface` e respiro `px-lg py-md`.
- **A borda é o único estado do card.** Ela troca para a cor de ação no passar do mouse e no foco de teclado
  (`hover:border-primary focus-within:border-primary`), e o card não ganha sombra: sombra não existe na página.
- **O card inteiro é clicável, e quem recebe o foco é o link de verdade.** O link vive no título e se estica
  sobre o card pelo `before` com `inset-0` e `z-index` acima do conteúdo, senão o clique no rodapé do card
  bateria no texto de data. O leitor de tela e a tecla Tab encontram um link só, com contorno visível
  (`src/components/BlogCard.tsx:28-33`).
- **A grade do índice** é uma coluna no celular e duas no tamanho médio para cima (`md:grid-cols-2
  md:items-stretch`, `src/app/blog/page.tsx:94`), com os cards da mesma linha esticados na mesma altura.
- **O fecho do guia** traz três outros guias na mesma grade, em três colunas no tamanho médio para cima
  (`md:grid-cols-3`, um por linha no celular), e o botão `See all guides`, centralizado, porque três cards não
  cobrem a lista (`src/app/blog/[slug]/page.tsx:300-316`).
- **O título do guia** usa `type-display` com 34 rem de medida e o resumo usa `type-body` em `support`, o mesmo
  par do cabeçalho do índice: as duas páginas do blog não divergem de hierarquia.
- **Fonte externa sai com `target="_blank"` e `rel="noopener noreferrer"`**
  (`src/app/blog/[slug]/page.tsx:253-258`): link que abre fora da aba não devolve a aba anterior sem o
  `noopener`, e o `noreferrer` impede que a origem da visita vá junto para quem foi citado.
