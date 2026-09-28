import { describe, expect, it } from "vitest";
import { years, note, num, percent, percentFull, usd } from "./format";

describe("formatting", () => {
  it("formats United States currency", () => {
    expect(usd(14726.25)).toBe("$14,726.25");
  });
  it("formats the payback in years with one decimal", () => {
    expect(years(6.9)).toBe("6.9 years");
  });
  it("separates thousands", () => {
    expect(num(1840)).toBe("1,840");
  });
  it("formats coverage as percent", () => {
    expect(percent(80)).toBe("80%");
  });

  // A city with a zero rate makes the calculation go to infinity and the screen shows
  // "∞ $∞ $NaN NaN years". The city schema already blocks that data on the way in; this guard is the second
  // layer, so a broken number fails the build instead of showing up to the visitor.
  it("refuses a non-finite number, instead of printing NaN or infinity", () => {
    expect(() => usd(Number.NaN)).toThrow(/not finite/);
    expect(() => num(Number.POSITIVE_INFINITY)).toThrow(/not finite/);
    expect(() => years(Number.NaN)).toThrow(/not finite/);
    expect(() => percent(Number.NEGATIVE_INFINITY)).toThrow(/not finite/);
  });

  // The federal incentive rate comes from the city file, and the label needs it as a percentage. It was
  // written by hand in the component and in the metadata description: if the data changes, the label lies.
  // The crew rating comes from the data as 5 or as 4.9. Printed raw, the rating 5 shows as "5", and the person
  // reads two different scales on the same line (5 and 4.9). One decimal place always solves it.
  it("formats the crew note with one decimal place", () => {
    expect(note(5)).toBe("5.0");
    expect(note(4.9)).toBe("4.9");
    expect(note(4.95)).toBe("5.0");
  });

  it("refuses a non-finite note", () => {
    expect(() => note(Number.NaN)).toThrow(/not finite/);
  });

  it("formats the rate fraction as a whole percent", () => {
    expect(percentFull(0.3)).toBe("30%");
    expect(percentFull(0.25)).toBe("25%");
    expect(percentFull(0.075)).toBe("8%");
    expect(percentFull(1)).toBe("100%");
  });

  it("refuses a non-finite fraction, like the other formatters", () => {
    expect(() => percentFull(Number.NaN)).toThrow(/not finite/);
  });

  it("says who received the broken value, so the build points at the place", () => {
    expect(() => usd(Number.NaN)).toThrow(/usd/);
    expect(() => years(Number.NaN)).toThrow(/years/);
  });
});
