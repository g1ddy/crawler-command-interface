import assert from "node:assert/strict";
import test from "node:test";

import { compileRawFloorFiles } from "../../app/domain/raw-compiler.ts";
import { applyEvent, createInitialState, projectState } from "../../app/domain/projection.ts";
import { deriveCrawlerPresentation } from "../../src/features/crawler/crawler-presentation.ts";
import { loadRawFloorDocument } from "../../app/domain/raw-loader.ts";
import { validateCrawlerTimeline, validateRawCrawlerFloor } from "../../app/domain/validation.ts";

const rawFloor1 = loadRawFloorDocument("floor-1");
const rawFloor2 = loadRawFloorDocument("floor-2");
const rawFloor3 = loadRawFloorDocument("floor-3");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function appendRawEvent(doc, event) {
  doc.events.push({
    id: `evt-f${doc.floor.ordinal}-regression-${doc.events.length + 1}`,
    position: { floor: doc.floor.ordinal, book: doc.floor.book },
    summary: "Regression fixture event",
    evidence: [{ sourceId: doc.sources[0].id, confidence: "confirmed" }],
    ...event,
  });
}

function assertInvalidWith(validation, fragment) {
  assert.equal(validation.valid, false, "fixture should be rejected");
  assert.ok(
    validation.errors.some((error) => error.includes(fragment)),
    `expected an error containing ${JSON.stringify(fragment)}; got: ${validation.errors.join("; ")}`
  );
}

test("countdown lifecycle events require a known countdownId", () => {
  const missingId = clone(rawFloor1);
  appendRawEvent(missingId, { type: "CountdownReset", newRemainingSeconds: 500000 });
  assertInvalidWith(validateRawCrawlerFloor(missingId), "countdownId");

  const unknownId = clone(rawFloor1);
  appendRawEvent(unknownId, {
    type: "CountdownReset",
    countdownId: "countdown-does-not-exist",
    newRemainingSeconds: 500000,
  });
  assertInvalidWith(validateRawCrawlerFloor(unknownId), 'references countdownId "countdown-does-not-exist"');
});

test("a lifecycle event for one countdown cannot break monotonicity for another countdown", () => {
  const timeline = compileRawFloorFiles([clone(rawFloor2)]);
  assert.ok(timeline.countdowns?.length, "Floor 2 must compile at least one countdown");

  const target = timeline.countdowns[0];
  assert.ok(target.references.length >= 2, "fixture needs at least two countdown references");
  const pairIndex = target.references.findIndex((reference, index) => index > 0 && reference.sequence - target.references[index - 1].sequence > 1);
  assert.ok(pairIndex > 0, "fixture needs a countdown-reference pair separated by an event");
  const first = target.references[pairIndex - 1];
  const second = target.references[pairIndex];
  const between = timeline.events.find(
    (event) => event.sequence > first.sequence && event.sequence < second.sequence
  );
  assert.ok(between, "fixture needs an event between the first two countdown references");

  const other = clone(target);
  other.id = `${target.id}-other`;
  other.title = `${target.title} Other`;
  timeline.countdowns.push(other);

  const boundaryIndex = timeline.events.findIndex((event) => event.id === between.id);
  timeline.events[boundaryIndex] = {
    id: between.id,
    sequence: between.sequence,
    type: "CountdownReset",
    countdownId: other.id,
    newRemainingSeconds: first.remainingSeconds,
    position: between.position,
    summary: "Regression countdown reset boundary",
    evidence: between.evidence,
  };
  target.references[pairIndex].remainingSeconds = first.remainingSeconds + 1;

  assertInvalidWith(validateCrawlerTimeline(timeline), "increases from");

  timeline.events[boundaryIndex].countdownId = target.id;
  const matchingBoundary = validateCrawlerTimeline(timeline);
  assert.equal(matchingBoundary.valid, true, matchingBoundary.errors.join("; "));
});

test("HotlistUpdated validation rejects incomplete payloads and accepts both supported forms", () => {
  const cases = [
    [{}, false],
    [{ skillId: "skill-regression" }, false],
    [{ index: 0 }, false],
    [{ hotlist: ["skill-a", "skill-b"] }, true],
    [{ skillId: "skill-regression", index: 0 }, true],
  ];

  for (const [payload, expectedValid] of cases) {
    const doc = clone(rawFloor1);
    appendRawEvent(doc, { type: "HotlistUpdated", ...payload });
    const validation = validateRawCrawlerFloor(doc);
    assert.equal(
      validation.valid,
      expectedValid,
      `${JSON.stringify(payload)} => ${validation.errors.join("; ")}`
    );
  }
});

test("HotlistUpdated accepted forms reach projection and mutate the hotlist", () => {
  const initial = createInitialState({
    crawler: { name: "CARL", level: 1, attributes: {}, condition: {} },
    skills: [
      { skillId: "skill-a", name: "A" },
      { skillId: "skill-b", name: "B" },
      { skillId: "skill-c", name: "C" },
    ],
  });

  const replacement = applyEvent(initial, {
    sequence: 1,
    type: "HotlistUpdated",
    hotlist: ["skill-c", "skill-a"],
    summary: "Replace hotlist",
  });
  assert.deepEqual(replacement.hotlist, ["skill-c", "skill-a"]);

  const targeted = applyEvent(initial, {
    sequence: 1,
    type: "HotlistUpdated",
    skillId: "skill-c",
    index: 1,
    summary: "Update one hotlist slot",
  });
  assert.equal(targeted.hotlist.length, 10);
  assert.equal(targeted.hotlist[1], "skill-c");
  assert.equal(targeted.hotlist.filter(Boolean).length, 1);
});

function equippedStackState(quantity = 3) {
  const state = createInitialState({
    crawler: { name: "CARL", level: 1, attributes: {}, condition: {} },
    inventory: [{
      instanceId: "inst-stack",
      itemId: "item-stack",
      name: "Stackable Equipment",
      category: "equipment",
      slot: "RING",
      quantity,
    }],
  });
  return applyEvent(state, {
    sequence: 1,
    type: "ItemEquipped",
    itemInstanceId: "inst-stack",
    slot: "RING",
    summary: "Equip stack",
  });
}

function assertEquipmentConsistent(state, instanceId) {
  const item = state.inventory.find((entry) => entry.instanceId === instanceId);
  const slots = Object.entries(state.equippedSlots)
    .filter(([, equippedId]) => equippedId === instanceId)
    .map(([slot]) => slot);
  assert.equal(Boolean(item?.isEquipped), slots.length > 0);
}

test("partial ItemDiscarded preserves equipment state for a remaining stack", () => {
  const result = applyEvent(equippedStackState(), {
    sequence: 2,
    type: "ItemDiscarded",
    itemInstanceId: "inst-stack",
    quantity: { known: true, value: 1 },
    summary: "Discard one",
  });

  const item = result.inventory.find((entry) => entry.instanceId === "inst-stack");
  assert.ok(item);
  assert.equal(item.quantity, 2);
  assert.equal(item.isEquipped, true);
  assert.equal(result.equippedSlots.RING, "inst-stack");
  assertEquipmentConsistent(result, "inst-stack");
});

test("full and unquantified ItemDiscarded clear every equipment reference", () => {
  for (const quantity of [{ known: true, value: 3 }, undefined]) {
    const event = {
      sequence: 2,
      type: "ItemDiscarded",
      itemInstanceId: "inst-stack",
      summary: "Discard stack",
    };
    if (quantity !== undefined) event.quantity = quantity;

    const result = applyEvent(equippedStackState(), event);
    assert.equal(result.inventory.some((entry) => entry.instanceId === "inst-stack"), false);
    assert.equal(result.equippedSlots.RING, null);
    assertEquipmentConsistent(result, "inst-stack");
  }
});

test("initial production projection leaves unsourced attributes and stats unset without default baselines of 10", () => {
  const doc = compileRawFloorFiles([clone(rawFloor1)]);
  const initial = createInitialState(doc.initialState);

  for (const attr of ["Strength", "Dexterity", "Constitution", "Intelligence", "Charisma"]) {
    assert.equal(
      initial.crawler.attributes[attr],
      undefined,
      `attribute ${attr} should be undefined in initial state`
    );
  }

  assert.equal(initial.crawler.level, null, "initial level should be null when unsourced");
  assert.equal(initial.crawler.xp, undefined, "initial xp should be undefined when unsourced");
  assert.equal(initial.crawler.maxXp, undefined, "initial maxXp should be undefined when unsourced");
  assert.equal(initial.crawler.availableAttributePoints, undefined, "initial stat points should be undefined");

  assert.equal(initial.crawler.condition.currentHealth, null);
  assert.equal(initial.crawler.condition.maxHealth, null);
  assert.equal(initial.crawler.condition.currentMana, null);
  assert.equal(initial.crawler.condition.maxMana, null);
  assert.equal(initial.crawler.condition.currentStamina, null);
  assert.equal(initial.crawler.condition.maxStamina, null);
});

test("authored crawler stats become visible strictly at their sequence and do not leak backward", () => {
  const testEvents = [
    { sequence: 1, type: "NarrativeEvent", summary: "Sequence 1 event" },
    { sequence: 2, type: "LevelChanged", level: 2, summary: "Reached Level 2" },
    { sequence: 3, type: "NarrativeEvent", summary: "Sequence 3 event" },
  ];

  const initialState = createInitialState();
  assert.equal(initialState.crawler.level, null, "Initial level must be null");

  const seq1State = projectState(testEvents, 1, [], initialState);
  assert.equal(seq1State.crawler.level, null, "Level must remain null at sequence 1 prior to LevelChanged");

  const seq2State = projectState(testEvents, 2, [], initialState);
  assert.equal(seq2State.crawler.level, 2, "Level must equal 2 at sequence 2");

  const seq3State = projectState(testEvents, 3, [], initialState);
  assert.equal(seq3State.crawler.level, 2, "Level must remain 2 at sequence 3");

  const replayedSeq1 = projectState(testEvents, 1, [], initialState);
  assert.equal(replayedSeq1.crawler.level, null, "Replaying sequence 1 must remain null and not leak backward");
});

test("production Floor 3 projection keeps unobserved effects unknown and does not infer an empty list on expiry", () => {
  const effectDoc = clone(rawFloor3);
  appendRawEvent(effectDoc, { id: "evt-f3-regression-effect-pre", type: "NarrativeEvent", kind: "other", summary: "No effect state reported" });
  appendRawEvent(effectDoc, {
    id: "evt-f3-regression-effect-applied", type: "EffectApplied", effectId: "eff-f3-poison",
    name: "Minor Poison", effectType: "bad", durationSeconds: 30,
    summary: "Poison begins",
  });
  appendRawEvent(effectDoc, { id: "evt-f3-regression-effect-omitted", type: "NarrativeEvent", kind: "other", summary: "Later event omits effects payload" });
  appendRawEvent(effectDoc, { id: "evt-f3-regression-effect-expired", type: "EffectExpired", effectId: "eff-f3-poison", summary: "Poison wears off" });

  const timeline = compileRawFloorFiles([effectDoc]);
  const sequenceOf = (id) => {
    const event = timeline.events.find((entry) => entry.id === id);
    assert.ok(event, `compiled production timeline should contain ${id}`);
    return event.sequence;
  };
  const preSequence = sequenceOf("evt-f3-regression-effect-pre");
  const appliedSequence = sequenceOf("evt-f3-regression-effect-applied");
  const omittedSequence = sequenceOf("evt-f3-regression-effect-omitted");
  const expiredSequence = sequenceOf("evt-f3-regression-effect-expired");
  const emptyObs = { xpProgress: {}, attributes: {}, condition: {} };
  const present = (sequence) => deriveCrawlerPresentation(projectState(timeline, sequence), emptyObs);

  const before = present(preSequence);
  assert.equal(before.effects.status, "unavailable");
  assert.equal(before.effects.harmful.length, 0);

  const applied = present(appliedSequence);
  assert.equal(applied.effects.status, "unavailable");
  assert.equal(applied.effects.harmful.length, 1);
  assert.equal(applied.effects.harmful[0].effectId, "eff-f3-poison");

  const omitted = present(omittedSequence);
  assert.equal(omitted.effects.status, "unavailable");
  assert.equal(omitted.effects.harmful.length, 1);
  assert.equal(omitted.effects.harmful[0].effectId, "eff-f3-poison");

  const expired = present(expiredSequence);
  assert.equal(expired.effects.status, "unavailable");
  assert.equal(expired.effects.harmful.length, 0);

  const replayedBefore = present(preSequence);
  assert.equal(replayedBefore.effects.status, "unavailable");
  assert.equal(replayedBefore.effects.harmful.length, 0);
});
