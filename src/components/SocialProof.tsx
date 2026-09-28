/* eslint-disable @next/next/no-img-element */
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { City } from "@/lib/city";
import { note, num } from "@/lib/format";
import { NeighborhoodIcon, QuoteIcon, CrewIcon, StarIcon } from "@/components/icons";

// Fourth block: social proof of the city. The team photo could be a reserved space or a generated image,
// and the decision here was not to invent a face: the team circle is a
// DRAWING of a team (the helmet), and not the initials of the name.
//
// The initials played the role of an avatar, and the question was whether an icon would not be
// better. It was: whoever uses the circle is a TEAM ("Ray O. and team", "The Okafor brothers"), and not a
// person, so the initials read as the avatar of people who do not exist, and gave the wrong monogram
// ("TO" for "The Okafor brothers", which takes the "The"). The helmet says what the thing is, the name next to it
// says which team, and the drawing accompanies the other two circles of the section, which already are icons (the quote
// marks of the featured testimonial and the pin of the neighborhoods). The icon is decorative: what carries the meaning is
// the name next to it, and the screen reader does not announce the same thing twice.

export default function SocialProof({ city }: { city: City }) {
  return (
    // Band 3: `canvas`, the background of the page. The band belongs to the section and the content lives in the 64 rem column inside it.
    <section id="proof" aria-labelledby="proof-title" className="w-full bg-canvas py-xxl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-lg px-lg">
      {/* The title names the two groups without promising an order: the section shows the testimonials first, which is the
          order of the page, and the old title announced the opposite. */}
      <p className="flex items-center gap-sm type-label text-support">
        <span aria-hidden className="h-px w-xl bg-support" />
        Local proof
      </p>
      <h2 id="proof-title" className="type-title text-ink md:max-w-[54rem]">
        Neighbors and crews
      </h2>

      {/* Category label in uppercase with letter spacing: it is the resource of the Zapier reference
          to separate groups, and here there is a real category. The two trios of cards use different
          icons because they show different things, a quote on one side and a company on the other, and without a label
          nobody knew why. Each label is a real h3, so the hierarchy follows h1, h2, h3. */}
      <h3 className="type-label tracking-[0.5px] text-support uppercase">What the neighbors say</h3>

      {/* Grid of the testimonials: the featured one takes the TWO COLUMNS of the first row
          (`md:col-span-2`) and the other two stay side by side in the row below. Before the featured one took two
          ROWS in the left column (`md:row-span-2`), which left it tall and narrow next to two stacked
          cards. With no `row-span` and no `items-start`: each card lives in a single row, and the default `stretch` of the
          grid becomes the right one, because it matches the height of the two of the second row with each other without stretching the
          featured one, which is alone in its row. In the compact size nothing changes: one column, the three stacked. */}
      <div className="grid gap-md md:grid-cols-2">
        {city.testimonials.map((testimonial, index) => (
          <Card
            key={testimonial.author}
            className={
              // No `h-full` in the featured one: `height: 100%` resolves against the grid area, and in a row of two
              // columns that stretches it against the neighbor again. The other two keep `h-full`, which is what
              // matches their height inside their own row.
              index === 0 ? "stagger rise border-primary md:col-span-2" : "stagger rise h-full"
            }
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardContent
              className={
                index === 0 ? "flex flex-1 flex-col justify-center gap-sm py-6" : "flex flex-col gap-sm py-6"
              }
            >
              {/* The photo that came to stay inside this card (the house) has left: a photo
                  over the amber wash of the featured one (action color ink at 25%) vanishes with the roof, and with it out the
                  house lives in a single place, which is the block of the neighborhoods. Here the testimonial goes back to what it was: the quote
                  mark, the speech and the name of whoever spoke. */}
              <span className="flex size-12 items-center justify-center rounded-full bg-ink text-primary-light">
                <QuoteIcon />
              </span>
              {/* The featured one carries the quote one step above (`type-lead`): the card is the argument of the section, and
                  with the same body as the other two the difference between it and them was only the border. */}
              <blockquote className={index === 0 ? "type-lead text-ink" : "type-body text-ink"}>
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <p className="microcopy">
                {testimonial.author}, {testimonial.neighborhood} &middot;{" "}
                {new Date(testimonial.date).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="type-label tracking-[0.5px] text-support uppercase">Who did the work</h3>
      {/* The team photo stays above the three cards: it is the team that does the work the cards describe, and the
          file is the one of the crew lifting the module. */}
      <img
        src="/fotos/crew-on-sidewalk.avif"
        alt="The Brightfield crew lifting a solar module into place"
        width={1600}
        height={1074}
        loading="lazy"
        decoding="async"
        className="h-auto w-full rounded-lg border border-outline object-cover md:max-h-[16rem]"
      />
      <div className="grid gap-md md:grid-cols-3">
        {city.crews.map((crew, index) => (
          <Card key={crew.name} className="stagger rise h-full" style={{ animationDelay: `${index * 60}ms` }}>
            <CardHeader className="flex flex-row items-center gap-sm">
              {/* The circle of initials was the LAST blue of the page (`bg-secondary`) and became ink;
                  in place of the letters came the helmet (`IconeEquipe`, from
                  Phosphor, the same filled weight as the others) in place of the letters. The team has a name, not a face,
                  and the name is next to it, so the drawing is decorative and the screen reader repeats nothing.

                  The rest of the section is in the place he asked for: the score icon and the "since", the team score and the
                  installation number come from `microcopy`, which is `support`; the pin of the neighborhoods is `primary-dark`
                  (dark gold, measured at 3,92 over white); and the background of the cards is `surface`, with no wash. */}
              <Avatar>
                <AvatarFallback className="bg-ink text-primary-light">
                  <CrewIcon />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="type-label text-ink">{crew.name}</CardTitle>
                <p className="microcopy">
                  <span className="inline-flex items-center gap-xs">
                    <StarIcon />
                    {note(crew.rating)}
                  </span>{" "}
                  &middot; {num(crew.installs)} installs &middot; since {crew.since}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="type-body text-support">{crew.blurb}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* The city data carries the neighborhoods (`popularNeighborhoods`) and does not say, in any text, what they
          are nor what they are for. The previous label, "Crews cover", was an invention, in two words, with no
          subject and no purpose. The block came to answer the two questions: which they are (the neighborhoods where
          Brightfield installs the most) and what they serve here (to support the social proof, linking the teams above to the
          place of whoever reads). The chips gained a background of their own, which takes them out of the role of a ghost label. */}
      <div className="flex flex-col gap-md rounded-lg border border-primary bg-primary/25 p-lg">
        <div className="flex flex-wrap items-baseline justify-between gap-sm">
          {/* One step above the label and below the title of the section: the block needed its own hierarchy, and it is this
              step that gives it emphasis. */}
          <h3 className="flex items-center gap-sm type-lead text-ink">
            <span className="flex size-7 items-center justify-center rounded-full bg-ink text-primary-light">
              <NeighborhoodIcon />
            </span>
            Where the crews work
          </h3>
          {/* The count answers "how many", which was the third question with no answer: the data brings the list, and the
              number of the list did not appear anywhere. */}
          <p className="type-label text-ink">
            {city.popularNeighborhoods.length} neighborhoods in {city.city}
          </p>
        </div>
        <p className="type-body max-w-measure text-ink">
          These are the {city.city} neighborhoods where Brightfield installs most. The crews above work here, and
          the site visit is free.
        </p>
        {/* This photo comes in twice: the same house that opens the featured testimonial, here
            inside the block of the neighborhoods, so the list of places has a visual address. The file is the same, so it does not
            cost new bytes: the browser downloads it only once. */}
        <img
          src="/fotos/house-phoenix.avif"
          alt={`A single-story ${city.city} home with solar panels on the tiled roof`}
          width={1600}
          height={1074}
          loading="lazy"
          decoding="async"
          className="h-auto w-full rounded-md border border-outline object-cover md:max-h-[14rem]"
        />
        {/* Neighborhoods in a grid with the golden pin, in place of the tiny chips: the list is a relation of places, and
            each item carries the same pin as the title of the block. The pin comes in DARK gold (`primary-dark`),
            because the light gold measures 1,86 to 1 over white and does not identify a 16 px drawing; the dark one
            measures 3,92, which is the Material minimum for an icon, and it is the same solution as the icons of the calculator. */}
        <ul className="grid grid-cols-2 gap-x-lg gap-y-md md:grid-cols-3">
          {city.popularNeighborhoods.map((neighborhood) => (
            <li key={neighborhood} className="flex items-center gap-sm type-body text-ink">
              <span className="text-primary-dark">
                <NeighborhoodIcon />
              </span>
              {neighborhood}
            </li>
          ))}
        </ul>
      </div>
      </div>
    </section>
  );
}
