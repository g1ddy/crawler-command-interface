import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const testsDirectory = path.join(repositoryRoot, "tests");
const unitTestsDirectory = path.join(testsDirectory, "unit");

async function findFilesRecursively(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findFilesRecursively(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

test("all unit test files reside under tests/unit and follow *.test.mjs pattern", async () => {
  const topLevelEntries = await readdir(testsDirectory, { withFileTypes: true });
  const misplacedTestFiles = [];

  for (const entry of topLevelEntries) {
    if (entry.isFile() && entry.name.endsWith(".test.mjs")) {
      misplacedTestFiles.push(entry.name);
    }
  }

  assert.deepEqual(
    misplacedTestFiles,
    [],
    `Found test files directly in tests/: ${misplacedTestFiles.join(", ")}. Unit tests must be placed in tests/unit/ so npm run test:unit discovers them automatically.`,
  );

  const unitFiles = await findFilesRecursively(unitTestsDirectory);
  const mjsTestFiles = unitFiles.filter((file) => file.endsWith(".test.mjs"));

  assert.ok(
    mjsTestFiles.length >= 15,
    `Expected at least 15 unit tests in tests/unit/, found ${mjsTestFiles.length}.`,
  );
});
