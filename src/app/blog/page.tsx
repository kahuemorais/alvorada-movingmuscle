import type { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import SiteHeader from "@/components/SiteHeader";
import { listPosts, type BlogPost } from "@/lib/blog";
import { listCitySlugs } from "@/lib/city";
import { blogPageUrl, cityPath, siteUrl } from "@/lib/urls";

// Blog index: the list, and nothing more. Publishing the next guide is dropping the file into
// src/content/blog and rebuilding, without touching here, which is the same scale as the city page.
//
// The order is not a decision of this page. `listarTextos` already returns from the newest to the oldest, with the
// slug breaking the tie between two texts of the same day, and reordering here would be a second truth about the same
// list: that is how the canonical and the structured data came to disagree in the address module.

// Readable date. The time zone comes in explicit because `new Date("2026-09-23")` is midnight in UTC: formatted in the
// visitor's time zone, it goes back a day in the west of the United States, and the printed date comes to disagree with the
// `datePublished` the structured data declares.
// Title of 57 characters and description of 155, measured: the copy standard asks for 50 to 60 in the title and 150 to 160 in the
// description. They stay in a constant because the structured data declares both again, and text written twice
// diverges at the first revision.
const TITLE = "Solar guides on estimates and payback | Brightfield Solar";
const DESCRIPTION =
  "Plain answers about reading a solar estimate, how many panels a roof holds, and what a utility rate does to payback, written by the crews who install them.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: blogPageUrl(siteUrl()) },
};

// Collection structured data. The node is `CollectionPage`, which is what describes a page whose content is
// a list, and not `BlogPosting`, which describes a text and lives on the text page: the index does not claim
// to be a guide, it claims to list guides. Each guide comes into `hasPart` with title, address and the two dates,
// and the address comes from `blogNoSite`, the same composer as the canonical, so the two do not diverge in shape.
function collectionSchema(texts: BlogPost[], site: string) {
  const url = blogPageUrl(site);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: TITLE,
    description: DESCRIPTION,
    inLanguage: "en-us",
    hasPart: texts.map((text) => {
      const address = blogPageUrl(site, text.slug);
      return {
        "@type": "WebPage",
        "@id": `${address}#webpage`,
        url: address,
        name: text.title,
        description: text.description,
        datePublished: text.publishedAt,
        dateModified: text.updatedAt,
      };
    }),
  };
}

export default function BlogIndexPage() {
  const texts = listPosts();
  const site = siteUrl();

  // Header base: the first published city, and not a slug written in the code. It is the same reason as the
  // site root, which uses that list as source, and it is what makes the four anchors of the bar point to
  // the city page instead of to a section that does not exist here.
  const [first] = listCitySlugs();
  if (!first) throw new Error("no city published in src/data/cities");
  const base = cityPath(first);

  return (
    <>
      {/* The same header as the city page, with the base of its path: the bar is the same across
          the whole site, and it is what gives the way back to whoever entered the blog from search. */}
      <SiteHeader base={base} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-xl px-lg py-xxl pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] sm:pb-xxl">
        {/* The JSON-LD comes in as text in the served HTML, and not built on the client: whoever searches and whoever
            answers a question read the HTML, not what React would do afterwards. The escaped `<` prevents a
            title with that shape from closing the tag early. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema(texts, site)).replace(/</g, "\\u003c") }}
        />

        {/* The index header uses the SAME band as the opening of the city page: the photo of the installers with
            the ink veil, which is what gives the list the color and the image it did not have. The text here is light as it is there,
            and the contrast is measured in the same place, over the pixels of the photo with the veil, and not over a background color
            that does not exist. The eyebrow rule comes out in gold because it is over the dark photo, and not over the light
            background of the other sections. */}
        <header className="hero-background relative isolate flex flex-col gap-md overflow-hidden rounded-xl bg-ink p-lg md:p-xl">
          <div data-background="hero" aria-hidden="true" className="band-photo-veil pointer-events-none absolute inset-0 z-0" />
          <div className="relative z-10 flex flex-col gap-md">
            <p className="flex items-center gap-sm type-label text-canvas">
              <span aria-hidden className="h-px w-xl bg-primary-light" />
              Solar guides
            </p>
            <h1 className="type-display max-w-[34rem] text-canvas">Solar, in the order you ask about it</h1>
            <p className="type-body max-w-[34rem] text-canvas/85">
              One question per guide: what the estimate means, how many panels a roof holds, and what the
              utility rate does to the number at the end. Newest first.
            </p>
          </div>
        </header>

        <ul className="flex flex-col gap-md md:grid md:grid-cols-2 md:items-stretch">
          {texts.map((text, index) => {
            // The first of the list is the newest guide, and it is the only one that takes the two columns: whoever arrived from
            // search came for it, and the grid says that before the eye reads the title.
            return <BlogCard key={text.slug} text={text} featured={index === 0} />;
          })}
        </ul>
      </main>
    </>
  );
}
