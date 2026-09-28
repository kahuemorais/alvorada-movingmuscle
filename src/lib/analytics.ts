// Simulation events. The question they answer: on Monday, whoever runs the campaigns
// needs to know which ads generated savings simulations, to decide what to pause and what to
// scale up. A pageview does not answer that, so the page sends an event with the campaign origin
// together with the simulated numbers.
//
// The origin is read from the URL on the first visit and stored in the session, because half of the traffic comes
// from a campaign and the person usually scrolls the page and touches the simulator later: without storing, the event
// would arrive without the tag the team needs.
import { track } from "@vercel/analytics";
import type { SimInput, SimResult } from "./solar";

const KEY = "brightfield-campaign";

// The parameters the ads carry. utm_* is the standard, gclid is from Google and fbclid from Meta.
const PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

export type Tags = Record<string, string>;
export type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void };

function store(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // session blocked by privacy: the event still works, just without the tag
    return null;
  }
}

// Reads the tags from the search; if nothing comes in, returns what was already stored in the session.
export function campaignTags(search: string, storage: Store | null = store()): Tags {
  const params = new URLSearchParams(search);
  const fromUrl: Tags = {};
  for (const name of PARAMETERS) {
    const value = params.get(name);
    if (value) fromUrl[name] = value;
  }

  if (Object.keys(fromUrl).length > 0) {
    try {
      storage?.setItem(KEY, JSON.stringify(fromUrl));
    } catch {
      // with no storage, the tag is valid only for this page
    }
    return fromUrl;
  }

  try {
    const stored = storage?.getItem(KEY);
    return stored ? (JSON.parse(stored) as Tags) : {};
  } catch {
    return {};
  }
}

export type EventoSimulacao = {
  name: "simulation_completed";
  data: {
    bill: number;
    coverage: number;
    panels: number;
    cost_after_credit: number;
    monthly_savings: number;
    payback_years: number;
    min_panels_applied: boolean;
    savings_capped: boolean;
    profile: string;
  } & Record<string, string | number | boolean>;
};

// What goes into the completed simulation event. Separated from the network call so it can be checked
// by test, and not only by a look at the dashboard.
export function simulationPayload(
  result: SimResult,
  input: SimInput,
  tags: Tags,
  profile: string | null,
): EventoSimulacao {
  return {
    name: "simulation_completed",
    data: {
      ...tags,
      bill: input.bill,
      coverage: input.coverage,
      panels: result.panels,
      cost_after_credit: result.investmentAfterCredit,
      monthly_savings: result.monthlySavings,
      payback_years: result.paybackYears,
      min_panels_applied: result.flags.minPanelsApplied,
      savings_capped: result.flags.savingsCapped,
      profile: profile ?? "none",
    },
  };
}

export function trackSimulationStarted(search: string, profile: string | null) {
  track("simulation_started", { ...campaignTags(search), profile: profile ?? "none" });
}

export function trackSimulationCompleted(
  result: SimResult,
  input: SimInput,
  search: string,
  profile: string | null,
) {
  const { name, data } = simulationPayload(result, input, campaignTags(search), profile);
  track(name, data);
}
