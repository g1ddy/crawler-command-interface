import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const testsDirectory = path.join(repositoryRoot, "tests");
const packageJsonPath = path.join(repositoryRoot, "package.json");

test("test:unit script uses the canonical unit test glob pattern and all unit tests are in tests/unit/", async () => {
  const packageJsonContent = await readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonContent);

  const testUnitScript = packageJson.scripts?.["test:unit"] ?? "";
  assert.ok(
    testUnitScript.includes("tests/unit/**/*.test.mjs"),
    `Expected package.json script "test:unit" to target "tests/unit/**/*.test.mjs", got: "${testUnitScript}"`,
  );

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
});
