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

test("Floor 3 achievement boundaries isolate award items prior to their causal unlocked sequence", () => {
  const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());
  const oneQuadEvent = compiledTimeline.events.find(
    (e) => e.type === "AchievementUnlocked" && e.achievement?.id === "achievement-one-quadrillion-views"
  );
  assert.ok(oneQuadEvent);

  const stateBefore = projectState(compiledTimeline, oneQuadEvent.sequence - 1);
  assert.equal(
    stateBefore.achievements.some((a) => a.achievementId === "achievement-one-quadrillion-views"),
    false
  );
  assert.equal(
    stateBefore.inventory.some((i) => i.itemId === "item-fan-box"),
    false
  );

  const stateAt = projectState(compiledTimeline, oneQuadEvent.sequence);
  assert.equal(
    stateAt.achievements.some((a) => a.achievementId === "achievement-one-quadrillion-views"),
    true
  );

  const fanBoxEvent = compiledTimeline.events.find(
    (e) => e.type === "ItemAcquired" && e.item?.itemId === "item-fan-box"
  );
  assert.ok(fanBoxEvent);
  const stateAfterFanBox = projectState(compiledTimeline, fanBoxEvent.sequence);
  assert.equal(
    stateAfterFanBox.inventory.some((i) => i.itemId === "item-fan-box"),
    true
  );
});

test("Floor 3 end-of-floor events follow strict sequence order for Bandit achievement and Celestial box handling", () => {
  const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());

  const banditEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-achievement-bandit");
  const upgradeEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-quest-boxes-upgraded-celestial");
  const quanChEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-celestial-box-quan-ch-opened");
  const vetoEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-celestial-boxes-vetoed");

  assert.ok(banditEvent, "evt-f3-achievement-bandit exists");
  assert.ok(upgradeEvent, "evt-f3-quest-boxes-upgraded-celestial exists");
  assert.ok(quanChEvent, "evt-f3-celestial-box-quan-ch-opened exists");
  assert.ok(vetoEvent, "evt-f3-celestial-boxes-vetoed exists");

  assert.ok(
    banditEvent.sequence < upgradeEvent.sequence,
    "Bandit achievement precedes Celestial upgrade"
  );
  assert.ok(
    upgradeEvent.sequence < quanChEvent.sequence,
    "Celestial upgrade precedes Quan Ch opening"
  );
  assert.ok(
    quanChEvent.sequence < vetoEvent.sequence,
    "Quan Ch opening precedes Borant veto"
  );

  assert.equal(banditEvent.achievement?.recipient, "party");
  assert.equal(
    banditEvent.achievement?.description,
    "Awarded to the crawlers who survived Fools Who Broke the Glass."
  );
});

test("Floor 3 ItemCrafted event projects Carl's Doomsday Scenario at its causal boundary", () => {
  const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());
  const craftEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-doomsday-scenario-created");
  assert.ok(craftEvent);
  assert.equal(craftEvent.type, "ItemCrafted");

  const stateBefore = projectState(compiledTimeline, craftEvent.sequence - 1);
  assert.equal(
    stateBefore.inventory.some((i) => i.itemId === "item-carls-doomsday-scenario"),
    false
  );

  const stateAfter = projectState(compiledTimeline, craftEvent.sequence);
  assert.equal(
    stateAfter.inventory.some((i) => i.itemId === "item-carls-doomsday-scenario"),
    true
  );
});
