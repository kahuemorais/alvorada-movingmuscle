import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import Hero from "@/components/Hero";
import Simulator from "@/components/Simulator";
import SiteHeader from "@/components/SiteHeader";
import SocialProof from "@/components/SocialProof";
import Steps from "@/components/Steps";
import StructuredData from "@/components/StructuredData";
import { findOptionalCity, getCity, listCitySlugs } from "@/lib/city";
import { num, percentFull } from "@/lib/format";
import { cityUrl } from "@/lib/urls";

// One route for all cities: the parameter is the slug, and the list of paths comes from the data folder.
// Publishing city number 120 is dropping its file into src/data/cities and rebuilding, without
// touching code, which is the scale requirement (about 120 cities).
export function generateStaticParams() {
  return listCitySlugs().map((city) => ({ city }));
}

// The page only exists for a slug that has a file: any other path falls into a real 404, instead
// of an empty page that the search engine indexes.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  // Safe path, and not the direct loader: a malformed slug or a city without a file returns null
  // and the response is 404. Before, this point threw a render error, because it was the only place
  // that called the loader without the list check the page body does.
  const data = findOptionalCity(city);
  if (!data) notFound();
  // No trailing slash: this is the address the host serves, and canonical has to be the address
  // served, not one that redirects.
  const url = cityUrl(data.slug);

  // Title of 51 characters and description of 152, measured: the copy standard asks for 50 to 60 in the title and 150 to
  // 160 in the description, and both were outside (47 and 171). The installation count comes in with a
  // thousands separator, which is how the data appears on the page.
  return {
    title: `Solar panel cost in ${data.city}, ${data.state} | Brightfield Solar`,
    description: `How many panels a ${data.city} home needs, the price after the ${percentFull(data.federalCreditRate)} federal credit, and monthly savings. ${num(data.installsCompleted)} installs completed with ${data.utilityName}.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "Brightfield Solar",
      title: `Solar panel cost in ${data.city}, ${data.state}`,
      description: `${num(data.installsCompleted)} installs completed with ${data.utilityName}. How many panels, the price after the credit, and the monthly savings.`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  if (!listCitySlugs().includes(city)) notFound();
  const data = getCity(city);

  // Order of the blocks, and it is the argument of the page: promise, bill, how it
  // happens, who does it, doubt, and the final call.
  return (
    <>
      {/* Anchor for the Home item, and not the `main`. A target with scroll margin makes the browser stop before
          the top, which was the reported defect: `main` has a margin because it is a section anchor target. Here
          the anchor is an element with no height, at the start of the document, so the jump goes to the real top. */}
      <span id="top" aria-hidden="true" />
      <SiteHeader brandInHero />
      {/* The opening takes the full width of the window, so it lives OUTSIDE the 64 rem container of `main`: inside
          it the ink block would stop before the edges. What reserves the height of the fixed bar at the top becomes the
          margin of this box, and not the padding of `main`: the opening test measures that it starts right below the
          bar, with square top corners. */}
      <div className="md:mt-[3.5rem]">
        <Hero city={data} />
      </div>
      {/* The bottom padding reserves the space of the fixed bar on mobile. With the bands, what gives the vertical
          padding of the sections is the `py-xxl` of each one, and the last band (the close, in the action color) reserves the
          bar inside itself: the `pb` of `main` no longer exists, so the close color reaches the end of the
          document instead of leaving a strip of the page background below the band. */}
      <main>
        <StructuredData city={data} />
        <Simulator city={data} />
        <Reveal>
          <Steps city={data} />
        </Reveal>
        <Reveal>
          <SocialProof city={data} />
        </Reveal>
        <Reveal>
          <Faq city={data} />
        </Reveal>
        <FinalCta city={data} />
      </main>
    </>
  );
}
