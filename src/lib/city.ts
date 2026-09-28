import fs from "node:fs";
import path from "node:path";
import { describeErrors, citySchema, type City } from "./schema";

// The type and the subtypes come from the schema, which is the single source. Re-exported here so whoever already imports
// `City` from this module keeps working without changing any call.
export type { City, Crew, Faq, HouseholdProfile, Testimonial } from "./schema";

// One folder, one file per city. Swapping the file has to generate the page of the other city without
// touching code, which is the scale requirement (about 120 cities).
const DIR = path.join(process.cwd(), "src", "data", "cities");

export function listCitySlugs(): string[] {
  return fs
    .readdirSync(DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort();
}

// Slug shape, closed in the loader and not in whoever calls it. The value becomes a file name and a page
// address, so accepting dot, slash or underscore is accepting leaving the data folder: an external JSON with
// a `..` slug has already showed up, and before this the defect was only unreachable because the build fixes the
// city list and the page body checked that list. Both of those are defense from outside; this is the
// defense where the data enters.
const SLUG_FORM = /^[a-z0-9-]+$/;

// Core separated on purpose: it takes the directory, so the test can point at a temporary folder
// with a crooked file inside, without writing anything into src/data.
export function loadCityFrom(dir: string, slug: string): City {
  if (!SLUG_FORM.test(slug)) throw new Error(`invalid slug: ${slug}`);

  const file = `${slug}.json`;
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) throw new Error(`city without a data file: ${slug}`);

  const raw: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const result = citySchema.safeParse(raw);
  if (!result.success) {
    // The message names the file and the field, and never the value: it is to fix data, not to leak
    // content of a wrong file into the build log.
    throw new Error(`invalid data in ${file}: ${describeErrors(result.error)}`);
  }
  return result.data;
}

export function getCity(slug: string): City {
  return loadCityFrom(DIR, slug);
}

// Safe path for whoever only renders the page: a slug that does not exist or has an invalid shape returns null,
// and the caller decides the 404. It exists because `generateMetadata` called the loader directly, without the
// check the page body did.
export function findOptionalCity(slug: string): City | null {
  try {
    return getCity(slug);
  } catch {
    return null;
  }
}
