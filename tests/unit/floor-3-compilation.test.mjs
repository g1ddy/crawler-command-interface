import assert from "node:assert/strict";
import test from "node:test";

import { loadRawFloorDocument, loadAllRawFloorDocuments } from "../../app/domain/raw-loader.ts";
import { adaptRawFloorDocument } from "../../app/domain/raw-adapter.ts";
import { compileRawFloorFiles } from "../../app/domain/raw-compiler.ts";
import { validateRawCrawlerFloor, validateCrawlerFloor, validateCrawlerTimeline } from "../../app/domain/validation.ts";
import { projectState, projectObservations } from "../../app/domain/projection.ts";

test("Floor 3 raw document loads cleanly and passes raw floor validation", () => {
  const rawFloor3 = loadRawFloorDocument("floor-3");
  assert.equal(rawFloor3.floor.ordinal, 3);
  assert.equal(rawFloor3.floor.title, "Third Floor");
  assert.equal(rawFloor3.floor.book, 2);

  const rawValidation = validateRawCrawlerFloor(rawFloor3);
  assert.equal(rawValidation.valid, true, rawValidation.errors.join("; "));
});

test("Floor 3 raw document adapts into a valid CrawlerFloorDocument compatibility object", () => {
  const rawFloor3 = loadRawFloorDocument("floor-3");
  const adaptedFloor3 = adaptRawFloorDocument(rawFloor3);

  assert.equal(adaptedFloor3.floor.ordinal, 3);
  assert.equal(adaptedFloor3.floor.title, "Third Floor");

  const adaptedValidation = validateCrawlerFloor(adaptedFloor3);
  assert.equal(adaptedValidation.valid, true, adaptedValidation.errors.join("; "));
});

test("loadAllRawFloorDocuments includes Floor 3 sorted after Floor 1 and Floor 2", () => {
  const allFloors = loadAllRawFloorDocuments();
  assert.equal(allFloors.length, 3);
  assert.deepEqual(
    allFloors.map((doc) => doc.floor.ordinal),
    [1, 2, 3]
  );
});

test("compileRawFloorFiles compiles Floor 3 in global sequence order without compiler special cases", () => {
  const allRawFloors = loadAllRawFloorDocuments();
  const compiledTimeline = compileRawFloorFiles(allRawFloors);

  const timelineValidation = validateCrawlerTimeline(compiledTimeline);
  assert.equal(timelineValidation.valid, true, timelineValidation.errors.join("; "));

  assert.equal(compiledTimeline.floors.length, 3);

  const [floor1, floor2, floor3] = compiledTimeline.floors;
  assert.equal(floor1.ordinal, 1);
  assert.equal(floor2.ordinal, 2);
  assert.equal(floor3.ordinal, 3);

  assert.equal(floor2.startSequence, floor1.endSequence + 1);
  assert.equal(floor3.startSequence, floor2.endSequence + 1);
  assert.ok(floor3.endSequence >= floor3.startSequence);

  const floor3Events = compiledTimeline.events.filter(
    (event) => event.position.floor === 3
  );
  assert.ok(floor3Events.length > 0);
  assert.equal(floor3Events[0].sequence, floor3.startSequence);
  assert.equal(floor3Events.at(-1).sequence, floor3.endSequence);
});

test("replay projection steps cleanly into and through Floor 3 events", () => {
  const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());
  const floor3Segment = compiledTimeline.floors.find((f) => f.ordinal === 3);
  assert.ok(floor3Segment);

  for (let seq = floor3Segment.startSequence; seq <= floor3Segment.endSequence; seq++) {
    const state = projectState(compiledTimeline, seq);
    const observations = projectObservations(compiledTimeline, seq);

    assert.ok(state);
    assert.ok(typeof observations === "object" && observations !== null);
  }

  const finalState = projectState(compiledTimeline, floor3Segment.endSequence);
  assert.ok(finalState.inventory.some((item) => item.itemId === "item-carls-doomsday-scenario"));
  assert.ok(finalState.achievements.some((ach) => ach.achievementId === "achievement-ultimate-extreme-power"));
  assert.ok(finalState.achievements.some((ach) => ach.achievementId === "achievement-bandit"));
});
