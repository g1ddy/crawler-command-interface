import assert from "node:assert/strict";
import test from "node:test";
import { floor6Events, floor6Snapshots, floor6Timeline } from "../app/domain/fixtures/floor6.ts";
import { projectState, createInitialState } from "../app/domain/projection.ts";
import { validateCrawlerTimeline, validateCrawlerFloor } from "../app/domain/validation.ts";
import { getStatBreakdown } from "../app/domain/stats.ts";
import { floor1AuthoredDoc, floor6AuthoredDoc, compiledTimeline } from "../app/domain/fixtures/compiled-timeline.ts";
import { compileFloorFiles } from "../app/domain/compiler.ts";

test("initial state has default crawler stats", () => {
  const state = createInitialState();
  assert.equal(state.crawler.name, "CARL G.");
  assert.equal(state.crawler.level, 42);
  assert.equal(state.inventory.length, 0);
});

test("projection at sequence 1 creates initial quest record", () => {
  const state = projectState(floor6Events, 1, []);
  assert.equal(state.sequence, 1);
  assert.equal(state.quests.length, 1);
  assert.equal(state.quests[0].title, "Tutorial: Reach the Stairs");
});

test("projection at sequence 4 equips Rogue's Hood", () => {
  const state = projectState(floor6Events, 4, floor6Snapshots);
  assert.equal(state.equippedSlots["HEAD"], "inst-hood-1");
  const hood = state.inventory.find((i) => i.instanceId === "inst-hood-1");
  assert.ok(hood);
  assert.equal(hood.isEquipped, true);
});

test("stat breakdown calculates total value with gear and effects", () => {
  const state = projectState(floor6Events, 30, floor6Snapshots);
  const dexBreakdown = getStatBreakdown(state, "Dexterity");
  assert.equal(dexBreakdown.baseValue, 34);
  assert.equal(dexBreakdown.gearContributions.length, 2);
  assert.equal(dexBreakdown.totalValue, 44);
});

test("snapshot acceleration produces identical results to full replay", () => {
  const fullReplayState = projectState(floor6Events, 35, []);
  const snapshotAcceleratedState = projectState(floor6Events, 35, floor6Snapshots);
  assert.equal(fullReplayState.sequence, snapshotAcceleratedState.sequence);
  assert.equal(fullReplayState.crawler.xp, snapshotAcceleratedState.crawler.xp);
  assert.equal(fullReplayState.inventory.length, snapshotAcceleratedState.inventory.length);
  assert.equal(fullReplayState.effects.length, snapshotAcceleratedState.effects.length);
});

test("item consumption reduces stack quantity", () => {
  const state = projectState(floor6Events, 28, floor6Snapshots);
  const vial = state.inventory.find((i) => i.instanceId === "inst-heal-vial");
  assert.ok(vial);
  assert.equal(vial.quantity, 6);
});

test("checked-in Floor 6 timeline validates successfully", () => {
  const validation = validateCrawlerTimeline(floor6Timeline);
  assert.equal(validation.valid, true, `Validation errors: ${validation.errors.join("; ")}`);
  assert.equal(validation.errors.length, 0);
});

test("valid timeline can be exported and re-imported with equivalent projected state", () => {
  const exportedJson = JSON.stringify(floor6Timeline);
  const importedDoc = JSON.parse(exportedJson);
  const validation = validateCrawlerTimeline(importedDoc);
  assert.equal(validation.valid, true);

  const origState = projectState(floor6Timeline, 51);
  const reimportedState = projectState(importedDoc, 51);
  assert.equal(reimportedState.sequence, origState.sequence);
  assert.equal(reimportedState.crawler.level, origState.crawler.level);
  assert.equal(reimportedState.inventory.length, origState.inventory.length);
});

test("invalid schema rejects non-compliant documents", () => {
  const invalidDoc = {
    schemaVersion: "invalid/version",
    timeline: { id: "bad", title: "" },
  };
  const validation = validateCrawlerTimeline(invalidDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.length > 0);
});

test("rejects document with duplicate or out-of-order event sequence numbers", () => {
  const badDoc = JSON.parse(JSON.stringify(floor6Timeline));
  badDoc.events[1].sequence = 1;
  const validation = validateCrawlerTimeline(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((e) => e.includes("not strictly increasing")));
});

test("rejects document with duplicate event or source IDs", () => {
  const badDoc = JSON.parse(JSON.stringify(floor6Timeline));
  badDoc.events[1].id = badDoc.events[0].id;
  const validation = validateCrawlerTimeline(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((e) => e.includes("Duplicate event ID")));
});

test("rejects document with evidence sourceId missing from sources catalog", () => {
  const badDoc = JSON.parse(JSON.stringify(floor6Timeline));
  badDoc.events[0].evidence = [{ sourceId: "non-existent-source" }];
  const validation = validateCrawlerTimeline(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((e) => e.includes("does not exist in sources catalog")));
});

test("rejects document with item references to unacquired items", () => {
  const badDoc = JSON.parse(JSON.stringify(floor6Timeline));
  badDoc.events.push({
    id: "evt-seq-999",
    sequence: 999,
    type: "ItemEquipped",
    position: { floor: 6 },
    summary: "Equipped ghost item",
    evidence: [{ sourceId: "src-wda-system-log" }],
    itemInstanceId: "non-existent-instance-id",
    slot: "TORSO",
  });
  const validation = validateCrawlerTimeline(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((e) => e.includes("was not acquired prior to or at this sequence")));
});

test("minimal non-Floor-6 document does not inherit Floor 6 state, inventory, quests, or snapshots", () => {
  const minimalDoc = {
    schemaVersion: "crawler-timeline/v1",
    timeline: {
      id: "tl-minimal",
      title: "Minimal Test Timeline",
      story: { id: "st-minimal", title: "Minimal Story" },
    },
    sources: [
      {
        id: "src-min",
        kind: "official-text",
        trust: "primary",
        title: "Minimal Source",
        url: "https://g1ddy.github.io/crawler-command-interface/schema/crawler-timeline.v1.schema.json",
      },
    ],
    initialState: {
      crawler: {
        name: "ALICE",
        level: 1,
        race: "HUMAN",
        class: "WARRIOR",
        xp: 0,
        maxXp: 100,
        attributes: { Strength: 10, Dexterity: 10, Constitution: 10, Intelligence: 10, Charisma: 10 },
        condition: { currentHealth: 100, maxHealth: 100, currentMana: 50, maxMana: 50, currentStamina: 50, maxStamina: 50 },
      },
      inventory: [],
      achievements: [],
      skills: [],
      quests: [],
      entitlements: [],
    },
    events: [
      {
        id: 'evt-min-1',
        sequence: 1,
        type: 'NarrativeEvent',
        kind: 'floor-entered',
        position: { floor: 1 },
        summary: 'Entered Floor 1',
        evidence: [{ sourceId: 'src-min' }],
      },
    ],
  };

  const validation = validateCrawlerTimeline(minimalDoc);
  assert.equal(validation.valid, true, `Validation failed: ${validation.errors.join('; ')}`);

  const projected = projectState(minimalDoc, 1);
  assert.equal(projected.crawler.name, 'ALICE');
  assert.equal(projected.crawler.level, 1);
  assert.equal(projected.inventory.length, 0);
  assert.equal(projected.quests.length, 0);
  assert.equal(projected.achievements.length, 0);
  assert.equal(projected.broadcast.viewers, 0);
});

// MULTI-FLOOR & AUTHORING TESTS

test("floor-1.json validates successfully against crawler-floor/v2 schema", () => {
  const validation = validateCrawlerFloor(floor1AuthoredDoc);
  assert.equal(validation.valid, true, `Floor 1 validation errors: ${validation.errors.join('; ')}`);
});

test("compiler produces a valid deterministic runtime timeline document from floor files", () => {
  const doc = compileFloorFiles([floor1AuthoredDoc, floor6AuthoredDoc]);
  const validation = validateCrawlerTimeline(doc);
  assert.equal(validation.valid, true, `Compiled timeline validation errors: ${validation.errors.join('; ')}`);
  assert.equal(doc.schemaVersion, "crawler-timeline/v2");
  assert.ok(Array.isArray(doc.floors));
  assert.equal(doc.floors.length, 2);
  assert.equal(doc.floors[0].ordinal, 1);
  assert.equal(doc.floors[1].ordinal, 6);
});

test("cross-floor item provenance is preserved when replaying later floor events", () => {
  // Sequence 5 acquires Crude Goblin Dagger on Floor 1
  // Sequence 14 is on Floor 6
  const stateAtSeq14 = projectState(compiledTimeline, 14);
  const dagger = stateAtSeq14.inventory.find((i) => i.itemId === "item-goblin-dagger");
  assert.ok(dagger, "Item acquired on Floor 1 should persist in inventory on Floor 6");
  assert.equal(dagger.source, "Floor 1: World Dungeon Entry");
});

test("achievement reward correlation chain links achievement, box, and acquired item", () => {
  // In Floor 1:
  // Event 3: FIRST BLOOD (ach-first-kill)
  // Event 4: UNBOXING THE APOCALYPSE (ach-reward-box-opened) correlated to ach-first-kill
  // Event 5: ItemAcquired Crude Goblin Dagger caused by ach-reward-box-opened and correlated to ach-first-kill
  const events = compiledTimeline.events;
  const itemAcquiredEvent = events.find((e) => e.id === "evt-f1-5");
  assert.ok(itemAcquiredEvent);
  assert.equal(itemAcquiredEvent.causationId, "ach-reward-box-opened");
  assert.equal(itemAcquiredEvent.correlationId, "ach-first-kill");
});

test("compiler rejects floor files with missing item or achievement catalog references", () => {
  const badFloorDoc = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  badFloorDoc.events.push({
    id: "evt-f1-bad-ref",
    order: 7,
    type: "ItemAcquired",
    position: { floor: 1 },
    summary: "Acquired uncatalogued item",
    item: { instanceId: "inst-bad", itemId: "non-existent-catalog-item-id", quantity: { known: true, value: 1 } },
    evidence: [{ sourceId: "src-wda-log-f1", confidence: "confirmed" }],
  });

  assert.throws(
    () => compileFloorFiles([badFloorDoc]),
    /not found in floor catalog|unmapped item/
  );
});

test("compiled timeline can be exported and re-imported with equivalent projected state", () => {
  const exported = JSON.stringify(compiledTimeline);
  const reimported = JSON.parse(exported);
  const validation = validateCrawlerTimeline(reimported);
  assert.equal(validation.valid, true);

  const endSeq = compiledTimeline.events[compiledTimeline.events.length - 1].sequence;
  const origState = projectState(compiledTimeline, endSeq);
  const reimportedState = projectState(reimported, endSeq);

  assert.equal(reimportedState.sequence, origState.sequence);
  assert.equal(reimportedState.inventory.length, origState.inventory.length);
  assert.equal(reimportedState.achievements.length, origState.achievements.length);
});
