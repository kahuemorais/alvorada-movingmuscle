import fs from "node:fs";
import path from "node:path";
import { descreverErros, esquemaCidade, type City } from "./schema";

// O tipo e os subtipos vêm do esquema, que é a fonte única. Reexportados aqui para quem já importa
// `City` deste módulo continuar funcionando sem mudar chamada nenhuma.
export type { City, Crew, Faq, HouseholdProfile, Testimonial } from "./schema";

// Uma pasta, um arquivo por cidade. Trocar o arquivo tem que gerar a pagina da outra cidade sem
// tocar em codigo, que e o requisito de escala (cerca de 120 cidades).
const DIR = path.join(process.cwd(), "src", "data", "cities");

export function listCitySlugs(): string[] {
  return fs
    .readdirSync(DIR)
    .filter((arquivo) => arquivo.endsWith(".json"))
    .map((arquivo) => arquivo.replace(/\.json$/, ""))
    .sort();
}

// Forma do slug, fechada no carregador e não em quem chama. O valor vira nome de arquivo e endereço de
// página, então aceitar ponto, barra ou sublinhado é aceitar sair da pasta de dados: um JSON de fora com
// slug de `..` já apareceu, e antes disto o defeito só não era alcançável porque o build fixa a
// lista de cidades e o corpo da página conferia essa lista. As duas coisas são defesa de fora; esta é a
// defesa onde o dado entra.
const FORMA_DO_SLUG = /^[a-z0-9-]+$/;

// Miolo separado de propósito: recebe o diretório, para o teste poder apontar para uma pasta temporária
// com um arquivo torto dentro, sem escrever nada em src/data.
export function carregarCidadeDe(dir: string, slug: string): City {
  if (!FORMA_DO_SLUG.test(slug)) throw new Error(`slug inválido: ${slug}`);

  const arquivo = `${slug}.json`;
  const caminho = path.join(dir, arquivo);
  if (!fs.existsSync(caminho)) throw new Error(`cidade sem arquivo de dados: ${slug}`);

  const bruto: unknown = JSON.parse(fs.readFileSync(caminho, "utf8"));
  const resultado = esquemaCidade.safeParse(bruto);
  if (!resultado.success) {
    // A mensagem nomeia o arquivo e o campo, e nunca o valor: é para consertar dado, não para vazar
    // conteúdo de arquivo errado no log do build.
    throw new Error(`dado inválido em ${arquivo}: ${descreverErros(resultado.error)}`);
  }
  return resultado.data;
}

export function getCity(slug: string): City {
  return carregarCidadeDe(DIR, slug);
}

// Caminho seguro para quem só desenha a página: slug que não existe ou tem forma inválida devolve nulo,
// e quem chama decide o 404. Existe porque `generateMetadata` chamava o carregador direto, sem a
// conferência que o corpo da página fazia.
export function buscarCidadeOpcional(slug: string): City | null {
  try {
    return getCity(slug);
  } catch {
    return null;
  }
}
