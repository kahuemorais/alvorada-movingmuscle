# Brightfield Solar: página de cidade

Next.js com App Router, uma página por cidade, gerada a partir de um arquivo de dados. O mesmo modelo serve
uma rede de cerca de 120 cidades: publicar a próxima é soltar o arquivo dela e refazer o build.

- **Página publicada:** https://alvorada-chi.vercel.app
- **Uma página por cidade:** `src/data/cities/<slug>.json`

## Como rodar

```bash
pnpm install
pnpm dev        # http://localhost:3000, redireciona para a cidade publicada
```

Outros comandos:

```bash
pnpm build      # build de produção
pnpm start      # serve o build
pnpm test       # testes de unidade: cálculo, dados, dados estruturados, analytics e formatação
pnpm lint       # eslint, incluindo as regras de hooks do React
pnpm design     # confere DESIGN.md contra o tema e imprime a tabela de contraste
pnpm navegacao  # medidas no navegador: navegação, simulador, prova social e acabamento
pnpm seguranca  # varredura de dependência, segredo e padrão inseguro
pnpm verify     # tudo acima, nesta ordem, parando no primeiro que falhar
```

`pnpm verify` é o portão de cada mudança. Instalação, testes e build também foram conferidos em clone limpo
(`git clone`, `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`), que é o caminho de quem clona.

## O que a página tem

Seis blocos, nesta ordem:

1. Abertura de largura toda, em coluna centrada sobre a foto dos instaladores no telhado (com véu de tinta
   para o texto ler) e a marca dentro dela no celular: proposta, uma ação, e a faixa com instalações
   concluídas, nota média e equipes da cidade
2. Simulador de economia, que é o bloco que faz a pessoa pedir a visita técnica
3. Como a instalação acontece, em três passos, com a licença média da cidade vinda do dado
4. Prova social: depoimentos com bairro e data, equipes com volume e nota, e um bloco que diz quais são os
   bairros onde as equipes trabalham e para que a lista serve
5. Perguntas frequentes, uma por item do arquivo da cidade
6. Chamada final, com o telefone e o aviso do incentivo estadual, que fica fora da conta

O simulador recebe a conta de luz e a cobertura desejada, mostra painéis, investimento depois do crédito
federal, economia mensal e retorno, e explica na tela quando uma das três regras entra em ação: painel é
unidade inteira, a cidade tem mínimo de instalações, e a economia para no tamanho da conta porque o
excedente vira crédito na distribuidora e não dinheiro de volta.

## Estrutura

```
src/app/[city]/page.tsx               rota por cidade, com generateStaticParams lendo a pasta de dados
src/app/[city]/opengraph-image.tsx    card 1200x630 do compartilhamento, gerado no build
src/app/blog/page.tsx                 índice do blog, um card por guia, gerado no build
src/app/blog/[slug]/page.tsx          rota por guia, com as fontes e os três guias seguintes
src/app/page.tsx                      raiz redirecionando para a primeira cidade publicada
src/data/cities/*.json                TODO o conteúdo que muda de cidade
src/content/blog/*.md                 os guias do blog, com o cabeçalho em JSON entre as cercas
src/lib/city.ts                       tipo City e leitura dos arquivos
src/lib/solar.ts                      cálculo do sistema, função pura, sem React
src/lib/blog.ts                       leitura e validação dos guias, no mesmo desenho do city.ts
src/lib/analytics.ts                  evento de simulação com a origem da campanha
src/lib/structured.ts                 JSON-LD (Service e FAQPage)
src/components/                       os seis blocos da página
src/components/BlogCard.tsx           o card do guia, usado no índice e no fecho do texto
src/components/ui/                    componentes do shadcn, versionados e editáveis
DESIGN.md                             tokens e regras de design, fonte única de cor, tipo, raio e espaço
AGENTS.md                             guia para agente de código que mexa no repositório
```

## Como trocar ou acrescentar cidade

Solte `src/data/cities/<slug>.json` com o mesmo formato de `phoenix-az.json` e rode o build. A rota, o
título, a descrição, o canonical, o card de compartilhamento, o JSON-LD, a conta e todos os textos da
página saem do arquivo. Nenhuma linha de código muda, e é para isso que a estrutura foi feita.

## Como a conta é feita

- `src/lib/solar.ts` é função pura, sem React, e é o que os testes exercitam.
- As três regras do cálculo têm teste próprio em `src/lib/aceitacao.test.ts`, com estado explícito nas duas
  entradas (conta e cobertura): painel é unidade inteira e arredonda para cima, cada cidade tem um mínimo de
  painéis por instalação, e a economia mensal nunca passa do valor da conta.
- Todo número que muda de cidade sai de `src/data/cities/<slug>.json`: tarifa, horas de sol pleno, potência
  do painel, fator de desempenho, custo por watt instalado, mínimo de painéis e alíquota do crédito federal.
  Constante no componente existe só para os trilhos de entrada dos controles, nomeada e com o motivo ao lado.
- O estado da simulação vive na URL (`?bill=220&coverage=80`), então o endereço enviado por mensagem abre a
  mesma conta, e não a página em branco. Escolher um perfil de residência preenche a conta típica e não mexe
  na cobertura escolhida, que só muda se a pessoa mexer nela.

## Analytics

Um evento por simulação concluída, com a origem da campanha capturada uma vez, na primeira renderização, e os
números simulados. É o que responde, na segunda-feira, quais anúncios geraram simulação de economia. O módulo
tem teste de unidade, e o caminho completo, com a campanha entrando pela URL, tem teste de navegação.

## Regras de design

`DESIGN.md`, na especificação aberta do Google, é a fonte de cor, tipografia, raio e espaçamento, e o
`@theme` do `globals.css` é gerado dele:

```bash
npx -y @google/design.md lint DESIGN.md                          # zero erro, zero aviso
npx -y @google/design.md export --format css-tailwind DESIGN.md  # gera o bloco @theme
```

Os nomes semânticos do shadcn apontam para esses tokens, então nenhuma cor nasce no componente. Quem confere
isso é `pnpm design`: ele compara as cores, os degraus de tipo, os pesos e os cantos do `DESIGN.md` com o
`@theme`, reprova cor escrita em hexadecimal dentro de componente e imprime a tabela de contraste de todo par
de cor usado, com o mínimo do Material Design (4,5 para 1 em texto pequeno, 3 para 1 em limite de componente).
Os números de hoje: tinta sobre o fundo 16,47, tinta sobre o branco 17,80, apoio 6,27, economia 5,32, tinta
sobre a cor de ação 6,77 e limite 3,96. A cor de ação sobre o branco mede 2,63 e por isso não é usada como
texto.

A escala de tipo e de canto veio do sistema do Zapier, escolhido entre cinquenta e quatro por ser o mais
denso em chamada para ação e o mais próximo em temperatura da marca. O que o `DESIGN.md` declara hoje: H1 em
56 px de peso 600 com entrelinha 0,95, número de resultado em 48 px de peso 500, título de seção em 40 px de
peso 500, corpo em 16 px e rótulo em 14 px. Canto em 4, 6, 8 e 14, alvo de toque de 48 px em tudo que é
clicável, espaço na grade de 4 px, e as classes de janela do Material (600, 840, 1200 e 1600 px) no lugar dos
breakpoints padrão do Tailwind. Uma medida de texto só, de 40 rem, para a página inteira. A paleta não veio do
Zapier: laranja de sol, verde de economia e fundo quente são da Brightfield.

Um defeito que a conferência do tema revelou: o H1 saía com peso 400 em vez do peso declarado. O export do
`DESIGN.md` gera um nome de família e um de peso por degrau de tipo, e os dois caíam na mesma classe do
Tailwind, então um anulava o outro. A família passou a ser declarada uma vez, no `--font-sans`.

O texto da página segue regras de forma medidas: zero travessão e zero exclamação, zero adjetivo vazio, uma
chamada por bloco com verbo mais o que a pessoa leva, e número verificável no lugar de promessa. O `title` e a
`description` foram medidos e ajustados ao alvo (51 e 152 caracteres). O texto do FAQ, dos depoimentos e dos
perfis vem do arquivo da cidade, e não da copy de interface.

## Acessibilidade e segurança

- O simulador é operável só pelo teclado, do primeiro controle ao último, conferido em 375 e em 1280 px,
  junto de `axe-core` nas duas larguras: zero violação.
- Os cabeçalhos de segurança são dado, em `src/lib/security-headers.ts`, com teste que reprova quem afrouxar
  a política sem perceber.
- Nenhum dado de visitante sai da página antes de a pessoa pedir a visita.

## O que falta

- **Mais cidades de exemplo.** Hoje existe um arquivo de cidade, o de Phoenix. Um segundo arquivo com números
  diferentes é o teste que prova que nada de Phoenix está escrito no código.
- **Imagens das equipes.** Hoje são as iniciais do nome, para não afirmar que uma pessoa existe; com
  liberação de uso de imagem, viram foto.
- **Peso da página: 276 KB com gzip**, de 813 KB crus, medidos nos dez arquivos que o HTML da página carrega
  de verdade, e não no tamanho do repositório. O comando que produz o número lê o HTML construído, soma os
  arquivos referenciados e comprime cada um, então o valor é reprodutível.

## Guia para quem for mexer no código

`AGENTS.md` na raiz: comandos, mapa da estrutura e as regras que não se negociam.
