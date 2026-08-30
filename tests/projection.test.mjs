import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { floor6Events, floor6Snapshots, floor6Timeline } from "../app/domain/fixtures/floor6.ts";
import { projectState, createInitialState, applyEvent, defaultFloor6Quests } from "../app/domain/projection.ts";
import { validateCrawlerTimeline, validateCrawlerFloor } from "../app/domain/validation.ts";
import { compareGearStats, checkItemRequirements, getStatBreakdown } from "../app/domain/stats.ts";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline.ts";
import { compileFloorFiles } from "../app/domain/compiler.ts";
import { getFloorEndSequence } from "../app/domain/floors.ts";

const floor1AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-1.json", "utf8"));
const floor2AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-2.json", "utf8"));

test("initial state has default crawler stats", () => {
  const state = createInitialState();
  assert.equal(state.crawler.name, "CARL G.");
  assert.equal(state.crawler.level, 42);
  assert.equal(state.inventory.length, 0);
});

test("legacy achievement reward text remains visible as a structured reward", () => {
  const state = projectState(floor6Timeline, 25);
  const achievement = state.achievements.find((entry) => entry.achievementId === "ach-barely");
  assert.deepEqual(achievement.rewards, [{
    kind: "other",
    description: "+250 XP · +50 FAME · TITLE: UNBREAKABLE",
  }]);
});

test("initial-state achievements retain valid recipients", () => {
  const state = createInitialState({
    achievements: [
      { id: "achievement-donut", title: "Cat Lady", recipient: "donut" },
      { id: "achievement-invalid", title: "Unknown", recipient: "not-a-crawler" },
    ],
  });

  assert.equal(state.achievements[0].recipient, "donut");
  assert.equal(state.achievements[1].recipient, undefined);
});

test("projection at sequence 1 creates initial quest record with explicit fixture adapter", () => {
  const customInitial = createInitialState();
  customInitial.quests = defaultFloor6Quests;
  const state = projectState(floor6Events, 1, [], customInitial);
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

test("floor-2.json validates successfully against crawler-floor/v2 schema", () => {
  const validation = validateCrawlerFloor(floor2AuthoredDoc);
  assert.equal(validation.valid, true, `Floor 2 validation errors: ${validation.errors.join('; ')}`);
});

test("compiler produces a valid runtime timeline document from authored floor files", () => {
  const doc = compileFloorFiles([floor1AuthoredDoc, floor2AuthoredDoc]);
  const validation = validateCrawlerTimeline(doc);
  assert.equal(validation.valid, true, `Compiled timeline validation errors: ${validation.errors.join('; ')}`);
  assert.equal(doc.schemaVersion, "crawler-timeline/v2");
  assert.ok(Array.isArray(doc.floors));
  assert.equal(doc.floors.length, 2);
  assert.equal(doc.floors[0].ordinal, 1);
  assert.equal(doc.floors[1].ordinal, 2);
  assert.equal(doc.floors[0].endSequence + 1, doc.floors[1].startSequence);
  const floor1Countdown = doc.countdowns?.find((countdown) => countdown.id === "countdown-floor-1-collapse");
  assert.ok(floor1Countdown);
  assert.ok(floor1Countdown.references.length >= 18);
  assert.deepEqual(
    [floor1Countdown.references[0].remainingSeconds, floor1Countdown.references.at(-1).remainingSeconds],
    [432000, 0]
  );
  const floor2Countdown = doc.countdowns?.find((countdown) => countdown.id === "countdown-floor-2-collapse");
  assert.ok(floor2Countdown.references.length >= 14);
  assert.deepEqual(
    floor2Countdown.references.slice(0, 3).map((reference) => [reference.sequence, reference.remainingSeconds]),
    [
      [doc.events.find((event) => event.id === "evt-f2-001-early-access").sequence, 540000],
      [doc.events.find((event) => event.id === "evt-f2-001-entered").sequence, 525600],
      [doc.events.find((event) => event.id === "evt-f2-001-countdown-start").sequence, 518400],
    ]
  );
  const floor2End = projectState(doc, doc.events.at(-1).sequence);
  assert.equal(floor2End.crawler.level, 13);
  assert.equal(floor2End.broadcast.viewers, 212000000000);
  assert.equal(doc.sources.find((s) => s.id === "src-book-1")?.citationStyle, "Chapter {chapter}");
  assert.equal(doc.events.find((event) => event.id === "evt-f1-001-entered")?.position.chapter, 1);
});

test("compiler rejects floor files with conflicting item definitions", () => {
  const docA = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  const docB = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  docB.floor.id = "floor-2";
  docB.floor.ordinal = 2;
  docB.events.forEach((e) => {
    e.position.floor = 2;
  });
  docB.catalog.items[0].slot = "HEAD";
  assert.throws(() => compileFloorFiles([docA, docB]), /Conflicting catalog item definition/);
});

test("floor authoring supports replayable EffectApplied events", () => {
  const doc = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  const order = doc.events.length + 1;
  doc.events.push({ id: "evt-f1-effect", order, type: "EffectApplied", effectId: "effect-f1-test", name: "Test Effect", effectType: "good", durationSeconds: 60, description: "A schema and compiler regression test.", statModifiers: { Strength: 1 }, position: { floor: 1, book: 1, chapter: 30 }, summary: "Carl receives a test effect.", evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }] });
  assert.equal(validateCrawlerFloor(doc).valid, true);
  const compiled = compileFloorFiles([doc]);
  const state = projectState(compiled, order);
  assert.equal(state.effects[0]?.effectId, "effect-f1-test");
  assert.equal(state.effects[0]?.statModifiers?.Strength, 1);
});

test("compiler rejects floor files with mismatched storyId", () => {
  const docA = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  const docB = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  docB.floor.id = "floor-2";
  docB.floor.ordinal = 2;
  docB.storyId = "other-story";
  assert.throws(() => compileFloorFiles([docA, docB]), /Mismatched storyId across floor files/);
});

test("floor validator rejects achievement rewards with uncatalogued item references", () => {
  const badDoc = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  badDoc.catalog.achievements[0].reward.push({ kind: "item", itemId: "uncatalogued-reward-item" });
  const validation = validateCrawlerFloor(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((e) => e.includes("reward references itemId \"uncatalogued-reward-item\" not found")));
});

test("ItemCrafted events project crafted items into inventory", () => {
  const doc = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  doc.events.push({ id: "evt-f1-craft-bomb", order: doc.events.length + 1, type: "ItemCrafted", position: { floor: 1, book: 1, chapter: 30 }, summary: "Carl crafts a goblin explosive", item: { instanceId: "inst-f1-crafted-bomb", itemId: "item-goblin-copper-chopper", quantity: { known: true, value: 1 } }, evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }] });
  const compiled = compileFloorFiles([doc]);
  assert.equal(compiled.events.at(-1).type, "ItemCrafted");
  const state = projectState(compiled, compiled.events.length);
  const craftedItem = state.inventory.find((i) => i.instanceId === "inst-f1-crafted-bomb");
  assert.ok(craftedItem);
  assert.equal(state.recentLogs[0].category, "loot");
});

test("cross-floor item provenance is preserved when replaying later events", () => {
  const stateAtEnd = projectState(compiledTimeline, 29);
  const shirt = stateAtEnd.inventory.find((i) => i.itemId === "item-trollskin-shirt-of-pummeling");
  assert.ok(shirt);
  assert.equal(shirt.source, "First Floor");
});

test("the checked-in runtime fixture includes Floor 2 and preserves Floor 1 inventory", () => {
  assert.equal(compiledTimeline.floors?.length, 2);
  const floor2 = compiledTimeline.floors?.find((floor) => floor.ordinal === 2);
  assert.ok(floor2);
  const endOfFloor2 = projectState(compiledTimeline, floor2.endSequence);
  assert.ok(endOfFloor2.inventory.some((item) => item.itemId === "item-trollskin-shirt-of-pummeling"));
  assert.ok(endOfFloor2.inventory.some((item) => item.itemId === "item-enchanted-bigboi-boxers"));
});

test("projection preserves unknown quantity state for Floor 2 proximity trigger", () => {
  const floor2 = compiledTimeline.floors?.find((floor) => floor.ordinal === 2);
  assert.ok(floor2);
  const stateAtFloor2End = projectState(compiledTimeline, floor2.endSequence);
  const triggerItem = stateAtFloor2End.inventory.find((item) => item.instanceId === "inst-f2-proximity-trigger");
  assert.ok(triggerItem);
  assert.equal(triggerItem.quantity, 0);
  assert.ok(triggerItem.quantityObject);
  assert.equal(triggerItem.quantityObject.known, false);
});

test("compiler rejects floor files with missing item or achievement catalog references", () => {
  const badFloorDoc = JSON.parse(JSON.stringify(floor1AuthoredDoc));
  badFloorDoc.events.push({ id: "evt-f1-bad-ref", order: 20, type: "ItemAcquired", position: { floor: 1 }, summary: "Acquired uncatalogued item", item: { instanceId: "inst-bad", itemId: "non-existent-catalog-item-id", quantity: { known: true, value: 1 } }, evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }] });
  assert.throws(() => compileFloorFiles([badFloorDoc]), /not found in floor catalog|unmapped item/);
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
  state = projectState([{ id: "evt-ring1", sequence: 1, type: "ItemAcquired", summary: "Acquired Ring 1", item: { instanceId: "inst-ring-1", itemId: "item-ring-1", name: "Ring of Might", category: "equipment", slot: "RING", quantity: 1, stats: { Strength: 5 } } }, { id: "evt-ring2", sequence: 2, type: "ItemAcquired", summary: "Acquired Ring 2", item: { instanceId: "inst-ring-2", itemId: "item-ring-2", name: "Ring of Wisdom", category: "equipment", slot: "RING", quantity: 1, stats: { Intelligence: 10 } } }], 2, [], state);
  assert.equal(state.inventory.length, 2);
  state = projectState([{ id: "evt-equip1", sequence: 3, type: "ItemEquipped", itemInstanceId: "inst-ring-1", slot: "RING", summary: "Equipped Ring of Might" }], 3, [], state);
  assert.equal(state.equippedSlots["RING"], "inst-ring-1");
  assert.equal(state.inventory.find((i) => i.instanceId === "inst-ring-1")?.isEquipped, true);
  state = projectState([{ id: "evt-equip2", sequence: 4, type: "ItemEquipped", itemInstanceId: "inst-ring-2", slot: "RING", summary: "Equipped Ring of Wisdom" }], 4, [], state);
  assert.equal(state.equippedSlots["RING"], "inst-ring-2");
  assert.equal(state.inventory.find((i) => i.instanceId === "inst-ring-1")?.isEquipped, false);
  assert.equal(state.inventory.find((i) => i.instanceId === "inst-ring-2")?.isEquipped, true);
  state = projectState([{ id: "evt-unequip", sequence: 5, type: "ItemUnequipped", itemInstanceId: "inst-ring-2", slot: "RING", summary: "Unequipped Ring of Wisdom" }], 5, [], state);
  assert.equal(state.equippedSlots["RING"], null);
  assert.equal(state.inventory.find((i) => i.instanceId === "inst-ring-2")?.isEquipped, false);
});

test("ItemLocked, ItemUnlocked, ItemLockToggled, and ItemRepaired modify item state", () => {
  let state = createInitialState();
  state = projectState([{ id: "evt-shield", sequence: 1, type: "ItemAcquired", summary: "Acquired Shield", item: { instanceId: "inst-shield-1", itemId: "item-shield", name: "Kite Shield", category: "equipment", slot: "SPECIAL", quantity: 1, durability: { current: 50, max: 100 } } }], 1, [], state);
  let shield = state.inventory.find((i) => i.instanceId === "inst-shield-1");
  assert.ok(shield);
  assert.equal(shield.isLocked, false);
  assert.equal(shield.durability?.current, 50);
  state = projectState([{ id: "evt-lock", sequence: 2, type: "ItemLocked", itemInstanceId: "inst-shield-1", summary: "Locked Shield" }], 2, [], state);
  shield = state.inventory.find((i) => i.instanceId === "inst-shield-1");
  assert.equal(shield?.isLocked, true);
  state = projectState([{ id: "evt-toggle", sequence: 3, type: "ItemLockToggled", itemInstanceId: "inst-shield-1", summary: "Unlocked Shield" }], 3, [], state);
  shield = state.inventory.find((i) => i.instanceId === "inst-shield-1");
  assert.equal(shield?.isLocked, false);
  state = projectState([{ id: "evt-repair", sequence: 4, type: "ItemRepaired", itemInstanceId: "inst-shield-1", amount: 30, summary: "Repaired Shield" }], 4, [], state);
  shield = state.inventory.find((i) => i.instanceId === "inst-shield-1");
  assert.equal(shield?.durability?.current, 80);
});

test("compareGearStats and checkItemRequirements evaluate gear deltas and requirements", () => {
  const crawler = { name: "CARL G.", level: 42, race: "PRIMAL", class: "SCOUT", attributes: { Strength: 24, Dexterity: 34, Constitution: 30, Intelligence: 18, Charisma: 20 } };
  const deltas = compareGearStats({ stats: { Dexterity: 4, Armor: 15 } }, { stats: { Dexterity: 10, Armor: 10, Strength: 5 } });
  assert.equal(deltas.find((d) => d.statName === "Dexterity")?.delta, 6);
  assert.equal(deltas.find((d) => d.statName === "Armor")?.delta, -5);
  assert.equal(deltas.find((d) => d.statName === "Strength")?.delta, 5);
  assert.equal(checkItemRequirements(crawler, { level: 40, Strength: 20, class: "SCOUT" }).met, true);
  assert.equal(checkItemRequirements(crawler, { level: 50, Strength: 30 }).met, false);
  assert.equal(checkItemRequirements(crawler, { strength: 24 }).met, true);
  const unknownRequirement = checkItemRequirements(crawler, { strength: 999, agility: 1 });
  assert.equal(unknownRequirement.met, false);
  assert.equal(unknownRequirement.details.find((d) => d.key === "strength")?.current, 24);
  assert.equal(unknownRequirement.details.find((d) => d.key === "agility")?.current, "N/A");
  assert.equal(unknownRequirement.details.find((d) => d.key === "agility")?.met, false);
});

test("floor endpoint follows appended events instead of a stale compiled segment", () => {
  const events = [{ sequence: 1, position: { floor: 1 } }, { sequence: 19, position: { floor: 1 } }, { sequence: 20, position: { floor: 1 } }];
  assert.equal(getFloorEndSequence(events, 1, 19), 20);
  assert.equal(getFloorEndSequence(events, 2, 19), 19);
});

test("AttributeModified event allocates attribute points correctly", () => {
  let state = createInitialState();
  assert.equal(state.crawler.availableAttributePoints, 5);
  assert.equal(state.crawler.attributes.Strength, 24);
  state = projectState([{ id: "evt-attr-1", sequence: 1, type: "AttributeModified", attribute: "Strength", source: "allocation", delta: 1, summary: "Allocated +1 point to Strength" }], 1, [], state);
  assert.equal(state.crawler.attributes.Strength, 25);
  assert.equal(state.crawler.availableAttributePoints, 4);
});

test("HotlistUpdated event modifies hotlist skill slots", () => {
  let state = createInitialState();
  assert.ok(Array.isArray(state.hotlist));
  state = projectState([{ id: "evt-hotlist-1", sequence: 1, type: "HotlistUpdated", index: 2, skillId: "sk-custom-fireball", summary: "Assigned Fireball to hotlist slot 3" }], 1, [], state);
  assert.equal(state.hotlist[2], "sk-custom-fireball");
});

test("item requirement evaluation against live state vs historical state during timeline replay", () => {
  const events = [{ id: "evt-acq-sword", sequence: 1, type: "ItemAcquired", summary: "Acquired Heavy Greatsword", item: { instanceId: "inst-greatsword", itemId: "item-greatsword", name: "Heavy Greatsword", category: "equipment", slot: "SPECIAL", quantity: 1, requirements: { Strength: 25 } } }, { id: "evt-attr-up", sequence: 2, type: "AttributeModified", attribute: "Strength", source: "allocation", delta: 1, summary: "Allocated +1 point to Strength" }];
  const historicalState = projectState(events, 1);
  assert.equal(historicalState.crawler.attributes.Strength, 24);
  const liveState = projectState(events, 2);
  assert.equal(liveState.crawler.attributes.Strength, 25);
  const item = historicalState.inventory.find((i) => i.instanceId === "inst-greatsword");
  assert.ok(item);
  assert.equal(checkItemRequirements(historicalState.crawler, item.requirements).met, false);
  assert.equal(checkItemRequirements(liveState.crawler, item.requirements).met, true);
});

test("QuestUpdated event updates quest status and filtering excludes non-active quests from active tab", () => {
  let state = createInitialState();
  state = projectState([{ id: "evt-quest-complete", sequence: 1, type: "QuestUpdated", questId: "q-stairwell", title: "Tutorial: Reach the Stairs", urgency: "COMPLETED", goals: ["Find the emergency stairwell"], rewards: "150 XP", status: "completed", summary: "Completed Tutorial: Reach the Stairs" }, { id: "evt-quest-fail", sequence: 2, type: "QuestUpdated", questId: "q-defend", title: "Defend Outpost", urgency: "STANDARD", goals: ["Hold the line"], rewards: "None", status: "failed", summary: "Failed Defend Outpost" }, { id: "evt-quest-active", sequence: 3, type: "QuestUpdated", questId: "q-boss", title: "Defeat Boss", urgency: "URGENT", goals: ["Defeat Dungeon Boss"], rewards: "Legendary Chest", status: "active", summary: "Started Defeat Boss quest" }], 3, [], state);
  assert.equal(state.quests.length, 3);
  assert.equal(state.quests.filter((q) => q.status === "active").length, 1);
  assert.equal(state.quests.filter((q) => q.status === "completed").length, 1);
  assert.equal(state.quests.filter((q) => q.status === "failed").length, 1);
});

test("createInitialState preserves quests without forcing a status when absent", () => {
  const state = createInitialState({ crawler: { name: "CARL G.", level: 42, attributes: { Strength: 24, Dexterity: 34, Constitution: 30, Intelligence: 18, Charisma: 20 }, condition: { currentHealth: 3100, maxHealth: 4200, currentMana: 800, maxMana: 1360, currentStamina: 200, maxStamina: 280 } }, quests: [{ questId: "q-nostatus", title: "Quest Without Status", urgency: "STANDARD", goals: ["Do something"], rewards: "100 XP" }] });
  assert.equal(state.quests.length, 1);
  assert.equal(state.quests[0].status, undefined);
});

test("filtering preserves quests without a status as active", () => {
  const quests = [{ questId: "q-1", title: "Active Quest", status: "active" }, { questId: "q-2", title: "Statusless Quest" }, { questId: "q-3", title: "Completed Quest", status: "completed" }];
  const activeQuests = quests.filter((q) => !q.status || q.status === "active");
  const completedQuests = quests.filter((q) => q.status === "completed");
  const failedQuests = quests.filter((q) => q.status === "failed");
  assert.equal(activeQuests.length, 2);
  assert.deepEqual(activeQuests.map((q) => q.questId), ["q-1", "q-2"]);
  assert.equal(completedQuests.length, 1);
  assert.equal(failedQuests.length, 0);
});

test("AchievementUnlocked does not manufacture an icon when none is sourced", () => {
  const state = createInitialState({
    crawler: { name: "Test", level: 1, attributes: {}, condition: {} },
    achievements: [],
  });
  const projected = applyEvent(state, {
    id: "evt-achievement-no-icon",
    sequence: 1,
    type: "AchievementUnlocked",
    achievement: { id: "achievement-no-icon", title: "No Icon Authored" },
  });
  assert.equal(projected.achievements[0].icon, "");
});
