// The city schema is the single source of the `City` type, and the lock on the data that enters the calculation.
//
// Why it exists: a city file with a zero rate makes the calculation go to infinity, and the page shows
// "∞ $∞ $NaN NaN years" without anyone noticing. The older loading did
// `JSON.parse(...) as City`, which is a claim without proof: the compiler agrees with what the file
// says and nobody checks. With a schema, a crooked file fails the build, which is where the error is cheap.
//
// The numeric ranges are not arbitrary: each one exists to stop a plausible typing error,
// and they are commented one by one. `.strict()` rejects a field the schema does not know, so a field
// written wrong in the file (for example `utilityRate` instead of `utilityRatePerKwh`) fails instead of
// being ignored in silence.
import { z } from "zod";

export const profileSchema = z
  .object({
    label: z.string().min(1),
    // Household power bill in the United States: 40 dollars is the simulator minimum, 600 the ceiling.
    typicalBill: z.number().positive().min(40).max(600),
  })
  .strict();

export const crewSchema = z
  .object({
    name: z.string().min(1),
    installs: z.number().int().min(0),
    rating: z.number().min(0).max(5),
    since: z.number().int().min(1900).max(2100),
    blurb: z.string().min(1),
  })
  .strict();

export const testimonialSchema = z
  .object({
    quote: z.string().min(1),
    author: z.string().min(1),
    neighborhood: z.string().min(1),
    // ISO date, which is what the page formats and what the structured data expects.
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date outside the YYYY-MM-DD format"),
  })
  .strict();

export const questionSchema = z.object({ q: z.string().min(1), a: z.string().min(1) }).strict();

export const citySchema = z
  .object({
    // The slug becomes a file path and a page address, so the shape is closed here too.
    slug: z.string().regex(/^[a-z0-9-]+$/, "slug outside the lowercase letters, numbers and hyphen format"),
    city: z.string().min(1),
    state: z.string().length(2),
    stateFull: z.string().min(1),
    metroArea: z.string().min(1),
    utilityName: z.string().min(1),
    // Residential rate in the United States sits between 8 and 60 cents per kWh. Zero is the error that
    // breaks the calculation, and above 1 dollar is a typo.
    utilityRatePerKwh: z.number().positive().max(1),
    // Peak sun hours per day: the desert goes past 7, the north sits near 3. Above 12 does not exist.
    peakSunHoursPerDay: z.number().positive().max(12),
    // Residential panel: 250 to 800 W today.
    panelWatts: z.number().int().min(100).max(1000),
    // Loss from temperature, soiling and inverter: sits between 70 and 90 percent, never 1 nor 1,5.
    performanceRatio: z.number().positive().max(1),
    // Installed cost per watt before the incentive: 2 to 4 dollars is the market range.
    costPerWattInstalled: z.number().positive().max(20),
    // There is a minimum per installation: less than one panel is not a system.
    minPanels: z.number().int().min(1).max(100),
    // Federal credit rate: 30 percent today, and the value is a fraction, not a percentage.
    federalCreditRate: z.number().min(0).lt(1),
    stateIncentiveNote: z.string().min(1),
    installsCompleted: z.number().int().min(0),
    crewsAvailable: z.number().int().min(1),
    // Average rating: scale from zero to five.
    avgRating: z.number().min(0).max(5),
    avgPermitDays: z.number().int().min(0),
    phone: z.string().min(1),
    popularNeighborhoods: z.array(z.string().min(1)).min(1),
    householdProfiles: z.array(profileSchema).min(1),
    crews: z.array(crewSchema).min(1),
    testimonials: z.array(testimonialSchema).min(1),
    faq: z.array(questionSchema).min(1),
  })
  .strict();

export type City = z.infer<typeof citySchema>;
export type Crew = z.infer<typeof crewSchema>;
export type HouseholdProfile = z.infer<typeof profileSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type Faq = z.infer<typeof questionSchema>;

// ------------------------------------------------------------------------------------------------
// Blog: the same treatment as the city data, applied to text.
//
// A blog text has a header written by hand by whoever writes it, and a hand-written header errs at two
// points that cannot pass: a numeric claim without a declared source, which is the defect AGENTS.md
// forbids and an answer engine does not cite because it cannot check, and an update date earlier than
// the publication date, which makes the page lie about when it was revised. Both rules live here, and not in
// whoever reads it, so they hold on any path that loads text, including in the test.
export const sourceSchema = z
  .object({
    name: z.string().min(1),
    // Public address: a source without an address cannot be checked, so it does not count as a source.
    url: z.url(),
  })
  .strict();

export const blogQuestionSchema = z
  .object({
    question: z.string().min(1),
    answer: z.string().min(1),
  })
  .strict();

// The body enters the schema on purpose. The rule "a cited number requires a declared source" depends on what the
// text claims, and the body is the only part that claims: a schema of the header alone would have no way to look.
const DATE_FORM = /^\d{4}-\d{2}-\d{2}$/;

// Number cited in the body, in a deliberately broad sense: any digit counts, including inside a
// word. The sieve is conservative because the error of blocking too much is cheap (the source goes into the text) and the error of
// blocking too little is expensive (a number without an origin published as if it had one). It does not try to be a reading of
// language: here it only decides whether the text made any claim that needs an origin.
export function citesNumber(body: string): boolean {
  return /\d/.test(body);
}

export const postSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/, "slug outside the lowercase letters, numbers and hyphen format"),
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.string().regex(DATE_FORM, "date outside the YYYY-MM-DD format"),
    // Equal to the publication date when the text was not revised. The field exists anyway: a missing revision
    // date is what makes the page look never revised.
    updatedAt: z.string().regex(DATE_FORM, "date outside the YYYY-MM-DD format"),
    author: z.string().min(1),
    sources: z.array(sourceSchema),
    // Optional questions: when they exist, the answer must be literally in the body, and they are what
    // the page publishes as structured data.
    faq: z.array(blogQuestionSchema).optional(),
    body: z.string().min(1),
  })
  .strict()
  .superRefine((text, ctx) => {
    if (citesNumber(text.body) && text.sources.length === 0) {
      // The message names the field and not the value: whoever reads the build log needs to know what to fix,
      // not get the text excerpt back.
      ctx.addIssue({ code: "custom", path: ["sources"], message: "text cites a number and does not declare a source" });
    }
    // Text comparison works because both dates are in the YYYY-MM-DD format, which orders the same as
    // chronological order. An unreadable date never reaches here: the date shape was already checked above.
    if (text.updatedAt < text.publishedAt) {
      ctx.addIssue({ code: "custom", path: ["updatedAt"], message: "updatedAt is before publishedAt" });
    }
  });

export type BlogSource = z.infer<typeof sourceSchema>;
export type BlogFaq = z.infer<typeof blogQuestionSchema>;
// Text fields before they become blocks: `blog.ts` is what appends the blocks, because reading markdown is
// work for the content layer and not for the schema.
export type BlogPostFields = z.infer<typeof postSchema>;

// Readable error list, so the failure message names file and field without dumping the whole zod.
export function describeErrors(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
}
