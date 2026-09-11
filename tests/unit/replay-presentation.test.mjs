import assert from "node:assert/strict";
import test from "node:test";
import { deriveReplayPresentation } from "../../src/shell/replay/replay-presentation.ts";

const sampleEvents = [
  { sequence: 1, position: { floor: 1 }, type: "NarrativeEvent", summary: "Entered Floor 1", occurred_at: "2025-01-01T10:00:00Z" },
  { sequence: 5, position: { floor: 1 }, type: "ItemAcquired", summary: "Found Sword", occurred_at: "2025-01-01T10:05:00Z" },
  { sequence: 10, position: { floor: 2 }, type: "NarrativeEvent", summary: "Entered Floor 2", occurred_at: "2025-01-01T10:10:00Z" },
  { sequence: 15, position: { floor: 2 }, type: "NarrativeEvent", summary: "Cleared Floor 2", occurred_at: "2025-01-01T10:15:00Z" },
];

const sampleFloors = [
  { id: "floor-1", ordinal: 1, title: "The Beginning", startSequence: 1, endSequence: 5 },
  { id: "floor-2", ordinal: 2, title: "Deep Descent", startSequence: 10, endSequence: 15 },
];

const sampleCountdowns = [
  { id: "cd-floor-collapse", target: "floor-collapse", title: "Floor Collapse", floor: 1, durationSeconds: 600, references: [{ sequence: 1, remainingSeconds: 600, evidence: [] }] },
  { id: "cd-boss-spawn", target: "boss-spawn", title: "Boss Spawn", floor: 1, durationSeconds: 300, references: [{ sequence: 1, remainingSeconds: 300, evidence: [] }] },
];

test("mode reflects explicit Live and Replay states without UI label inference", () => {
  const livePres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: 2,
    selectedSequence: 15,
    isLive: true,
  });

  assert.equal(livePres.mode, "live");
  assert.equal(livePres.isLive, true);
  assert.equal(livePres.commands.canReturnToLive, false);

  const replayPres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: 2,
    selectedSequence: 5,
    isLive: false,
  });

  assert.equal(replayPres.mode, "replay");
  assert.equal(replayPres.isLive, false);
  assert.equal(replayPres.commands.canReturnToLive, true);
});

test("scope correctly identifies available floors, current floor, and sequence bounds", () => {
  const floor1Pres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: 1,
    selectedSequence: 5,
    isLive: false,
  });

  assert.equal(floor1Pres.scope.availableFloors.length, 2);
  assert.equal(floor1Pres.scope.currentFloorSegment?.title, "The Beginning");
  assert.equal(floor1Pres.scope.previousFloorOrdinal, null);
  assert.equal(floor1Pres.scope.nextFloorOrdinal, 2);
  assert.equal(floor1Pres.commands.canSelectPreviousFloor, false);
  assert.equal(floor1Pres.commands.canSelectNextFloor, true);
  assert.deepEqual(floor1Pres.scope.scopedSequences, [1, 5]);
  assert.equal(floor1Pres.scope.minSequence, 1);
  assert.equal(floor1Pres.scope.maxSequence, 5);

  const allFloorsPres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: "all",
    selectedSequence: 10,
    isLive: false,
  });

  assert.equal(allFloorsPres.scope.currentFloorSegment, null);
  assert.equal(allFloorsPres.commands.canSelectPreviousFloor, false);
  assert.equal(allFloorsPres.commands.canSelectNextFloor, false);
  assert.deepEqual(allFloorsPres.scope.scopedSequences, [1, 5, 10, 15]);
});

test("stepping limits and sequence navigation boundaries operate deterministically", () => {
  const startPres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: "all",
    selectedSequence: 1,
    isLive: false,
  });

  assert.equal(startPres.position.currentIndex, 0);
  assert.equal(startPres.commands.canStepPrevious, false);
  assert.equal(startPres.commands.canStepNext, true);
  assert.equal(startPres.position.previousSequence, null);
  assert.equal(startPres.position.nextSequence, 5);

  const midPres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: "all",
    selectedSequence: 5,
    isLive: false,
  });

  assert.equal(midPres.position.currentIndex, 1);
  assert.equal(midPres.commands.canStepPrevious, true);
  assert.equal(midPres.commands.canStepNext, true);
  assert.equal(midPres.position.previousSequence, 1);
  assert.equal(midPres.position.nextSequence, 10);
  assert.equal(midPres.position.closestSequence(7), 5);
  assert.equal(midPres.position.closestSequence(9), 10);

  const endPres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: "all",
    selectedSequence: 15,
    isLive: true,
  });

  assert.equal(endPres.position.currentIndex, 3);
  assert.equal(endPres.commands.canStepPrevious, true);
  assert.equal(endPres.commands.canStepNext, false);
  assert.equal(endPres.position.previousSequence, 10);
  assert.equal(endPres.position.nextSequence, null);
});

test("countdowns isolate primary floor collapse from secondary target countdowns", () => {
  const countdownPres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    countdowns: sampleCountdowns,
    selectedFloorOrdinal: 1,
    selectedSequence: 5,
    isLive: false,
  });

  assert.equal(countdownPres.countdowns.hasActiveCountdown, true);
  assert.equal(countdownPres.countdowns.activeCountdown?.id, "cd-floor-collapse");
  assert.equal(countdownPres.countdowns.hasSecondaryCountdowns, true);
  assert.equal(countdownPres.countdowns.secondaryCountdowns[0]?.id, "cd-boss-spawn");
});

test("source-honest availability handles empty inputs without inventing data", () => {
  const emptyPres = deriveReplayPresentation({
    events: [],
    selectedFloorOrdinal: 1,
    selectedSequence: 1,
    isLive: true,
  });

  assert.equal(emptyPres.availability.hasEvents, false);
  assert.equal(emptyPres.availability.hasFloorEvents, false);
  assert.equal(emptyPres.availability.hasScopedSequences, false);
  assert.equal(emptyPres.position.currentEvent, undefined);
  assert.equal(emptyPres.countdowns.hasActiveCountdown, false);
  assert.equal(emptyPres.countdowns.hasSecondaryCountdowns, false);
  assert.deepEqual(emptyPres.scope.scopedSequences, []);
});

test("minimal alternate replay consumer uses model without ReplaySurface", () => {
  // Simulate a minimal alternate shell strip or compact player component
  function renderMinimalReplayStrip(model) {
    return {
      statusText: `${model.mode.toUpperCase()} MODE - SEQ #${model.position.selectedSequence}`,
      floorText: model.scope.currentFloorSegment ? model.scope.currentFloorSegment.title : "ALL FLOORS",
      prevEnabled: model.commands.canStepPrevious,
      nextEnabled: model.commands.canStepNext,
      returnLiveEnabled: model.commands.canReturnToLive,
      countdownLabel: model.countdowns.activeCountdown?.formattedLabel ?? "NO COUNTDOWN",
    };
  }

  const model = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    countdowns: sampleCountdowns,
    selectedFloorOrdinal: 1,
    selectedSequence: 5,
    isLive: false,
  });

  const output = renderMinimalReplayStrip(model);
  assert.equal(output.statusText, "REPLAY MODE - SEQ #5");
  assert.equal(output.floorText, "The Beginning");
  assert.equal(output.prevEnabled, true);
  assert.equal(output.nextEnabled, false);
  assert.equal(output.returnLiveEnabled, true);
});
