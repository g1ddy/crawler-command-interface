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

test("unmatched local modules remain visible instead of being silently dropped", () => {
  const dot = graphToDot({
    modules: [
      {
        source: "src/CrawlerApp.tsx",
        dependencies: [{ resolved: "tools/bridge.ts", module: "../tools/bridge" }],
      },
      { source: "tools/bridge.ts", dependencies: [] },
      { source: "node_modules/react/index.js", dependencies: [] },
    ],
  });

  assert.match(dot, /label="Other analyzed modules"/);
  assert.match(dot, /"tools\/bridge\.ts" \[label="tools\/bridge\.ts"\]/);
  assert.match(dot, /"src\/CrawlerApp\.tsx" -> "tools\/bridge\.ts"/);
  assert.doesNotMatch(dot, /node_modules\/react\/index\.js/);
});

test("invalid Maritime graph contracts fail clearly", () => {
  assert.throws(() => graphToDot({}), /modules array/);
});
