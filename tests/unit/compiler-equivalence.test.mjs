import assert from "node:assert/strict";
import test from "node:test";

import { compileEvent } from "../../app/domain/compiler.ts";
import { compileRawFloorFiles } from "../../app/domain/raw-compiler.ts";
import { loadAllRawFloorDocuments } from "../../app/domain/raw-loader.ts";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectState, projectObservations, projectCountdownState } from "../../app/domain/projection.ts";

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

test("re-compiling raw floor files produces a timeline identical to the frozen compiled fixture", () => {
  const rawDocs = loadAllRawFloorDocuments();
  const freshTimeline = compileRawFloorFiles(rawDocs);

  assert.equal(freshTimeline.schemaVersion, compiledTimeline.schemaVersion);
  assert.equal(freshTimeline.timeline.id, compiledTimeline.timeline.id);
  assert.equal(freshTimeline.events.length, compiledTimeline.events.length);

  for (let i = 0; i < compiledTimeline.events.length; i++) {
    const expected = compiledTimeline.events[i];
    const actual = freshTimeline.events[i];
    assert.deepEqual(actual, expected, `Event #${i + 1} (${expected.id}) mismatch after recompilation`);
  }

  assert.deepEqual(freshTimeline.floors, compiledTimeline.floors);
  assert.deepEqual(freshTimeline.sources, compiledTimeline.sources);
  assert.deepEqual(freshTimeline.countdowns, compiledTimeline.countdowns);
});

test("replay state and observation projection are identical at every sequence between compiled fixture and re-compiled timeline", () => {
  const rawDocs = loadAllRawFloorDocuments();
  const freshTimeline = compileRawFloorFiles(rawDocs);

  const maxSeq = compiledTimeline.events[compiledTimeline.events.length - 1].sequence;

  for (let seq = 1; seq <= maxSeq; seq++) {
    const stateFromFixture = projectState(compiledTimeline, seq);
    const stateFromFresh = projectState(freshTimeline, seq);
    assert.deepEqual(
      stateFromFresh,
      stateFromFixture,
      `Projected state divergence at sequence #${seq}`
    );

    const obsFromFixture = projectObservations(compiledTimeline, seq);
    const obsFromFresh = projectObservations(freshTimeline, seq);
    assert.deepEqual(
      obsFromFresh,
      obsFromFixture,
      `Projected observations divergence at sequence #${seq}`
    );

    if (compiledTimeline.countdowns) {
      for (const countdownDef of compiledTimeline.countdowns) {
        const cdFromFixture = projectCountdownState(compiledTimeline, countdownDef.id, seq);
        const cdFromFresh = projectCountdownState(freshTimeline, countdownDef.id, seq);
        assert.deepEqual(
          cdFromFresh,
          cdFromFixture,
          `Projected countdown "${countdownDef.id}" divergence at sequence #${seq}`
        );
      }
    }
  }
});
