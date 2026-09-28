// A paleta do DESIGN.md escrita em TypeScript, para quem não consegue ler variável de CSS.
//
// O gerador da imagem de compartilhamento desenha com satori, que não conhece `var(--color-*)`, então
// antes estas seis cores viviam repetidas em hexadecimal dentro do arquivo da imagem. Duas fontes para o
// mesmo valor divergem no primeiro dia em que alguém mexe numa: agora o hexadecimal mora aqui, e o
// `scripts/audit-design.mjs` reprova o build se este arquivo e o DESIGN.md não disserem a mesma coisa.
//
// O nome aqui é camelCase porque identificador de TypeScript não aceita hífen; o verificador converte
// para kebab-case ao comparar com o DESIGN.md, então a comparação continua sendo uma a uma.
// Quem desenha em HTML continua usando as classes semânticas (`bg-canvas`, `text-ink`), que saem do
// `@theme` do globals.css. Este arquivo existe só para o caso de satori.
export const paleta = {
  ink: "#16181A",
  support: "#5B6167",
  primary: "#E8882A",
  primaryLight: "#F5A623",
  primaryDark: "#B0740F",
  secondary: "#1E5FBF",
  savings: "#1F7A4D",
  canvas: "#F7F6F3",
  surface: "#FFFFFF",
  outline: "#7F8081",
} as const;
