import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { compileFloorFiles } from "../../app/domain/compiler.ts";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectCountdownState, projectObservationValue, projectObservations, projectState } from "../../app/domain/projection.ts";
import { adaptRawFloorDocument, adaptRawFloorObservations } from "../../app/domain/raw-adapter.ts";
import { compileRawFloorFiles } from "../../app/domain/raw-compiler.ts";
import { loadRawFloorDocument } from "../../app/domain/raw-loader.ts";
import { validateCrawlerFloor, validateRawCrawlerFloor, validateCrawlerTimeline } from "../../app/domain/validation.ts";

const legacyFloor1 = JSON.parse(fs.readFileSync("data/floors/floor-1.json", "utf8"));
const legacyFloor2 = JSON.parse(fs.readFileSync("data/floors/floor-2.json", "utf8"));
const rawFloor1 = loadRawFloorDocument("floor-1");
const rawFloor2 = loadRawFloorDocument("floor-2");

function stableTimeline(doc) {
  const clone = JSON.parse(JSON.stringify(doc));
  delete clone.timeline.createdAt;
  delete clone.timeline.updatedAt;
  return clone;
}

function stableLegacyProjection(doc) {
  const clone = stableTimeline(doc);
  delete clone.observations;
  return clone;
}

test("raw Floor 1 and Floor 2 documents validate and adapt losslessly to the legacy floor contract", () => {
  for (const [raw, legacy] of [[rawFloor1, legacyFloor1], [rawFloor2, legacyFloor2]]) {
    const validation = validateRawCrawlerFloor(raw);
    assert.equal(validation.valid, true, validation.errors.join("; "));
    assert.ok(raw.events.every((event) => !("order" in event)));

    const adapted = adaptRawFloorDocument(raw);
    assert.deepEqual(adapted.events.map((event) => event.order), raw.events.map((_, index) => index + 1));
    assert.ok((adapted.countdowns || []).every((countdown) => countdown.references.every(
      (reference) => typeof reference.anchorEventId === "string" && !("anchorOrder" in reference),
    )));
    assert.deepEqual(adapted, legacy);
  }
});

test("raw array order deterministically becomes compiled global sequence", () => {
  const compiled = compileRawFloorFiles([rawFloor1, rawFloor2]);

  for (const raw of [rawFloor1, rawFloor2]) {
    const floor = compiled.floors.find((candidate) => candidate.ordinal === raw.floor.ordinal);
    assert.ok(floor);
    raw.events.forEach((event, index) => {
      const compiledEvent = compiled.events.find((candidate) => candidate.id === event.id);
      assert.ok(compiledEvent);
      assert.equal(compiledEvent.sequence, floor.startSequence + index);
    });
  }
});

test("raw authoring rejects duplicated numeric order", () => {
  const raw = JSON.parse(JSON.stringify(rawFloor1));
  raw.events[0].order = 1;
  const validation = validateRawCrawlerFloor(raw);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("additional properties")));
});

test("raw adapter preserves every compiled timeline projection and countdown result", () => {
  const legacyTimeline = compileFloorFiles([legacyFloor1, legacyFloor2]);
  const rawTimeline = compileRawFloorFiles([rawFloor1, rawFloor2]);

  assert.deepEqual(stableLegacyProjection(rawTimeline), stableTimeline(legacyTimeline));
  assert.deepEqual(stableLegacyProjection(compiledTimeline), stableLegacyProjection(rawTimeline));

  for (const event of legacyTimeline.events) {
    assert.deepEqual(
      projectState(rawTimeline, event.sequence),
      projectState(legacyTimeline, event.sequence),
      `Projected state differs at sequence ${event.sequence}`
    );

    const selectedFloor = event.position.floor;
    assert.deepEqual(
      projectCountdownState(rawTimeline, event.sequence, selectedFloor),
      projectCountdownState(legacyTimeline, event.sequence, selectedFloor),
      `Countdown state differs at sequence ${event.sequence}`
    );
  }
});

test("raw HUD observations are compiled at their event sequences without changing legacy state projection", () => {
  const rawTimeline = compileRawFloorFiles([rawFloor1, rawFloor2]);
  const mana = rawTimeline.observations.find((observation) => observation.id === "obs-f1-magic-baseline");
  assert.ok(mana);
  assert.equal(mana.sequence, rawTimeline.events.find((event) => event.id === "evt-f1-trollskin-shirt").sequence);
  assert.equal(mana.eventId, undefined);

  const projected = projectObservationValue(rawTimeline, mana.sequence, "crawler-condition.currentMana");
  assert.deepEqual(projected?.status, "stated");
  assert.equal(projected?.value, 3);
});

test("raw adapter resolves every supported observation kind without turning evidence into events", () => {
  const rawDoc = JSON.parse(JSON.stringify(rawFloor1));
  const eventId = rawDoc.events[0].id;
  const evidence = [{ sourceId: "src-book-1", confidence: "confirmed" }];
  rawDoc.observations = [
    { id: "obs-condition", kind: "crawler-condition", eventId, currentHealth: 1, evidence },
    { id: "obs-attributes", kind: "crawler-attributes", eventId, attributes: { Strength: 10 }, evidence },
    { id: "obs-xp", kind: "xp-progress", eventId, level: 2, evidence },
    { id: "obs-broadcast", kind: "broadcast-metrics", eventId, viewers: 1, evidence },
    { id: "obs-inventory", kind: "inventory-state", eventId, itemInstanceId: "inst-f1-toe-ring", present: true, evidence },
    { id: "obs-equipment", kind: "equipment-state", eventId, slot: "ring", itemInstanceId: null, evidence },
    { id: "obs-countdown", kind: "countdown-remaining", eventId, countdownId: "countdown-floor-1-collapse", remainingSeconds: 1, evidence },
  ];

  const adapted = adaptRawFloorObservations(rawDoc);
  assert.deepEqual(adapted.map(({ observation }) => observation.kind), [
    "crawler-condition", "crawler-attributes", "xp-progress", "broadcast-metrics",
    "inventory-state", "equipment-state", "countdown-remaining",
  ]);
  assert.ok(adapted.every(({ observation }) => observation.eventId === eventId));

  const compiled = compileRawFloorFiles([rawDoc]);
  assert.deepEqual(compiled.observations.map((observation) => observation.kind), adapted.map(({ observation }) => observation.kind));
  assert.equal(compiled.events.length, rawDoc.events.length);
});

test("multiple raw countdown observations compile into identified timers without leaking IDs into derived references", () => {
  const rawDoc = JSON.parse(JSON.stringify(rawFloor2));
  const eventId = rawDoc.events[0].id;
  const evidence = [{ sourceId: rawDoc.sources[0].id, confidence: "confirmed" }];
  rawDoc.observations = rawDoc.observations.filter((observation) => observation.kind !== "countdown-remaining");
  rawDoc.observations.push(
    { id: "obs-primary-routing", kind: "countdown-remaining", eventId, countdownId: "countdown-floor-2-collapse", remainingSeconds: 100, evidence },
    { id: "obs-secondary-routing", kind: "countdown-remaining", eventId, countdownId: "countdown-floor-2-safe-room-closure", remainingSeconds: 20, evidence },
  );

  const rawReadings = rawDoc.observations.filter((observation) => observation.kind === "countdown-remaining");
  assert.ok(rawReadings.every((observation) => typeof observation.countdownId === "string"));

  const compiled = compileRawFloorFiles([rawDoc]);
  const collapse = compiled.countdowns.find((countdown) => countdown.id === "countdown-floor-2-collapse");
  const safeRoom = compiled.countdowns.find((countdown) => countdown.id === "countdown-floor-2-safe-room-closure");

  assert.ok(collapse.references.some((reference) => reference.remainingSeconds === 100));
  assert.equal(safeRoom.references.length, 1);
  assert.equal(safeRoom.references[0].remainingSeconds, 20);
  assert.equal(safeRoom.references[0].sequence, compiled.events.find((event) => event.id === eventId).sequence);

  for (const countdown of compiled.countdowns) {
    assert.ok(countdown.references.every((reference) => !("countdownId" in reference)));
  }
});

test("Floor 1 and Floor 2 retain sourced progression anchors and supporting transitions", () => {
  const rawTimeline = compileRawFloorFiles([rawFloor1, rawFloor2]);
  const levelEvents = rawTimeline.events.filter((event) => event.type === "LevelChanged");
  const progressObservations = rawTimeline.observations.filter((observation) => observation.kind === "xp-progress");

  assert.deepEqual(levelEvents.map((event) => event.level), [2, 3, 5, 7, 8, 9, 10, 11, 12, 13]);
  assert.deepEqual(progressObservations.map((observation) => observation.level), [2, 3, 5, 7, 8, 9, 10, 11, 12, 13]);
  assert.ok(rawTimeline.events.some((event) => event.id === "evt-f1-toe-ring-equipped" && event.type === "ItemEquipped"));
  assert.ok(rawTimeline.events.some((event) => event.id === "evt-f2-jug-o-boom-crafted" && event.type === "ItemCrafted"));
  assert.ok(rawTimeline.events.some((event) => event.id === "evt-f2-dungeonpreneur-royalty" && event.type === "PermanentEntitlementGranted"));
});

test("Floor 1 and Floor 2 retain the complete Book 1 achievement catalog with recipients and rewards", () => {
  const rawTimeline = compileRawFloorFiles([rawFloor1, rawFloor2]);
  const achievements = rawTimeline.events.filter((event) => event.type === "AchievementUnlocked");
  const byFloor = (floor) => achievements.filter((event) => event.position.floor === floor);

  assert.equal(byFloor(1).length, 29);
  assert.equal(byFloor(2).length, 8);

  const crazyCatLady = achievements.find((event) => event.achievement.id === "achievement-crazy-cat-lady");
  assert.equal(crazyCatLady?.achievement.recipient, "carl");
  assert.equal(crazyCatLady?.achievement.reward?.[0]?.description, "Bronze Pet Box");
  // Party formation is an authored Floor 1 transition before achievement delivery.
  assert.equal(crazyCatLady?.sequence, 4);

  const trailblazingCrazyCatLady = achievements.find((event) => event.achievement.id === "achievement-trailblazing-crazy-cat-lady");
  assert.equal(trailblazingCrazyCatLady?.achievement.recipient, "donut");
  assert.equal(trailblazingCrazyCatLady?.achievement.reward?.[0]?.description, "Legendary Pet Box");

  const menagerie = achievements.find((event) => event.achievement.id === "achievement-menagerie");
  assert.equal(menagerie?.achievement.recipient, "donut");
  assert.ok(menagerie?.achievement.description);

  const floor1Exit = rawTimeline.events.find((event) => event.id === "evt-f1-exit");
  assert.ok(floor1Exit);
  const atFloor1Exit = projectState(rawTimeline, floor1Exit.sequence);
  assert.ok(atFloor1Exit.achievements.some((achievement) => achievement.achievementId === "achievement-found-stairs"));
  assert.ok(atFloor1Exit.achievements.some((achievement) => achievement.achievementId === "achievement-bitchmeat"));

  const bronzeAsshole = atFloor1Exit.achievements.find((achievement) => achievement.achievementId === "achievement-you-monster");
  assert.ok(bronzeAsshole.rewards.some((reward) => reward.description === "Bronze Asshole's Box" && reward.boxType === "asshole" && reward.rarity === "bronze"));
  const peta = projectState(rawTimeline, rawTimeline.events.at(-1).sequence).achievements.find((achievement) => achievement.achievementId === "achievement-peta-enthusiast");
  assert.deepEqual(peta.rewards, []);
});

test("floor telemetry preserves authored lower bounds", () => {
  const rawTimeline = compileRawFloorFiles([rawFloor1, rawFloor2]);
  const collapse = rawTimeline.events.find((event) => event.id === "evt-f1-floor-collapse");
  const floor = projectObservations(rawTimeline, collapse.sequence).floor;
  assert.deepEqual(floor.collapseDeaths.quantity, { kind: "lower-bound", value: 700000 });
  assert.notEqual(floor.collapseDeaths.quantity.kind, "exact");
});

test("PermanentEntitlementGranted persists the Dungeonpreneur royalty through later replay", () => {
  const rawTimeline = compileRawFloorFiles([rawFloor1, rawFloor2]);
  const royaltyEvent = rawTimeline.events.find((event) => event.id === "evt-f2-dungeonpreneur-royalty");
  assert.ok(royaltyEvent);

  const beforeGrant = projectState(rawTimeline, royaltyEvent.sequence - 1);
  assert.equal(beforeGrant.entitlements.some((entitlement) => entitlement.id === "entitlement-f2-dungeonpreneur-royalty"), false);

  const afterGrant = projectState(rawTimeline, royaltyEvent.sequence + 1);
  assert.deepEqual(
    afterGrant.entitlements.find((entitlement) => entitlement.id === "entitlement-f2-dungeonpreneur-royalty"),
    {
      id: "entitlement-f2-dungeonpreneur-royalty",
      name: "Dungeonpreneur royalty",
      description: "Carl receives a gold-coin royalty for kills made with his invention by other crawlers.",
    },
  );
});

test("numeric HUD readings interpolate only when both evidence anchors opt in", () => {
  const rawDoc = JSON.parse(JSON.stringify(rawFloor1));
  const evidence = [{ sourceId: "src-book-1", confidence: "confirmed" }];
  rawDoc.observations.push(
    { id: "obs-linear-mana-start", kind: "crawler-condition", eventId: "evt-f1-trollskin-shirt", interpolation: "linear", currentMana: 10, evidence },
    { id: "obs-linear-mana-end", kind: "crawler-condition", eventId: "evt-f1-first-magic-gear", interpolation: "linear", currentMana: 40, evidence },
  );
  const compiled = compileRawFloorFiles([rawDoc]);
  const startSequence = compiled.events.find((event) => event.id === "evt-f1-trollskin-shirt").sequence;
  const endSequence = compiled.events.find((event) => event.id === "evt-f1-first-magic-gear").sequence;
  const targetSequence = Math.floor((startSequence + endSequence) / 2);
  const estimated = projectObservationValue(compiled, targetSequence, "crawler-condition.currentMana");
  assert.equal(estimated?.status, "estimated");
  assert.equal(estimated?.basis, "sequence-position");
  assert.equal(estimated?.value, 10 + ((targetSequence - startSequence) / (endSequence - startSequence)) * 30);
  assert.deepEqual(estimated?.referenceObservationIds, ["obs-linear-mana-start", "obs-linear-mana-end"]);

  const discrete = JSON.parse(JSON.stringify(rawDoc));
  delete discrete.observations[discrete.observations.length - 1].interpolation;
  assert.equal(projectObservationValue(compileRawFloorFiles([discrete]), 9, "crawler-condition.currentMana"), null);
});

test("raw countdown observations reject missing event IDs and increasing values", () => {
  const missingEvent = JSON.parse(JSON.stringify(rawFloor1));
  missingEvent.observations[0].eventId = "evt-f1-does-not-exist";
  const missingEventValidation = validateRawCrawlerFloor(missingEvent);
  assert.equal(missingEventValidation.valid, false);
  assert.ok(missingEventValidation.errors.some((error) => error.includes("missing event ID")));

  const increasingCountdown = JSON.parse(JSON.stringify(rawFloor2));
  increasingCountdown.observations[1].remainingSeconds = 600000;
  const increasingValidation = validateRawCrawlerFloor(increasingCountdown);
  assert.equal(increasingValidation.valid, false);
  assert.ok(increasingValidation.errors.some((error) => error.includes("increases from")));
  assert.throws(() => compileRawFloorFiles([increasingCountdown]), /increases from/);

  const duplicateAnchor = JSON.parse(JSON.stringify(rawFloor2));
  duplicateAnchor.observations.push({
    ...duplicateAnchor.observations[1],
    id: "obs-countdown-floor-2-collapse-duplicate",
  });
  const duplicateValidation = validateRawCrawlerFloor(duplicateAnchor);
  assert.equal(duplicateValidation.valid, false);
  assert.ok(duplicateValidation.errors.some((error) => error.includes("duplicate anchor event ID")));

  const legacyIncrease = JSON.parse(JSON.stringify(legacyFloor2));
  legacyIncrease.countdowns[0].references[1].remainingSeconds = 600000;
  const legacyValidation = validateCrawlerFloor(legacyIncrease);
  assert.equal(legacyValidation.valid, false);
  assert.ok(legacyValidation.errors.some((error) => error.includes("increases from")));
});

test("raw observations reject unrelated, empty, and nullable inventory payloads", () => {
  const rawDoc = JSON.parse(JSON.stringify(rawFloor1));
  const eventId = rawDoc.events[0].id;
  const evidence = [{ sourceId: "src-book-1", confidence: "confirmed" }];

  rawDoc.observations.push({ id: "obs-invalid-inventory", kind: "inventory-state", eventId, itemInstanceId: null, present: true, evidence });
  assert.equal(validateRawCrawlerFloor(rawDoc).valid, false, "inventory instance IDs must be concrete IDs");

  rawDoc.observations[rawDoc.observations.length - 1] = { id: "obs-invalid-xp", kind: "xp-progress", eventId, currentHealth: 3, evidence };
  assert.equal(validateRawCrawlerFloor(rawDoc).valid, false, "XP observations cannot carry condition fields");

  rawDoc.observations[rawDoc.observations.length - 1] = { id: "obs-empty-condition", kind: "crawler-condition", eventId, evidence };
  assert.equal(validateRawCrawlerFloor(rawDoc).valid, false, "condition observations require at least one reading");
});

test("countdown phase breaks permit a later reset observation without interpolation", () => {
  const resetCountdown = JSON.parse(JSON.stringify(rawFloor2));
  const resetObservationIndex = resetCountdown.observations.findIndex((observation) => observation.id === "obs-countdown-floor-2-collapse-cascadia-intro");
  const resetObservation = resetCountdown.observations[resetObservationIndex];
  const resetEventIndex = resetCountdown.events.findIndex((event) => event.id === "evt-f2-goo-inator");
  const resetEvent = resetCountdown.events[resetEventIndex];
  resetCountdown.events[resetEventIndex] = {
    id: resetEvent.id,
    type: "CountdownReset",
    countdownId: "countdown-floor-2-collapse",
    newRemainingSeconds: 600000,
    position: resetEvent.position,
    summary: "The countdown reset before the next phase.",
    evidence: resetEvent.evidence,
  };
  resetCountdown.observations[resetObservationIndex].remainingSeconds = 600000;
  delete resetCountdown.observations[resetObservationIndex].activationOffset;

  const validation = validateRawCrawlerFloor(resetCountdown);
  assert.equal(validation.valid, true, validation.errors.join("; "));

  const compiled = compileRawFloorFiles([resetCountdown]);
  const resetEventSequence = compiled.events.find((event) => event.id === resetEvent.id).sequence;
  assert.equal(projectCountdownState(compiled, resetEventSequence, 2), null, "a phase boundary must not be interpolated across");
  const resetSeq = compiled.events.find((e) => e.id === resetObservation.eventId).sequence;
  const resetReference = projectCountdownState(compiled, resetSeq, 2);
  assert.ok(resetReference);
  assert.equal(resetReference.status, "stated");
  assert.equal(resetReference.remainingSeconds, 600000);
});

test("Phase 2: raw schema accepts all expanded HUD event variants and rejects malformed payloads", () => {
  const rawDoc = JSON.parse(JSON.stringify(rawFloor1));

  rawDoc.events.push(
    {
      id: "evt-f1-phase2-attr",
      type: "AttributeModified",
      attribute: "Dexterity",
      delta: 2,
      source: "allocation",
      isAllocation: true,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Allocated +2 to Dexterity",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-cond",
      type: "ConditionChanged",
      currentHealth: 2000,
      healthDelta: -1100,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Took 1100 damage",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-xp",
      type: "XPChanged",
      xp: 25000,
      xpDelta: 3500,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Gained 3500 XP",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-disc",
      type: "ItemDiscarded",
      itemInstanceId: "inst-f1-trollskin-shirt",
      reason: "Torn beyond repair",
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Discarded torn shirt",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-qty",
      type: "ItemQuantityChanged",
      itemInstanceId: "inst-f1-goblin-copper-chopper",
      delta: 1,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Acquired second chopper",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-quest",
      type: "QuestUpdated",
      questId: "q-floor1-clear",
      title: "Clear Floor 1 Boss",
      urgency: "URGENT",
      goals: ["Locate boss room", "Defeat boss"],
      rewards: "2000 XP",
      status: "active",
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Accepted Floor 1 boss quest",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-hotlist",
      type: "HotlistUpdated",
      skillId: "sk-f1-power-strike",
      index: 1,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Set Power Strike to hotlist slot 1",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-effexp",
      type: "EffectExpired",
      effectId: "eff-f1-potion-buff",
      reason: "Duration ran out",
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Potion buff expired",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-cdreset",
      type: "CountdownReset",
      countdownId: "countdown-floor-1-collapse",
      newRemainingSeconds: 500000,
      phase: "phase-dungeon-reset",
      reason: "Floor stabilization triggered",
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Dungeon stabilizer reset the collapse timer",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-broadcast",
      type: "BroadcastUpdated",
      viewers: 120000,
      patrons: [{ id: "patron-1", name: "High Sponsor", tier: "Gold", contribution: "5000 Gold" }],
      favorites: ["patron-1"],
      metrics: { peakViewers: 150000, retentionRate: 0.92 },
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Broadcast updated with patron and viewer metrics",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    }
  );

  const validRes = validateRawCrawlerFloor(rawDoc);
  assert.equal(validRes.valid, true, `Validation failed: ${validRes.errors.join("; ")}`);

  // Test malformed payload rejection
  const malformedDoc = JSON.parse(JSON.stringify(rawDoc));
  const attrIndex = rawDoc.events.findIndex((e) => e.type === "AttributeModified");
  malformedDoc.events[attrIndex].attribute = "InvalidStatName";

  const invalidRes = validateRawCrawlerFloor(malformedDoc);
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.some((e) => e.includes("AttributeModified") || e.includes("enum") || e.includes("attribute")));
});

test("Phase 2: raw-floor validation verifies referenced IDs and structured countdown phase transitions without keywords", () => {
  const rawDoc = JSON.parse(JSON.stringify(rawFloor1));

  rawDoc.events.push({
    id: "evt-f1-reset-no-keyword",
    type: "CountdownReset",
    countdownId: "countdown-floor-1-collapse",
    newRemainingSeconds: 600000,
    phase: "phase-2",
    position: { floor: 1, book: 1, chapter: 15 },
    summary: "A un-descriptive event title with no trigger words.",
    evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
  });

  const validRes = validateRawCrawlerFloor(rawDoc);
  assert.equal(validRes.valid, true, `Validation failed: ${validRes.errors.join("; ")}`);

  // Verify that an invalid countdownId is rejected
  const invalidCountdownDoc = JSON.parse(JSON.stringify(rawDoc));
  invalidCountdownDoc.events[invalidCountdownDoc.events.length - 1].countdownId = "countdown-does-not-exist";

  const invalidRes = validateRawCrawlerFloor(invalidCountdownDoc);
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.some((e) => e.includes("references countdownId \"countdown-does-not-exist\"")));
});

test("Phase 2: raw fixture demonstrates partial observations, inventory lifecycle, countdown reset, and projection reached", () => {
  const rawDoc = JSON.parse(JSON.stringify(rawFloor1));

  rawDoc.events.push(
    {
      id: "evt-f1-p2-hp",
      type: "ConditionChanged",
      currentHealth: 1200,
      maxHealth: 2000,
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "Carl's HP drops to 1200",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-xp",
      type: "XPChanged",
      xp: 28000,
      maxXp: 80000,
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "XP observed at 28000 / 80000",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-attr",
      type: "AttributeModified",
      attribute: "Strength",
      delta: 2,
      source: "allocation",
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "Allocated +2 Strength",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-acq-ring",
      type: "ItemAcquired",
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "Acquired Silver Ring +1 CON",
      item: {
        instanceId: "inst-f1-temp-ring",
        itemId: "item-silver-ring-plus-1-con",
        quantity: { known: true, value: 1 },
      },
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-consume",
      type: "ItemConsumed",
      itemInstanceId: "inst-f1-temp-ring",
      quantity: { known: true, value: 1 },
      healthRestored: 300,
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "Consumed temporary ring for effect",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-discard",
      type: "ItemDiscarded",
      itemInstanceId: "inst-f1-toe-ring",
      reason: "Discarded toe ring",
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "Discarded toe ring",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-cdreset",
      type: "CountdownReset",
      countdownId: "countdown-floor-1-collapse",
      newRemainingSeconds: 500000,
      phase: "phase-stabilized",
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "Floor collapse timer reset",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    }
  );

  const validation = validateRawCrawlerFloor(rawDoc);
  assert.equal(validation.valid, true, validation.errors.join("; "));

  const compiled = compileRawFloorFiles([rawDoc]);
  const timelineValidation = validateCrawlerTimeline(compiled);
  assert.equal(timelineValidation.valid, true, timelineValidation.errors.join("; "));

  // Test projections reach documented derived representation
  const startLen = rawFloor1.events.length;
  const seqAtConsume = startLen + 5;
  const seqAtDiscard = startLen + 6;

  const stateAtConsume = projectState(compiled, seqAtConsume);
  assert.equal(stateAtConsume.crawler.condition.currentHealth, 1500, "HP 1200 + 300 restored by consumed potion = 1500");
  assert.equal(stateAtConsume.crawler.xp, 28000, "XP updated to 28000");
  assert.equal(stateAtConsume.crawler.maxXp, 80000, "MaxXP updated to 80000");
  assert.equal(stateAtConsume.crawler.attributes.Strength, 12, "Base 10 + 2 allocated Strength = 12");

  const stateAtDiscard = projectState(compiled, seqAtDiscard);
  assert.equal(
    stateAtDiscard.inventory.some((i) => i.instanceId === "inst-f1-toe-ring"),
    false,
    "Discarded toe ring removed from inventory"
  );

  // Check structured countdown phase transition
  const countdownEvent = compiled.events.find((e) => e.type === "CountdownReset");
  assert.ok(countdownEvent);
  assert.equal(countdownEvent.countdownId, "countdown-floor-1-collapse");
});

test("projectObservations returns latest observations across Floor 1-2 with provenance and boundary rules", () => {
  const rawTimeline = compileRawFloorFiles([rawFloor1, rawFloor2]);

  // Test exact anchor observation retrieval and provenance
  const obsAtSeq = projectObservations(rawTimeline, 5);
  assert.ok(obsAtSeq.condition);
  assert.ok(obsAtSeq.attributes);
  assert.ok(obsAtSeq.xpProgress);
  assert.ok(obsAtSeq.broadcast);
  assert.ok(obsAtSeq.inventory);
  assert.ok(obsAtSeq.equipment);

  // Check discrete scalar behavior (level remains stepwise, non-interpolated)
  const levelThreeSequence = rawTimeline.events.find((event) => event.id === "evt-f1-level-3").sequence;
  const levelTwoSequence = rawTimeline.events.find((event) => event.id === "evt-f1-level-2").sequence;
  const levelObs = projectObservationValue(rawTimeline, Math.floor((levelTwoSequence + levelThreeSequence) / 2), "xp-progress.level");
  assert.equal(levelObs, null, "discrete levels must not be linearly interpolated between sequence anchors");

  const levelProjected = projectObservations(rawTimeline, levelThreeSequence).xpProgress.level;
  assert.ok(levelProjected);
  assert.equal(levelProjected.status, "stated");
  assert.equal(levelProjected.basis, "exact-observation");
  assert.equal(levelProjected.value, 3, "stepwise fallback preserves latest stated level of 3");

  // Check boundary rules for interpolation:
  // Interpolation must not cross floor boundary
  const crossFloorDoc = JSON.parse(JSON.stringify(rawFloor1));
  const f2Doc = JSON.parse(JSON.stringify(rawFloor2));

  crossFloorDoc.observations.push({
    id: "obs-f1-interp-end",
    kind: "crawler-condition",
    eventId: crossFloorDoc.events[crossFloorDoc.events.length - 2].id,
    interpolation: "linear",
    currentHealth: 1000,
    evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
  });
  f2Doc.observations.push({
    id: "obs-f2-interp-start",
    kind: "crawler-condition",
    eventId: f2Doc.events[0].id,
    interpolation: "linear",
    currentHealth: 2000,
    evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
  });

  const compiledCrossFloor = compileRawFloorFiles([crossFloorDoc, f2Doc]);
  const targetBetweenFloors = compiledCrossFloor.events.find((event) => event.id === crossFloorDoc.events[crossFloorDoc.events.length - 1].id).sequence;
  const hpInterp = projectObservationValue(compiledCrossFloor, targetBetweenFloors, "crawler-condition.currentHealth");
  assert.equal(hpInterp, null, "interpolation must not cross floor boundaries");

  // Interpolation must not cross countdown phase break
  const phaseBreakDoc = JSON.parse(JSON.stringify(rawFloor1));
  const eventId1 = phaseBreakDoc.events[0].id;
  const eventId2 = phaseBreakDoc.events[2].id;

  phaseBreakDoc.observations.push(
    {
      id: "obs-p1-start",
      kind: "crawler-condition",
      eventId: eventId1,
      interpolation: "linear",
      currentMana: 100,
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "obs-p1-end",
      kind: "crawler-condition",
      eventId: eventId2,
      interpolation: "linear",
      currentMana: 200,
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    }
  );

  // Insert CountdownReset between event 1 and 2
  phaseBreakDoc.events[1] = {
    id: phaseBreakDoc.events[1].id,
    type: "CountdownReset",
    countdownId: "countdown-floor-1-collapse",
    newRemainingSeconds: 500000,
    position: phaseBreakDoc.events[1].position,
    summary: "Countdown reset event",
    evidence: phaseBreakDoc.events[1].evidence,
  };

  const compiledPhaseBreak = compileRawFloorFiles([phaseBreakDoc]);
  const phaseBreakSequence = compiledPhaseBreak.events.find((event) => event.id === phaseBreakDoc.events[1].id).sequence;
  const manaInterp = projectObservationValue(compiledPhaseBreak, phaseBreakSequence, "crawler-condition.currentMana");
  assert.equal(manaInterp, null, "interpolation must not cross countdown phase breaks");

  // Verify that observation projection does not alter causal event state or countdown projection
  const causalStateBefore = projectState(rawTimeline, 10);
  const countdownStateBefore = projectCountdownState(rawTimeline, 10, 1);
  projectObservations(rawTimeline, 10);
  assert.deepEqual(projectState(rawTimeline, 10), causalStateBefore);
  assert.deepEqual(projectCountdownState(rawTimeline, 10, 1), countdownStateBefore);
});


test("raw event and observation IDs enforce their schema namespaces", () => {
  const badEvent = structuredClone(rawFloor1);
  badEvent.events[0].id = "event-f1-invalid";
  assert.equal(validateRawCrawlerFloor(badEvent).valid, false);

  const badObservation = structuredClone(rawFloor1);
  if (!badObservation.observations?.length) throw new Error("fixture needs observations");
  badObservation.observations[0].id = "reading-f1-invalid";
  assert.equal(validateRawCrawlerFloor(badObservation).valid, false);
});

test("raw event IDs must match their authored floor ordinal", () => {
  const doc = structuredClone(rawFloor1);
  const originalId = doc.events[0].id;
  const wrongFloorId = originalId.replace(/^evt-f1-/, "evt-f2-");
  doc.events[0].id = wrongFloorId;
  for (const observation of doc.observations || []) {
    if (observation.eventId === originalId) observation.eventId = wrongFloorId;
  }
  const validation = validateRawCrawlerFloor(doc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("must use prefix \"evt-f1-\"")));
});
