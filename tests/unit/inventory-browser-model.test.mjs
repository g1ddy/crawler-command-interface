import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveSelectedInventoryItem,
  visibleInventoryItems,
} from "../../src/features/inventory/inventoryItemBrowserModel.ts";

const items = [
  {
    instanceId: "older",
    itemId: "older",
    name: "Alpha Item",
    icon: "A",
    rarity: "common",
    category: "consumable",
    quantity: 1,
    maxStack: 1,
    value: 10,
    description: "older",
    acquiredAtSequence: 2,
    source: "test",
  },
  {
    instanceId: "newer",
    itemId: "newer",
    name: "Beta Item",
    icon: "B",
    rarity: "rare",
    category: "consumable",
    quantity: 1,
    maxStack: 1,
    value: 20,
    description: "newer",
    acquiredAtSequence: 8,
    source: "test",
  },
];

test("default selection follows the visible sort order", () => {
  const newest = visibleInventoryItems(items, "ALL ITEMS", "", "newest");
  assert.equal(resolveSelectedInventoryItem(newest, null)?.instanceId, "newer");

  const oldest = visibleInventoryItems(items, "ALL ITEMS", "", "oldest");
  assert.equal(resolveSelectedInventoryItem(oldest, null)?.instanceId, "older");
});

test("search moves selection to a visible item when the selected item is hidden", () => {
  const visible = visibleInventoryItems(items, "ALL ITEMS", "Alpha", "newest");

  assert.deepEqual(
    visible.map((item) => item.instanceId),
    ["older"],
  );
  assert.equal(resolveSelectedInventoryItem(visible, "newer")?.instanceId, "older");
});

test("an explicitly selected visible item remains selected across sort changes", () => {
  const visible = visibleInventoryItems(items, "ALL ITEMS", "", "oldest");
  assert.equal(resolveSelectedInventoryItem(visible, "newer")?.instanceId, "newer");
});
