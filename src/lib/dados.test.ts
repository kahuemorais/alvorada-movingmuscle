// Sweep of every city file, and not only of what is published today.
//
// Why it exists separately from city.test.ts: that one proves the loader rule with one city; this
// one walks the whole folder. The folder can reach around 120 cities, and each new file is a file
// written by hand: without the sweep, city number 40 lands crooked and the error shows up on the visit, in the form of a
// broken number on the screen. With the sweep, the build fails saying which file and which field.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { citySchema } from "./schema";

const FOLDER = path.join(process.cwd(), "src", "data", "cities");

describe("sweep of the city files", () => {
  const files = readdirSync(FOLDER).filter((name) => name.endsWith(".json"));

  it("has at least one published city", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("each file passes the schema, with the file name in the failure", () => {
    const problems: string[] = [];
    for (const file of files) {
      const raw: unknown = JSON.parse(readFileSync(path.join(FOLDER, file), "utf8"));
      const result = citySchema.safeParse(raw);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path.join(".") || "root").join(", ");
        problems.push(`${file}: ${fields}`);
      }
    }
    expect(problems, `files with a problem:\n${problems.join("\n")}`).toEqual([]);
  });

  it("the file name is the slug declared inside it", () => {
    // A divergence between the two would produce a page address different from the slug used in the canonical
    // address and in the structured data.
    const divergent = files
      .map((file) => ({ file, slug: JSON.parse(readFileSync(path.join(FOLDER, file), "utf8")).slug }))
      .filter(({ file, slug }) => file !== `${slug}.json`)
      .map(({ file, slug }) => `${file} declares ${slug}`);
    expect(divergent).toEqual([]);
  });
});
