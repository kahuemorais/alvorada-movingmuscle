// O endereço público do site, em um lugar só.
//
// Existe porque havia três verdades diferentes sobre o mesmo endereço: o canônico e o Open
// Graph usavam `https://host/slug`, o dado estruturado usava `https://host/slug/` e o redirecionamento da
// raiz também. As duas com barra apontam para um endereço que responde 308, e essa divergência de forma
// já impediu a página de abrir uma vez, quando `trailingSlash` estava ligado. Aqui a composição é uma só,
// e o teste confere que nenhum caminho composto termina em barra.
//
// E a queda para localhost deixou de ser silenciosa: em produção, sem variável de ambiente configurada, o
// canônico, a imagem de compartilhamento e o dado estruturado apontariam para a máquina do build, que é
// pior do que falhar. Em produção sem endereço, o build para.
const FORMA_DO_SLUG = /^[a-z0-9-]+$/;

function semBarraNoFim(valor: string): string {
  return valor.replace(/\/+$/, "");
}

export function siteUrl(): string {
  const proprio = process.env.NEXT_PUBLIC_SITE_URL;
  if (proprio) return semBarraNoFim(proprio);

  const hospedagem = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (hospedagem) return `https://${semBarraNoFim(hospedagem)}`;

  // Ambiente de publicação é onde o endereço importa: a Vercel marca `VERCEL`, e qualquer integração
  // contínua marca `CI`. Build rodado na máquina de quem desenvolve não é publicação, e derrubar o build
  // local não protege ninguém: atrapalha a verificação. `EXIGIR_ENDERECO_PUBLICO=1` força a exigência
  // para hospedagem que não marque nenhuma das duas.
  const emPublicacao = Boolean(process.env.VERCEL) || Boolean(process.env.CI) || process.env.EXIGIR_ENDERECO_PUBLICO === "1";
  if (process.env.NODE_ENV === "production" && emPublicacao) {
    throw new Error(
      "endereço público não configurado: defina NEXT_PUBLIC_SITE_URL, ou rode na Vercel, que preenche VERCEL_PROJECT_PRODUCTION_URL",
    );
  }
  // Fora do ambiente de publicação o retorno é o localhost, e o aviso existe para a queda não ser
  // silenciosa: canônico e imagem de compartilhamento apontando para a máquina errada é defeito caro.
  if (process.env.NODE_ENV === "production") {
    console.warn("endereço público não configurado: usando http://localhost:3000 no build");
  }
  return "http://localhost:3000";
}

export function cityPath(slug: string): string {
  if (!FORMA_DO_SLUG.test(slug)) throw new Error(`slug inválido: ${slug}`);
  return `/${slug}`;
}

// Compositor puro, recebendo o site como parâmetro: é o mesmo usado pelo endereço de página e pelo
// endereço declarado no dado estruturado. Ter um compositor só é o que impede os dois de divergirem de
// novo, que foi o defeito original.
// Caminho do blog: o índice sem slug e o texto com slug, pelo mesmo compositor do caminho de cidade, e com
// a mesma forma fechada. Existe aqui e não na página porque endereço montado à mão é o defeito que este
// módulo já registra: foi assim que o canônico e o dado estruturado passaram a discordar.
export function blogPath(slug?: string): string {
  if (slug === undefined) return "/blog";
  if (!FORMA_DO_SLUG.test(slug)) throw new Error(`slug inválido: ${slug}`);
  return `/blog/${slug}`;
}

export function cidadeNoSite(site: string, slug: string): string {
  return `${semBarraNoFim(site)}${cityPath(slug)}`;
}

export function cityUrl(slug: string): string {
  return cidadeNoSite(siteUrl(), slug);
}

export function blogNoSite(site: string, slug?: string): string {
  return `${semBarraNoFim(site)}${blogPath(slug)}`;
}

export function blogUrl(slug?: string): string {
  return blogNoSite(siteUrl(), slug);
}
