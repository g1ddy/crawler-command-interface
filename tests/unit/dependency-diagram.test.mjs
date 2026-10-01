import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("repository-local graph renderer script is removed", () => {
  const scriptPath = join(repositoryRoot, "scripts/generate-dependency-diagram.mjs");
  assert.equal(existsSync(scriptPath), false, "scripts/generate-dependency-diagram.mjs should not exist");
});

test("generated architecture SVG artifact exists and contains valid SVG content", async () => {
  const svgPath = join(repositoryRoot, "docs/images/dependency-graph.svg");
  assert.equal(existsSync(svgPath), true, "docs/images/dependency-graph.svg should exist");

  const content = await readFile(svgPath, "utf8");
  assert.match(content, /<svg[^>]*>/i, "diagram file should contain an SVG element");
  assert.match(content, /<\/svg>/i, "diagram file should contain an SVG closing tag");
});

test("publish-artifacts workflow configures Maritime analysis and graph rendering", async () => {
  const publishWorkflowPath = join(repositoryRoot, ".github/workflows/publish-artifacts.yml");
  const publishContent = await readFile(publishWorkflowPath, "utf8");

  assert.match(publishContent, /docs\/images\/dependency-graph\.svg/);
  assert.match(publishContent, /render-graph:\s*'true'/);
  assert.match(publishContent, /graph-output:\s*'docs\/images\/dependency-graph\.svg'/);
  assert.match(publishContent, /git diff --quiet -- docs\/images\/dependency-graph\.svg/);
});
