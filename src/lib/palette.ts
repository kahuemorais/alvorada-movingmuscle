// The DESIGN.md palette written in TypeScript, for whoever cannot read a CSS variable.
//
// The share image generator draws with satori, which does not know `var(--color-*)`, so
// before, these six colors lived repeated in hexadecimal inside the image file. Two sources for the
// same value diverge on the first day someone touches one of them: now the hexadecimal lives here, and
// `scripts/audit-design.mjs` fails the build if this file and DESIGN.md do not say the same thing.
//
// The name here is camelCase because a TypeScript identifier does not accept a hyphen; the checker converts
// to kebab-case when comparing with DESIGN.md, so the comparison stays one to one.
// Whoever draws in HTML still uses the semantic classes (`bg-canvas`, `text-ink`), which come from the
// `@theme` of globals.css. This file exists only for the satori case.
export const palette = {
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
