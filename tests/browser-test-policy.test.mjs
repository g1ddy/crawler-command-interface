import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const BROWSER_TEST_DIRS = ["tests/e2e", "tests/screenshots"];
const FORCE_TRUE_PATTERN = /\bforce\s*:\s*true\b/;

async function sourceFilesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await sourceFilesUnder(entryPath));
    } else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

test("browser tests do not bypass Playwright actionability with force: true", async () => {
  const files = (
    await Promise.all(BROWSER_TEST_DIRS.map((directory) => sourceFilesUnder(directory)))
  ).flat();

  const violations = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (FORCE_TRUE_PATTERN.test(source)) {
      violations.push(file);
    }
  }

  assert.deepEqual(
    violations,
    [],
    [
      "Do not use click({ force: true }) or other forced Playwright actions in browser tests.",
      "Wait for the intended application state/actionability instead.",
      `Violations: ${violations.join(", ")}`,
    ].join("\n"),
  );
});
