import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { compileFloorFiles } from "../app/domain/compiler.ts";
import { applyEvent, createInitialState } from "../app/domain/projection.ts";

const floor1AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-1.json", "utf8"));

test("compiler preserves missing authored item rarity as unknown", () => {
  const compiled = compileFloorFiles([floor1AuthoredDoc]);
  const acquired = compiled.events.find((event) => event.id === "evt-f1-006-trollskin-shirt");

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
