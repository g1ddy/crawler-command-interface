import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { compileFloorFiles } from "../app/domain/compiler.ts";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline.ts";
import { projectCountdownState, projectState } from "../app/domain/projection.ts";
import { adaptRawFloorDocument } from "../app/domain/raw-adapter.ts";
import { compileRawFloorFiles } from "../app/domain/raw-compiler.ts";
import { validateCrawlerFloor, validateRawCrawlerFloor, validateCrawlerTimeline } from "../app/domain/validation.ts";

const legacyFloor1 = JSON.parse(fs.readFileSync("data/floors/floor-1.json", "utf8"));
const legacyFloor2 = JSON.parse(fs.readFileSync("data/floors/floor-2.json", "utf8"));
const rawFloor1 = JSON.parse(fs.readFileSync("data/raw/floors/floor-1.json", "utf8"));
const rawFloor2 = JSON.parse(fs.readFileSync("data/raw/floors/floor-2.json", "utf8"));

function stableTimeline(doc) {
  const clone = JSON.parse(JSON.stringify(doc));
  delete clone.timeline.createdAt;
  delete clone.timeline.updatedAt;
  return clone;
}

test("raw Floor 1 and Floor 2 documents validate and adapt losslessly to the legacy floor contract", () => {
  for (const [raw, legacy] of [[rawFloor1, legacyFloor1], [rawFloor2, legacyFloor2]]) {
    const validation = validateRawCrawlerFloor(raw);
    assert.equal(validation.valid, true, validation.errors.join("; "));
    assert.deepEqual(adaptRawFloorDocument(raw), legacy);
  }
});

test("raw adapter preserves every compiled timeline projection and countdown result", () => {
  const legacyTimeline = compileFloorFiles([legacyFloor1, legacyFloor2]);
  const rawTimeline = compileRawFloorFiles([rawFloor1, rawFloor2]);

  assert.deepEqual(stableTimeline(rawTimeline), stableTimeline(legacyTimeline));
  assert.deepEqual(stableTimeline(compiledTimeline), stableTimeline(rawTimeline));

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
  assert.ok(duplicateValidation.errors.some((error) => error.includes("duplicate anchor order")));

  const legacyIncrease = JSON.parse(JSON.stringify(legacyFloor2));
  legacyIncrease.countdowns[0].references[1].remainingSeconds = 600000;
  const legacyValidation = validateCrawlerFloor(legacyIncrease);
  assert.equal(legacyValidation.valid, false);
  assert.ok(legacyValidation.errors.some((error) => error.includes("increases from")));
});

test("countdown phase breaks permit a later reset observation without interpolation", () => {
  const resetCountdown = JSON.parse(JSON.stringify(rawFloor2));
  const resetEvent = resetCountdown.events[1];
  resetCountdown.events[1] = {
    id: resetEvent.id,
    order: resetEvent.order,
    type: "CountdownReset",
    countdownId: "countdown-floor-2-collapse",
    newRemainingSeconds: 600000,
    position: resetEvent.position,
    summary: "The countdown reset before the next phase.",
    evidence: resetEvent.evidence,
  };
  resetCountdown.observations[1].remainingSeconds = 600000;

  const validation = validateRawCrawlerFloor(resetCountdown);
  assert.equal(validation.valid, true, validation.errors.join("; "));

  const compiled = compileRawFloorFiles([resetCountdown]);
  assert.equal(projectCountdownState(compiled, 2, 2), null, "a phase boundary must not be interpolated across");
  const resetReference = projectCountdownState(compiled, 4, 2);
  assert.ok(resetReference);
  assert.equal(resetReference.status, "stated");
  assert.equal(resetReference.remainingSeconds, 600000);
});

test("Phase 2: raw schema accepts all expanded HUD event variants and rejects malformed payloads", () => {
  const rawDoc = JSON.parse(JSON.stringify(rawFloor1));
  let nextOrder = rawDoc.events.length + 1;

  rawDoc.events.push(
    {
      id: "evt-f1-phase2-attr",
      order: nextOrder++,
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
      order: nextOrder++,
      type: "ConditionChanged",
      currentHealth: 2000,
      healthDelta: -1100,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Took 1100 damage",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-xp",
      order: nextOrder++,
      type: "XPChanged",
      xp: 25000,
      xpDelta: 3500,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Gained 3500 XP",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-disc",
      order: nextOrder++,
      type: "ItemDiscarded",
      itemInstanceId: "inst-f1-trollskin-shirt",
      reason: "Torn beyond repair",
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Discarded torn shirt",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-qty",
      order: nextOrder++,
      type: "ItemQuantityChanged",
      itemInstanceId: "inst-f1-goblin-copper-chopper",
      delta: 1,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Acquired second chopper",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-quest",
      order: nextOrder++,
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
      order: nextOrder++,
      type: "HotlistUpdated",
      skillId: "sk-f1-power-strike",
      index: 1,
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Set Power Strike to hotlist slot 1",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-effexp",
      order: nextOrder++,
      type: "EffectExpired",
      effectId: "eff-f1-potion-buff",
      reason: "Duration ran out",
      position: { floor: 1, book: 1, chapter: 15 },
      summary: "Potion buff expired",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-phase2-cdreset",
      order: nextOrder++,
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
      order: nextOrder++,
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
  const nextOrder = rawDoc.events.length + 1;

  rawDoc.events.push({
    id: "evt-f1-reset-no-keyword",
    order: nextOrder,
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
  let nextOrder = rawDoc.events.length + 1;

  rawDoc.events.push(
    {
      id: "evt-f1-p2-hp",
      order: nextOrder++,
      type: "ConditionChanged",
      currentHealth: 1200,
      maxHealth: 2000,
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "Carl's HP drops to 1200",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-xp",
      order: nextOrder++,
      type: "XPChanged",
      xp: 28000,
      maxXp: 80000,
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "XP observed at 28000 / 80000",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-attr",
      order: nextOrder++,
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
      order: nextOrder++,
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
      order: nextOrder++,
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
      order: nextOrder++,
      type: "ItemDiscarded",
      itemInstanceId: "inst-f1-toe-ring",
      reason: "Discarded toe ring",
      position: { floor: 1, book: 1, chapter: 20 },
      summary: "Discarded toe ring",
      evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
    },
    {
      id: "evt-f1-p2-cdreset",
      order: nextOrder++,
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
