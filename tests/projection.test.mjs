import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { floor6Events, floor6Snapshots, floor6Timeline } from "../app/domain/fixtures/floor6.ts";
import { projectState, createInitialState } from "../app/domain/projection.ts";
import { validateCrawlerTimeline, validateCrawlerFloor } from "../app/domain/validation.ts";
import { compareGearStats, checkItemRequirements, getStatBreakdown } from "../app/domain/stats.ts";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline.ts";
import { compileFloorFiles } from "../app/domain/compiler.ts";
import { getFloorEndSequence } from "../app/domain/floors.ts";

const floor1AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-1.json", "utf8"));

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
  const doc = compileFloorFiles([floor1AuthoredDoc]);
  const validation = validateCrawlerTimeline(doc);
  assert.equal(validation.valid, true, `Compiled timeline validation errors: ${validation.errors.join('; ')}`);
  assert.equal(doc.schemaVersion, "crawler-timeline/v2");
  assert.ok(Array.isArray(doc.floors));
  assert.equal(doc.floors.length, 1);
  assert.equal(doc.floors[0].ordinal, 1);
  assert.equal(doc.sources.find((s) => s.id === "src-book-1")?.citationStyle, "Chapter {chapter}");
  // Position metadata check
  assert.equal(doc.events[0].position.chapter, 1);
});

test("compiler rejects floor files with conflicting item definitions", () => {
  const docA = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  const docB = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  docB.floor.id = "floor-2";
  docB.floor.ordinal = 2;
  docB.events.forEach((e) => {
    e.position.floor = 2;
  });
  docB.catalog.items[0].slot = "HEAD"; // Conflicting slot with docA

  assert.throws(
    () => compileFloorFiles([docA, docB]),
    /Conflicting catalog item definition/
  );
});

test("compiler rejects floor files with mismatched storyId", () => {
  const docA = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  const docB = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  docB.floor.id = "floor-2";
  docB.floor.ordinal = 2;
  docB.storyId = "other-story";

  assert.throws(
    () => compileFloorFiles([docA, docB]),
    /Mismatched storyId across floor files/
  );
});

test("floor validator rejects achievement rewards with uncatalogued item references", () => {
  const badDoc = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  badDoc.catalog.achievements[0].reward.push({
    kind: "item",
    itemId: "uncatalogued-reward-item",
  });

  const validation = validateCrawlerFloor(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.errors.some((e) => e.includes("reward references itemId \"uncatalogued-reward-item\" not found"))
  );
});

test("ItemCrafted events project crafted items into inventory", () => {
  const doc = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  doc.events.push({
    id: "evt-f1-craft-bomb",
    order: 20,
    type: "ItemCrafted",
    position: { floor: 1, book: 1, chapter: 30 },
    summary: "Carl crafts a goblin explosive",
    item: { instanceId: "inst-f1-crafted-bomb", itemId: "item-goblin-copper-chopper", quantity: { known: true, value: 1 } },
    evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
  });

  const compiled = compileFloorFiles([doc]);
  assert.equal(compiled.events.at(-1).type, "ItemCrafted");
  const state = projectState(compiled, compiled.events.length);
  const craftedItem = state.inventory.find((i) => i.instanceId === "inst-f1-crafted-bomb");
  assert.ok(craftedItem, "Crafted item should be present in projected inventory");
  assert.equal(state.recentLogs[0].category, "loot");
});

test("cross-floor item provenance is preserved when replaying later events", () => {
  const stateAtEnd = projectState(compiledTimeline, 19);
  const shirt = stateAtEnd.inventory.find((i) => i.itemId === "item-trollskin-shirt-of-pummeling");
  assert.ok(shirt, "Item acquired on Floor 1 should persist in inventory");
  assert.equal(shirt.source, "First Floor");
});

test("compiler rejects floor files with missing item or achievement catalog references", () => {
  const badFloorDoc = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  badFloorDoc.events.push({
    id: "evt-f1-bad-ref",
    order: 20,
    type: "ItemAcquired",
    position: { floor: 1 },
    summary: "Acquired uncatalogued item",
    item: { instanceId: "inst-bad", itemId: "non-existent-catalog-item-id", quantity: { known: true, value: 1 } },
    evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
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

test("ItemEquipped and ItemUnequipped correctly manage equipped slot state and isEquipped flags", () => {
  let state = createInitialState();

  // Acquire two ring items
  state = projectState(
    [
      {
        id: "evt-ring1",
        sequence: 1,
        type: "ItemAcquired",
        summary: "Acquired Ring 1",
        item: {
          instanceId: "inst-ring-1",
          itemId: "item-ring-1",
          name: "Ring of Might",
          category: "equipment",
          slot: "RING",
          quantity: 1,
          stats: { Strength: 5 },
        },
      },
      {
        id: "evt-ring2",
        sequence: 2,
        type: "ItemAcquired",
        summary: "Acquired Ring 2",
        item: {
          instanceId: "inst-ring-2",
          itemId: "item-ring-2",
          name: "Ring of Wisdom",
          category: "equipment",
          slot: "RING",
          quantity: 1,
          stats: { Intelligence: 10 },
        },
      },
    ],
    2,
    [],
    state
  );

  assert.equal(state.inventory.length, 2);

  // Equip Ring 1
  state = projectState(
    [
      {
        id: "evt-equip1",
        sequence: 3,
        type: "ItemEquipped",
        itemInstanceId: "inst-ring-1",
        slot: "RING",
        summary: "Equipped Ring of Might",
      },
    ],
    3,
    [],
    state
  );

  assert.equal(state.equippedSlots["RING"], "inst-ring-1");
  assert.equal(state.inventory.find((i) => i.instanceId === "inst-ring-1")?.isEquipped, true);

  // Equip Ring 2 into same slot (should unequip Ring 1)
  state = projectState(
    [
      {
        id: "evt-equip2",
        sequence: 4,
        type: "ItemEquipped",
        itemInstanceId: "inst-ring-2",
        slot: "RING",
        summary: "Equipped Ring of Wisdom",
      },
    ],
    4,
    [],
    state
  );

  assert.equal(state.equippedSlots["RING"], "inst-ring-2");
  assert.equal(state.inventory.find((i) => i.instanceId === "inst-ring-1")?.isEquipped, false);
  assert.equal(state.inventory.find((i) => i.instanceId === "inst-ring-2")?.isEquipped, true);

  // Unequip Ring 2
  state = projectState(
    [
      {
        id: "evt-unequip",
        sequence: 5,
        type: "ItemUnequipped",
        itemInstanceId: "inst-ring-2",
        slot: "RING",
        summary: "Unequipped Ring of Wisdom",
      },
    ],
    5,
    [],
    state
  );

  assert.equal(state.equippedSlots["RING"], null);
  assert.equal(state.inventory.find((i) => i.instanceId === "inst-ring-2")?.isEquipped, false);
});

test("ItemLocked, ItemUnlocked, ItemLockToggled, and ItemRepaired modify item state", () => {
  let state = createInitialState();

  state = projectState(
    [
      {
        id: "evt-shield",
        sequence: 1,
        type: "ItemAcquired",
        summary: "Acquired Shield",
        item: {
          instanceId: "inst-shield-1",
          itemId: "item-shield",
          name: "Kite Shield",
          category: "equipment",
          slot: "SPECIAL",
          quantity: 1,
          durability: { current: 50, max: 100 },
        },
      },
    ],
    1,
    [],
    state
  );

  let shield = state.inventory.find((i) => i.instanceId === "inst-shield-1");
  assert.ok(shield);
  assert.equal(shield.isLocked, false);
  assert.equal(shield.durability?.current, 50);

  // Lock shield
  state = projectState(
    [
      { id: "evt-lock", sequence: 2, type: "ItemLocked", itemInstanceId: "inst-shield-1", summary: "Locked Shield" },
    ],
    2,
    [],
    state
  );
  shield = state.inventory.find((i) => i.instanceId === "inst-shield-1");
  assert.equal(shield?.isLocked, true);

  // Toggle lock shield (unlock)
  state = projectState(
    [
      { id: "evt-toggle", sequence: 3, type: "ItemLockToggled", itemInstanceId: "inst-shield-1", summary: "Unlocked Shield" },
    ],
    3,
    [],
    state
  );
  shield = state.inventory.find((i) => i.instanceId === "inst-shield-1");
  assert.equal(shield?.isLocked, false);

  // Repair shield
  state = projectState(
    [
      { id: "evt-repair", sequence: 4, type: "ItemRepaired", itemInstanceId: "inst-shield-1", amount: 30, summary: "Repaired Shield" },
    ],
    4,
    [],
    state
  );
  shield = state.inventory.find((i) => i.instanceId === "inst-shield-1");
  assert.equal(shield?.durability?.current, 80);
});

test("compareGearStats and checkItemRequirements evaluate gear deltas and requirements", () => {
  const crawler = {
    name: "CARL G.",
    level: 42,
    race: "PRIMAL",
    class: "SCOUT",
    attributes: { Strength: 24, Dexterity: 34, Constitution: 30, Intelligence: 18, Charisma: 20 },
  };

  const equippedItem = { stats: { Dexterity: 4, Armor: 15 } };
  const candidateItem = { stats: { Dexterity: 10, Armor: 10, Strength: 5 } };

  const deltas = compareGearStats(equippedItem, candidateItem);
  const dexDelta = deltas.find((d) => d.statName === "Dexterity");
  const armorDelta = deltas.find((d) => d.statName === "Armor");
  const strDelta = deltas.find((d) => d.statName === "Strength");

  assert.equal(dexDelta?.delta, 6);
  assert.equal(armorDelta?.delta, -5);
  assert.equal(strDelta?.delta, 5);

  // Check valid requirements
  const validReqs = { level: 40, Strength: 20, class: "SCOUT" };
  const validResult = checkItemRequirements(crawler, validReqs);
  assert.equal(validResult.met, true);

  // Check failing requirements
  const failReqs = { level: 50, Strength: 30 };
  const failResult = checkItemRequirements(crawler, failReqs);
  assert.equal(failResult.met, false);
  assert.equal(failResult.details.filter((d) => !d.met).length, 2);

  // Attribute names are normalized, and unknown requirements fail closed.
  assert.equal(checkItemRequirements(crawler, { strength: 24 }).met, true);
  const unknownRequirement = checkItemRequirements(crawler, { strength: 999, agility: 1 });
  assert.equal(unknownRequirement.met, false);
  assert.equal(unknownRequirement.details.find((d) => d.key === "strength")?.current, 24);
  assert.equal(unknownRequirement.details.find((d) => d.key === "agility")?.current, "N/A");
  assert.equal(unknownRequirement.details.find((d) => d.key === "agility")?.met, false);
});

test("floor endpoint follows appended events instead of a stale compiled segment", () => {
  const events = [
    { sequence: 1, position: { floor: 1 } },
    { sequence: 19, position: { floor: 1 } },
    { sequence: 20, position: { floor: 1 } },
  ];

  assert.equal(getFloorEndSequence(events, 1, 19), 20);
  assert.equal(getFloorEndSequence(events, 2, 19), 19);
});
