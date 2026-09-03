import assert from "node:assert/strict";
import test from "node:test";
import { getFloorEndSequence } from "../../app/domain/floors.ts";

test("getFloorEndSequence returns fallback when events array is empty", () => {
  const result = getFloorEndSequence([], 1, 100);
  assert.equal(result, 100);
});

test("getFloorEndSequence returns fallback when no events match the floor", () => {
  const events = [
    { sequence: 10, position: { floor: 2 } },
    { sequence: 20, position: { floor: 3 } },
  ];
  const result = getFloorEndSequence(events, 1, 100);
  assert.equal(result, 100);
});

test("getFloorEndSequence returns the highest sequence for the matching floor", () => {
  const events = [
    { sequence: 110, position: { floor: 1 } },
    { sequence: 130, position: { floor: 1 } },
    { sequence: 120, position: { floor: 1 } },
  ];
  const result = getFloorEndSequence(events, 1, 100);
  assert.equal(result, 130);
});

test("getFloorEndSequence handles mixed floors and returns the highest for the matching floor", () => {
  const events = [
    { sequence: 110, position: { floor: 1 } },
    { sequence: 120, position: { floor: 2 } },
    { sequence: 130, position: { floor: 1 } },
    { sequence: 140, position: { floor: 3 } },
    { sequence: 125, position: { floor: 1 } },
  ];
  const result = getFloorEndSequence(events, 1, 100);
  assert.equal(result, 130);
});

test("getFloorEndSequence handles malformed events gracefully (missing position or floor)", () => {
  const events = [
    { sequence: 110 }, // missing position
    { sequence: 120, position: {} }, // missing floor
    { sequence: 130, position: { floor: 1 } },
  ];

  // Checking floor 1 should find the sequence 130
  const result1 = getFloorEndSequence(events, 1, 100);
  assert.equal(result1, 130);

  // Checking floor 2 should return fallback
  const result2 = getFloorEndSequence(events, 2, 100);
  assert.equal(result2, 100);
});
