import { describe, expect, it } from "vitest";
import { campaignTags, simulationPayload } from "./analytics";
import { getCity } from "./city";
import { simulate } from "./solar";

const phoenix = getCity("phoenix-az");
const result = simulate(phoenix, { bill: 220, coverage: 80 });

function fakeStore(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    dump: () => data,
  };
}

describe("campaign tags", () => {
  it("reads the URL parameters", () => {
    const store = fakeStore();
    const tags = campaignTags("?utm_source=meta&utm_campaign=phoenix-julho&gclid=abc123", store);
    expect(tags).toEqual({ utm_source: "meta", utm_campaign: "phoenix-julho", gclid: "abc123" });
  });

  it("stores in the session and returns it afterwards, because the person touches the simulator after scrolling", () => {
    const store = fakeStore();
    campaignTags("?utm_source=meta&utm_campaign=phoenix-julho", store);
    const after = campaignTags("", store);
    expect(after).toEqual({ utm_source: "meta", utm_campaign: "phoenix-julho" });
  });

  it("without URL and without session it returns empty, and does not break", () => {
    expect(campaignTags("", fakeStore())).toEqual({});
    expect(campaignTags("", null)).toEqual({});
  });

  it("ignores an unknown parameter", () => {
    expect(campaignTags("?foo=bar&utm_source=google", fakeStore())).toEqual({ utm_source: "google" });
  });
});

describe("simulation completed event", () => {
  const payload = simulationPayload(result, { bill: 220, coverage: 80 }, { utm_source: "meta" }, "3");

  it("carries the campaign origin together with the numbers", () => {
    expect(payload.name).toBe("simulation_completed");
    expect(payload.data.utm_source).toBe("meta");
  });

  it("carries the numbers the crew needs to decide what to pause", () => {
    expect(payload.data.panels).toBe(17);
    expect(payload.data.monthly_savings).toBe(179.01);
    expect(payload.data.cost_after_credit).toBe(14726.25);
    expect(payload.data.payback_years).toBe(6.9);
    expect(payload.data.coverage).toBe(80);
  });

  it("says when a rule came into action, so nobody reads the number as a bill error", () => {
    const withMinimum = simulate(phoenix, { bill: 60, coverage: 50 });
    const p = simulationPayload(withMinimum, { bill: 60, coverage: 50 }, {}, null);
    expect(p.data.min_panels_applied).toBe(true);
    expect(p.data.profile).toBe("none");
  });
});
