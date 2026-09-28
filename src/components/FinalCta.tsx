import { Button } from "@/components/ui/button";
import type { City } from "@/lib/city";
import { OutlinePhoneIcon } from "@/components/icons";

// Sixth block: the final call. It repeats the action of the top because whoever got here has already simulated, and the
// next step now is a technical visit. The notice of the state incentive stays here, where it does not
// contaminate the simulator bill.
//
// The client said the page was standing still. The eyebrow above the title stays, and the gradient veil of the
// action color (`action-veil`) is the base of the band. The sun watermark that bled in the corner left,
// together with the corner glow (`sun-glow`): the band came to have the photo of the panels in the desert with the veil over it,
// and the two ink ornaments were competing with it in the same corner.
export default function FinalCta({ city }: { city: City }) {
  return (
    // Anchor of this section, because the Call item of the menu leads here: this is where the visit is scheduled, and the
    // phone of the utility is written right below the invite.
    // Band 5: the full action color, now at the window width and with no corner: the rounded corner left with the
    // band, because a rounded block bleeding at both ends reads as a cutting defect (the rule the
    // opening already follows). The bottom padding reserves the mobile fixed bar plus the safe area, since the
    // color reaches the end of the document.
    <section
      id="book"
      aria-labelledby="final-cta-title"
      className="action-veil relative w-full overflow-hidden bg-primary py-xxl pb-[calc(var(--spacing-xxl)_+_var(--spacing-lg)_+_env(safe-area-inset-bottom))] sm:pb-[calc(var(--spacing-xxl)_+_var(--spacing-lg))]"
    >
      {/* The photo in the background and the veil on top: the veil of the close is the same design as the opening, with the lighter alpha
          (`.closing-photo-veil`, measured), because the desert came out faded behind the veil of the opening, and the photo
          has to appear. The action color keeps being the base of the band: if the file does not load, the band stays in the action
          color with the gradient of `action-veil`, without ending up with no background. With a photo behind, the text of the band is the light one, which is the
          pair the veil guarantees: the three measured pieces stay between 4,9 and 7,8 in both sizes. */}
      <div aria-hidden className="closing-background pointer-events-none absolute inset-0" />
      <div aria-hidden className="closing-photo-veil pointer-events-none absolute inset-0" />

      {/* The watermark and the corner glow that were here have left. The photo, the veil, the text and the
          button stay as they were. */}

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-md px-lg">
        <p className="flex items-center gap-sm type-label text-canvas">
          <span aria-hidden className="h-px w-xl bg-canvas/60" />
          Next step
        </p>
        <h2 id="final-cta-title" className="type-title text-canvas md:max-w-[54rem]">
          Book the site visit for {city.city}
        </h2>
        <p className="type-body max-w-measure text-canvas/85">
          A technician measures the roof, checks the panel layout against your actual usage and confirms
          the number you just saw. The visit costs nothing and does not commit you to anything.
        </p>
        <div className="flex flex-wrap items-center gap-md">
          {/* Over the dark veil the button is again the light one of the action color, with the text in ink: it was the dark one
              while the background was the full action color, because a button of the action color over the action color disappears.
              With the photo and the veil, the action button is what identifies the action. */}
          <Button asChild size="lg">
            <a href={`tel:${city.phone.replace(/[^0-9+]/g, "")}`}>
              <OutlinePhoneIcon />
              Call {city.phone}
            </a>
          </Button>
        </div>
        <p className="microcopy text-canvas/80">{city.stateIncentiveNote}</p>
      </div>
    </section>
  );
}
