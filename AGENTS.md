<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## What this project is

A city page for Brightfield Solar. Next.js with App Router, one page per city, generated from a data file.

## Commands

- Install: `pnpm install`
- Development: `pnpm dev`
- Build: `pnpm build`
- Tests: `pnpm test`
- Lint: `pnpm lint`

## Structure

- `src/app/[city]/page.tsx`: route per city, with `generateStaticParams` reading `src/data/cities`
- `src/data/cities/*.json`: EVERYTHING that changes from city to city lives here
- `src/app/blog/page.tsx`: blog index, with the posts read from `src/content/blog`
- `src/app/blog/[slug]/page.tsx`: one page per post, with `generateStaticParams` reading the folder and a real 404
- `src/content/blog/*.md`: the blog posts, with a JSON header between the fences and a markdown body
- `src/lib/blog.ts`: reading, validation and ordering of the posts, same shape as `src/lib/city.ts`
- `src/components/BlogCard.tsx`: the post card, used in the index and at the end of each post
- `src/lib/solar.ts`: system calculation, pure function, no React
- `src/lib/city.ts`: `City` type and reading of the city files
- `src/components/`: the six blocks of the page
- `src/components/ui/`: shadcn components, versioned and editable
- `DESIGN.md`: tokens and design rules, single source for color, radius, type and spacing

## Rules that are not negotiable

- **No city value is born inside a component.** Every number that changes from city to city (rate, sun,
  price, minimum panels, credit rate) comes from `src/data/cities/*.json`. A constant inside a component is
  allowed only for input rails, that is, the range and the step of the simulator controls, which are the
  same in every city, and in that case it is named, with the reason written next to it. There are four
  today: the bill limits, the bill step, the coverage range and the coverage step.
- **The calculation does not live in React.** `src/lib/solar.ts` is a pure function and it is what the tests
  exercise. The three rules of the calculation (a panel is a whole unit, the city minimum, the savings cap)
  have their own test.
- **No loose styling.** Color, radius, spacing and the type scale come out of `DESIGN.md` into the `@theme`
  of `globals.css`. A new component does not write hex by hand.
- **A type step is written `type-<step>`, never `text-<step>` next to `font-<step>`.** Each `type-*`
  utility applies size, line height and weight at once. The reason is measured: `cn` uses tailwind-merge,
  which does not know a custom step, classifies `text-<step>` as color or alignment, and silently drops the
  class when it sits next to `text-ink` or `text-left`. The FAQ question rendered at 16 px when the code
  asked for 22, and the H1 rendered at weight 400 when it asked for 700.
- **A border that carries meaning uses `border-outline`, not a light gray.** Material asks for 3 to 1 of
  contrast on a component boundary, and `ink` at 15% measures 1.37: it identifies nothing. It applies to a
  form field, a choice control, a clickable item and anything whose boundary must be perceived. A grouping
  border, like the one on a card, is decorative and stays light.
- **Width is not written with `w-lg`, `max-w-md` and the like.** Our space steps are called `xs`, `sm`,
  `md`, `lg`, `xl` and `xxl`, and in Tailwind v4 those same names define the container scale, so `max-w-lg`
  resolves to `var(--spacing-lg)`, which is 24 px instead of the 32 rem of Tailwind. Width goes in an
  explicit value (`max-w-[34rem]`) or in a name we do not declare (`2xl` and up). It cost a collapsed
  navigation pill 24 px of width on mobile.
- **`calc()` inside a Tailwind class needs `_` in place of the space.** `w-[calc(100vw-2rem)]` becomes
  invalid CSS and the property is silently ignored; the right way is
  `bottom-[calc(1rem_+_env(safe-area-inset-bottom))]`. The example has to be a real class, with the `env`
  argument written out: Tailwind scans the project `.md` files as a class source, so an example with an
  ellipsis in place of the argument generates invalid CSS, and that takes `pnpm dev` down with a 500 on
  every route — the production build swallows it, the development pipeline does not.
- **No customer data, no credential, no employer code.**
- **Accessibility is not a finishing polish.** If you touch the simulator, check keyboard and screen reader
  before committing.

## Before finishing any change

`pnpm verify`

A single command: build, tests, lint, design and security sweep, in this order, stopping at the first
failure. The sweep covers four fronts and each one catches a different class: `pnpm audit` for a published
dependency with a known vulnerability, `gitleaks` for a secret in the code and in the history, `semgrep` for
an insecure code pattern in TypeScript, and `osv-scanner` for a dependency against the OSV database by
lockfile. A missing tool fails the sweep with the install command, and does not pass as a warning.

The real net is running the command on the machine before every commit: the pre-commit hook
(`git config core.hooksPath .githooks`, once per clone) runs the secret sweep and the lint, and the full
`pnpm verify` is the gate for every change.

Tools required on the machine:

```
brew install semgrep gitleaks osv-scanner
git config core.hooksPath .githooks   # activates the pre-commit hook, once per clone
```

`pnpm design` checks that the colors, the type steps, the weights and the corners in `DESIGN.md` are the
same ones in the `@theme`, that no component writes a hex color or a size outside the scale, and prints the
contrast table of every color pair in use, with the Material Design minimum.
