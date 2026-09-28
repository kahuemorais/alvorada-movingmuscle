import fs from "node:fs";
import path from "node:path";
import { descreverErros, esquemaTexto, type BlogPostFields } from "./schema";

// A camada de conteúdo do blog, no mesmo desenho de `city.ts`: uma pasta, um arquivo por texto, validação
// no carregamento e o miolo separado do caminho fixo para o teste poder apontar para pasta temporária.
//
// Por que o texto é dado e não JSX: a regra do projeto é que valor que muda de um item para outro não
// nasce no componente. Publicar o texto seguinte é soltar um arquivo na pasta, sem tocar em código, que é
// a mesma escala que a página de cidade precisa com cento e vinte cidades.
//
// O cabeçalho é JSON entre as cercas `---`, e não YAML. YAML pede dependência nova, e a dependência nova
// entra na varredura de segurança que reprova o build. JSON é lido pelo próprio Node, não tem ambiguidade
// de indentação e o erro dele é de sintaxe, que o build acusa no arquivo certo. O corpo abaixo da cerca
// continua markdown comum.
//
// O corpo vira lista de blocos, e não HTML montado aqui: quem decide a aparência é o componente, com os
// degraus de tipo e as cores do `@theme`, e a lista de blocos é o que permite isso sem `dangerouslySetInnerHTML`.
export type { BlogSource, BlogFaq } from "./schema";

const DIR = path.join(process.cwd(), "src", "content", "blog");
const EXTENSAO = ".md";

// Forma do slug fechada no carregador, e não em quem chama, pelo mesmo motivo do carregador de cidade: o
// valor vira nome de arquivo e endereço de página, então aceitar ponto, barra ou sublinhado é aceitar sair
// da pasta de conteúdo.
const FORMA_DO_SLUG = /^[a-z0-9-]+$/;

export type Bloco =
  | { tipo: "titulo"; texto: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; itens: string[] };

// O texto publicado: o cabeçalho validado mais o corpo já em blocos.
export type BlogPost = BlogPostFields & { blocos: Bloco[] };

// Tempo de leitura em minutos, CALCULADO do corpo do texto. Escrito à mão, o número envelhece na primeira
// revisão do texto e ninguém lembra de recontar; calculado, ele acompanha o corpo sozinho. A conta separa
// palavras por espaço em branco — título, parágrafo e item de lista — e usa 200 palavras por minuto, que é a
// média de leitura em tela. O piso de um minuto existe porque "0 min read" não significa nada.
const PALAVRAS_POR_MINUTO = 200;

export function minutosDeLeitura(texto: BlogPost): number {
  const palavras = texto.blocos
    .map((bloco) => (bloco.tipo === "lista" ? bloco.itens.join(" ") : bloco.texto))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}

export function listBlogSlugs(): string[] {
  return fs
    .readdirSync(DIR)
    .filter((arquivo) => arquivo.endsWith(EXTENSAO))
    .map((arquivo) => arquivo.replace(/\.md$/, ""))
    .sort();
}

// Cabeçalho e corpo, separados pela segunda cerca. Não começar pela cerca, ou não ter a segunda, é defeito
// do arquivo e a mensagem diz qual: texto sem cabeçalho validado não pode entrar na página.
function separarCabecalho(bruto: string, arquivo: string): { cabecalho: string; corpo: string } {
  const linhas = bruto.split("\n");
  if (linhas[0]?.trim() !== "---") throw new Error(`texto sem cabecalho em ${arquivo}`);
  const fim = linhas.findIndex((linha, i) => i > 0 && linha.trim() === "---");
  if (fim === -1) throw new Error(`cabecalho sem cerca de fim em ${arquivo}`);
  return { cabecalho: linhas.slice(1, fim).join("\n"), corpo: linhas.slice(fim + 1).join("\n").trim() };
}

// Markdown reduzido ao que o blog usa: título de seção, parágrafo e lista. A lista tem que ser a única
// coisa de uma linha? Não: um traço no começo da linha abre item, e linha comum depois de lista fecha a
// lista e vira parágrafo. Menos que isto é o suficiente, e mais que isto constrói um leitor de markdown
// inteiro, que é onde a manutenção fica mais caro que a dependência que ele evita.
export function emBlocos(corpo: string): Bloco[] {
  const blocos: Bloco[] = [];
  let paragrafo: string[] = [];
  let itens: string[] = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) blocos.push({ tipo: "paragrafo", texto: paragrafo.join(" ") });
    paragrafo = [];
  };
  const fecharLista = () => {
    if (itens.length) blocos.push({ tipo: "lista", itens });
    itens = [];
  };

  for (const linha of corpo.split("\n")) {
    const texto = linha.trim();
    if (texto === "") {
      fecharParagrafo();
      fecharLista();
      continue;
    }
    if (texto.startsWith("## ")) {
      fecharParagrafo();
      fecharLista();
      blocos.push({ tipo: "titulo", texto: texto.slice(3).trim() });
      continue;
    }
    if (texto.startsWith("- ")) {
      fecharParagrafo();
      itens.push(texto.slice(2).trim());
      continue;
    }
    fecharLista();
    paragrafo.push(texto);
  }
  fecharParagrafo();
  fecharLista();
  return blocos;
}

// Resumo do item da lista: a primeira frase do primeiro parágrafo, que é onde o padrão de escrita do blog
// manda estar a resposta. O `description` só entra quando o corpo não tem parágrafo nenhum, para a lista
// nunca mostrar resumo vazio.
export function resumoDe(texto: BlogPost): string {
  const primeiro = texto.blocos.find((bloco) => bloco.tipo === "paragrafo");
  if (!primeiro || primeiro.tipo !== "paragrafo") return texto.description;
  const fim = primeiro.texto.indexOf(". ");
  return fim === -1 ? primeiro.texto : primeiro.texto.slice(0, fim + 1);
}

// Lê um texto já carregado em memória. Existe separado do disco porque o teste precisa exercitar cabeçalho
// torto, falta de fonte e data fora de ordem sem escrever arquivo em src/content.
export function interpretarTexto(bruto: string, arquivo: string): BlogPost {
  const { cabecalho, corpo } = separarCabecalho(bruto, arquivo);

  let dados: unknown;
  try {
    dados = JSON.parse(cabecalho);
  } catch {
    // Sem o valor na mensagem, pelo mesmo motivo do esquema: o log do build aponta o arquivo, não despeja
    // o conteúdo de um arquivo lido por engano.
    throw new Error(`cabecalho fora do formato JSON em ${arquivo}`);
  }
  if (typeof dados !== "object" || dados === null || Array.isArray(dados)) {
    throw new Error(`cabecalho precisa ser um objeto JSON em ${arquivo}`);
  }

  const resultado = esquemaTexto.safeParse({ ...(dados as Record<string, unknown>), body: corpo });
  if (!resultado.success) {
    throw new Error(`texto invalido em ${arquivo}: ${descreverErros(resultado.error)}`);
  }

  const texto = resultado.data;
  // O nome do arquivo é o endereço da página, e o slug do cabeçalho é conferido contra ele. É isto que
  // impede dois arquivos apontarem para o mesmo endereço: um deles, no mínimo, discorda do próprio nome.
  const doArquivo = arquivo.replace(/\.md$/, "");
  if (texto.slug !== doArquivo) {
    throw new Error(`slug do cabecalho nao bate com o nome do arquivo em ${arquivo}`);
  }

  return { ...texto, blocos: emBlocos(texto.body) };
}

// Miolo separado de propósito, igual ao de cidade: recebe o diretório, para o teste apontar para pasta
// temporária com um arquivo torto dentro sem escrever nada em src/content.
export function carregarTextoDe(dir: string, slug: string): BlogPost {
  if (!FORMA_DO_SLUG.test(slug)) throw new Error(`slug inválido: ${slug}`);

  const arquivo = `${slug}${EXTENSAO}`;
  const caminho = path.join(dir, arquivo);
  if (!fs.existsSync(caminho)) throw new Error(`texto sem arquivo: ${slug}`);

  return interpretarTexto(fs.readFileSync(caminho, "utf8"), arquivo);
}

export function getTexto(slug: string): BlogPost {
  return carregarTextoDe(DIR, slug);
}

// Caminho seguro para quem só desenha a página: slug que não existe ou tem forma inválida devolve nulo, e
// quem chama decide o 404. Mesmo desenho do `buscarCidadeOpcional`.
export function buscarTextoOpcional(slug: string): BlogPost | null {
  try {
    return getTexto(slug);
  } catch {
    return null;
  }
}

// Lista do mais novo para o mais antigo, com o slug desempatando: dois textos publicados no mesmo dia
// precisam sair sempre na mesma ordem, senão a página muda de conteúdo sem ninguém mudar o arquivo.
export function listarTextos(): BlogPost[] {
  return listBlogSlugs()
    .map((slug) => getTexto(slug))
    .sort((a, b) => (a.publishedAt === b.publishedAt ? a.slug.localeCompare(b.slug) : b.publishedAt.localeCompare(a.publishedAt)));
}
