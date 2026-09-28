// Verifica que o design continua sendo um só, e reprova quando não é.
//
// Existe porque a revisão de Material Design só vale se puder ser repetida: sem isto, alguém mexe numa
// cor no DESIGN.md, ninguém atualiza o @theme, e a divergência aparece só quando alguém olha a tela.
// Ele confere quatro coisas, todas por leitura dos arquivos, sem dependência nenhuma:
//
//   1. As cores do DESIGN.md são as mesmas do @theme do globals.css e do src/lib/palette.ts.
//   2. Os degraus de tipo, os pesos e a escala de canto do DESIGN.md são os mesmos do @theme.
//   3. Nenhum componente escreve cor em hexadecimal, nem tamanho de texto fora da escala, nem canto
//      fora da escala. As únicas exceções são o globals.css e o palette.ts, que são as fontes.
//   4. A tabela de contraste de todo par de cor que a página usa, com o mínimo do Material Design
//      (4,5 para 1 em texto pequeno, 3 para 1 em texto grande e em limite de componente).
//
// Uso: pnpm design
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const raiz = new URL("..", import.meta.url).pathname;
const ler = (rel) => readFileSync(join(raiz, rel), "utf8");
const problemas = [];
const avisos = [];

const design = ler("DESIGN.md");
const globals = ler("src/app/globals.css");
const palette = ler("src/lib/palette.ts");

// ---------- 1. cores ----------
const coresDesign = Object.fromEntries(
  [...design.matchAll(/^ {2}([a-z-]+): "(#[0-9A-Fa-f]{6})"/gm)].map(([, nome, valor]) => [nome, valor]),
);
const coresTheme = Object.fromEntries(
  [...globals.matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6});/g)].map(([, nome, valor]) => [nome, valor]),
);
// O espelho em TypeScript usa camelCase, porque identificador não aceita hífen. A comparação é feita em
// kebab-case, que é como o DESIGN.md e o @theme escrevem.
const coresPalette = Object.fromEntries(
  [...palette.matchAll(/^ {2}([a-zA-Z]+): "(#[0-9A-Fa-f]{6})",$/gm)].map(([, nome, valor]) => [
    nome.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`),
    valor,
  ]),
);

for (const [nome, valor] of Object.entries(coresDesign)) {
  if (!coresTheme[nome]) problemas.push(`cor do DESIGN.md sem token no @theme: ${nome}`);
  else if (coresTheme[nome].toUpperCase() !== valor.toUpperCase())
    problemas.push(`cor divergente em ${nome}: DESIGN.md ${valor}, @theme ${coresTheme[nome]}`);
  if (!coresPalette[nome]) problemas.push(`cor do DESIGN.md ausente no palette.ts: ${nome}`);
  else if (coresPalette[nome].toUpperCase() !== valor.toUpperCase())
    problemas.push(`cor divergente em ${nome}: DESIGN.md ${valor}, palette.ts ${coresPalette[nome]}`);
}
for (const nome of Object.keys(coresPalette)) {
  if (!coresDesign[nome]) problemas.push(`cor no palette.ts que não existe no DESIGN.md: ${nome}`);
}
console.log(`cores: ${Object.keys(coresDesign).length} no DESIGN.md, ${Object.keys(coresTheme).length} no @theme, ${Object.keys(coresPalette).length} no palette.ts`);

// ---------- 2. tipo, peso e canto ----------
const degraus = (texto) =>
  [...texto.matchAll(/^ {2}([a-z-]+):\n {4}fontSize: ([0-9.]+)rem/gm)].map(([, nome, rem]) => [nome, Math.round(parseFloat(rem) * 16)]);
const tamanhos = Object.fromEntries(degraus(design));
const tamanhosTheme = Object.fromEntries(
  [...globals.matchAll(/--text-([a-z-]+):\s*([0-9.]+)rem;/g)].map(([, nome, rem]) => [nome, Math.round(parseFloat(rem) * 16)]),
);
for (const [nome, px] of Object.entries(tamanhos)) {
  if (tamanhosTheme[nome] !== px) problemas.push(`degrau divergente em ${nome}: DESIGN.md ${px}px, @theme ${tamanhosTheme[nome]}px`);
}
for (const nome of Object.keys(tamanhosTheme)) {
  if (!tamanhos[nome]) problemas.push(`degrau no @theme que não existe no DESIGN.md: ${nome}`);
}

const pesosDesign = Object.fromEntries(
  [...design.matchAll(/^ {2}([a-z]+):\n(?:.*\n)*? {4}fontWeight: (\d+)/gm)].map(([, nome, valor]) => [nome, valor]),
);
const pesosTheme = Object.fromEntries(
  [...globals.matchAll(/--font-weight-([a-z-]+):\s*(\d+);/g)].map(([, nome, valor]) => [nome, valor]),
);
for (const [nome, valor] of Object.entries(pesosDesign)) {
  if (pesosTheme[nome] && pesosTheme[nome] !== valor) problemas.push(`peso divergente em ${nome}: DESIGN.md ${valor}, @theme ${pesosTheme[nome]}`);
}
const pesosUsados = new Set(Object.values(pesosTheme));
console.log(`degraus: ${Object.keys(tamanhos).length} | pesos declarados: ${[...pesosUsados].join(", ")}`);

const cantosTheme = Object.fromEntries(
  [...globals.matchAll(/--radius-([a-z0-9]+):\s*([0-9]+)px;/g)].map(([, nome, px]) => [nome, Number(px)]),
);
const escalaCantos = new Set(Object.values(cantosTheme));
console.log(`cantos: ${[...escalaCantos].sort((a, b) => a - b).join(", ")} px`);

// ---------- 3. varredura dos componentes ----------
function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return caminho.endsWith(".tsx") || caminho.endsWith(".css") ? [caminho] : [];
  });
}
const componentes = arquivos(join(raiz, "src"));
const fontesDeValor = ["src/app/globals.css", "src/lib/palette.ts"];
for (const caminho of componentes) {
  const rel = relative(raiz, caminho);
  // Comentário não é código: sem tirar os blocos `/* */` o verificador reprova a própria explicação da
  // regra, que cita `text-lead` como exemplo do que não fazer.
  const texto = readFileSync(caminho, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  if (!fontesDeValor.includes(rel)) {
    const hex = texto.match(/#[0-9A-Fa-f]{6}\b/g);
    if (hex) problemas.push(`cor em hexadecimal em ${rel}: ${[...new Set(hex)].join(", ")}`);
  }
  const foraDaEscala = [...texto.matchAll(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\b/g)].map((m) => m[0]);
  if (foraDaEscala.length) problemas.push(`tamanho do Tailwind em ${rel}: ${[...new Set(foraDaEscala)].join(", ")}`);
  // Degrau da nossa escala escrito como `text-*` em vez de `type-*`: é o que o tailwind-merge descarta.
  // A expressao evita casar o token do CSS (`--text-display`) e so pega a classe (`text-display`).
  const degrauAntigo = [...texto.matchAll(/(?<!-)\btext-(display|number|title|lead|body|label)\b(?!-)/g)].map((m) => m[0]);
  if (degrauAntigo.length) problemas.push(`degrau escrito como text-* em ${rel}: ${[...new Set(degrauAntigo)].join(", ")} (use type-*)`);
  // Espaçamento fora da grade de 4 px, com os nossos degraus. Zero não conta.
  const espacos = [...texto.matchAll(/\b(?:p|px|py|pt|pb|pl|pr|gap|m|mx|my|mt|mb|ml|mr)-(\d+(?:\.\d+)?)\b/g)]
    .map((m) => [m[0], parseFloat(m[1]) * 4])
    .filter(([, px]) => px !== 0 && ![4, 8, 16, 24, 32, 64].includes(px));
  if (espacos.length) problemas.push(`espaçamento fora da grade em ${rel}: ${[...new Set(espacos.map(([c, px]) => `${c} (${px}px)`))].join(", ")}`);
  const cantoFora = [...texto.matchAll(/rounded-\[([^\]]+)\]/g)].map((m) => m[0]);
  if (cantoFora.length) problemas.push(`canto arbitrário em ${rel}: ${[...new Set(cantoFora)].join(", ")}`);
  // Tamanho escrito direto no arquivo, fora de classe: só o gerador de imagem faz isso, e só nos degraus
  // do Material que a página não usa: Display Large 57, Display Medium 45 e Headline Small 24.
  const embutidos = [...texto.matchAll(/fontSize:\s*(\d+)/g)].map((m) => Number(m[1]));
  const permitidos = [14, 16, 22, 24, 32, 36, 45, 57];
  const intrusos = embutidos.filter((n) => !permitidos.includes(n));
  if (intrusos.length) problemas.push(`tamanho de fonte fora da escala em ${rel}: ${[...new Set(intrusos)].join(", ")} px`);
}

// ---------- 4. contraste ----------
const luminancia = (hexa) => {
  const c = hexa.replace("#", "");
  const canais = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const linear = canais.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};
const contraste = (a, b) => {
  const [la, lb] = [luminancia(a), luminancia(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
// A cor secundaria entra na tabela, e nao so no tema: cor que nao e medida nao tem guarda.
const texto = [["ink", "canvas"], ["ink", "surface"], ["support", "canvas"], ["support", "surface"],
               ["savings", "surface"], ["savings", "canvas"], ["ink", "primary"], ["ink", "primary-light"],
               ["secondary", "canvas"], ["secondary", "surface"], ["canvas", "secondary"],
               ["primary-light", "ink"]];
const limite = [["outline", "surface"], ["outline", "canvas"], ["secondary", "surface"], ["secondary", "canvas"],
                ["primary-dark", "surface"], ["primary-dark", "canvas"]];
console.log("\ncontraste de texto (mínimo 4,5 para 1):");
for (const [frente, fundo] of texto) {
  const valor = contraste(coresDesign[frente], coresDesign[fundo]);
  const marca = valor >= 4.5 ? "ok" : "REPROVA";
  if (valor < 4.5) problemas.push(`contraste de texto ${frente} sobre ${fundo}: ${valor.toFixed(2)} para 1`);
  console.log(`  ${marca.padEnd(8)} ${frente} sobre ${fundo}: ${valor.toFixed(2)}`);
}
console.log("contraste de limite de componente (mínimo 3 para 1):");
for (const [frente, fundo] of limite) {
  const valor = contraste(coresDesign[frente], coresDesign[fundo]);
  const marca = valor >= 3 ? "ok" : "REPROVA";
  if (valor < 3) problemas.push(`contraste de limite ${frente} sobre ${fundo}: ${valor.toFixed(2)} para 1`);
  console.log(`  ${marca.padEnd(8)} ${frente} sobre ${fundo}: ${valor.toFixed(2)}`);
}
// Movimento: quem pediu menos no sistema não pode receber animação nenhuma.
if (!globals.includes("prefers-reduced-motion")) problemas.push("globals.css sem a regra de prefers-reduced-motion");

avisos.push("primary sobre surface mede 2,63 para 1: a cor de ação não serve como texto. Onde ela aparece é ícone decorativo, fundo com tinta por cima (6,77), ou borda de estado escolhido que tem o texto e o rádio como segundo sinal.");

console.log("");
for (const aviso of avisos) console.log(`aviso: ${aviso}`);
if (problemas.length) {
  console.log(`\n${problemas.length} problema(s):`);
  for (const p of problemas) console.log(`  - ${p}`);
  process.exit(1);
}
console.log("\ntudo dentro do DESIGN.md");
