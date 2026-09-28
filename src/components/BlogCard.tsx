import { ClockIcon } from "@/components/icons";
import { readingMinutes, type BlogPost } from "@/lib/blog";
import { blogPath } from "@/lib/urls";

// Readable date. The time zone comes in explicit because `new Date("2026-09-23")` is midnight in UTC: formatted in the visitor's
// time zone, it goes back a day in the west of the United States, and the printed date comes to disagree with the `datePublished`
// the structured data declares.
const FORMATO_DA_DATA = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

function dataLegivel(iso: string): string {
  return FORMATO_DA_DATA.format(new Date(`${iso}T00:00:00Z`));
}

// The text card of the blog, used in the index and at the end of each text. It exists so there are not two truths about the same
// piece: the card has to be clickable as a whole and change the border on hover, and that has to hold in both places.
//
// The link stays only in the title, and the whole card becomes a click area through the stretched link pattern: the `before` of the
// link itself covers the card, with z-index to stay above the content, otherwise the click on the footer of the card hits the date
// text. The keyboard focus stays on the real link, which is what the screen reader and the Tab key see.
export function BlogCard({ text, featured = false }: { text: BlogPost; featured?: boolean }) {
  // The revision date only comes in when it really exists. The field is required in the schema and repeats the
  // publication date when the text was not revised.
  const revisado = text.updatedAt !== text.publishedAt;
  // The reading time comes from the body of the text, and not from the header: it is the only datum of this line that does not
  // age on its own if someone edits the text.
  const minutes = readingMinutes(text);

  return (
    // The featured card takes the two columns at the medium size: hierarchy without inventing a color or a new
    // font size: the newest guide is what most came to read, and the grid says that before the text.
    <li
      className={`group relative rounded-lg border border-outline bg-surface px-lg py-md transition-colors hover:border-primary-light focus-within:border-primary${
        featured ? " md:col-span-2" : ""
      }`}
    >
      <article className="flex flex-col gap-sm">
        <h2 className="type-lead text-ink">
          <a
            href={blogPath(text.slug)}
            className="underline decoration-outline underline-offset-4 transition-colors before:absolute before:inset-0 before:z-10 before:content-[''] group-hover:decoration-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {text.title}
          </a>
        </h2>

        <p className="type-body max-w-[34rem] text-support">{text.description}</p>

        <p className="microcopy flex flex-wrap items-center gap-x-xs gap-y-0">
          <span className="inline-flex items-center gap-1">
            <ClockIcon />
            {minutes} min read
          </span>
          <span aria-hidden>·</span>
          <span>
            Published <time dateTime={text.publishedAt}>{dataLegivel(text.publishedAt)}</time>
          </span>
          {revisado && (
            <>
              {" · Updated "}
              <time dateTime={text.updatedAt}>{dataLegivel(text.updatedAt)}</time>
            </>
          )}
        </p>
      </article>
    </li>
  );
}
