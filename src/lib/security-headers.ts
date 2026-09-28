// Cabeçalhos de segurança como dado, e não espalhados na configuração do Next.
//
// Por que existe: a resposta saía sem nenhuma proteção, numa página que roda script de terceiro e
// circula por anúncio, onde enquadramento e origem de script deixam de ser teoria. Como dado,
// os cabeçalhos ficam testáveis, e `pnpm test` reprova se alguém afrouxar a política sem perceber.
//
// O que a política bloqueia: script de origem terceira que não seja o medidor, `eval`, plugin e objeto
// embutido, sequestro de base para reescrever endereço relativo, enquadramento em outro site e envio de
// formulário para fora.
//
// O que ela não bloqueia, e por quê, para não parecer descuido:
//
//   script-src com 'unsafe-inline'  o Next injeta o script de hidratação em linha no HTML servido. Nonce
//                                   exigiria renderização dinâmica, e a página é estática de propósito,
//                                   por causa do custo e do cache; hash por build não serve, porque a
//                                   configuração de cabeçalho é avaliada antes de existir HTML para medir.
//   style-src com 'unsafe-inline'   o mesmo motivo, para o estilo crítico que o Next injeta.
//
// As duas exceções são o custo conhecido de página estática no Next. Se um dia a página passar a ser
// renderizada a cada requisição, o caminho é nonce por requisição, que é o que a documentação da versão
// descreve (01-app/02-guides/content-security-policy.md).
export type Cabecalho = { key: string; value: string };

function politica(ambiente: string) {
  const desenvolvimento = ambiente === "development";
  return [
    "default-src 'self'",
    // O medidor da Vercel carrega `/_vercel/insights/script.js`, de mesma origem, quando é produção; o
    // endereço `va.vercel-scripts.com` só aparece no modo de depuração, e fica liberado para o
    // desenvolvimento não quebrar sem aviso.
    //
    // `'unsafe-eval'` SÓ em desenvolvimento, e por um motivo que não é preguiça: o React em modo de
    // desenvolvimento usa `eval()` para reconstruir pilha de chamada e para o recarregamento rápido, e sem
    // isso o console acusa erro a cada carregamento, e foi assim que este defeito apareceu. Em produção
    // nada disso roda, e a política continua fechada contra `eval`; o teste deste arquivo reprova quem
    // levar a exceção para o lado de produção.
    `script-src 'self' 'unsafe-inline'${desenvolvimento ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    // O envio do medidor também passa pela mesma origem em produção.
    "connect-src 'self' https://va.vercel-scripts.com",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

// O ambiente entra por parâmetro para o teste poder exercitar os dois lados: o de produção, que não pode
// ter `unsafe-eval`, e o de desenvolvimento, que precisa dele. Sem o parâmetro, a função lê o ambiente em
// que está rodando, que é o que a configuração do Next faz.
export function cabecalhosSeguranca(ambiente: string = process.env.NODE_ENV ?? "production"): Cabecalho[] {
  return [
    { key: "Content-Security-Policy", value: politica(ambiente) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()",
    },
  ];
}
