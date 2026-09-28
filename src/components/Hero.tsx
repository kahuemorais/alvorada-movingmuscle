import { Button } from "@/components/ui/button";
import { Counter } from "@/components/Counter";
import type { City } from "@/lib/city";
import { ArrowDownIcon, BrandIcon, OutlinePhoneIcon } from "@/components/icons";

// First block: proposal and a single action. The promise of the top has to be the same thing the
// page delivers right below, which is the bill, so the CTA leads straight to the simulator.
//
// Composition: a centered column over the ink panel. Before it was two pieces side by side
// (text on one side, photo in the other half), and later a column with the photo in a band below; the band left
// because it got in the way of the new design. The opening today is ONLY the panel: eyebrow in a chip,
// title, promise, action and the number band, centered. What the external reference brought was the ORGANIZATION
// (centered column, eyebrow in a chip, thin grid and glow in the background), and not its skin: gradient in the
// title, Tailwind type steps, loose hex and `-z-10` stayed out.
//
// The background went through three designs, and the current one is a photo in place of the effect. The image came in
// (two installers on the roof, light sky above and dark roof below), and it retired the
// thin grid and the yellow veil: the photo already has the light the veil imitated. What is left is the ink veil (`.photo-veil`),
// which is not an ornament: it is what guarantees the contrast of the light text, and its alpha is measured, not chosen by eye.
//
// The decorative background lives INSIDE the panel, and not as the first child of the section: the contrast test samples
// the first `> div` of the opening, and there the sample has to be ink, not the drawing.
//
// The rule of the house still holds: the text lives over a solid color, which is verifiable in the pixel, and nothing animates
// width, height or top. The service photo of the page lives in the social proof, where it proves what the section says.
//
// No border and no corner: the opening takes the full width of the window since it left the 64 rem container of
// `main`, and a box with a border and a rounded corner bleeding at both ends reads as a cutting defect.
//
// `overflow-hidden` stays: the background photo is cropped by the panel, and nothing decorative may leak outside the
// opening: that is how a halo became a loose gradient over the block.
export default function Hero({ city }: { city: City }) {
  return (
    <section aria-labelledby="hero-title" className="w-full overflow-hidden">
      {/* `bg-ink` stays: it paints behind the photo, so it is the fallback background if the image does not load. */}
      {/* The minimum height of the desktop rose from 34 to 42 rem: the old panel never reached 34,
          because the content went over it, and the opening ended up with the height of the content (~561 px on a 900 screen).
          42 rem give 672 px, and since the content has ~497, `justify-center` now has room to distribute above and
          below, which is what makes the opening look like an opening, and not a band. */}
      {/* The bottom reservation in the compact size is the height of the bar PLUS the padding the panel already had (`p-lg`), and not
          only the bar: with a reservation of the exact size of the glass, the band of the three numbers and the utility line
          stayed behind it (measured at 393x852: procedure 797 against the top of the bar 787). The `sm:pb-lg` and the
          `md:p-xl md:pb-xl` of the desktop follow as they were. */}
      <div className="hero-background relative isolate flex flex-col items-center gap-lg bg-ink p-lg pb-[calc(var(--spacing-bar)_+_var(--spacing-lg)_+_env(safe-area-inset-bottom))] text-center sm:pb-lg md:min-h-[42rem] md:justify-center md:p-xl md:pb-xl">
        {/* The only decorative layer now is the veil: the photo lives in the background of the panel, and the veil over it. */}
        <div
          data-background="hero"
          aria-hidden="true"
          className="photo-veil pointer-events-none absolute inset-0 z-0"
        />

        {/* The padding between the pieces is SMALLER on mobile, and that is design, not carelessness: with seven lines of title and
            five of promise, the 24 px gap between the six pieces added up to 120 px of air in a panel that is already taller than
            a screen (measured: 953 px of panel on a 900 px screen, taller than the screen). The
            32 px step stays on the desktop, which is where the room exists. */}
        <div className="relative z-10 flex w-full flex-col items-center gap-md md:gap-xl">
          {/* On mobile the brand lives HERE, inside the panel, and not in an identity line above: the opening carries the identity, and the top of the page no longer has a separate band. From the medium size
              up the one that carries the brand is the bar, and this block leaves the scene. */}
          <span className="enter flex items-center gap-sm md:hidden" style={{ animationDelay: "0ms" }}>
            {/* The brand is light here, and not in the action color: with the sun hitting from above, the yellow of the icon fell over
                the yellow band of the panel and vanished. Light ink over the band measures 7,7 to 1. */}
            <span className="flex size-10 items-center justify-center rounded-md bg-canvas/10 text-canvas">
              <BrandIcon />
            </span>
            <span className="type-lead text-canvas">Brightfield Solar</span>
          </span>

          {/* The label does not go in uppercase: the rule of the house treats uppercase as a defect in a long label, and
              "Residential solar in Phoenix, AZ" has thirty characters.
              It is the only text of the opening with a background of its own, and the action ink at 70 percent over the sun veil
              measured 4,09 to 1, below the required 4,5: now the pill has a dark background (ink at 35 percent) and the
              text goes in FULL light ink, so the contrast does not depend on where the yellow is at that point. */}
          <p
            className="enter type-label flex items-center gap-sm rounded-md border border-canvas/20 bg-ink/35 px-md py-sm tracking-wide text-canvas"
            style={{ animationDelay: "60ms" }}
          >
            Residential solar in {city.city}, {city.state}
          </p>

          {/* The title goes down one step on mobile, and has its own measure on the desktop. Both things came out of measurement, not
              of taste: at 3,5 rem in a 345 px column the title broke into SEVEN lines (372 px of block, measured), and at
              40 px it breaks into five (212 px). On the desktop, the reading measure of 40 rem gave THREE lines for a
              title of 70 characters; at 54 rem it closes in two, which is what the measure demands. The measure of 40 rem
              keeps being the one of the running text of the page. */}
          <h1
            id="hero-title"
            className="enter type-title text-canvas md:type-display md:max-w-[54rem]"
            style={{ animationDelay: "120ms" }}
          >
            Know what solar costs on your roof before anyone knocks on your door.
          </h1>

          {/* The lead went back to being ONE sentence: with two sentences it pushed the band of the three
              numbers and the utility line behind the fixed bar on mobile, which is the measured defect. What
              left was the origin of the rate, which the line `From Brightfield's own jobs with ...` right below
              already states with the name of the utility and the region. What stayed is the promise (panels, price after the
              credit, savings and return), the city and the "no form". */}
          <p className="enter type-body max-w-measure text-canvas/85" style={{ animationDelay: "180ms" }}>
            Panels, price after the federal credit, savings and payback for a {city.city}, {city.state} roof, with
            no form and no lead sold to three installers.
          </p>

          <div
            className="enter flex flex-wrap items-center justify-center gap-md"
            style={{ animationDelay: "240ms" }}
          >
            <Button asChild size="lg">
              <a href="#simulator">
                Estimate my savings
                <ArrowDownIcon />
              </a>
            </Button>
            <a className="inline-flex min-h-touch items-center type-body text-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas" href={`tel:${city.phone.replace(/[^0-9+]/g, "")}`}>
              <OutlinePhoneIcon />
              Or call {city.phone}
            </a>
          </div>

          {/* Number band at the base of the block, with thin dividers. The count painted a
              partial value over the number the HTML already delivers right: the score of 4,8 appeared as 0,3 at the
              start of the animation, measured frame by frame. The fix: the count continues, but
              starts at 90% of the value and rises to it, without going through zero (the floor is in `Counter.tsx`, with the
              reason next to it). */}
          {/* On mobile the three stay in ONE real line, and not in two: with `flex-wrap` and a 24 px gap the
              labels added up to more than the 345 useful px of the panel and the third fell down, which was the reported
              defect. The grid of three divides the line into equal parts and the label breaks inside its own column. */}
          {/* The origin lives glued to the band, and not loose in the 32 px gap: it explains the three numbers above, so
              it comes in as a piece of the same block (`gap-sm`), with the same staggered entry as the others. */}
          <div className="enter flex w-full flex-col gap-sm" style={{ animationDelay: "300ms" }}>
          <dl
            className="grid w-full grid-cols-3 gap-md border-t border-canvas/20 pt-lg md:flex md:flex-wrap md:items-start md:justify-center md:gap-lg"
          >
            <div className="flex flex-col gap-xs">
              <dt className="microcopy text-canvas/70">Installs completed</dt>
              <dd className="type-lead text-canvas tabular-nums">
                <Counter value={city.installsCompleted} />
              </dd>
            </div>
            <div className="flex flex-col gap-xs border-l border-canvas/20 pl-md md:pl-lg">
              {/* The label says "Average customer rating", and not only "rating": the score alone does not say whose it is, and
                  social proof that can be checked has to say whose the score is. The number does not change: 4,8 is the one from the file. */}
              <dt className="microcopy text-canvas/70">Average customer rating</dt>
              <dd className="type-lead text-canvas tabular-nums">
                <Counter value={city.avgRating} casas={1} />
              </dd>
            </div>
            <div className="flex flex-col gap-xs border-l border-canvas/20 pl-md md:pl-lg">
              <dt className="microcopy text-canvas/70">Crews in the area</dt>
              <dd className="type-lead text-canvas tabular-nums">
                <Counter value={city.crewsAvailable} />
              </dd>
            </div>
          </dl>

          {/* Origin of the three numbers above. The social proof has to be checkable, and the discarded alternative was
              to invent context: here no collection date comes in, no satisfaction percentage and no "families
              served", because none of that exists in the city file. What exists is the name of the utility and the
              metropolitan region, and they are the ones that say where the number comes from. */}
          <p className="type-label text-canvas/80">
            From Brightfield&apos;s own jobs with {city.utilityName} in the {city.metroArea} area.
          </p>
          </div>
        </div>
      </div>
    </section>
  );
}
