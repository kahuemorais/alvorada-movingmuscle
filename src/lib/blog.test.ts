import { describe, expect, it } from "vitest";
import { listPosts, readingMinutes } from "./blog";

// Reading time is CALCULATED from the body, and the test exists to prove that: a hand-written number would pass
// any range check (every text is between one and thirty minutes), and only the comparison between different
// texts reveals that it does not come from the body. That is why the variety assertion came in together with the
// range one: the first does not distinguish a constant from a computation, the second does.
describe("reading time", () => {
  const texts = listPosts();

  it("gives a whole number of minutes for every published text", () => {
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) {
      const minutes = readingMinutes(text);
      expect(Number.isInteger(minutes), `${text.slug} returned ${minutes}`).toBe(true);
      expect(minutes, `${text.slug} returned ${minutes}`).toBeGreaterThanOrEqual(1);
      expect(minutes, `${text.slug} returned ${minutes}`).toBeLessThanOrEqual(30);
    }
  });

  it("grows with the body, and is not the same number in every text", () => {
    const minutes = texts.map((text) => readingMinutes(text));
    // Variety is the proof that the computation looks at the body: a constant does not vary.
    expect(new Set(minutes).size).toBeGreaterThan(1);
  });
});
