import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { compileFloorFiles } from "../app/domain/compiler.ts";
import { applyEvent, createInitialState } from "../app/domain/projection.ts";
import { deriveAwardHistory } from "../src/features/inventory/awardHistory.ts";

const floor1AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-1.json", "utf8"));

test("compiler preserves missing authored item rarity as unknown", () => {
  const compiled = compileFloorFiles([floor1AuthoredDoc]);
  const acquired = compiled.events.find((event) => event.id === "evt-f1-trollskin-shirt");

  assert.ok(acquired);
  assert.ok("item" in acquired && acquired.item);
  assert.equal(acquired.item.rarity, "unknown");
});

test("ItemAcquired does not manufacture missing presentation metadata", () => {
  const projected = applyEvent(createInitialState(), {
    id: "evt-unsourced-item",
    sequence: 1,
    type: "ItemAcquired",
    position: { floor: 1 },
    summary: "An item is acquired with only its identity and quantity sourced.",
    evidence: [],
    item: {
      instanceId: "inst-unsourced-item",
      itemId: "item-unsourced",
      name: "Sourced Name Only",
      quantity: { known: true, value: 1 },
    },
  });

  const item = projected.inventory.find((candidate) => candidate.instanceId === "inst-unsourced-item");
  assert.ok(item);
  assert.equal(item.rarity, "unknown");
  assert.equal(item.category, "miscellaneous");
  assert.equal(item.maxStack, "NOT SOURCED");
  assert.equal(item.value, 0);
  assert.equal(item.source, "Source not provided");
});

test("award history excludes ordinary loot boxes without achievement causation", () => {
  const events = [
    {
      id: "evt-ordinary-box",
      sequence: 1,
      type: "ItemAcquired",
      item: {
        instanceId: "inst-ordinary-box",
        name: "Ordinary Loot Box",
        category: "box",
        rarity: "bronze",
      },
    },
  ];

  assert.deepEqual(deriveAwardHistory(events, 1, []), []);
});

test("award history requires causation to resolve to a preceding AchievementUnlocked event", () => {
  const events = [
    {
      id: "evt-not-achievement",
      sequence: 1,
      type: "NarrativeEvent",
      achievement: { title: "Looks achievement-like" },
    },
    {
      id: "evt-invalid-award",
      sequence: 2,
      type: "ItemAcquired",
      causationId: "evt-not-achievement",
      item: {
        instanceId: "inst-invalid-award",
        name: "Invalid Award Box",
        category: "box",
        rarity: "silver",
      },
    },
    {
      id: "evt-late-achievement",
      sequence: 4,
      type: "AchievementUnlocked",
      achievement: { title: "Too Late" },
    },
    {
      id: "evt-causation-points-forward",
      sequence: 3,
      type: "ItemAcquired",
      causationId: "evt-late-achievement",
      item: {
        instanceId: "inst-forward-award",
        name: "Forward-Caused Box",
        category: "box",
        rarity: "gold",
      },
    },
  ];

  assert.deepEqual(deriveAwardHistory(events, 4, []), []);
});

test("award history is replay-bounded and records opening only after it occurs", () => {
  const events = [
    {
      id: "evt-achievement",
      sequence: 2,
      type: "AchievementUnlocked",
      achievement: { title: "Early Adopter" },
    },
    {
      id: "evt-award-box",
      sequence: 3,
      type: "ItemAcquired",
      causationId: "evt-achievement",
      item: {
        instanceId: "inst-award-box",
        name: "Silver Adventurer Box",
        category: "box",
        rarity: "silver",
      },
    },
    {
      id: "evt-open-box",
      sequence: 5,
      type: "ItemDiscarded",
      itemInstanceId: "inst-award-box",
      reason: "opened",
    },
  ];
  const inventory = [{ instanceId: "inst-award-box" }];

  assert.deepEqual(deriveAwardHistory(events, 2, inventory), []);

  const beforeOpening = deriveAwardHistory(events, 3, inventory);
  assert.equal(beforeOpening.length, 1);
  assert.equal(beforeOpening[0].achievementTitle, "Early Adopter");
  assert.equal(beforeOpening[0].achievementSequence, 2);
  assert.equal(beforeOpening[0].awardedAtSequence, 3);
  assert.equal(beforeOpening[0].openedAtSequence, undefined);

  const afterOpening = deriveAwardHistory(events, 5, []);
  assert.equal(afterOpening.length, 1);
  assert.equal(afterOpening[0].openedAtSequence, 5);
  assert.equal(afterOpening[0].isInInventory, false);
});
