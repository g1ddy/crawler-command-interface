import assert from "node:assert/strict";
import test from "node:test";
import { deriveReplayPresentation } from "../../src/features/timeline/replay-presentation.ts";

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

  const replayPres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: 2,
    selectedSequence: 5,
    isLive: false,
  });

  assert.equal(replayPres.mode, "replay");
  assert.equal(replayPres.isLive, false);
});

test("scope correctly identifies available floors, current floor, and sequence bounds globally", () => {
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
  // Scoped sequences are global across all events/floors
  assert.deepEqual(floor1Pres.scope.scopedSequences, [1, 5, 10, 15]);
  assert.equal(floor1Pres.scope.minSequence, 1);
  assert.equal(floor1Pres.scope.maxSequence, 15);

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

test("source-honest availability and inspection evaluate to false on empty inputs", () => {
  const emptyPres = deriveReplayPresentation({
    events: [],
    observations: [],
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
  assert.equal(emptyPres.inspection.hasFloorRules, false);
  assert.equal(emptyPres.inspection.hasTimelineHistory, false);
  assert.equal(emptyPres.inspection.hasTimelineEvidence, false);
  assert.deepEqual(emptyPres.scope.scopedSequences, []);
});

test("inspection booleans report true when source events and telemetry observations exist", () => {
  const populatedPres = deriveReplayPresentation({
    events: sampleEvents,
    observations: [{ id: "obs-1", kind: "crawler-condition", sequence: 1, payload: {}, evidence: [] }],
    selectedFloorOrdinal: 1,
    selectedSequence: 1,
    isLive: true,
  });

  assert.equal(populatedPres.inspection.hasFloorRules, true);
  assert.equal(populatedPres.inspection.hasTimelineHistory, true);
  assert.equal(populatedPres.inspection.hasTimelineEvidence, true);
});

test("minimal alternate replay consumer uses model without ReplaySurface", () => {
  function renderMinimalReplayStrip(model) {
    return {
      statusText: `${model.mode.toUpperCase()} MODE - SEQ #${model.position.selectedSequence}`,
      floorText: model.scope.currentFloorSegment ? model.scope.currentFloorSegment.title : "ALL FLOORS",
      prevEnabled: model.commands.canStepPrevious,
      nextEnabled: model.commands.canStepNext,
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
  assert.equal(output.nextEnabled, true);
});

test("Live edge when isLive is true produces LIVE mode and NOW temporal context", () => {
  const livePres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: 2,
    selectedSequence: 15,
    isLive: true,
  });

  assert.equal(livePres.mode, "live");
  assert.equal(livePres.isLive, true);
  assert.equal(livePres.position.elapsedTimeAgo, "NOW");
});

test("historical position before Live edge produces HISTORICAL status and valid elapsed label or TIME UNKNOWN", () => {
  const pres = deriveReplayPresentation({
    events: sampleEvents,
    floors: sampleFloors,
    selectedFloorOrdinal: 1,
    selectedSequence: 5,
    isLive: false,
  });

  assert.equal(pres.mode, "replay");
  assert.equal(pres.isLive, false);
  assert.equal(pres.position.elapsedTimeAgo, "TIME UNKNOWN");

  const floor6Events = [
    { sequence: 10, position: { floor: 6, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "Start" },
    { sequence: 20, position: { floor: 6, elapsedSeconds: 700 }, type: "NarrativeEvent", summary: "Mid" },
    { sequence: 30, position: { floor: 6, elapsedSeconds: 8140 }, type: "NarrativeEvent", summary: "End" },
  ];

  const validPres = deriveReplayPresentation({
    events: floor6Events,
    selectedFloorOrdinal: 6,
    selectedSequence: 10,
    isLive: false,
  });

  assert.equal(validPres.mode, "replay");
  assert.equal(validPres.isLive, false);
  assert.equal(validPres.position.elapsedTimeAgo, "2h 14m ago");
});

test("elapsed-time derivation is independent of event array ordering for shuffled inputs", () => {
  const ascendingEvents = [
    { sequence: 10, position: { floor: 6, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "Seq 10" },
    { sequence: 20, position: { floor: 6, elapsedSeconds: 700 }, type: "NarrativeEvent", summary: "Seq 20" },
    { sequence: 30, position: { floor: 6, elapsedSeconds: 8140 }, type: "NarrativeEvent", summary: "Seq 30" },
  ];

  const shuffledEvents = [
    { sequence: 30, position: { floor: 6, elapsedSeconds: 8140 }, type: "NarrativeEvent", summary: "Seq 30" },
    { sequence: 10, position: { floor: 6, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "Seq 10" },
    { sequence: 20, position: { floor: 6, elapsedSeconds: 700 }, type: "NarrativeEvent", summary: "Seq 20" },
  ];

  const ascPres = deriveReplayPresentation({
    events: ascendingEvents,
    selectedFloorOrdinal: 6,
    selectedSequence: 10,
    isLive: false,
  });

  const shufPres = deriveReplayPresentation({
    events: shuffledEvents,
    selectedFloorOrdinal: 6,
    selectedSequence: 10,
    isLive: false,
  });

  // Delta: 8140 - 100 = 8040s = 2h 14m
  assert.equal(ascPres.position.elapsedTimeAgo, "2h 14m ago");
  assert.equal(shufPres.position.elapsedTimeAgo, "2h 14m ago");
});

test("conflicting temporal coordinates at the same sequence yield TIME UNKNOWN regardless of event array order", () => {
  const conflictingEventsOrderA = [
    { sequence: 10, position: { floor: 6, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "Seq 10 A" },
    { sequence: 10, position: { floor: 6, elapsedSeconds: 200 }, type: "NarrativeEvent", summary: "Seq 10 B" },
    { sequence: 30, position: { floor: 6, elapsedSeconds: 8140 }, type: "NarrativeEvent", summary: "Seq 30" },
  ];

  const conflictingEventsOrderB = [
    { sequence: 10, position: { floor: 6, elapsedSeconds: 200 }, type: "NarrativeEvent", summary: "Seq 10 B" },
    { sequence: 10, position: { floor: 6, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "Seq 10 A" },
    { sequence: 30, position: { floor: 6, elapsedSeconds: 8140 }, type: "NarrativeEvent", summary: "Seq 30" },
  ];

  const presA = deriveReplayPresentation({
    events: conflictingEventsOrderA,
    selectedFloorOrdinal: 6,
    selectedSequence: 10,
    isLive: false,
  });

  const presB = deriveReplayPresentation({
    events: conflictingEventsOrderB,
    selectedFloorOrdinal: 6,
    selectedSequence: 10,
    isLive: false,
  });

  assert.equal(presA.position.elapsedTimeAgo, "TIME UNKNOWN");
  assert.equal(presB.position.elapsedTimeAgo, "TIME UNKNOWN");
});

test("historical position where selected event equals live event (sequence gap before max) yields TIME UNKNOWN", () => {
  const eventsWithGapBeforeMax = [
    { sequence: 10, position: { floor: 6, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "Start" },
    { sequence: 20, position: { floor: 6, elapsedSeconds: 700 }, type: "NarrativeEvent", summary: "Last Event" },
  ];
  // Observations add sequence 30 as maxSequence
  const observations = [
    { id: "obs-1", kind: "crawler-condition", sequence: 30, payload: {}, evidence: [] },
  ];

  // Selected sequence 25 (where selected event is sequence 20 and live event is sequence 20) in replay mode
  const pres = deriveReplayPresentation({
    events: eventsWithGapBeforeMax,
    observations,
    selectedFloorOrdinal: 6,
    selectedSequence: 25,
    isLive: false,
  });

  assert.equal(pres.mode, "replay");
  assert.equal(pres.isLive, false);
  assert.equal(pres.position.elapsedTimeAgo, "TIME UNKNOWN");
});

test("later observation beyond the last event prevents using a stale event as the Live time reference", () => {
  const events = [
    { sequence: 10, position: { floor: 6, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "Start" },
    { sequence: 20, position: { floor: 6, elapsedSeconds: 700 }, type: "NarrativeEvent", summary: "Last event" },
  ];
  const observations = [
    { id: "obs-live-edge", kind: "crawler-condition", sequence: 30, payload: {}, evidence: [] },
  ];

  const pres = deriveReplayPresentation({
    events,
    observations,
    selectedFloorOrdinal: 6,
    selectedSequence: 10,
    isLive: false,
  });

  assert.equal(pres.scope.maxSequence, 30);
  assert.equal(pres.position.elapsedTimeAgo, "TIME UNKNOWN");
});

test("non-finite elapsedSeconds coordinates yield TIME UNKNOWN without NaN or Infinity text", () => {
  const nanEvents = [
    { sequence: 10, position: { floor: 6, elapsedSeconds: NaN }, type: "NarrativeEvent", summary: "Start" },
    { sequence: 30, position: { floor: 6, elapsedSeconds: 8140 }, type: "NarrativeEvent", summary: "End" },
  ];

  const pres = deriveReplayPresentation({
    events: nanEvents,
    selectedFloorOrdinal: 6,
    selectedSequence: 10,
    isLive: false,
  });

  assert.equal(pres.position.elapsedTimeAgo, "TIME UNKNOWN");
});

test("historical position with valid same-floor elapsed coordinates displays exact relative duration", () => {
  const floor6Events = [
    { sequence: 10, position: { floor: 6, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "Start" },
    { sequence: 20, position: { floor: 6, elapsedSeconds: 700 }, type: "NarrativeEvent", summary: "Mid" },
    { sequence: 30, position: { floor: 6, elapsedSeconds: 8140 }, type: "NarrativeEvent", summary: "End" },
  ];

  const presSeq10 = deriveReplayPresentation({
    events: floor6Events,
    selectedFloorOrdinal: 6,
    selectedSequence: 10,
    isLive: false,
  });

  // Delta: 8140 - 100 = 8040s = 2h 14m
  assert.equal(presSeq10.position.elapsedTimeAgo, "2h 14m ago");

  const presSeq20 = deriveReplayPresentation({
    events: floor6Events,
    selectedFloorOrdinal: 6,
    selectedSequence: 20,
    isLive: false,
  });

  // Delta: 8140 - 700 = 7440s = 2h 4m
  assert.equal(presSeq20.position.elapsedTimeAgo, "2h 4m ago");
});

test("cross-floor positions do not produce a duration from floor-local elapsed coordinates and report TIME UNKNOWN", () => {
  const crossFloorEvents = [
    { sequence: 10, position: { floor: 1, elapsedSeconds: 100 }, type: "NarrativeEvent", summary: "F1" },
    { sequence: 20, position: { floor: 2, elapsedSeconds: 500 }, type: "NarrativeEvent", summary: "F2" },
  ];

  const pres = deriveReplayPresentation({
    events: crossFloorEvents,
    selectedFloorOrdinal: "all",
    selectedSequence: 10,
    isLive: false,
  });

  assert.equal(pres.position.elapsedTimeAgo, "TIME UNKNOWN");
});

test("missing or incomplete temporal data displays TIME UNKNOWN without fabricating duration", () => {
  const missingElapsedEvents = [
    { sequence: 1, position: { floor: 1 }, type: "NarrativeEvent", summary: "Seq 1" },
    { sequence: 50, position: { floor: 1 }, type: "NarrativeEvent", summary: "Seq 50" },
    { sequence: 100, position: { floor: 2 }, type: "NarrativeEvent", summary: "Seq 100" },
  ];

  const presSeq1 = deriveReplayPresentation({
    events: missingElapsedEvents,
    selectedFloorOrdinal: "all",
    selectedSequence: 1,
    isLive: false,
  });

  assert.equal(presSeq1.position.elapsedTimeAgo, "TIME UNKNOWN");

  const presSeq50 = deriveReplayPresentation({
    events: missingElapsedEvents,
    selectedFloorOrdinal: 1,
    selectedSequence: 50,
    isLive: false,
  });

  assert.equal(presSeq50.position.elapsedTimeAgo, "TIME UNKNOWN");
});

test("countdown resets, pauses, resumes, phase changes, or countdown references do not fabricate elapsed time", () => {
  const countdownEvents = [
    { sequence: 10, position: { floor: 1 }, type: "NarrativeEvent", summary: "Start" },
    { sequence: 20, position: { floor: 1 }, type: "CountdownReset", countdownId: "cd-1", newRemainingSeconds: 5000, summary: "Reset" },
    { sequence: 30, position: { floor: 1 }, type: "NarrativeEvent", summary: "End" },
  ];
  const countdownsWithRefs = [
    {
      id: "cd-1",
      title: "Test Countdown",
      floor: 1,
      target: "floor-collapse",
      references: [
        { sequence: 10, remainingSeconds: 10000, evidence: [] },
        { sequence: 30, remainingSeconds: 5000, evidence: [] },
      ],
    },
  ];

  const pres = deriveReplayPresentation({
    events: countdownEvents,
    countdowns: countdownsWithRefs,
    selectedFloorOrdinal: 1,
    selectedSequence: 10,
    isLive: false,
  });

  assert.equal(pres.position.elapsedTimeAgo, "TIME UNKNOWN");
});

test("sequence gaps alone never determine elapsed duration", () => {
  const largeSequenceGapEvents = [
    { sequence: 1, position: { floor: 1 }, type: "NarrativeEvent", summary: "First" },
    { sequence: 1000, position: { floor: 1 }, type: "NarrativeEvent", summary: "Thousandth" },
  ];

  const pres = deriveReplayPresentation({
    events: largeSequenceGapEvents,
    selectedFloorOrdinal: 1,
    selectedSequence: 1,
    isLive: false,
  });

  assert.equal(pres.position.elapsedTimeAgo, "TIME UNKNOWN");
});
