import assert from "node:assert/strict";
import test from "node:test";

import { loadAllRawFloorDocuments } from "../../app/domain/raw-loader.ts";
import { validateRawCrawlerFloor } from "../../app/domain/validation.ts";

test("raw NarrativeEvent authoring requires an explicit kind", () => {
  const [floor] = loadAllRawFloorDocuments();
  const invalid = structuredClone(floor);
  const narrative = invalid.events.find((event) => event.type === "NarrativeEvent");

  assert.ok(narrative, "Expected fixture to contain a NarrativeEvent");
  delete narrative.kind;

  const result = validateRawCrawlerFloor(invalid);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((error) => error.includes("kind")),
    `Expected schema error for missing NarrativeEvent.kind, got: ${result.errors.join("; ")}`
  );
});
