import { BlogIcon, CalculatorIcon, HouseIcon, BrandIcon, StepsIcon, PhoneIcon } from "@/components/icons";
import { blogPath } from "@/lib/urls";

// Navigation in the pattern Vexor uses and that comes from kahue-site: two bars with the same list of
// destinations.
//
// The top one is the identity line, which scrolls together with the page. The bottom one is the link bar and stays
// fixed: on mobile it sits against the bottom edge, where the thumb reaches, and from the medium window class (600 px)
// up it sticks to the top.
//
// The fourth item carried the phone in its own address, to dial from any point of the page. Now
// it leads to the section where the visit is scheduled, which is where the phone is written. The channel
// stays one tap away, and the item stops being a shortcut that takes the person out of the page without going through the decision.
//
// The destinations are anchors of this page, not another page: no link competing with the action, which is what the
// landing page discipline forbids. The first one is the way back to the top for whoever scrolled to
// the end: without it, going back depends on a system gesture. Reviews and FAQ left the menu:
// they are not a destination of whoever arrives from an ad, and the page has six blocks, so the bar keeps what
// leads to the decision.
//
// The blog is the exception, and it is a declared exception instead of carelessness: the guide is a page of this
// site, not an escape route, and whoever reads the guide reaches the decision later. It comes BEFORE the
// conversion item, and not at the end, because the conversion item is the last of the bar, and that is what the
// navigation test guards. There are five items.
//
// The blog address comes from `blogPath`, the single composer of the address module: written by hand here,
// it would be one more copy of the same path, and it is that divergence the module exists to prevent.
const DESTINATIONS = [
  { href: "#top", label: "Home", icon: <HouseIcon /> },
  { href: "#simulator", label: "Estimate", icon: <CalculatorIcon /> },
  { href: "#steps", label: "Steps", icon: <StepsIcon /> },
  { href: blogPath(), label: "Blog", icon: <BlogIcon /> },
  { href: "#book", label: "Call", icon: <PhoneIcon /> },
];

// The base is the city path where the anchors live, and it exists because of the blog: the four anchors
// of the bar are sections of the city page, and on a blog page they would point nowhere. Without
// a base, what comes out is today's one, byte for byte, and that is what the city page uses; with a base, only the anchors
// gain the path in front (`/phoenix-az#simulator`) and the blog item stays absolute, because it already
// is another page. The alternative was a header of the blog itself, smaller, and it was refused: two bars
// with the same list of destinations diverge at the first revision, and the list is the decision about
// what enters the menu.
//
// The base arrives from outside, resolved by the caller from `listCitySlugs()[0]`, and not from a slug
// written here: a city in the code is what the data folder exists to avoid.
function withBase(href: string, base?: string): string {
  if (!base || !href.startsWith("#")) return href;
  return `${base}${href}`;
}

export default function SiteHeader({ base, brandInHero }: { base?: string; brandInHero?: boolean }) {

  return (
    <>
      {/* The padding that clears the fixed bar lives here, and not in the `body`: with the padding on the body, the anchor of
          the top of the page sits 64 px below the start of the document, and the jump of the Home item stopped at that
          height. In the content, the anchor reaches position zero. 96 px is the brand padding (32) plus the
          height of the fixed bar (56) rounded to the next step. */}
      {/* Identity line: on the blog it keeps being the home of the brand on mobile. On the city page it does not
          exist, because the brand comes to live INSIDE the opening (`marcaNoHero`), and then the top
          of the page no longer has a separate band above the ink block. */}
      {!brandInHero && (
      <nav
        aria-label="Brightfield Solar"
        className="mx-auto flex w-full max-w-5xl items-center gap-sm px-lg pt-xxl sm:pt-[6rem] md:pt-0"
      >
        <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary md:hidden">
          <BrandIcon />
        </span>
        {/* Only the brand. The city does not come in here: the first sentence of the page already says city
            and state, so repeating it at the top was an echo. */}
        <span className="type-lead text-ink md:hidden">Brightfield Solar</span>
      </nav>
      )}

      {/* Bar against the bottom edge, full width, square corner: no loose pill with a gap around it. The glass stays, white at 58% with a 20 px blur and 180%
          saturation, which is the value of the Vexor bar. From the medium size up it rises to the top and
          centers the items.
          The safe area padding came into the bar, and not as a floating gap: sitting against the
          edge, it is the one that needs to rise above the iPhone indicator.
          If someone limits the width of this bar again, use an explicit value like `max-w-[34rem]` and not
          `max-w-lg`: our space steps have the same names as the Tailwind v4 container scale,
          and `max-w-lg` resolves to 24 px, which is what already collapsed this bar once.
          The accessibility label stopped being `Sections of this page`: with the blog item, the bar
          carries a destination that is not a section of this page, and a label that describes what the bar is not
          gets in the way of whoever navigates with a screen reader. It becomes `Main navigation`, which is what it is: the
          main navigation, with the anchors of the page and one destination outside it. On the blog pages the
          proportion reverses, with four destinations outside and one inside, and the label still holds for the
          same reason: it describes the bar, which is the main navigation of the site, and not the page. */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-10 flex items-stretch gap-xs rounded-none bg-surface/58 p-xs pb-[calc(var(--spacing-xs)_+_env(safe-area-inset-bottom))] backdrop-blur-[20px] backdrop-saturate-[180%] sm:top-0 sm:bottom-auto sm:pb-xs print:hidden"
      >
        {/* The bar takes the full width, but its content lives in the same band as the items of the page, with the same
            width limit the header and the content use. Without that, brand and destinations go to the edges of the
            window and end up loose from the reading column. */}
        <div className="mx-auto flex w-full max-w-5xl items-stretch gap-xs px-lg sm:items-center sm:justify-between">
        {/* The brand comes into the bar from the medium size up, on the left, with the destinations on the right through
            `justify-between`. On mobile it leaves the bar on purpose: the mobile bar is short, with items of
            equal width, and the brand there squeezes the labels. On mobile it stays in the identity line above. */}
        <span className="hidden items-center gap-xs sm:flex">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <BrandIcon />
          </span>
          <span className="type-label text-ink">Brightfield Solar</span>
        </span>
        {DESTINATIONS.map((destination) => (
          <a
            key={destination.href}
            href={withBase(destination.href, base)}
            className="group flex min-h-touch flex-1 flex-col items-center justify-center gap-xs rounded-full px-xs py-xs type-label text-ink transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none sm:flex-none sm:px-md"
          >
            {/* Dark icon at rest and golden on hover: the color comes into the icon only, so the label next to
                it stays ink in any state. */}
            <span className="flex text-ink transition-colors group-hover:text-primary-light">{destination.icon}</span>
            <span data-label className="text-center leading-tight">
              {destination.label}
            </span>
          </a>
        ))}
        </div>
      </nav>
    </>
  );
}
