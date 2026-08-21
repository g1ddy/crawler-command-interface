import assert from "node:assert/strict";
import test from "node:test";
import { floor6Events, floor6Snapshots } from "../app/domain/fixtures/floor6.ts";
import { projectState, createInitialState } from "../app/domain/projection.ts";
import { getStatBreakdown } from "../app/domain/stats.ts";

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
  // At sequence 30, Rogue Hood (+4 Dex) and Tracker Boots (+6 Dex) are equipped
  const state = projectState(floor6Events, 30, floor6Snapshots);
  const dexBreakdown = getStatBreakdown(state, "Dexterity");
  assert.equal(dexBreakdown.baseValue, 34);
  assert.equal(dexBreakdown.gearContributions.length, 2); // Hood + Boots
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
  // Sequence 9 adds 8 vials, Seq 27 consumes 1, Seq 28 consumes 1 -> 6 remaining
  const state = projectState(floor6Events, 28, floor6Snapshots);
  const vial = state.inventory.find((i) => i.instanceId === "inst-heal-vial");
  assert.ok(vial);
  assert.equal(vial.quantity, 6);
});
