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
  assert.equal(rawFloor3.floor.title, "Over City");
  assert.equal(rawFloor3.floor.book, 2);

  const rawValidation = validateRawCrawlerFloor(rawFloor3);
  assert.equal(rawValidation.valid, true, rawValidation.errors.join("; "));
});


test("Floor 3 display title has URL-backed corroborating evidence", () => {
  const rawFloor3 = loadRawFloorDocument("floor-3");
  assert.equal(rawFloor3.floor.title, "Over City");

  const timeline = compileRawFloorFiles(loadAllRawFloorDocuments());
  const titleEvidenceEvent = timeline.events.find((event) => event.id === "evt-f3-over-city-entered");
  assert.ok(titleEvidenceEvent, "Expected the authored Over City entry event");
  assert.ok(
    titleEvidenceEvent.evidence?.some(
      (evidence) => evidence.sourceId === "src-wiki-third-floor" && evidence.confidence === "corroborated",
    ),
    "Over City must remain tied to corroborating authored evidence",
  );

  const source = timeline.sources.find((candidate) => candidate.id === "src-wiki-third-floor");
  assert.ok(source?.url?.startsWith("https://"), "Corroborating evidence must have a source URL");
});

test("Floor 3 raw document adapts into a valid CrawlerFloorDocument compatibility object", () => {
  const rawFloor3 = loadRawFloorDocument("floor-3");
  const adaptedFloor3 = adaptRawFloorDocument(rawFloor3);

  assert.equal(adaptedFloor3.floor.ordinal, 3);
  assert.equal(adaptedFloor3.floor.title, "Over City");

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

test("Floor 3 skill grants and crawler progression project cleanly across replay boundaries", () => {
  const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());

  const raceClassNarrative = compiledTimeline.events.find((e) => e.id === "evt-f3-race-class-selected");
  const raceClassEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-carl-race-class-selected");
  const findTrapEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-skill-find-trap-granted");
  const backfireEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-skill-backfire-granted");
  const cestaPuntaNarrative = compiledTimeline.events.find((e) => e.id === "evt-f3-earth-hobby-potion-carl-consumed");
  const cestaPuntaEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-skill-cesta-punta-granted");
  const scutelliphilyNarrative = compiledTimeline.events.find((e) => e.id === "evt-f3-earth-hobby-potion-donut-consumed");
  const scutelliphilyEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-skill-scutelliphily-granted");
  const level27Event = compiledTimeline.events.find((e) => e.id === "evt-f3-carl-level-27");

  // Verify narrative events were preserved intact
  assert.ok(raceClassNarrative && raceClassNarrative.type === "NarrativeEvent");
  assert.ok(cestaPuntaNarrative && cestaPuntaNarrative.type === "NarrativeEvent");
  assert.ok(scutelliphilyNarrative && scutelliphilyNarrative.type === "NarrativeEvent");

  // Verify state-bearing events exist
  assert.ok(raceClassEvent && raceClassEvent.type === "RaceClassSelected");
  assert.ok(findTrapEvent && findTrapEvent.type === "SkillGranted");
  assert.ok(backfireEvent && backfireEvent.type === "SkillGranted");
  assert.ok(cestaPuntaEvent && cestaPuntaEvent.type === "SkillGranted");
  assert.ok(scutelliphilyEvent && scutelliphilyEvent.type === "SkillGranted");
  assert.ok(level27Event && level27Event.type === "LevelChanged");

  // 1. Before Chapter 1 selection
  const stateBeforeCh1 = projectState(compiledTimeline, raceClassEvent.sequence - 1);
  assert.equal(stateBeforeCh1.crawler?.race, undefined);
  assert.equal(stateBeforeCh1.crawler?.class, undefined);
  assert.equal(stateBeforeCh1.skills.some((s) => s.skillId === "skill-find-trap"), false);
  assert.equal(stateBeforeCh1.skills.some((s) => s.skillId === "skill-backfire"), false);

  // 2. At Carl's race/class selection sequence
  const stateAtRaceClass = projectState(compiledTimeline, raceClassEvent.sequence);
  assert.equal(stateAtRaceClass.crawler?.race, "Primal");
  assert.equal(stateAtRaceClass.crawler?.class, "Compensated Anarchist");

  // 3. At Find Trap skill grant sequence
  const stateAtFindTrap = projectState(compiledTimeline, findTrapEvent.sequence);
  const findTrapSkill = stateAtFindTrap.skills.find((s) => s.skillId === "skill-find-trap");
  assert.ok(findTrapSkill);
  assert.equal(findTrapSkill.name, "Find Trap");
  assert.equal(findTrapSkill.owner, "carl");
  assert.equal(findTrapSkill.modifier, "+5");
  assert.equal(findTrapSkill.rank, undefined, "Find Trap modifier must not be represented as an inferred rank");

  // 4. At Backfire skill grant sequence
  const stateAtBackfire = projectState(compiledTimeline, backfireEvent.sequence);
  const backfireSkill = stateAtBackfire.skills.find((s) => s.skillId === "skill-backfire");
  assert.ok(backfireSkill);
  assert.equal(backfireSkill.name, "Backfire");
  assert.equal(backfireSkill.owner, "carl");
  assert.equal(backfireSkill.rank, "5 levels");

  // 5. Before Chapter 5 hobby potion skill grants
  const stateBeforeCh5Potions = projectState(compiledTimeline, cestaPuntaEvent.sequence - 1);
  assert.equal(stateBeforeCh5Potions.skills.some((s) => s.skillId === "skill-cesta-punta"), false);
  assert.equal(stateBeforeCh5Potions.skills.some((s) => s.skillId === "skill-scutelliphily"), false);

  // 6. At Cesta Punta grant
  const stateAtCestaPunta = projectState(compiledTimeline, cestaPuntaEvent.sequence);
  const cestaPuntaSkill = stateAtCestaPunta.skills.find((s) => s.skillId === "skill-cesta-punta");
  assert.ok(cestaPuntaSkill);
  assert.equal(cestaPuntaSkill.name, "Cesta Punta");
  assert.equal(cestaPuntaSkill.owner, "carl");
  assert.equal(cestaPuntaSkill.rank, undefined, "Missing rank must remain undefined");
  assert.equal(cestaPuntaSkill.cooldown, undefined, "Missing cooldown must remain undefined");
  assert.equal(cestaPuntaSkill.category, undefined, "Missing category must remain undefined");

  // 7. At Scutelliphily grant
  const stateAtScutelliphily = projectState(compiledTimeline, scutelliphilyEvent.sequence);
  const scutelliphilySkill = stateAtScutelliphily.skills.find((s) => s.skillId === "skill-scutelliphily");
  assert.ok(scutelliphilySkill);
  assert.equal(scutelliphilySkill.name, "Scutelliphily");
  assert.equal(scutelliphilySkill.owner, "donut");

  // 8. Level progression at Chapter 26
  const stateBeforeLevel27 = projectState(compiledTimeline, level27Event.sequence - 1);
  assert.notEqual(stateBeforeLevel27.crawler?.level, 27);

  const stateAtLevel27 = projectState(compiledTimeline, level27Event.sequence);
  assert.equal(stateAtLevel27.crawler?.level, 27);
});

test("Floor 3 end-of-floor events follow strict sequence order for Bandit achievement and Celestial box handling", () => {
  const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());

  const banditEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-achievement-bandit");
  const upgradeEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-quest-boxes-upgraded-celestial");
  const carlAcquiredEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-celestial-box-carl-acquired");
  const quanChAcquiredEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-celestial-box-quan-ch-acquired");
  const quanChOpenedEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-celestial-box-quan-ch-opened");
  const vetoEvent = compiledTimeline.events.find((e) => e.id === "evt-f3-celestial-boxes-vetoed");

  assert.ok(banditEvent, "evt-f3-achievement-bandit exists");
  assert.ok(upgradeEvent, "evt-f3-quest-boxes-upgraded-celestial exists");
  assert.ok(carlAcquiredEvent, "evt-f3-celestial-box-carl-acquired exists");
  assert.ok(quanChAcquiredEvent, "evt-f3-celestial-box-quan-ch-acquired exists");
  assert.ok(quanChOpenedEvent, "evt-f3-celestial-box-quan-ch-opened exists");
  assert.ok(vetoEvent, "evt-f3-celestial-boxes-vetoed exists");

  assert.ok(
    banditEvent.sequence < upgradeEvent.sequence,
    "Bandit achievement precedes Celestial upgrade"
  );
  assert.ok(
    upgradeEvent.sequence < carlAcquiredEvent.sequence,
    "Celestial upgrade precedes Carl box acquisition"
  );
  assert.ok(
    carlAcquiredEvent.sequence < quanChAcquiredEvent.sequence,
    "Carl box acquisition precedes Quan Ch box acquisition"
  );
  assert.ok(
    quanChAcquiredEvent.sequence < quanChOpenedEvent.sequence,
    "Quan Ch box acquisition precedes Quan Ch box opening"
  );
  assert.ok(
    quanChOpenedEvent.sequence < vetoEvent.sequence,
    "Quan Ch opening precedes Borant veto"
  );

  assert.equal(banditEvent.achievement?.recipient, "party");
  assert.equal(
    banditEvent.achievement?.description,
    "Awarded to the crawlers who survived Fools Who Broke the Glass."
  );
  assert.deepEqual(
    banditEvent.achievement?.reward,
    [],
    "Bandit achievement does not expose the 83 Celestial box reward before the upgrade sequence"
  );

  assert.equal(upgradeEvent.type, "NarrativeEvent");
  assert.ok(
    upgradeEvent.summary.includes("83 crawlers"),
    "Upgrade event describes the upgrade of 83 boxes"
  );
  assert.equal(
    upgradeEvent.item,
    undefined,
    "Upgrade event does not contain an individual item payload or Quan Ch's item instance"
  );

  assert.equal(carlAcquiredEvent.type, "ItemAcquired");
  assert.equal(carlAcquiredEvent.item?.itemId, "item-celestial-quest-box");
  assert.equal(carlAcquiredEvent.item?.instanceId, "inst-f3-celestial-box-carl");

  assert.equal(quanChAcquiredEvent.type, "NarrativeEvent");
  assert.equal(quanChAcquiredEvent.kind, "other");
  assert.equal(quanChAcquiredEvent.item, undefined, "Quan Ch narrative acquisition event should not have item field");
  assert.ok(quanChAcquiredEvent.summary.includes("receives"), "Quan Ch narrative acquisition includes receives");

  assert.equal(quanChOpenedEvent.type, "NarrativeEvent");
  assert.equal(quanChOpenedEvent.kind, "other");
  assert.equal(quanChOpenedEvent.itemInstanceId, undefined, "Quan Ch narrative opened event should not have itemInstanceId field");
  assert.equal(quanChOpenedEvent.outcome, undefined, "Quan Ch narrative opened event should not have outcome field");
  assert.ok(quanChOpenedEvent.summary.includes("Cloak of the Benevolent Champion"), "Quan Ch narrative opened includes Cloak of the Benevolent Champion");

  const getCelestialBoxCount = (sequence) => {
    const state = projectState(compiledTimeline.events, sequence);
    const box = state.inventory.find(i => i.itemId === "item-celestial-quest-box");
    return box?.quantity || 0;
  };

  assert.equal(
    getCelestialBoxCount(upgradeEvent.sequence),
    0,
    "Carl has 0 Celestial Quest Boxes before acquisition"
  );
  assert.equal(
    getCelestialBoxCount(carlAcquiredEvent.sequence),
    1,
    "Carl has exactly 1 Celestial Quest Box after his acquisition event"
  );
  assert.equal(
    getCelestialBoxCount(quanChAcquiredEvent.sequence),
    1,
    "Carl has exactly 1 Celestial Quest Box after Quan Ch's narrative acquisition event"
  );
  assert.equal(
    getCelestialBoxCount(quanChOpenedEvent.sequence),
    1,
    "Carl has exactly 1 Celestial Quest Box after Quan Ch's narrative opened event"
  );
  assert.equal(
    getCelestialBoxCount(vetoEvent.sequence),
    1,
    "Carl has exactly 1 Celestial Quest Box after the veto event"
  );

  // Verify the validator still requires an item instance to be established before ItemConsumed
  const invalidTimeline = JSON.parse(JSON.stringify(compiledTimeline));
  const badConsumedEvent = {
    id: "evt-f3-bad-consumed",
    sequence: 999,
    type: "ItemConsumed",
    itemInstanceId: "inst-f3-unacquired-box",
    position: { floor: 3, book: 2, chapter: 26 },
    summary: "Attempting to consume an unacquired box",
    evidence: [{ sourceId: "src-book-2", confidence: "confirmed" }]
  };
  invalidTimeline.events.push(badConsumedEvent);
  const validation = validateCrawlerTimeline(invalidTimeline);
  assert.equal(validation.valid, false, "Timeline validation must fail when ItemConsumed references an unacquired instance");
  assert.ok(
    validation.errors.some((err) => err.includes("inst-f3-unacquired-box")),
    "Validation error must cite the missing itemInstanceId"
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
