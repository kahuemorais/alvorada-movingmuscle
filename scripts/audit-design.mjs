// Checks that the design stays single, and fails when it does not.
//
// Why it exists: the Material Design review is only worth anything if it can be repeated. Without this,
// someone edits a color in DESIGN.md, nobody updates the @theme, and the divergence shows up only when
// someone looks at the screen. It checks four things, all by reading the files, with no dependency:
//
//   1. The colors in DESIGN.md are the same ones in the @theme of globals.css and in src/lib/palette.ts.
//   2. The type steps, the weights and the corner scale in DESIGN.md are the same ones in the @theme.
//   3. No component writes a hexColors color, a text size outside the scale, or a corner outside the scale.
//      The only exceptions are globals.css and palette.ts, which are the sources.
//   4. The contrast table of every color pair the page uses, with the Material Design minimum
//      (4.5 to 1 for small text, 3 to 1 for large text and for a component boundary).
//
// Usage: pnpm design
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const problems = [];
const warnings = [];

const design = read("DESIGN.md");
const globals = read("src/app/globals.css");
const palette = read("src/lib/palette.ts");

// ---------- 1. colors ----------
const designColors = Object.fromEntries(
  [...design.matchAll(/^ {2}([a-z-]+): "(#[0-9A-Fa-f]{6})"/gm)].map(([, name, value]) => [name, value]),
);
const themeColors = Object.fromEntries(
  [...globals.matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6});/g)].map(([, name, value]) => [name, value]),
);
// The TypeScript mirror uses camelCase, because an identifier does not take a hyphen. The comparison runs
// in kebab-case, which is how DESIGN.md and the @theme write them.
const paletteColors = Object.fromEntries(
  [...palette.matchAll(/^ {2}([a-zA-Z]+): "(#[0-9A-Fa-f]{6})",$/gm)].map(([, name, value]) => [
    name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
    value,
  ]),
);

for (const [name, value] of Object.entries(designColors)) {
  if (!themeColors[name]) problems.push(`DESIGN.md color without a token in the @theme: ${name}`);
  else if (themeColors[name].toUpperCase() !== value.toUpperCase())
    problems.push(`divergent color in ${name}: DESIGN.md ${value}, @theme ${themeColors[name]}`);
  if (!paletteColors[name]) problems.push(`DESIGN.md color missing from palette.ts: ${name}`);
  else if (paletteColors[name].toUpperCase() !== value.toUpperCase())
    problems.push(`divergent color in ${name}: DESIGN.md ${value}, palette.ts ${paletteColors[name]}`);
}
for (const name of Object.keys(paletteColors)) {
  if (!designColors[name]) problems.push(`color in palette.ts that does not exist in DESIGN.md: ${name}`);
}
console.log(`colors: ${Object.keys(designColors).length} in DESIGN.md, ${Object.keys(themeColors).length} in the @theme, ${Object.keys(paletteColors).length} in palette.ts`);

// ---------- 2. type, weight and corner ----------
const steps = (textPairs) =>
  [...textPairs.matchAll(/^ {2}([a-z-]+):\n {4}fontSize: ([0-9.]+)rem/gm)].map(([, name, rem]) => [name, Math.round(parseFloat(rem) * 16)]);
const sizes = Object.fromEntries(steps(design));
const themeSizes = Object.fromEntries(
  [...globals.matchAll(/--text-([a-z-]+):\s*([0-9.]+)rem;/g)].map(([, name, rem]) => [name, Math.round(parseFloat(rem) * 16)]),
);
for (const [name, px] of Object.entries(sizes)) {
  if (themeSizes[name] !== px) problems.push(`divergent step in ${name}: DESIGN.md ${px}px, @theme ${themeSizes[name]}px`);
}
for (const name of Object.keys(themeSizes)) {
  if (!sizes[name]) problems.push(`step in the @theme that does not exist in DESIGN.md: ${name}`);
}

const designWeights = Object.fromEntries(
  [...design.matchAll(/^ {2}([a-z]+):\n(?:.*\n)*? {4}fontWeight: (\d+)/gm)].map(([, name, value]) => [name, value]),
);
const themeWeights = Object.fromEntries(
  [...globals.matchAll(/--font-weight-([a-z-]+):\s*(\d+);/g)].map(([, name, value]) => [name, value]),
);
for (const [name, value] of Object.entries(designWeights)) {
  if (themeWeights[name] && themeWeights[name] !== value) problems.push(`divergent weight in ${name}: DESIGN.md ${value}, @theme ${themeWeights[name]}`);
}
const pesosUsados = new Set(Object.values(themeWeights));
console.log(`type steps: ${Object.keys(sizes).length} | declared weights: ${[...pesosUsados].join(", ")}`);

const themeCorners = Object.fromEntries(
  [...globals.matchAll(/--radius-([a-z0-9]+):\s*([0-9]+)px;/g)].map(([, name, px]) => [name, Number(px)]),
);
const cornerScale = new Set(Object.values(themeCorners));
console.log(`corners: ${[...cornerScale].sort((a, b) => a - b).join(", ")} px`);

// ---------- 3. component sweep ----------
function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const filePath = join(dir, name);
    if (statSync(filePath).isDirectory()) return files(filePath);
    return filePath.endsWith(".tsx") || filePath.endsWith(".css") ? [filePath] : [];
  });
}
const componentes = files(join(root, "src"));
const valueSources = ["src/app/globals.css", "src/lib/palette.ts"];
for (const filePath of componentes) {
  const relativePath = relative(root, filePath);
  // A comment is not code: without stripping the `/* */` blocks the checker fails its own rule
  // explanation, which cites `text-lead` as an example of what not to do.
  const textPairs = readFileSync(filePath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  if (!valueSources.includes(relativePath)) {
    const hexColors = textPairs.match(/#[0-9A-Fa-f]{6}\b/g);
    if (hexColors) problems.push(`hexColors color in ${relativePath}: ${[...new Set(hexColors)].join(", ")}`);
  }
  const offScale = [...textPairs.matchAll(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\b/g)].map((m) => m[0]);
  if (offScale.length) problems.push(`Tailwind size in ${relativePath}: ${[...new Set(offScale)].join(", ")}`);
  // A step of our scale written as `text-*` instead of `type-*`: that is what tailwind-merge drops.
  // The expression avoids matching the CSS token (`--text-display`) and takes only the class (`text-display`).
  const oldStep = [...textPairs.matchAll(/(?<!-)\btext-(display|number|title|lead|body|label)\b(?!-)/g)].map((m) => m[0]);
  if (oldStep.length) problems.push(`step written as text-* in ${relativePath}: ${[...new Set(oldStep)].join(", ")} (use type-*)`);
  // Spacing outside the 4 px grid, using our steps. Zero does not count.
  const spacings = [...textPairs.matchAll(/\b(?:p|px|py|pt|pb|pl|pr|gap|m|mx|my|mt|mb|ml|mr)-(\d+(?:\.\d+)?)\b/g)]
    .map((m) => [m[0], parseFloat(m[1]) * 4])
    .filter(([, px]) => px !== 0 && ![4, 8, 16, 24, 32, 64].includes(px));
  if (spacings.length) problems.push(`spacing outside the grid in ${relativePath}: ${[...new Set(spacings.map(([c, px]) => `${c} (${px}px)`))].join(", ")}`);
  const offCorner = [...textPairs.matchAll(/rounded-\[([^\]]+)\]/g)].map((m) => m[0]);
  if (offCorner.length) problems.push(`arbitrary corner in ${relativePath}: ${[...new Set(offCorner)].join(", ")}`);
  // A size written straight into the file, outside a class: only the image generator does that, and only in
  // the Material steps the page does not use: Display Large 57, Display Medium 45 and Headline Small 24.
  const inlined = [...textPairs.matchAll(/fontSize:\s*(\d+)/g)].map((m) => Number(m[1]));
  const allowed = [14, 16, 22, 24, 32, 36, 45, 57];
  const intruders = inlined.filter((n) => !allowed.includes(n));
  if (intruders.length) problems.push(`font size outside the scale in ${relativePath}: ${[...new Set(intruders)].join(", ")} px`);
}

// ---------- 4. contrast ----------
const luminance = (hexa) => {
  const c = hexa.replace("#", "");
  const canais = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const linear = canais.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};
const contrast = (a, b) => {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
// The secondary color enters the table, not only the theme: a color that is not measured has no guard.
const textPairs = [["ink", "canvas"], ["ink", "surface"], ["support", "canvas"], ["support", "surface"],
               ["savings", "surface"], ["savings", "canvas"], ["ink", "primary"], ["ink", "primary-light"],
               ["secondary", "canvas"], ["secondary", "surface"], ["canvas", "secondary"],
               ["primary-light", "ink"]];
const boundaryPairs = [["outline", "surface"], ["outline", "canvas"], ["secondary", "surface"], ["secondary", "canvas"],
                ["primary-dark", "surface"], ["primary-dark", "canvas"]];
console.log("\ntext contrast (minimum 4.5 to 1):");
for (const [front, back] of textPairs) {
  const value = contrast(designColors[front], designColors[back]);
  const mark = value >= 4.5 ? "ok" : "FAIL";
  if (value < 4.5) problems.push(`text contrast ${front} over ${back}: ${value.toFixed(2)} to 1`);
  console.log(`  ${mark.padEnd(8)} ${front} sobre ${back}: ${value.toFixed(2)}`);
}
console.log("component boundary contrast (minimum 3 to 1):");
for (const [front, back] of boundaryPairs) {
  const value = contrast(designColors[front], designColors[back]);
  const mark = value >= 3 ? "ok" : "FAIL";
  if (value < 3) problems.push(`boundary contrast ${front} over ${back}: ${value.toFixed(2)} to 1`);
  console.log(`  ${mark.padEnd(8)} ${front} sobre ${back}: ${value.toFixed(2)}`);
}
// Motion: whoever asked for less motion in the system must not get any animation.
if (!globals.includes("prefers-reduced-motion")) problems.push("globals.css without the prefers-reduced-motion rule");

warnings.push("primary over surface measures 2.63 to 1: the action color does not work as text. Where it appears it is a decorative icon, a background with ink on top (6.77), or the border of a selected state that has the text and the radio as a second signal.");

console.log("");
for (const warning of warnings) console.log(`warning: ${warning}`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log("\neverything inside DESIGN.md");
