import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { graphToDot } from "../scripts/generate-dependency-diagram.mjs";

test("Maritime graph is converted to stable, path-grouped DOT", async () => {
  const graph = JSON.parse(await readFile(new URL("../.maritime/dependency-graph.json", import.meta.url), "utf8"));

  const first = graphToDot(graph);
  const second = graphToDot(graph);

  assert.equal(first, second);
  assert.match(first, /^\/\/ Generated from \.maritime\/dependency-graph\.json/);
  assert.match(first, /label="UI components"/);
  assert.match(first, /label="Domain runtime"/);
  assert.match(first, /label="External packages"/);
  assert.match(first, /"src\/CrawlerApp\.tsx" -> "app\/domain\/projection\.ts"/);
  assert.doesNotMatch(first, /"node_modules\/react\/index\.js" \[/);
});

test("invalid Maritime graph contracts fail clearly", () => {
  assert.throws(() => graphToDot({}), /modules array/);
});
