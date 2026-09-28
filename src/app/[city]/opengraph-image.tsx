import { ImageResponse } from "next/og";
import { getCity } from "@/lib/city";
import { usd } from "@/lib/format";
import { paleta } from "@/lib/palette";
import { simulate } from "@/lib/solar";

// Card de compartilhamento: quase ninguem decide sozinho, e o endereco e enviado por mensagem para quem
// decide junto. Entao o card mostra os dois numeros que
// essa pessoa vai olhar antes de abrir o link, paineis e economia, no ponto de partida do simulador.
//
// Sem fonte propria: o ImageResponse usa a fonte do sistema, e carregar um .ttf so para o card
// custaria mais peso do que o ganho de consistencia tipografica aqui.
export const alt = "Solar estimate for a city served by Brightfield Solar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// O card e o mesmo para toda visita daquela cidade, entao ele e gerado no build junto com a pagina,
// em vez de virar funcao que responde sob demanda (o que adicionaria partida fria justo quando o
// rastreador do mensageiro busca a imagem).
export const dynamic = "force-static";

export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const dados = getCity(city);
  const resultado = simulate(dados, { bill: 220, coverage: 80 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: paleta.canvas,
          color: paleta.ink,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, letterSpacing: 1, color: paleta.support, textTransform: "uppercase" }}>
            Brightfield Solar
          </div>
          {/* Uma string interpolada, e nao tres nos filhos: cada div do satori precisa declarar
              display quando tem mais de um filho, e o texto do titulo tem cidade e estado. */}
          <div style={{ fontSize: 57, fontWeight: 700, lineHeight: 1.05, marginTop: 24, maxWidth: 940 }}>
            {`Solar in ${dados.city}, ${dados.state}`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 64, alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: paleta.support }}>Panels</div>
            <div style={{ fontSize: 45, fontWeight: 700 }}>{String(resultado.panels)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: paleta.support }}>Monthly savings</div>
            <div style={{ fontSize: 45, fontWeight: 700, color: paleta.savings }}>
              {usd(resultado.monthlySavings)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, color: paleta.support }}>Installs completed</div>
            <div style={{ fontSize: 45, fontWeight: 700 }}>{String(dados.installsCompleted)}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
