import type { NextConfig } from "next";
import { cabecalhosSeguranca } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // Sem `trailingSlash`, e nao por descuido. A primeira versao tinha `trailingSlash: true` porque o
  // canonical e o Open Graph declaravam a URL com barra, e no build local isso funcionava. No
  // dominio publicado nao: a Vercel normaliza a URL sem barra antes de o Next ver a requisicao, entao
  // /phoenix-az/ respondia 308 para /phoenix-az e /phoenix-az respondia 404, ou seja, a pagina da
  // cidade nao abria por caminho nenhum. Agora o endereco servido, o canonical e o Open Graph sao
  // todos sem barra, que e o padrao do Next e o que a hospedagem serve.
  poweredByHeader: false,

  // Cabeçalhos de segurança em toda rota. Os valores moram em `src/lib/security-headers.ts`, e não aqui,
  // porque lá eles são dado testável: `pnpm test` reprova se alguém afrouxar a política sem perceber. Os
  // motivos das duas exceções de `unsafe-inline` estão escritos no próprio módulo.
  async headers() {
    return [{ source: "/(.*)", headers: cabecalhosSeguranca() }];
  },
};

export default nextConfig;
