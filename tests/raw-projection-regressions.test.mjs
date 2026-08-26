import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { compileRawFloorFiles } from "../app/domain/raw-compiler.ts";
import { applyEvent, createInitialState } from "../app/domain/projection.ts";
import { validateCrawlerTimeline, validateRawCrawlerFloor } from "../app/domain/validation.ts";

const rawFloor1 = JSON.parse(fs.readFileSync("data/raw/floors/floor-1.json", "utf8"));
const rawFloor2 = JSON.parse(fs.readFileSync("data/raw/floors/floor-2.json", "utf8"));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function appendRawEvent(doc, event) {
  const maxOrder = Math.max(...doc.events.map((entry) => entry.order));
  doc.events.push({
    id: `evt-regression-${maxOrder + 1}`,
    order: maxOrder + 1,
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
  assert.deepEqual(targeted.hotlist, ["skill-a", "skill-c", "skill-c"]);
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
