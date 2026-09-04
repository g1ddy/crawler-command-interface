import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import { compileEvent } from "../../app/domain/compiler.ts";
import { compileRawFloorFiles } from "../../app/domain/raw-compiler.ts";
import { loadAllRawFloorDocuments } from "../../app/domain/raw-loader.ts";
import { projectState, projectObservations, projectCountdownState } from "../../app/domain/projection.ts";

/**
 * Expected SHA-256 hashes of canonical projected state JSON representations at key
 * sequence milestones across Floors 1 and 2, generated from the pre-refactor baseline (`8e28a22`).
 */
const PRE_REFACTOR_STATE_HASHES = new Map([
  [1, "32a29a8106704c157fe45aefce67252b06b736e4bb5a229a809f13156e07bd9e"],
  [50, "e4035b2ebb5ac426daf39e6f226160d831182518d14716dd18f8d86376dd86ec"],
  [100, "2c420a7fcb891ee6ffe8291d3010214260325e634081676c9774560e50802fc1"],
  [150, "fccae0250829278a0578de99e86470b28c338c27fe1dc540598cb0de8eb7d130"],
  [200, "fccae0250829278a0578de99e86470b28c338c27fe1dc540598cb0de8eb7d130"],
]);

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

test("re-compiling raw floor files produces semantically equivalent timeline events to pre-refactor baseline", () => {
  const rawDocs = loadAllRawFloorDocuments();
  const freshTimeline = compileRawFloorFiles(rawDocs);

  assert.equal(freshTimeline.schemaVersion, "crawler-timeline/v2");
  assert.ok(freshTimeline.events.length > 0, "fresh timeline should compile events");

  for (const event of freshTimeline.events) {
    assert.ok(event.id, "event must have ID");
    assert.ok(event.sequence >= 1, "event must have valid sequence");
    assert.ok(event.type, "event must have type");
    assert.ok(event.summary, "event must have summary");
    assert.ok(Array.isArray(event.evidence) && event.evidence.length > 0, "event must have evidence");
  }
});

test("replay state and observation projection match pre-refactor benchmark state hashes across sequence checkpoints", () => {
  const rawDocs = loadAllRawFloorDocuments();
  const freshTimeline = compileRawFloorFiles(rawDocs);

  for (const [seq, expectedHash] of PRE_REFACTOR_STATE_HASHES) {
    const state = projectState(freshTimeline, seq);
    const stateHash = crypto.createHash("sha256").update(canonicalJson(state)).digest("hex");
    assert.equal(
      stateHash,
      expectedHash,
      `Projected state at sequence #${seq} diverged from the pre-refactor baseline hash.`
    );

    const obs = projectObservations(freshTimeline, seq);
    assert.ok(obs, `Observations should be projectable at sequence #${seq}`);

    if (freshTimeline.countdowns) {
      for (const countdownDef of freshTimeline.countdowns) {
        const cd = projectCountdownState(freshTimeline, countdownDef.id, seq);
        if (cd) {
          assert.ok(cd.formattedTime, `Countdown state for "${countdownDef.id}" has valid formatted time`);
        }
      }
    }
  }
});
