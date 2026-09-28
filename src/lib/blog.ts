import fs from "node:fs";
import path from "node:path";
import { describeErrors, postSchema, type BlogPostFields } from "./schema";

// The blog content layer, in the same design as `city.ts`: one folder, one file per text, validation
// at load time and the core separated from the fixed path so the test can point at a temporary folder.
//
// Why the text is data and not JSX: the project rule is that a value that changes from one item to another does not
// start life in the component. Publishing the next text is dropping a file into the folder, without touching code, which is
// the same scale the city page needs with a hundred and twenty cities.
//
// The header is JSON between the `---` fences, and not YAML. YAML asks for a new dependency, and the new dependency
// enters the security scan that fails the build. JSON is read by Node itself, has no ambiguity
// of indentation and its error is a syntax error, which the build reports in the right file. The body below the fence
// stays plain markdown.
//
// The body becomes a list of blocks, and not HTML built here: the component decides the appearance, with the
// type steps and the colors from `@theme`, and the block list is what allows that without `dangerouslySetInnerHTML`.
export type { BlogSource, BlogFaq } from "./schema";

const DIR = path.join(process.cwd(), "src", "content", "blog");
const EXTENSION = ".md";

// Slug shape closed in the loader, and not in whoever calls it, for the same reason as the city loader: the
// value becomes a file name and a page address, so accepting dot, slash or underscore is accepting leaving
// the content folder.
const SLUG_FORM = /^[a-z0-9-]+$/;

export type Block =
  | { type: "title"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

// The published text: the validated header plus the body already in blocks.
export type BlogPost = BlogPostFields & { blocks: Block[] };

// Reading time in minutes, CALCULATED from the text body. Written by hand, the number ages at the first
// revision of the text and nobody remembers to recount; calculated, it follows the body on its own. The calculation splits
// words by whitespace (title, paragraph and list item) and uses 200 words per minute, which is the
// average on-screen reading speed. The one-minute floor exists because "0 min read" means nothing.
const WORDS_PER_MINUTE = 200;

export function readingMinutes(text: BlogPost): number {
  const words = text.blocks
    .map((block) => (block.type === "list" ? block.items.join(" ") : block.text))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function listBlogSlugs(): string[] {
  return fs
    .readdirSync(DIR)
    .filter((file) => file.endsWith(EXTENSION))
    .map((file) => file.replace(/\.md$/, ""))
    .sort();
}

// Header and body, separated by the second fence. Not starting with the fence, or not having the second, is a defect
// of the file and the message says which: text without a validated header cannot enter the page.
function splitHeader(raw: string, file: string): { header: string; body: string } {
  const lines = raw.split("\n");
  if (lines[0]?.trim() !== "---") throw new Error(`text without a header in ${file}`);
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (end === -1) throw new Error(`header without a closing fence in ${file}`);
  return { header: lines.slice(1, end).join("\n"), body: lines.slice(end + 1).join("\n").trim() };
}

// Markdown reduced to what the blog uses: section title, paragraph and list. Does the list have to be the only
// thing on one line? No: a dash at the start of the line opens an item, and a common line after a list closes the
// list and becomes a paragraph. Less than this is enough, and more than this builds a markdown reader
// in full, which is where maintenance costs more than the dependency it avoids.
export function inBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];

  const closeParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };
  const closeList = () => {
    if (items.length) blocks.push({ type: "list", items });
    items = [];
  };

  for (const line of body.split("\n")) {
    const text = line.trim();
    if (text === "") {
      closeParagraph();
      closeList();
      continue;
    }
    if (text.startsWith("## ")) {
      closeParagraph();
      closeList();
      blocks.push({ type: "title", text: text.slice(3).trim() });
      continue;
    }
    if (text.startsWith("- ")) {
      closeParagraph();
      items.push(text.slice(2).trim());
      continue;
    }
    closeList();
    paragraph.push(text);
  }
  closeParagraph();
  closeList();
  return blocks;
}

// List item summary: the first sentence of the first paragraph, which is where the blog writing pattern
// demands the answer be. The `description` only enters when the body has no paragraph at all, so the list
// never shows an empty summary.
export function summaryOf(text: BlogPost): string {
  const first = text.blocks.find((block) => block.type === "paragraph");
  if (!first || first.type !== "paragraph") return text.description;
  const end = first.text.indexOf(". ");
  return end === -1 ? first.text : first.text.slice(0, end + 1);
}

// Reads a text already loaded in memory. It exists separate from disk because the test needs to exercise a crooked
// header, a missing source and an out-of-order date without writing a file into src/content.
export function parsePost(raw: string, file: string): BlogPost {
  const { header, body } = splitHeader(raw, file);

  let data: unknown;
  try {
    data = JSON.parse(header);
  } catch {
    // Without the value in the message, for the same reason as the schema: the build log points at the file, it does not dump
    // the content of a file read by mistake.
    throw new Error(`header outside the JSON format in ${file}`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`header must be a JSON object in ${file}`);
  }

  const result = postSchema.safeParse({ ...(data as Record<string, unknown>), body: body });
  if (!result.success) {
    throw new Error(`invalid text in ${file}: ${describeErrors(result.error)}`);
  }

  const text = result.data;
  // The file name is the page address, and the header slug is checked against it. This is what
  // stops two files from pointing at the same address: at least one of them disagrees with its own name.
  const fromFile = file.replace(/\.md$/, "");
  if (text.slug !== fromFile) {
    throw new Error(`header slug does not match the file name in ${file}`);
  }

  return { ...text, blocks: inBlocks(text.body) };
}

// Core separated on purpose, as in the city one: it takes the directory, so the test can point at a temporary
// folder with a crooked file inside without writing anything into src/content.
export function loadPostFrom(dir: string, slug: string): BlogPost {
  if (!SLUG_FORM.test(slug)) throw new Error(`invalid slug: ${slug}`);

  const file = `${slug}${EXTENSION}`;
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) throw new Error(`text without a file: ${slug}`);

  return parsePost(fs.readFileSync(filePath, "utf8"), file);
}

export function getPost(slug: string): BlogPost {
  return loadPostFrom(DIR, slug);
}

// Safe path for whoever only renders the page: a slug that does not exist or has an invalid shape returns null, and
// the caller decides the 404. Same design as `findOptionalCity`.
export function findOptionalPost(slug: string): BlogPost | null {
  try {
    return getPost(slug);
  } catch {
    return null;
  }
}

// List from newest to oldest, with the slug breaking ties: two texts published on the same day
// must always come out in the same order, otherwise the page changes content without anyone changing the file.
export function listPosts(): BlogPost[] {
  return listBlogSlugs()
    .map((slug) => getPost(slug))
    .sort((a, b) => (a.publishedAt === b.publishedAt ? a.slug.localeCompare(b.slug) : b.publishedAt.localeCompare(a.publishedAt)));
}
