import { test } from "node:test";
import assert from "node:assert";

// Simple benchmark to measure the O(N) array lookup vs Map lookup performance

const inventorySize = 10000;
const iterations = 1000;
const slots = [
  "HEAD",
  "FACE",
  "NECK",
  "TORSO",
  "WRISTS",
  "RING",
  "WAIST",
  "LEGS",
  "FEET",
  "SPECIAL",
];

test("Performance Benchmark: Array.find vs Map.get for Inventory", () => {
  // 1. Setup mock inventory
  const inventory = [];
  const equippedSlots = {};

  for (let i = 0; i < inventorySize; i++) {
    const item = {
      instanceId: `item-${i}`,
      name: `Item ${i}`,
      category: "EQUIPMENT",
      slot: slots[i % slots.length]
    };
    inventory.push(item);

    // Equip the last item for each slot
    if (i >= inventorySize - 10) {
      equippedSlots[item.slot] = item.instanceId;
    }
  }

  // Baseline: O(N) Array.find
  const startArray = performance.now();
  let dummyCount = 0;
  for (let it = 0; it < iterations; it++) {
    for (const [name] of slots.map(s => [s])) {
      const occupantId = equippedSlots[name];
      const occupant = inventory.find((item) => item.instanceId === occupantId);
      if (occupant) dummyCount++;
    }
  }
  const endArray = performance.now();
  const timeArray = endArray - startArray;

  // Optimized: Map.get
  const startMapSetup = performance.now();
  // Map initialization (happens once per render/memo)
  const map = new Map();
  for (const item of inventory) {
    if (item.instanceId) map.set(item.instanceId, item);
  }

  const startMapLookup = performance.now();
  for (let it = 0; it < iterations; it++) {
    for (const [name] of slots.map(s => [s])) {
      const occupantId = equippedSlots[name];
      const occupant = occupantId ? map.get(occupantId) : undefined;
      if (occupant) dummyCount++;
    }
  }
  const endMap = performance.now();
  const timeMapLookup = endMap - startMapLookup;
  const timeMapTotal = endMap - startMapSetup; // Includes Map build time

  console.log(`\n--- BENCHMARK RESULTS (Inventory Size: ${inventorySize}, Iterations: ${iterations}) ---`);
  console.log(`Baseline (Array.find):    ${timeArray.toFixed(2)} ms`);
  console.log(`Optimized (Map build):    ${(startMapLookup - startMapSetup).toFixed(2)} ms`);
  console.log(`Optimized (Map lookup):   ${timeMapLookup.toFixed(2)} ms`);
  console.log(`Optimized (Total):        ${timeMapTotal.toFixed(2)} ms`);

  const speedup = (timeArray / timeMapTotal).toFixed(2);
  console.log(`Speedup (Total time):     ${speedup}x`);

  assert.ok(timeMapTotal < timeArray, "Map approach should be faster than Array.find for large inventory");
  assert.ok(dummyCount > 0, "Benchmark should access matched occupants");
});
