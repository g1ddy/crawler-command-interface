import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { compileEvent } from "../../app/domain/compiler.ts";
import { compileRawFloorFiles } from "../../app/domain/raw-compiler.ts";
import { loadAllRawFloorDocuments } from "../../app/domain/raw-loader.ts";
import { projectState, projectObservations, projectCountdownState } from "../../app/domain/projection.ts";

// Frozen from the pre-#140 base commit (8e28a22) using the historical compiler output
// and historical projector. Generated timestamps are excluded from the timeline hash.
const PRE_140_TIMELINE_HASH = "46cacf241c16c1825b5d3e5f1fad7bc22fc6a051b63e8aa423f6fc7930514b01";
const REPLAY_PROJECTION_HASH = "a2a59b1dd6b7c5d28d10110255c23b0b859cca20160a3ccc0cd922ed5c312254";

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

test("every reachable replay state matches the current projection contract", () => {
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
    REPLAY_PROJECTION_HASH,
    "Replay state, observation, or primary countdown projection diverged from the current contract."
  );
});
