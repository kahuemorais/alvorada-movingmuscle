gra---
version: alpha
name: Brightfield Solar
description: Desert sun on a warm background, with the savings always in green, on the skeleton of Zapier.
colors:
  ink: "#16181A"
  support: "#5B6167"
  primary: "#E8882A"
  secondary: "#1E5FBF"
  primary-light: "#F5A623"
  primary-dark: "#B0740F"
  savings: "#1F7A4D"
  canvas: "#F7F6F3"
  surface: "#FFFFFF"
  outline: "#7F8081"
typography:
  display:
    fontSize: 3.5rem
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  number:
    fontSize: 3rem
    fontWeight: 500
    lineHeight: 1
  title:
    fontSize: 2.5rem
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  lead:
    fontSize: 1.25rem
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.43
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 14px
  4xl: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 64px
  touch: 48px
components:
  page:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
  cta-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    height: 56px
  cta-button-hover:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    height: "{spacing.touch}"
  result-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  savings-value:
    textColor: "{colors.savings}"
    typography: "{typography.number}"
  microcopy:
    textColor: "{colors.support}"
    typography: "{typography.label}"
  profile-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  nav-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  nav-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.4xl}"
---

## Overview

Campaign landing page for someone standing in the backyard looking at their own roof, on the
phone. Warm and light background, high contrast, nothing decorative: every block either shows a
number, or explains the number.

The skeleton comes from the Zapier system, chosen for being the densest in call to action and the closest
in temperature to the brand.
The palette is Brightfield's and does not change: what came from Zapier was type, corner, depth and rhythm.

## Where this design comes from

What came from Zapier, and why:

- **Type compressed at the top.** The opening uses a line height of 0.95 with negative leading, which gives the
  compact block of someone who does not need to shout. The weight drops from 700 to 600: with Archivo, a grotesque
  with a sturdy stroke, the 500 of the original reads weak on the phone, and 600 is the weight Zapier itself uses in the
  large button text.
- **Large and light number.** The money value is their statistic counter: 48 px at weight 500, in
  place of 36 px at weight 700. Tabular figures along with it, because the four numbers change live while the
  person moves the control.
- **Tight corner.** The scale drops from 8, 12, 16 and 28 to 4, 6, 8 and 14. It is the stroke that most changes the
  face of the page, and it is cheap: button 8, card 14, field and label 4 to 6.
- **Border in place of shadow.** It was already like this here, and it continues: depth comes from border and from
  background tone, never from shadow.

What stayed out, with the reason:

- **Their palette.** Orange `#ff4f00` over cream `#fffefb` is beautiful and is not our brand.
- **Short leading in the body.** Zapier uses 1.20 to 1.25 in the body because it writes short and functional text;
  here the questions are running text on the phone, and 1.5 reads better. Declared divergence.
- **Alternation of light and dark section.** They switch the environment of the page halfway; here the whole page
  is the same light, and the contrast stays for the result card.
- **Touch target of 44 px.** Theirs is 44; here it is 48, which is the project rule and is better for the thumb.
- **Text in uppercase with tracking.** It exists in Zapier for a category label. It comes in only where there is a
  real category, not in every label.

The tokens of this design live in the `@theme` of `src/app/globals.css`, which is generated from this file, and in
`src/lib/palette.ts`, which is checked against this file by `scripts/audit-design.mjs`. The contrast numbers
and the minimums of each use are in this file, section Colors, and the run that rejects whatever falls
below the Material minimum is `pnpm design`.

## Colors

- **primary (#E8882A):** the sun, and the color of ACTION. It sits in the two main actions of the page, `Estimate my
  savings` and `Book the site visit`, in the final band, which stays in orange only, in the **highlight
  inks** of the two blocks with decision work (the middle call, in the simulator, and the neighborhoods block) and in the
  **chosen option**
  of the simulator controls, and in the FAQ accordion: the arrow and the border of the open item. Blue came to take those
  places and left them: the background of a large block is not a place for a highlight color, the chosen option keeps
  being orange, and the accordion reads better in orange than in blue, both on hover and open. **The band of the close
  came to have the photo of the panels in the desert over the action color, with the same veil as the opening**, and orange
  keeps being what the band is: the base color (it is what appears if the photo does not load, together with the gradient of
  `action-veil`) and the color of the call button, which with the dark veil went back to being the light one of the action color, with the text in ink.
- **primary-dark (#B0740F):** the dark gold, and it exists by measurement, not by taste: the light gold over
  white measures 1.86 and does not identify a 20 px drawing. It measures **3.92** over white and **3.63** over the page
  background, which is the Material minimum for an icon. It lives in the calculator icons, which sit over a white card; the
  icons with a **dark circle** behind them (three steps, neighborhood location, testimonial quotes and the crew
  hard hat) stay in the light gold, which over ink measures 8.78.
- **secondary (#1E5FBF):** the blue, and it is **accent, never the background of a block**. **The page no longer uses
  this color**: the last appearance was the circle of initials of the crews, which moved to ink, and the token stays in the theme
  because the `secondary` variants of the shadcn components are still
  written (`ui/button.tsx`, `ui/badge.tsx`), with no consumer on the page. The path to here was all removal: blue left the menu (the hover went back to being the background only), the whole opening, the icons
  (which became filled and gold), the label of the three steps (which went back to ink), the focus of the bill
  field (which went back to the action color, because blue is not a control color here), the hairline of the number box and, last,
  the crews. It measures
  **5.64** over the page background and **6.10** over white, so it would serve for text, unlike the amber, and
  that is what is in `DESIGN.md` as a contrast reference, not as a use. The light variant (`secondary-light`)
  existed to read over the dark
  photo of the opening, and left when white came back there: an unused token does not stay in the theme.
- **primary-light (#F5A623):** the golden yellow, derived from the amber: lighter and more vibrant
  than it, and clearly another tone, the hue goes from ~28 to ~42 degrees. The hex is the one of the gold, the same
  the page consumes. It has two roles, and that is why the name speaks of the color and not of a single use: it is the **hover** of the
  action buttons and of the blog cards, and it is the color of the **filled icons** of the three steps, of the testimonial quotes
  and of the neighborhood location icon. Its pair with ink measures **8.78** in both directions. It does not come into the veil
  of the final band: the close stays in orange only, and the veil darkens the amber itself by `color-mix`,
  with no new token. The token exists from before, for a reason that keeps holding: the hover was the amber with opacity,
  and opacity no checker can measure.
- **savings (#1F7A4D):** exclusive to the money saved. Green here is what the person stops paying.
- **ink and support:** text and support text. The support gray appears only in a small body, never in a number.
- **canvas and surface:** page background and card background. The card is white over the warm background, and it is that
  difference of two tones that separates the simulator result from the rest of the page without needing a shadow.
- **outline (#7F8081):** boundary gray, and it exists by measurement. With `ink` at 15 percent the border measured
  1.37 to 1 against white, and Material asks for 3 to 1 in a component boundary, which is what makes a
  field or a clickable item perceived as clickable. With this token it measures 3.96 over white and 3.66
  over the page background. A grouping border, like the one of the card, stays light on purpose: it does not
  need to be perceived, the content is what groups.

The contrast of every color pair used is in `pnpm design`, which fails when some pair falls below the
Material minimum. The numbers of today: ink over the background 16.47, ink over white 17.80, support
over white 6.27, savings over white 5.32, ink over the action color 6.77, boundary over white
3.96, ink over the gold `primary-light` 8.78 (and the same 8.78 in the gold over ink, which is the case of the icon in the
dark circle), `primary-dark` over white 3.92 and over the background 3.63, and the ones of the new color: blue over the background 5.64, blue over white 6.10 and
light ink over blue 5.64. The action color over white measures 2.63, and that is why it does not serve as text: where it appears it is a decorative
icon, a background with ink over it, or the border of a chosen state, which has the text and the radio as a
second signal.

## Typography

Archivo in everything, because the page lives on the phone, and the family is the same one registered in the `Typeface`
section, at the end of this file: Inter is a spent font, and Archivo is a
sturdy grotesque, with tabular figures, which is what aligns the numbers of the page. One family only, and three
weights: 400 in the body, 500 in the labels, titles and numbers, 600 in the H1. The display is reserved for the H1, with tight leading on purpose,
and the result number uses the `number` step, never the body one, so the value is read at a glance and without
changing width while it changes.

**The 40 rem measure is the one of running text, and the title has its own.** The headline of the opening needs 54 rem to
close in two lines on the desktop: with the 40 rem of the body it took three, measured, and three lines in a display is visual
excess. The running text stays with 40 rem, and the two measures live together because they have different jobs: one governs
reading, the other governs the line break of a display. **The section titles use the same 54 rem measure** on the desktop
(`md:max-w-[54rem]`), and the title column of the FAQ grew from 16 to 22 rem: at 16 rem the title of four words
broke in four lines, and a title that breaks too much does not read as a title.

**On the phone the title drops one type step, and that is what decides the height of the opening.** At 56 px, in the column of 345 px,
the headline of 70 characters broke in seven lines (372 px of block) and took the panel to 953 px, taller than a
screen of 900. With the `title` step (40 px) it breaks in five lines and the block falls to 212 px. The step is declared
in the component (`type-title md:type-display`), so both sizes keep coming from the scale of this document, and the
browser measure keeps both sides.

## Layout

Spacing scale on the 4 px grid, with the steps 4, 8, 16, 24, 32 and 64, plus 48 for the touch target.
Every block breathes on the 64 step. No margin invented per block, and nothing below 4 px outside of a
1 px border.

## Shapes

Tight corner scale, inherited from Zapier: 4, 6, 8 and 14. What is action uses 8, the card uses 14, and field
and label use 4 to 6. It came out straighter than the Material scale that was here before, and that is on purpose: the
tight corner is what gives the air of a warm tool, and it is the stroke noticed from far away. Circle
appears only where the object is round, which is radio button, avatar and navigation bar item.

The pill is a declared exception, with a reason: the "full" shape exists for navigation bar item, and it is used
in the items of the bar. The bar itself is not a pill: it touches the bottom edge on the phone, takes the whole
width and has a straight corner, and from the medium size up it glues to the top, also straight. That was once a floating
pill and was removed.

A border that carries meaning uses the `outline` token, at 3.96 to 1 against white: that is the case of a form
field, a choice control and a clickable item. A grouping border, like the one of the card, stays light on
purpose. Separation comes from background tone and from border, never from shadow, and the page uses no shadow at all.

## Components

- `microcopy` is the support text under a control: it explains where the number comes from, in a small body.
- The main call is the shadcn `Button` in the large size, with 56 px of height, a corner of 8 px and dark
  ink over the amber, and not white: white over that amber sits at 2.6:1 and fails contrast. The 56 px
  come from the reference, which uses a large button taller than the touch minimum, and they stay above the 48 px the
  project rule demands.
- The simulator result is the white `Card` over the warm background, with a corner of 8 px, which is the corner of the
  featured card in the reference.
- **The result is a statement with the savings in the poster slot, and not four numbers of the same size.** The savings
  rule: it is the only value on the `number` step (48 px, in `savings`), with the label and the context sentence that says how
  much the bill comes to (bill minus savings, arithmetic of the simulation itself). The amber hairline that crossed the column above the
  label **left**: with it the block had two openings, the
  hairline and the label, and the value lost the poster start slot. Below, panels in
  a statement line (label on `label` on one side, value on `lead` of 20 px on the other) and, in a line of two, **cost
  after the federal credit and years of payback side by side**. Before, the four were on the same step
  and nothing said which one was the answer to the question the person asked.
- **The explanation of the value and the estimate warning are ONE block only** (`How this estimate is built`,
  `#how-we-calculate`), right below the simulator lining, and it is a **numbered row, not a paragraph**: each one of the
  six bills is a row with the number in an outline label over the page background (numbering is orientation, not
  highlight, as in the blog), the term in ink on the `label` step and the sentence in support in the body, in two columns on the
  desktop and one on the phone. Every value comes out of `simulate()` or of the city file, so none is a new number, and it is
  where the rule of the minimum of panels stays visible always, and not only when it comes in. The block enters the scroll
  like the other sections (`Reveal`) and the six rows arrive staggered 60 in 60 ms, the same resource of the
  cards of the three steps: this part had to be prettier and more
  dynamic. The block went through four arrangements: it started inside the result card (the three
  blocks stayed glued together), moved to two cards below it (it was still too much content), became one only with the list in
  two columns, and ended in numbered rows with a staggered entry.
- **The estimate warning is the second part of that block** (`Estimate, not a proposal`, `#estimate-warning`), in the
  body of 16 px, and not `microcopy`: it was 14 px at the foot of the result card, too small for what
  decides whether the person trusts the number. Two rows stayed, and what left was what the
  bills above already say: the rate and the sun hours are in bill 1 and in 3, and the federal credit is in 5. What
  it says, and the bills do not say, is what the warning exists to say: those are the reference numbers of the
  city and not the ones of the house of whoever reads, production varies with shade, tilt, panel model and weather, and the number
  that counts is the one the technician confirms after measuring the roof.
- **The highlight uses a round dollar, and the detailed bill keeps the cent.** `usdRedondo` in `src/lib/format.ts`
  is presentation only: the result card, its footer, the middle call, the price floor that the minimum
  imposes and the typical bill of the profiles show `$179` and `$14,726`, because a round number reads as a tool; the list
  of the six bills and the surplus warning show `$179.01` and `$14,726.25`, because that is where the person checks the
  arithmetic. `simulate()` keeps returning the cent in both cases, and does not change.
- **The household profile shortcut is not a form.** The four cards lost the radio dot and became
  buttons with `aria-pressed` (`data-profile` as the hook), marked by the border and by the ring of the action color, the
  same resource the Half, Most and All shortcuts already use one step above. The card with a radio
  read as a form, and the chosen state was weak. The accessible name and the state stay announced; the
  `radio-group.tsx` of shadcn stays in the `ui/` folder, with no consumer, like the `separator.tsx` that was already there.
  **And the four cards open the column, above the bill field**: whoever arrives does not know
  their own bill by heart, so the fastest path is the first one. The order of the column is: profiles, bill field
  (editable, with the step on each side) and the coverage right below. Choosing a card changes the BILL and nothing else: the
  chosen coverage stays where it is, and the bill of the profile comes in even with the coverage at 100%, because bill and coverage
  are independent decisions. Two measures keep that: the order on screen, in both widths, and the coverage preserved
  when the card changes. **On load one card already comes marked**: the initial state is the reference table ($220 with
  80%), and $220 is the typical bill of the "Three-bedroom house, no pool", the marking is derived from that state, so the same
  card lights up in a shared link with $220 / 80% and none lights up when the link brings another state.
- **The middle call asks for the visit, and not for an estimate.** The label is `Book the site visit`, and not
  `Get my roof estimate`, because the `Estimate my savings` at the top already asks for the bill: two buttons speaking of
  estimate at different points of the page dispute the same role. The arrow keeps being the down one, which is
  where the link leads (`#book`, in this same page).
- **The phone of the opening is text, and not an underlined link.** The underline next to a button of 56 px gave two
  weights to the same action block. The phone icon keeps being the hint that it is clickable, and the keyboard
  focus keeps a visible outline.
- The monthly saving is the only green number on the page, on `type-number`, and green appears only when it is
  money that the person stops paying.
- The navigation is the `SiteHeader` bar: glass, destinations with an icon over the label and the call to book
  closing the bar, with no item with a background of its own. There are five items, and the blog one is the only one that is not an anchor
  of this page: it leads to another page of the site (`src/components/SiteHeader.tsx:28-34`).
- A category label, to separate groups inside a block, is an `h3` in uppercase with 0.5 px of
  letter spacing, on the `label` step and in the support color. It is the label resource of the Zapier reference,
  used only where a real category exists (the social proof has two: what the neighbors say and who did the
  work). In uppercase, the label is never running text.
- **The eyebrow hairline takes the color of the label itself, and not the secondary color.** The
  stroke before `The calculator` and `Your estimate` comes out in the label color, and not in blue. The hairline is
  a hierarchy ornament of the label, so it follows the label: the support color when the label is the support
  color (`bg-support`), and ink at 60% when the label is ink, which is the case of the two eyebrows over a colored
  band (the one of the middle block and the one of the closing). Blue stays in `secondary` for what it really marks: the
  hairline of the number box, the initials circle of the crews and the outline of the neighborhood tag. In the blog the
  hairline of the photo band stays gold, because there the label is light over the dark photo and the label color would
  have no contrast. The measure lives in `tests/finish.spec.ts`.
- The value inside a form field uses the `lead` step, and not the `number`: the `number` is for a result
  number, which sits outside a box, and inside a field it goes past the height of the box and clips the value. It was
  a defect observed after the type scale change.

## Do's and Don'ts

- Do: one CTA per decision block, always with the same visual weight and the same touch height.
- Do: tight leading in a title, and loose leading in running text. They are different audiences.
- Do: green only when it is money that the person stops paying.
- Don't: use the amber in text over a light background, because the contrast falls below the minimum.
- Don't: heavy shadow, gradient with a loose color or decorative illustration. The gradient that exists is the veil of the
  two colored blocks, with both stops coming from tokens, and it is registered below.
- Don't: import the orange of Zapier, nor its cream. The reference is the skeleton, not the color.

- The opening is a **centered column** over the ink panel (`src/components/Hero.tsx`), and not two pieces
  side by side: the brand (on the phone), the eyebrow in a chip, the title, the promise, the action and the band of numbers,
  all centered, with `md:min-h-` and `md:justify-center` on the desktop. It **takes the whole width of the window**, and that is why
  it is rendered before the `main`, outside the 64 rem container: a full width block, with no border and no corner.
  It has no image: the one that sat in a band below the panel left, and the photo of the service of the page
  lives in the social proof, where it proves what the section says. The text sits over a solid color, which is verifiable, and the
  contrast test samples the pixels to the right of the title inside the panel.
- **The background of the opening is a photo, in the place of the effect.** The image, two installers on the roof,
  light sky above and dark roof below, retired the fine grid and the yellow veil: the photo already has the light that
  the veil imitated. The file is `public/fotos/installers-on-roof.avif`, 2048 by 1365, 100 kB, served from its own
  domain and not by the Next optimizer, like the other photos. It is the LCP of the page, and the measured weight stayed at
  **363 kB** on the desktop and **330 kB** on the phone. The image comes from a public bank (Unsplash) and the license of use is the
  same pending point as the others.
- **The veil of the photo is not an ornament, it is what guarantees the contrast.** It starts dark AT THE TOP, which is where the photo is light:
  on the phone the brand and the eyebrow fall exactly in the band of the sky. The alpha is measured: the text of the opening is light
  (`canvas`, luminance 0.90) and needs 4.5 to 1; over the roof (0.03) any alpha passes, and over the sky
  (0.72) it passes only from ~78% of ink. Measured with the photo live: title **5.36**, sentence **10.60** and eyebrow
  **10.38** on the desktop; on the phone, **10.12**, **11.67** and **10.17**. The smallest margin is the one of the title, and it is the one that
  reports first if the photo is swapped for a lighter one.
- From the medium size up the opening starts right below the fixed bar, and not behind it: `md:mt-[3.5rem]` on the
  box of the opening reserves the height of the bar (`src/app/[city]/page.tsx`), and the measure checks the slack. The corners
  are straight in both sizes, because the block has no corner nor border.
- **The background bands, at the width of the window.** More visual presence with no new language, and the answer was to
  alternate the background of the sections: opening (ink panel with photo) and then, in order, `#simulator` on the page background
  (`canvas`), `#steps` in `surface` (the whole white band), `#proof` back on the `canvas`, `#faq` in the action color at
  12% and `#book` in the full action color. The background is of the `<section>`, which now takes the width of the window, and the content
  lives in a 64 rem wrapper inside it (`mx-auto max-w-5xl px-lg`), which is the arrangement the opening already used:
  with the side breathing room on the wrapper, and not on the band, the items of the bar stay aligned with the content column. The
  bands touch one another: the `gap-xxl` of the `main` left and the breathing room became the `py-xxl` of each band, because
  a band with a gap of the background between them reads as a loose block. The closing lost the rounded corner along with it, by the rule the
  opening already followed: a block with a corner bleeding at both ends reads as a clipping defect. The band of the steps gained
  the photos inside the three cards and the one of the crews, the photo above the cards; the one of the closing gained the photo in the background, with the
  veil of the opening and the text in light. The measure in
  `tests/visual.spec.ts` guards the order, the color of each band, the touching between them and the contrast of every text against the
  background that is behind it (composed by the ancestors, because the band of 12% has alpha and the white cards sit above
  it; text over photo stays out of that count and is measured on the pixel, like the one of the opening and the one of the closing).
- **The band of numbers of the opening counts from the floor, and not from zero.** It counted from zero to the value, and printing the band
  frame by frame showed the defect: 24 distinct values for three numbers, with the rating of 4.8 appearing as `0.3` at the
  start. A number the server delivers right and that regresses on the screen reads as wrong data. The fix was to keep the
  count starting at 90% of the value (`floor`, in `src/components/Counter.tsx`): 1.656 to 1.840, 4.3 to 4.8, 11 to
  12, always rising and never going through zero. The `tests/motion.spec.ts` guards the three halves of that: no frame
  below the floor, the count never descending and the last frame equal to the value of the city file.
- **On the phone the bar is reserved at the END of two blocks, and not only at the end of the document.** The bar lives glued to the
  bottom edge, so it covers the bottom band of the window at any scroll position: measured before the
  fix, the band of numbers of the opening sat 33 px behind it in a window of 667 px of height, the line of
  provenance 3 px behind in a window of 852, and the bill field fell in the same band when the browser brought it into the
  visible area. The opening and the `#simulator`
  now reserve the height of the bar plus `env(safe-area-inset-bottom)` in the `padding-bottom`, with the height of the
  bar coming from the `--spacing-bar` variable (58 px, measured in the browser) instead of a number copied into two files.
  The reservation holds only below 600 px, which is where the bar lives at the bottom: from the medium size up it rises to the
  top and whoever reserves its space is the margin of the opening. After the change, with the page open or at the anchor
  destination `#simulator`, the action of the opening and the bill field stay above the bar in both measured windows
  (393 by 852 and 375 by 667).
- **On the phone the brand is light, and the band of numbers takes one line.** The icon of the brand went in the action color over
  a chip of the action color itself, and with the sun hitting it from above it vanished: on the phone it becomes light ink
  over a light chip at 10% (the brand reads 6.21 to 1 over the yellow band, measured). And the three numbers sit in a grid
  of three columns, and not in `flex-wrap`: with a gap of 24 px the labels added up to more than the 345 useful px of the panel and the
  third one fell to the line below.
- **The band of numbers says where it comes from.** The rule is social proof that can be checked, with no invented
  context, so what came in was provenance, and not a new number: a line below the band
  (`From Brightfield's own jobs with Arizona Public Service in the Phoenix, Mesa and Chandler area`) built from the two
  fields that already exist in the city file, and the label of the rating became `Average customer rating`, which names
  whose the rating is. Collection date, satisfaction percentage and family count do not enter, because none of that
  exists in the data. The breathing room between the pieces of the opening also dropped from 24 to 16 px **on the phone only** (`md:gap-xl`
  keeps the 32 px of the desktop): with six pieces, the gap of 24 px added up to 120 px of air in a panel that was already taller
  than the screen.
- **The block of the neighborhoods uses the same highlight of the middle call**, ink of the action color at 25% with a border of the same
  color, with the title one step above the label (`type-lead`) and the count of neighborhoods beside it. **The list is a grid
  with a gold pin, and not a row of chips**: each neighborhood is a grid item (two columns on the phone,
  three on the desktop) with the `NeighborhoodIcon`, the same pin of the title of the block, in `primary-dark`. The light gold measures 1.86
  to 1 over the light background and does not identify a 16 px drawing; the dark gold measures 3.92, which is the minimum of
  Material for an icon, and it is the solution the calculator icons already used. The middle block and this one are the only two
  with that highlight on the page, and both have decision work: one asks for the visit, the other proves local presence.
- **The icons are FILLED.** The full weight takes the place of the thin stroke, with the size and the position of
  each one intact: whoever decides that is still the `className` of 16, 20, 24 or 28 px in `src/components/icons.tsx`.
  Two exceptions, and both have the reason written in the file: the **phone inside a button or link** stays outlined
  (`OutlinePhoneIcon`), because a full glyph in a narrow button becomes a smudge; and the
  **brand of the header** stays outlined, because it is not an interface icon but the drawing of the identity, which does not
  get fatter. The quote rose one size step (28 px) along with the weight, for "more visual weight".
  And the gold gained a **dark circular background** (`rounded-full bg-ink`): gold over a light background
  measured 1.86 and did not allow identifying the drawing. The black #1A1A1A is the ink the page already has
  (#16181A, four points of difference in the red channel), so the declared value is worth it instead of a second near-black in
  the theme: the gold-over-ink pair measures 8.78. It holds in the three steps, in the location icon and in the quotes; in the icons
  of the **menu** there is no background at all: they are dark at rest and gold only under the cursor. And where the icon sits over
  a white card with no circle, the ones of the calculator, the light gold was swapped for the **dark gold**, which is what
  measures 3.92 there: the little contrast on the screen asks for a color correction, and not a background one.
- **The blog uses the language of the city page, and not a new one.** The index opened with more ornament: the
  **photo band** of the opening, a **gold** hairline on the eyebrow (gold because there the background is the
  dark photo, and not the light background of the sections) and the **first card taking the two columns**, hierarchy by the
  grid, with no invented color and no new font size. Each card gained the **reading time**, which is **calculated from the
  body of the text** at 200 words per minute: written by hand it goes stale in the first revision, and nobody remembers to
  recount. In the text, the sections became **numbered**, and the box at the end came in the peach ink with the gold
  hairline. The number arrived in a dark circle with a gold font, in the language of the three steps, and the number weighed too much:
  numbering is orientation, not highlight. It became **card background, number in ink and the boundary border** that the other
  cards already use, the weight of a label, and not of a seal. The numbering comes out of the position of the block, and not of a
  counter that adds up during the render; in development React renders twice, and the counter would become
  2, 4, 6.
- **The brand on the phone lives inside the opening.** The identity line keeps existing in the blog; on the city
  page it is not rendered (`brandInHero` in `src/components/SiteHeader.tsx`), and the brand comes in as the first
  piece of the column of the opening. From the medium size up, whoever carries the brand is the bar at the top: one brand per
  screen size, and the measure guards the two halves of that.
- **The secondary color is the blue `#1e5fbf`, and its role is measured.** See its entry in the list of colors above: it
  is an accent, never the background of a block, and its reach was trimmed in three steps: it left the menu, it left the opening and
  gave the accordion back to orange.
- **The gradient veils, and the measured ceiling of each one.** There are four, all in `src/app/globals.css` (ornament
  section), all with the stops coming from tokens (`ink`, `primary`) and no component writes a
  hexadecimal value: the **photo veil** of the opening (`photo-veil`, dark at the top, with the ceiling measured above), the veil of the action band
  of the closing (`action-veil`), which is the base of the band, and the photo veil of the closing (`closing-photo-veil`, with its own
  alpha measured below). **The sun watermark and the corner glow of the closing
  (`sun-glow`) left**: with the photo in the background of the band, the two ink ornaments were left
  competing with it in the same corner. The fine grid and the yellow veil of the
  opening left when the photo came in, and the `globals.css` keeps no unused utility. The fourth one is the **veil of the short band**
  (`band-photo-veil`), and it exists by measurement: the header of the blog uses the same photo in a low band, so the
  text catches the light part of the frame; with the veil of the opening the title measured 4.70 on the phone, and 4.70 is a margin that is too
  thin. With its own veil it measures 8.34, and the photo keeps showing. **The closing came into the same drawing**: the photo
  of the panels in the desert is the background of the band (`.closing-background`), the `photo-veil` covers it, and the text of the band went from ink
  to light, which is the pair the veil exists to guarantee. In the closing the veil is lighter (`.closing-photo-veil`, 0.70 / 0.52 /
  0.46 instead of 0.80 / 0.60 / 0.55) by measurement: with the veil of the opening the desert appeared washed out behind the text, and the photo
  has to show; with the lighter alpha the text stays between 4.9 and 7.8 in both sizes, and one step
  below that the label falls to 4.47 on the desktop. There the contrast and the presence of the photo are also measured over the
  pixels, in the probe `the closing text has contrast measured over the pixels of the photo`.
- **The ceiling of the yellow is measured, not chosen by eye.** The text of the panel is light (`canvas`, luminance 0.90):
  pure yellow on show (`primary`, #e8882a, luminance 0.38) leaves that text at 2.2 to 1 and fails the 4.5
  demanded. At 55% over the ink the pixel paints around #81532c and the same text measures 6.04 to 1, measured on the
  pixel behind the three numbers of the opening: **6.04 / 5.98 / 7.45**. The strong yellow lives at the foot of the panel, and raising
  that mix means running the pixel contrast test first (`tests/visual.spec.ts`) and the check of the band of
  numbers. The previous description, that there was no gradient at all on the page, held for the old drawing.
- **The page uses seven photos, and all of them are a static file, not the Next optimizer.** The complete map, file by file:
  `installers-on-roof.avif` in the background of the opening, `technician-on-roof.avif` in step 1,
  `rail-on-roof.avif` in step 2, `panels-in-field.avif` in step 3, `house-phoenix.avif` in the block of the neighborhoods,
  `crew-on-sidewalk.avif` above the crew cards and `panels-in-desert.avif` in the background of the closing. **The house came to
  sit also inside the featured testimonial and left**: a photo over the amber wash of the highlight
  (ink of the action color at 25%) disappears together with the roof, and the rule became "one house, one place". **With the photo out, the
  wash of the highlight left too**: it was a stain with no work, and whoever distinguishes the card now is the border in the action
  color with the quote mark inside. The photos of the three steps come in with `md:aspect-auto md:max-h-[11rem]` (the
  `aspect-[4/3]` stays on the phone, where the card is the whole column) and the one of the crew with `md:max-h-[16rem]`: with no ceiling, the three photos of the steps took the section to some 2.400 px on the phone and the one of the crew became too wide
  on the desktop. The five of content use
  `loading="lazy"`; the two of background (opening and
  closing) are `background-image` in `src/app/globals.css` and are what the band shows behind the veil. The reason why they do not
  go through the optimizer is written in the component: the files are already in AVIF and optimized, and the optimizer
  would demand a new image dependency in the project with no real gain in bytes. The photos come from an image bank and the license
  of use keeps pending confirmation. The measure of `tests/visual.spec.ts`
  guards the whole map: each file in its place, the two of background read from the CSS, and every image with a declared
  dimension, alt text in English and a 200 in the request.
- The entry of the sections on scroll animates opacity and offset, with an exponential exit curve and with no bounce,
  never width, height or top. Whoever asked for less motion in the system gets the section visible, with no animation.
- **The motion of the ornament, with the measure of each one.** The opening enters in six pieces (the brand on the phone, the
  eyebrow, the title, the promise, the action and the band of numbers) with a staggered wait of 60 ms (`enter`, in
  `src/components/Hero.tsx`); the cards of steps, of testimonials and of crew enter together with
  the section, 60 ms between one and the next (`stagger`); the number that changes in the simulator gives a pulse of opacity and scale, for
  the person to see which of the four answered what they moved (`pulsed`, in `src/components/Simulator.tsx`); and the anchors
  of the menu scroll smooth. **The trail of the three steps left**: it was the line below the title, with the
  stretch in the action color that grew from the left to the right (a scale and never a width), and it said
  "this is a sequence", which the three numbered cards already say. With it the rule of the `globals.css` left, because
  an unused utility does not stay in the file. Measured in the browser: the box
  of the section does not change size during the entry (976 by 357 px before, during and after), and with reduced motion
  the section already comes visible, with no animation, with
  `scroll-behavior: auto`. The transferred weight stayed at 381 kB on the desktop, against 380 kB before the ornament; more visual ornament took the weight
  to **503 kB** (the photo of the steps, 120 kB) and the set of photos to **725 kB** on the desktop and on the
  phone, with the four new photos (rail, house, crew and desert, 224 kB in total) and the two of background (opening
  and closing) always on the critical path.
- **The band of numbers of the opening counts from the floor, and not from zero.** The rule, the value of the floor and the three halves of the
  measure are in the Layout section above, together with the numbers measured frame by frame
  (`src/components/Counter.tsx`, `tests/motion.spec.ts`).

## Typeface

The family is **Archivo**, and not Inter. Reason: Inter, Roboto, Geist,
Plus Jakarta and Space Grotesk are spent fonts, precisely because every interface generator converges on them,
and a site that wants to convey technical solidity cannot carry the same lettering of everything that exists. Archivo is a sturdy
grotesque, with tabular figures, which is what a page full of kilowatt, dollar and deadline needs for the numbers to
line up in the column. The hierarchy comes out of size and weight, not of a different family in the title.

## Blog

The blog is the second surface of the site, and reuses the same bar, the same tokens and the same steps: the index
lives at `/blog/` and each guide at `/blog/<slug>/`, both generated in the build from `src/content/blog/`
(`src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`). There is no new color, corner or size: what the blog
adds is an arrangement of list and of text.

- **The card of the guide** is `BlogCard`, used in the index and in the closing of each text, so there are not two truths about
  the same piece (`src/components/BlogCard.tsx:25`): a list item with a corner of 8 px (`rounded-lg`), border
  `outline`, background `surface` and breathing room `px-lg py-md`.
- **The border is the only state of the card.** It switches to the action color on mouse hover and on keyboard focus
  (`hover:border-primary focus-within:border-primary`), and the card gains no shadow: shadow does not exist on the page.
- **The whole card is clickable, and what takes focus is the real link.** The link lives in the title and
  stretches over the card through the `before` pseudo-element with `inset-0` and a `z-index` above the
  content, otherwise a click on the card footer would land on the date text. The screen reader and the Tab
  key find a single link, with a visible outline (`src/components/BlogCard.tsx:28-33`).
- **The index grid** is one column on mobile and two from the medium size up (`md:grid-cols-2
  md:items-stretch`, `src/app/blog/page.tsx:94`), with the cards of the same row stretched to the same height.
- **The closing of a guide** brings three other guides in the same grid, in three columns from the medium
  size up (`md:grid-cols-3`, one per row on mobile), and the `See all guides` button, centered, because three
  cards do not cover the list (`src/app/blog/[slug]/page.tsx:300-316`).
- **The guide title** uses `type-display` with a 34 rem measure and the summary uses `type-body` in
  `support`, the same pair as the index header: the two blog pages do not diverge in hierarchy.
- **An external source leaves with `target="_blank"` and `rel="noopener noreferrer"`**
  (`src/app/blog/[slug]/page.tsx:253-258`): a link that opens outside the tab does not give the previous tab
  back without `noopener`, and `noreferrer` keeps the visit origin from travelling along to whoever was cited.
