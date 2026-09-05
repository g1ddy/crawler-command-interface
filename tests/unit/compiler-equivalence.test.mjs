import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { compileEvent } from "../../app/domain/compiler.ts";
import { compileRawFloorFiles } from "../../app/domain/raw-compiler.ts";
import { loadAllRawFloorDocuments } from "../../app/domain/raw-loader.ts";
import { projectState, projectObservations, projectCountdownState } from "../../app/domain/projection.ts";

// Frozen from the pre-#140 base commit (8e28a22) using the historical compiler output
// and historical projector. Generated timestamps are excluded from the timeline hash.
const PRE_140_TIMELINE_HASH = "0b07c79f5918424f684340960baba0939f0702a42ce3234a3fa9448f45fc283b";
const PRE_140_REPLAY_HASH = "4ff93e2744e6598432e3ed9ae98933d75ea4c778251aeed382f9ddd5276fbfc0";

function canonicalKeyOrder(key, value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value)
      .sort()
      .reduce((sorted, k) => {
        sorted[k] = value[k];
        return sorted;
      }, {});
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(value, canonicalKeyOrder);
}

function sha256(value) {
  return crypto.createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function normalizeTimeline(timeline) {
  const normalized = structuredClone(timeline);
  delete normalized.timeline.createdAt;
  delete normalized.timeline.updatedAt;
  return normalized;
}

test("compileEvent generic identity compilation preserves non-specialized event payloads", () => {
  const mockDoc = {
    storyId: "test-story",
    floor: { ordinal: 1, title: "Floor 1", book: 1 },
  };
  const ctx = {
    seq: 42,
    pos: { floor: 1, book: 1, chapter: 2 },
    doc: mockDoc,
    itemsCatalog: new Map(),
    achCatalog: new Map(),
  };

  const rawEv = {
    id: "evt-f1-custom-1",
    order: 1,
    type: "PermanentEntitlementGranted",
    position: { floor: 1, book: 1, chapter: 2 },
    summary: "Granted entitlement",
    evidence: [{ sourceId: "src-official-text", confidence: "confirmed" }],
    entitlement: {
      id: "entitlement-1",
      name: "Special Royalty",
      description: "Test description",
    },
  };

  const compiled = compileEvent(rawEv, ctx);
  assert.equal(compiled.id, "evt-f1-custom-1");
  assert.equal(compiled.sequence, 42);
  assert.equal(compiled.type, "PermanentEntitlementGranted");
  assert.deepEqual(compiled.entitlement, rawEv.entitlement);
  assert.equal("order" in compiled, false);
});

test("re-compiling raw floor files matches the frozen pre-#140 semantic timeline", () => {
  const freshTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());

  assert.equal(
    sha256(normalizeTimeline(freshTimeline)),
    PRE_140_TIMELINE_HASH,
    "Compiled timeline semantics diverged from the pre-#140 baseline."
  );
});

test("every reachable replay state matches the frozen pre-#140 replay oracle", () => {
  const freshTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());
  const maxSequence = freshTimeline.events.at(-1).sequence;
  const replay = [];

  for (let sequence = 1; sequence <= maxSequence; sequence++) {
    replay.push({
      sequence,
      state: projectState(freshTimeline, sequence),
      observations: projectObservations(freshTimeline, sequence),
      countdown: projectCountdownState(freshTimeline, sequence, "all"),
    });
  }

  assert.equal(
    sha256(replay),
    PRE_140_REPLAY_HASH,
    "Replay state, observation, or primary countdown projection diverged from the pre-#140 baseline."
  );
});
