/* eslint-disable @next/next/no-img-element */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { City } from "@/lib/city";
import { num } from "@/lib/format";
import { KeyIcon, ConnectionIcon, DocumentIcon } from "@/components/icons";

// Third block: how the installation happens, in three steps. The first step carries the number from the
// data (average permit of the city) instead of generic text, because it is the real doubt of whoever waits.
//
// The page was standing still, and this block gained the eyebrow above the title: the line says "this is a
// sequence of three", which is what the block means, and the three cards come in staggered, 60 ms between one and the other.
// The track that grew from left to right below the title has left.
export default function Steps({ city }: { city: City }) {
  const steps = [
    {
      title: "Permit",
      icon: <DocumentIcon />,
      tempo: `${num(city.avgPermitDays)} days, on average`,
      text: `${city.city} reviews the plan and issues the permit. Brightfield files it for you, and the average wait here is ${num(city.avgPermitDays)} days.`,
      photo: "/fotos/technician-on-roof.avif",
      alt: "A technician working on installed panels on a roof",
      width: 1170,
      height: 780,
    },
    {
      title: "Installation",
      icon: <KeyIcon />,
      tempo: "One day",
      text:
        "The crew mounts the rails, sets the panels and photographs every roof penetration. Most homes are done in a single day.",
      photo: "/fotos/rail-on-roof.avif",
      alt: "Mounting rails being installed on a roof",
      width: 1600,
      height: 1074,
    },
    {
      title: "Interconnection",
      icon: <ConnectionIcon />,
      tempo: "A week or two",
      text: `${city.utilityName} swaps the meter and approves the connection. From that day on, your production is credited against your bill.`,
      photo: "/fotos/panels-in-field.avif",
      alt: "Rows of installed solar panels, seen from above",
      width: 1170,
      height: 780,
    },
  ];

  return (
    // Band 2: `surface`, the whole white band. The background belongs to the section, with its own vertical padding, and the content
    // lives in the 64 rem column inside it.
    <section id="steps" aria-labelledby="steps-title" className="w-full bg-surface py-xxl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-lg px-lg">
      {/* Eyebrow: rule in the color of the label itself, with a short label. It is the ornament that gives hierarchy to the section, and the
          label is a count ("Three steps"), not a new phrase. */}
      <p className="flex items-center gap-sm type-label text-support">
        <span aria-hidden className="h-px w-xl bg-support" />
        Three steps
      </p>
      <h2 id="steps-title" className="type-title text-ink md:max-w-[54rem]">
        From signed quote to switched-on meter
      </h2>
      {/* The track that crossed the section below the title (a neutral line with the stretch in the action color that grew
          when the section entered) has left. It existed to say "this is a sequence", which the
          three numbered cards already say; without it the title is what the section shows before the steps. */}
      {/* The service photo came INTO the cards: one per step, in the step it shows, the
          technician in step 1, the rail in 2, the panels in 3. Before it was a loose band above the three. The three
          are `img` and not the Next optimizer, for the same reason as the others: the
          file is already in AVIF and optimized. */}
      <ol className="grid gap-md md:grid-cols-3">
        {steps.map((passo, index) => (
          <li key={passo.title} className="stagger rise" style={{ animationDelay: `${index * 60}ms` }}>
            <Card className="h-full">
              <CardHeader>
                {/* The icon gained a light blue background and the step label came into the blue. The blue came into
                    "Step 2" and "Step 3" and the light background behind each icon; the three labels became equal because
                    "Step 1" in gray next to two blues reads as an oversight, and not as hierarchy. */}
                <p className="flex items-center gap-sm type-label text-ink">
                  {/* Dark circle behind the golden icon: gold over a light background did not
                      give contrast to identify the drawing. The black used (#1A1A1A) is the ink the page already
                      has (ink, #16181A, four points of difference in the red channel), so the token is worth it instead
                      of a second near-black in the theme. The icon keeps the size; what grew was the circle. */}
                  <span className="flex size-9 items-center justify-center rounded-full bg-ink text-primary-light">
                    {passo.icon}
                  </span>
                  Step {index + 1}
                </p>
                <CardTitle className="type-title text-ink">{passo.title}</CardTitle>
                <p className="type-label text-ink">{passo.tempo}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-md">
                {/* Height ceiling also in the compact size: without it, the `aspect-[4/3]` with `w-full` gave 233 px of
                    height per photo in a 390 px column, and the photo stretched the step card. The
                    `md:max-h-[11rem]` of the desktop stays as it was; here the ceiling is 10 rem, and
                    `object-cover` crops what goes over. */}
                <img
                  src={passo.photo}
                  alt={passo.alt}
                  width={passo.width}
                  height={passo.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full max-h-[10rem] rounded-md border border-outline object-cover md:aspect-auto md:max-h-[11rem]"
                />
                <p className="type-body text-support">{passo.text}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}
