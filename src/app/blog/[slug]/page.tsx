import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/BlogCard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { ClockIcon, ArrowUpIcon } from "@/components/icons";
import {
  findOptionalPost,
  listBlogSlugs,
  listPosts,
  readingMinutes,
  type Block,
  type BlogPost,
} from "@/lib/blog";
import { listCitySlugs } from "@/lib/city";
import { blogPageUrl, blogPath, blogUrl, cityPath, siteUrl } from "@/lib/urls";

// One route per text: the parameter is the slug, and the list of paths comes from the content folder, just as the
// city page comes from the data folder. Publishing the next guide is dropping the file into
// src/content/blog and rebuilding, without touching code.
export function generateStaticParams() {
  return listBlogSlugs().map((slug) => ({ slug }));
}

// The page only exists for a slug that has a file: any other path falls into a real 404, instead
// of an empty page that the search engine indexes.
export const dynamicParams = false;

// Readable date. The time zone comes in explicit for the same reason as in the index: `new Date("2026-09-23")` is
// midnight in UTC, and formatted in the visitor's time zone it goes back a day in the west of the United States,
// which would make the printed date disagree with the `datePublished` the structured data declares.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

function readableDate(iso: string): string {
  return DATE_FORMAT.format(new Date(`${iso}T00:00:00Z`));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // Safe path, and not the direct loader: a malformed slug or a text with no file returns
  // null and the response is 404, instead of a render error.
  const text = findOptionalPost(slug);
  if (!text) notFound();
  // No trailing slash: this is the address the host serves, and canonical has to be the address served,
  // not one that redirects. The composer is the same as in the index, so the two do not diverge in shape.
  const url = blogUrl(text.slug);

  // The brand suffix closes the title at 51 characters for today's text, inside the 50 to 60 range
  // the copy standard asks for, and the description comes from the header, already measured between 150 and 160.
  return {
    title: `${text.title} | Brightfield Solar`,
    description: text.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Brightfield Solar",
      title: text.title,
      description: text.description,
      publishedTime: text.publishedAt,
      modifiedTime: text.updatedAt,
    },
  };
}

type Node = Record<string, unknown>;

// Image declared in the `BlogPosting`. There is still no share card per text, and inventing an
// image address that does not respond is worse than not declaring it: while the route of its own does not exist,
// the declared image is the one the site already serves, and the adjustment stays in a single place when the card arrives.
function siteImage(site: string): string {
  return `${site}/icon.svg`;
}

// Name of the index in the breadcrumb. It is the same label as the blog item in the menu, and not a second phrase about the
// same page: text written twice diverges at the first revision.
const INDEX_NAME = "Blog";

// Structured data of the text, in the same design as the index: a graph built here and served as text in the
// HTML, and not on the client. The `url` of the text is the same as the canonical, through the same composer, and the `isPartOf`
// points to the node `#collection` the index declares, instead of creating a new node for the same list.
function postSchema(text: BlogPost, site: string): { "@context": string; "@graph": Node[] } {
  const url = blogPageUrl(site, text.slug);
  const index = blogPageUrl(site);

  const graph: Node[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#post`,
      headline: text.title,
      description: text.description,
      url,
      image: [siteImage(site)],
      datePublished: text.publishedAt,
      dateModified: text.updatedAt,
      // Organization, and not person: the `author` of the text header is the brand that signs the
      // page. When a text is signed by someone, the header field changes together with this.
      author: { "@type": "Organization", name: text.author },
      inLanguage: "en-us",
      isPartOf: { "@type": "CollectionPage", "@id": `${index}#collection`, url: index },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: INDEX_NAME, item: index },
        { "@type": "ListItem", position: 2, name: text.title, item: url },
      ],
    },
  ];

  // FAQPage only comes in when the text header declares questions, and the answer is the one from the header,
  // literal, which is the one the body already states. A summary written here would be a new statement with no source.
  if (text.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: text.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// Body in blocks. They are the only three types the markdown reader of `blog.ts` produces: section
// title, paragraph and list. A new type in the reader comes in here together, and not before: the `switch` with no exit
// for an invented type is what guarantees that nothing appears empty on the page.
function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    // Explicit reading width, in a value and not in a container step: our space steps
    // use the same names as the Tailwind container scale, and `max-w-lg` resolves to 24 px.
    <div className="flex max-w-[52rem] flex-col gap-lg">
      {blocks.map((block, position) => {
        if (block.type === "title") {
          // The numbering comes from the POSITION, and not from a counter that adds up during rendering: in development
          // React renders twice, and the counter would become 2, 4, 6. The section text is what carries the
          // meaning; the number is orientation, so it is decorative for the screen reader.
          const number = blocks.slice(0, position + 1).filter((b) => b.type === "title").length;
          return (
            <h2 key={`title-${position}`} className="flex items-start gap-sm type-title text-ink">
              {/* The number left the dark circle with golden type: heavy for a numbering, and numbering is
                  orientation, not emphasis. It became light with a card background, the number in ink and the
                  outline border the other cards already use: the same visual weight of a label, and not of a badge. */}
              <span
                aria-hidden="true"
                className="mt-xs flex size-9 shrink-0 items-center justify-center rounded-full border border-outline bg-surface type-label text-ink"
              >
                {number}
              </span>
              {block.text}
            </h2>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={`lista-${position}`} className="flex list-disc flex-col gap-sm pl-lg">
              {block.items.map((item, index) => (
                <li key={`item-${index}`} className="type-body text-ink">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`paragrafo-${position}`} className="type-body text-ink">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const text = findOptionalPost(slug);
  // Three other guides, from the most recent. The list already comes ordered, so there is no reordering here.
  const others = listPosts()
    .filter((other) => other.slug !== slug)
    .slice(0, 3);

  if (!text) notFound();

  const site = siteUrl();
  // The revision date only comes in when it really exists. The field is required in the schema and repeats
  // the publication date when the text was not revised, so printing it always would say that every guide was
  // revised on the day it came out.
  const revised = text.updatedAt !== text.publishedAt;

  // Header base: the first published city, and not a slug written in the code, for the same reason
  // the site root uses that list. It is the same path the close of the text uses to reach the
  // simulator, composed only once: two compositions of the same address diverge at the first change of
  // entry city.
  const [first] = listCitySlugs();
  if (!first) throw new Error("no city published in src/data/cities");
  const base = cityPath(first);
  const calculator = `${base}#simulator`;

  return (
    <>
      {/* Zero point of this page, declared here and not in the `main`: the `main` has a margin because it is a
          section anchor target, and whoever enters it as a target makes the browser stop at the start of the block, below the
          top. This anchor is an element with no height, first child of the document, so the jump goes to
          position zero for real. The `#topo` of the bar does not serve for this: it leaves here with the base of the
          city in front and leads to the top of the city page. */}
      <span id="top" aria-hidden="true" />
      {/* Same header as the city page, with the base of its path: it is what gives a way back to the
          whole site, and without it whoever enters the guide from search would only go back through the browser button. */}
      <SiteHeader base={base} />
      {/* The bottom padding is the one of the city page: on mobile the bar sits against the edge and its
          space has to be reserved, otherwise the end of the text stays behind the glass. From the medium
          size up the bar rises to the top and what reserves the space is the padding of the block. */}
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-xl px-lg py-xxl pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] sm:pb-xxl">
        {/* The JSON-LD comes in as text in the served HTML, and not built on the client: whoever searches and whoever
            answers a question read the HTML, not what React would do afterwards. The escaped `<` prevents a
            title with that shape from closing the tag early. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(postSchema(text, site)).replace(/</g, "\\u003c") }}
        />

        <article className="flex flex-col gap-xl">
          <header className="flex flex-col gap-md">
            {/* Back to the index in the menu label, and not in a new phrase: whoever arrived from search needs the
                way back without the page inventing a second name for the same list. */}
            <nav aria-label="Breadcrumb" className="microcopy">
              <a
                href={blogPath()}
                className="inline-flex min-h-touch items-center gap-xs underline decoration-outline underline-offset-4 transition-colors hover:decoration-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {/* The visible label is Back, and not the name of the index: whoever arrived from search wants to go back, and the
                    destination already is the index. The constant still holds for the structured data, which has to
                    name the section and not the action. */}
                <ArrowUpIcon />
                Back
              </a>
            </nav>

            <h1 className="type-display max-w-[52rem] text-ink">{text.title}</h1>
            <p className="type-body max-w-[52rem] text-support">{text.description}</p>

            <p className="microcopy flex flex-wrap items-center gap-x-xs gap-y-0">
              <span className="inline-flex items-center gap-1">
                <ClockIcon />
                {readingMinutes(text)} min read
              </span>
              <span aria-hidden>·</span>
              <span>By {text.author}</span>
              <span aria-hidden>·</span>
              <span>
                Published <time dateTime={text.publishedAt}>{readableDate(text.publishedAt)}</time>
              </span>
              {revised && (
                <>
                  {" · Updated "}
                  <time dateTime={text.updatedAt}>{readableDate(text.updatedAt)}</time>
                </>
              )}
            </p>
          </header>

          <Blocks blocks={text.blocks} />

          {/* Sources only when they exist: the schema requires a source for text that cites a number, and the guide with no
              number has no source to list. Section title comes in as `h2` so the page has a single
              hierarchy, and not two second levels competing. */}
          {text.sources.length > 0 && (
            <section aria-labelledby="sources-title" className="flex max-w-[52rem] flex-col gap-md">
              <h2 id="sources-title" className="type-lead text-ink">
                Sources
              </h2>
              <ul className="flex flex-col gap-sm">
                {text.sources.map((source) => (
                  <li key={source.url} className="type-body text-support">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-outline underline-offset-4 transition-colors hover:decoration-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {source.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Close of the text: the guide explains how to read the bill, and the next step is the bill of your own
              roof. The address comes from `cityPath`, the same composer as the city canonical. */}
          <section className="flex flex-col gap-md rounded-lg border border-primary bg-primary/25 px-lg py-md">
            <p className="flex items-center gap-sm type-label text-ink">
              <span aria-hidden className="h-px w-xl bg-primary-light" />
              Next step
            </p>
            <h2 className="type-lead text-ink">Run the numbers for your own roof</h2>
            <p className="type-body max-w-[52rem] text-support">
              The city page computes the estimate from the data of that city: the utility tariff, the
              sunlight hours, the panel used and the installed cost per watt.
            </p>
            <a
              href={calculator}
              className="type-label text-ink underline decoration-outline underline-offset-4 transition-colors hover:decoration-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Open the calculator
            </a>
          </section>

          {/* Back to the top. It stays in the body and at the end of the text, and not in the bar: the mobile bar has
              five items with equal width and a measured label, and a sixth item squeezes that again; besides,
              going back to the top is an end-of-reading gesture, and not a navigation destination, which is what
              justifies it appearing only after the sources and the close. Pure anchor, with no JavaScript: the
              target is the `#topo` of this page, and not the city base the bar uses in its items. */}
          <a
            href="#top"
            className="type-label inline-flex min-h-touch items-center gap-xs self-start rounded-sm text-ink underline decoration-outline underline-offset-4 transition-colors hover:decoration-primary-light focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <ArrowUpIcon />
            Back to top
          </a>
        </article>
              {/* End of the text: three other guides and the path to the index. The three are the most recent that are not
            this one, and not a choice by subject, because the list already comes ordered from a single source and reordering here
            would be a second truth about the same list. The button exists because whoever arrived from search and wants to keep
            reading needs a path, and three cards do not cover the list. With no divider line above: what
            separates is the padding of the block. */}
        {others.length > 0 && (
          <section aria-labelledby="others-title" className="flex flex-col gap-lg pt-xl">
            <h2 id="others-title" className="type-lead text-ink">
              Keep reading
            </h2>
            <ul className="flex flex-col gap-md md:grid md:grid-cols-3 md:items-stretch">
              {others.map((other) => (
                <BlogCard key={other.slug} text={other} />
              ))}
            </ul>
            <div className="flex justify-center">
              <Button asChild variant="outline" size="lg">
                <a href={blogPath()}>See all guides</a>
              </Button>
            </div>
          </section>
        )}

</main>
    </>
  );
}
