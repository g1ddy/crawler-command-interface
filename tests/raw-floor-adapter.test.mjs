import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { compileFloorFiles } from "../app/domain/compiler.ts";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline.ts";
import { projectCountdownState, projectState } from "../app/domain/projection.ts";
import { adaptRawFloorDocument } from "../app/domain/raw-adapter.ts";
import { compileRawFloorFiles } from "../app/domain/raw-compiler.ts";
import { validateCrawlerFloor, validateRawCrawlerFloor } from "../app/domain/validation.ts";

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
