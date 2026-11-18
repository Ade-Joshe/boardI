// Checks conventions ESLint can't: file naming and comment length.
// Rules live in docs/standards/code.md.
import { globSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_LINES = 2;
const MAX_WIDTH = 80;

// Every file we write comments in: code, configs, Dockerfiles, hooks, CI.
const COMMENTED = [
  "{src,tests,scripts}/**/*.{ts,tsx,mts,mjs,js,css}",
  "*.config.{ts,mjs,js}",
  "src/*.ts",
  ".devcontainer/{devcontainer.json,Dockerfile,*.sh}",
  "Dockerfile",
  ".husky/*",
  ".github/**/*.{yml,yaml}",
  "{pnpm-workspace.yaml,.env.example,.dockerignore,.gitignore}",
];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? [p, ...walk(p)] : [p];
  });
}

// Unwraps Next segments: (group), [id], [...slug], @slot, _private.
function isKebabSegment(name: string): boolean {
  const core = name
    .replace(/^\[\[?(\.\.\.)?|\]?\]$/g, "")
    .replace(/^\((.*)\)$/, "$1")
    .replace(/^[_@]/, "");
  return core.split(".").every((part) => KEBAB.test(part));
}

// Returns the comment text of a line, or null if it isn't a comment.
function commentText(line: string, hashStyle: boolean): string | null {
  const t = line.trim();
  if (hashStyle) {
    const directive = t.startsWith("#!") || t.startsWith("# syntax=");
    return t.startsWith("#") && !directive ? t : null;
  }
  return /^(\/\/|\/\*|\{\s*\/\*|\*)/.test(t) ? t : null;
}

describe("conventions", () => {
  it("file and folder names are kebab-case", () => {
    const bad = walk("src").filter(
      (p) => !isKebabSegment(p.split("/").at(-1) ?? "")
    );
    assert.deepEqual(bad, [], "rename to kebab-case");
  });

  it(`comments are at most ${MAX_LINES} lines of ${MAX_WIDTH} chars`, () => {
    const files = [...new Set(globSync(COMMENTED))].filter((f) =>
      statSync(f).isFile()
    );
    assert.ok(files.length > 20, "comment check found too few files");

    const bad: string[] = [];
    for (const file of files) {
      const hashStyle = !/\.(ts|tsx|mts|mjs|js|css|json)$/.test(file);
      let run = 0;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const text = commentText(line, hashStyle);
          run = text === null ? 0 : run + 1;
          if (run === MAX_LINES + 1)
            bad.push(`${file}:${i - 1} too many lines`);
          if (text && text.length > MAX_WIDTH)
            bad.push(`${file}:${i + 1} too wide`);
        });
    }
    assert.deepEqual(bad, [], "make these comments shorter");
  });
});
