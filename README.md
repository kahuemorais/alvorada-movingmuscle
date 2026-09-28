# Brightfield Solar: city page

Next.js with App Router, one page per city, generated from a data file. The same model serves a network of
roughly 120 cities: publishing the next one means dropping its file and rebuilding.

- **Published page:** https://alvorada-chi.vercel.app
- **One page per city:** `src/data/cities/<slug>.json`

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:3000, redirects to the published city
```

Other commands:

```bash
pnpm build       # production build
pnpm start       # serves the build
pnpm test        # unit tests: calculation, data, structured data, analytics and formatting
pnpm lint        # eslint, including the React hooks rules
pnpm design      # checks DESIGN.md against the theme and prints the contrast table
pnpm navigation  # browser measurements: navigation, simulator, social proof and finish
pnpm security    # dependency, secret and insecure pattern sweep
pnpm verify      # all of the above, in this order, stopping at the first failure
```

`pnpm verify` is the gate for every change. Install, tests and build were also checked in a clean clone
(`git clone`, `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`), which is the path someone
cloning will take.

## What the page has

Six blocks, in this order:

1. Full width opening, a centered column over the photo of the installers on the roof (with an ink veil so
   the text reads) and the brand inside it on mobile: the promise, one action, and the strip with completed
   installs, average rating and crews in the city
2. Savings simulator, which is the block that makes the visitor book the site visit
3. How the installation happens, in three steps, with the average permit time coming from the data
4. Social proof: testimonials with neighborhood and date, crews with volume and rating, and a block that
   says which neighborhoods the crews work in and what the list is for
5. Frequently asked questions, one per item in the city file
6. Closing call, with the phone number and the note about the state incentive, which stays out of the math

The simulator takes the power bill and the coverage the visitor wants, shows panels, investment after the
federal credit, monthly savings and payback, and explains on screen when one of the three rules applies: a
panel is a whole unit, the city has a minimum number of panels per installation, and savings stop at the
size of the bill because the surplus becomes bill credit with the utility and not money back.

## Structure

```
src/app/[city]/page.tsx               route per city, with generateStaticParams reading the data folder
src/app/[city]/opengraph-image.tsx    1200x630 share card, generated at build time
src/app/blog/page.tsx                 blog index, one card per guide, generated at build time
src/app/blog/[slug]/page.tsx          route per guide, with the sources and the next three guides
src/app/page.tsx                      root redirecting to the first published city
src/data/cities/*.json                EVERYTHING that changes from city to city
src/content/blog/*.md                 the blog guides, with a JSON header between the fences
src/lib/city.ts                       City type and reading of the city files
src/lib/solar.ts                      system calculation, pure function, no React
src/lib/blog.ts                       reading and validation of the guides, same shape as city.ts
src/lib/analytics.ts                  simulation event with the campaign origin
src/lib/structured.ts                 JSON-LD (Service and FAQPage)
src/components/                       the six blocks of the page
src/components/BlogCard.tsx           the guide card, used in the index and at the end of a guide
src/components/ui/                    shadcn components, versioned and editable
DESIGN.md                             tokens and design rules, single source for color, type, radius, space
AGENTS.md                             guide for a code agent working in the repository
```

## Swapping or adding a city

Drop `src/data/cities/<slug>.json` with the same shape as `phoenix-az.json` and run the build. The route,
the title, the description, the canonical, the share card, the JSON-LD, the math and every text on the page
come from that file. No line of code changes, and that is what the structure is for.

## How the math works

- `src/lib/solar.ts` is a pure function, no React, and it is what the tests exercise.
- The three rules of the calculation have their own test in `src/lib/aceitacao.test.ts`, with explicit state
  on both inputs (bill and coverage): a panel is a whole unit and rounds up, every city has a minimum number
  of panels per installation, and monthly savings never exceed the bill.
- Every number that changes from city to city comes from `src/data/cities/<slug>.json`: rate, peak sun
  hours, panel watts, performance ratio, cost per watt installed, minimum panels and federal credit rate. A
  constant inside a component exists only for the input rails of the controls, named, with the reason next
  to it.
- The simulator state lives in the URL (`?bill=220&coverage=80`), so the address sent over a message opens
  the same estimate and not an empty page. Picking a household profile fills the typical bill and does not
  touch the chosen coverage, which only changes when the visitor changes it.

## Analytics

One event per completed simulation, with the campaign origin captured once, on the first render, and the
simulated numbers. It is what answers, on Monday, which ads generated a savings simulation. The module has a
unit test, and the full path, with the campaign arriving in the URL, has a browser test.

## Design rules

`DESIGN.md`, in Google's open specification, is the source for color, typography, radius and spacing, and
the `@theme` in `globals.css` is generated from it:

```bash
npx -y @google/design.md lint DESIGN.md                          # zero error, zero warning
npx -y @google/design.md export --format css-tailwind DESIGN.md  # generates the @theme block
```

The shadcn semantic names point at those tokens, so no color is born inside a component. `pnpm design` is
what checks that: it compares the colors, type steps, weights and corners in `DESIGN.md` with the `@theme`,
fails any hex color written inside a component, and prints the contrast table of every color pair in use,
with the Material Design minimum (4.5 to 1 for small text, 3 to 1 for a component boundary). Today's
numbers: ink over canvas 16.47, ink over white 17.80, support 6.27, savings 5.32, ink over the action color
6.77 and outline 3.96. The action color over white measures 2.63, which is why it is not used as text.

The type and corner scale came from the Zapier system, picked out of fifty four for being the densest in
calls to action and the closest in temperature to the brand. What `DESIGN.md` declares today: H1 at 56 px
weight 600 with 0.95 line height, result number at 48 px weight 500, section title at 40 px weight 500, body
at 16 px and label at 14 px. Corners at 4, 6, 8 and 14, a 48 px touch target on everything clickable, a 4 px
spacing grid, and the Material window classes (600, 840, 1200 and 1600 px) in place of the Tailwind default
breakpoints. A single text measure of 40 rem for the whole page. The palette did not come from Zapier: sun
orange, savings green and a warm background belong to Brightfield.

One defect the theme check revealed: the H1 rendered at weight 400 instead of the declared weight. The
`DESIGN.md` export generates one family name and one weight name per type step, and both landed in the same
Tailwind class, so one cancelled the other. The family is now declared once, in `--font-sans`.

The page text follows measured form rules: no em dash and no exclamation mark, no empty adjective, one call
per block with a verb plus what the visitor gets, and a verifiable number instead of a promise. The `title`
and the `description` were measured and tuned to target (51 and 152 characters). The FAQ, testimonial and
profile text comes from the city file, not from interface copy.

## Accessibility and security

- The simulator is operable by keyboard alone, from the first control to the last, checked at 375 and at
  1280 px, together with `axe-core` at both widths: zero violations.
- The security headers are data, in `src/lib/security-headers.ts`, with a test that fails whoever loosens
  the policy without noticing.
- No visitor data leaves the page before the visitor asks for the site visit.

## What is missing

- **More example cities.** There is one city file today, Phoenix. A second file with different numbers is
  the test that proves nothing about Phoenix is written into the code.
- **Crew photos.** Today the cards use the initials of the name, so the page does not claim a person
  exists; with image rights cleared, they become photos.
- **Page weight: 276 KB gzipped**, out of 813 KB raw, measured across the ten files the page HTML really
  loads, and not the size of the repository. The command that produces the number reads the built HTML,
  sums the referenced files and compresses each one, so the value is reproducible.

## Guide for whoever touches the code

`AGENTS.md` at the root: commands, map of the structure and the rules that are not negotiable.
