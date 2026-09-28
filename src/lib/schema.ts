// O esquema da cidade é a fonte única do tipo `City`, e a trava do dado que entra na conta.
//
// Por que existe: um arquivo de cidade com tarifa zero faz a conta virar infinito, e a página mostra
// "∞ $∞ $NaN NaN years" sem ninguém perceber. O carregamento antigo fazia
// `JSON.parse(...) as City`, que é uma afirmação sem prova: o compilador concorda com o que o arquivo
// diz e ninguém confere. Com esquema, arquivo torto derruba o build, que é onde o erro é barato.
//
// As faixas numéricas não são arbitrárias: cada uma existe para barrar um erro de digitação plausível,
// e estão comentadas uma a uma. `.strict()` recusa campo que o esquema não conhece, para um campo
// escrito errado no arquivo (por exemplo `utilityRate` em vez de `utilityRatePerKwh`) falhar em vez de
// ser ignorado em silêncio.
import { z } from "zod";

export const esquemaPerfil = z
  .object({
    label: z.string().min(1),
    // Conta de luz de casa nos Estados Unidos: 40 dólares é o mínimo do simulador, 600 o teto.
    typicalBill: z.number().positive().min(40).max(600),
  })
  .strict();

export const esquemaEquipe = z
  .object({
    name: z.string().min(1),
    installs: z.number().int().min(0),
    rating: z.number().min(0).max(5),
    since: z.number().int().min(1900).max(2100),
    blurb: z.string().min(1),
  })
  .strict();

export const esquemaDepoimento = z
  .object({
    quote: z.string().min(1),
    author: z.string().min(1),
    neighborhood: z.string().min(1),
    // Data ISO, que é o que a página formata e o que o dado estruturado espera.
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data fora do formato AAAA-MM-DD"),
  })
  .strict();

export const esquemaPergunta = z.object({ q: z.string().min(1), a: z.string().min(1) }).strict();

export const esquemaCidade = z
  .object({
    // O slug vira caminho de arquivo e endereço de página, então a forma é fechada aqui também.
    slug: z.string().regex(/^[a-z0-9-]+$/, "slug fora do formato minusculas, numeros e hifen"),
    city: z.string().min(1),
    state: z.string().length(2),
    stateFull: z.string().min(1),
    metroArea: z.string().min(1),
    utilityName: z.string().min(1),
    // Tarifa residencial nos Estados Unidos fica entre 8 e 60 centavos por kWh. Zero é o erro que
    // quebra a conta, e acima de 1 dólar é digitação.
    utilityRatePerKwh: z.number().positive().max(1),
    // Horas de sol pleno por dia: o deserto passa de 7, o norte fica perto de 3. Acima de 12 não existe.
    peakSunHoursPerDay: z.number().positive().max(12),
    // Painel residencial: 250 a 800 W hoje.
    panelWatts: z.number().int().min(100).max(1000),
    // Perda por temperatura, sujeira e inversor: fica entre 70 e 90 por cento, nunca 1 nem 1,5.
    performanceRatio: z.number().positive().max(1),
    // Custo instalado por watt antes do incentivo: 2 a 4 dólares é a faixa de mercado.
    costPerWattInstalled: z.number().positive().max(20),
    // Existe mínimo por instalação: menos de um painel não é sistema.
    minPanels: z.number().int().min(1).max(100),
    // Alíquota do crédito federal: 30 por cento hoje, e o valor é fração, não porcentagem.
    federalCreditRate: z.number().min(0).lt(1),
    stateIncentiveNote: z.string().min(1),
    installsCompleted: z.number().int().min(0),
    crewsAvailable: z.number().int().min(1),
    // Nota média: escala de zero a cinco.
    avgRating: z.number().min(0).max(5),
    avgPermitDays: z.number().int().min(0),
    phone: z.string().min(1),
    popularNeighborhoods: z.array(z.string().min(1)).min(1),
    householdProfiles: z.array(esquemaPerfil).min(1),
    crews: z.array(esquemaEquipe).min(1),
    testimonials: z.array(esquemaDepoimento).min(1),
    faq: z.array(esquemaPergunta).min(1),
  })
  .strict();

export type City = z.infer<typeof esquemaCidade>;
export type Crew = z.infer<typeof esquemaEquipe>;
export type HouseholdProfile = z.infer<typeof esquemaPerfil>;
export type Testimonial = z.infer<typeof esquemaDepoimento>;
export type Faq = z.infer<typeof esquemaPergunta>;

// ------------------------------------------------------------------------------------------------
// Blog: o mesmo tratamento do dado de cidade, aplicado a texto.
//
// O texto do blog tem cabeçalho escrito à mão por quem escreve, e cabeçalho escrito à mão erra em dois
// pontos que não podem passar: afirmação numérica sem fonte declarada, que é o defeito que o AGENTS.md
// proíbe e que motor de resposta não cita porque não pode conferir, e data de atualização anterior à de
// publicação, que faz a página mentir sobre quando foi revisada. As duas regras moram aqui, e não em
// quem lê, para valerem em qualquer caminho que carregue texto, inclusive no teste.
export const esquemaFonte = z
  .object({
    nome: z.string().min(1),
    // Endereço público: fonte sem endereço não é conferível, então não conta como fonte.
    url: z.url(),
  })
  .strict();

export const esquemaPerguntaBlog = z
  .object({
    pergunta: z.string().min(1),
    resposta: z.string().min(1),
  })
  .strict();

// O corpo entra no esquema de propósito. A regra "número citado pede fonte declarada" depende do que o
// texto afirma, e o corpo é a única parte que afirma: um esquema só do cabeçalho não teria como olhar.
const FORMA_DA_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Número citado no corpo, em sentido largo de propósito: qualquer dígito conta, inclusive dentro de uma
// palavra. O crivo é conservador porque o erro de barrar demais é barato (a fonte entra no texto) e o de
// barrar de menos é caro (número sem origem publicado como se tivesse). Não tenta ser uma leitura de
// linguagem: aqui só se decide se o texto fez alguma afirmação que precise de origem.
export function citaNumero(corpo: string): boolean {
  return /\d/.test(corpo);
}

export const esquemaTexto = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/, "slug fora do formato minusculas, numeros e hifen"),
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.string().regex(FORMA_DA_DATA, "data fora do formato AAAA-MM-DD"),
    // Igual a de publicação quando o texto não foi revisado. O campo existe mesmo assim: data de revisão
    // ausente é o que faz a página parecer nunca revista.
    updatedAt: z.string().regex(FORMA_DA_DATA, "data fora do formato AAAA-MM-DD"),
    author: z.string().min(1),
    sources: z.array(esquemaFonte),
    // Perguntas opcionais: quando existem, a resposta precisa estar literalmente no corpo, e são elas que
    // a página publica como dado estruturado.
    faq: z.array(esquemaPerguntaBlog).optional(),
    body: z.string().min(1),
  })
  .strict()
  .superRefine((texto, ctx) => {
    if (citaNumero(texto.body) && texto.sources.length === 0) {
      // A mensagem nomeia o campo e não o valor: quem lê o log do build precisa saber o que consertar,
      // não receber o trecho do texto de volta.
      ctx.addIssue({ code: "custom", path: ["sources"], message: "texto cita numero e nao declara fonte" });
    }
    // Comparação de texto funciona porque as duas datas estão no formato AAAA-MM-DD, que ordena igual à
    // ordem cronológica. Data ilegível nunca chega aqui: a forma da data já foi conferida acima.
    if (texto.updatedAt < texto.publishedAt) {
      ctx.addIssue({ code: "custom", path: ["updatedAt"], message: "updatedAt anterior a publishedAt" });
    }
  });

export type BlogSource = z.infer<typeof esquemaFonte>;
export type BlogFaq = z.infer<typeof esquemaPerguntaBlog>;
// Campos do texto antes de virarem blocos: `blog.ts` é quem acrescenta os blocos, porque ler markdown é
// trabalho da camada de conteúdo e não do esquema.
export type BlogPostFields = z.infer<typeof esquemaTexto>;

// Lista de erros legível, para a mensagem de falha nomear arquivo e campo sem despejar o zod inteiro.
export function descreverErros(erro: z.ZodError): string {
  return erro.issues.map((i) => `${i.path.join(".") || "raiz"}: ${i.message}`).join("; ");
}
