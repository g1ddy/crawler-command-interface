import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { compileFloorFiles } from "../app/domain/compiler.ts";
import { projectCountdownState, formatCountdownDuration } from "../app/domain/projection.ts";
import { getFloorEndSequence } from "../app/domain/floors.ts";
import { validateCrawlerFloor, validateCrawlerTimeline } from "../app/domain/validation.ts";

const floor1AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-1.json", "utf8"));
const floor2AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-2.json", "utf8"));
const compiledDoc = compileFloorFiles([floor1AuthoredDoc, floor2AuthoredDoc]);
const floor1CountdownSequence = compiledDoc.countdowns.find((countdown) => countdown.id === "countdown-floor-1-collapse").references[0].sequence;
const [floor2EntryCountdownSequence, floor2MidFloorCountdownSequence] = compiledDoc.countdowns
  .find((countdown) => countdown.id === "countdown-floor-2-collapse")
  .references.map((reference) => reference.sequence);

test("formatCountdownDuration formats exact and estimated durations properly", () => {
  assert.equal(formatCountdownDuration(417600, false), "4d 20h left");
  assert.equal(formatCountdownDuration(417600, true), "~4d 20h left");
  assert.equal(formatCountdownDuration(169200, false), "1d 23h left");
  assert.equal(formatCountdownDuration(3600, false), "1h left");
  assert.equal(formatCountdownDuration(150, false), "2m 30s left");
  assert.equal(formatCountdownDuration(0, false), "0s left");
  assert.equal(formatCountdownDuration(0, true), "~0s left");
});

test("Floor 1's authored collapse-clock reference is visible at its exact sequence", () => {
  const state = projectCountdownState(compiledDoc, floor1CountdownSequence, 1);
  assert.ok(state);
  assert.equal(state.status, "stated");
  assert.equal(state.basis, "exact-reference");
  assert.equal(state.remainingSeconds, 237600);
  assert.equal(state.formattedLabel, "2d 18h left · stated");
  assert.equal(state.referencePoints.length, 1);
  assert.equal(state.referencePoints[0].sequence, floor1CountdownSequence);
});

test("timeline retains Floor 1's last known reading without extrapolating it", () => {
  assert.equal(projectCountdownState(compiledDoc, 1, 1), null);
  assert.equal(projectCountdownState(compiledDoc, floor1CountdownSequence - 1, 1), null);

  const stated = projectCountdownState(compiledDoc, floor1CountdownSequence, 1);
  assert.ok(stated);
  assert.equal(stated.status, "stated");
  assert.equal(stated.remainingSeconds, 237600);

  const lastKnown = projectCountdownState(compiledDoc, floor1CountdownSequence + 1, 1);
  assert.ok(lastKnown);
  assert.equal(lastKnown.status, "stated");
  assert.equal(lastKnown.isStale, true);
  assert.equal(lastKnown.basis, "last-known-reference");
  assert.equal(lastKnown.remainingSeconds, 237600);
  assert.equal(lastKnown.formattedLabel, "2d 18h left · stated (latest source)");
  assert.equal(lastKnown.referencePoints.length, 1);
  assert.equal(lastKnown.referencePoints[0].sequence, floor1CountdownSequence);
});

test("Floor 2's authored collapse-clock references are monotonic", () => {
  const stateSeq20 = projectCountdownState(compiledDoc, floor2EntryCountdownSequence, 2);
  assert.ok(stateSeq20);
  assert.equal(stateSeq20.status, "stated");
  assert.equal(stateSeq20.remainingSeconds, 536400);

  const stateSeq23 = projectCountdownState(compiledDoc, floor2MidFloorCountdownSequence, 2);
  assert.ok(stateSeq23);
  assert.equal(stateSeq23.status, "stated");
  assert.equal(stateSeq23.remainingSeconds, 360000);

  const estimatedState = projectCountdownState(compiledDoc, floor2EntryCountdownSequence + 1, 2);
  assert.ok(estimatedState);
  assert.equal(estimatedState.status, "estimated");
  assert.ok(estimatedState.remainingSeconds < stateSeq20.remainingSeconds);
  assert.ok(estimatedState.remainingSeconds > stateSeq23.remainingSeconds);
  const lastKnown = projectCountdownState(compiledDoc, compiledDoc.floors.find((floor) => floor.ordinal === 2).endSequence, 2);
  assert.ok(lastKnown);
  assert.equal(lastKnown.status, "estimated");
  assert.equal(lastKnown.isStale, false);
  assert.equal(lastKnown.basis, "sequence-position-extrapolation");
  assert.ok(lastKnown.remainingSeconds < 360000);
  assert.equal(lastKnown.formattedTime.startsWith("~"), true);
});

test("prefers elapsed-duration calculations when timestamps are available; falls back to sequence-position with low-confidence", () => {
  const docWithElapsed = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "tl-test", title: "Test", story: { id: "dungeon-crawler-carl", title: "Story" } },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    initialState: { crawler: { name: "CARL", level: 1, attributes: {}, condition: {} } },
    events: [
      { id: "e1", sequence: 10, type: "NarrativeEvent", position: { floor: 1, elapsedSeconds: 100 }, summary: "Start", evidence: [{ sourceId: "src-1" }] },
      { id: "e2", sequence: 20, type: "NarrativeEvent", position: { floor: 1, elapsedSeconds: 700 }, summary: "Mid", evidence: [{ sourceId: "src-1" }] },
      { id: "e3", sequence: 30, type: "NarrativeEvent", position: { floor: 1, elapsedSeconds: 1100 }, summary: "End", evidence: [{ sourceId: "src-1" }] },
    ],
    countdowns: [
      {
        id: "cd-1",
        title: "Test Countdown",
        floor: 1,
        target: "floor-collapse",
        references: [
          { sequence: 10, remainingSeconds: 10000, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
          { sequence: 30, remainingSeconds: 0, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
        ],
      },
    ],
  };

  const elapsedEstimate = projectCountdownState(docWithElapsed, 20, 1);
  assert.ok(elapsedEstimate);
  assert.equal(elapsedEstimate.basis, "elapsed-duration");
  assert.equal(elapsedEstimate.remainingSeconds, 4000);
  assert.equal(elapsedEstimate.confidence, "confirmed");

  const docWithoutElapsed = JSON.parse(JSON.stringify(docWithElapsed));
  delete docWithoutElapsed.events[0].position.elapsedSeconds;

  const sequenceEstimate = projectCountdownState(docWithoutElapsed, 20, 1);
  assert.ok(sequenceEstimate);
  assert.equal(sequenceEstimate.basis, "sequence-position");
  assert.equal(sequenceEstimate.confidence, "low-confidence");
  assert.equal(sequenceEstimate.remainingSeconds, 5000);
});

test("returns null for non-monotonic (incompatible) references or pause/resume/phase breaks", () => {
  const nonMonotonicDoc = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "tl-test", title: "Test", story: { id: "dungeon-crawler-carl", title: "Story" } },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    initialState: { crawler: { name: "CARL", level: 1, attributes: {}, condition: {} } },
    events: [
      { id: "e1", sequence: 10, type: "NarrativeEvent", position: { floor: 1 }, summary: "Start", evidence: [{ sourceId: "src-1" }] },
      { id: "e2", sequence: 20, type: "NarrativeEvent", position: { floor: 1 }, summary: "Mid", evidence: [{ sourceId: "src-1" }] },
      { id: "e3", sequence: 30, type: "NarrativeEvent", position: { floor: 1 }, summary: "End", evidence: [{ sourceId: "src-1" }] },
      { id: "e4", sequence: 35, type: "CountdownReset", countdownId: "cd-1", newRemainingSeconds: 5000, position: { floor: 1 }, summary: "Countdown reset by system", evidence: [{ sourceId: "src-1" }] },
    ],
    countdowns: [
      {
        id: "cd-1",
        title: "Test Countdown",
        floor: 1,
        target: "floor-collapse",
        references: [
          { sequence: 10, remainingSeconds: 1000, evidence: [{ sourceId: "src-1" }] },
          { sequence: 30, remainingSeconds: 2000, evidence: [{ sourceId: "src-1" }] },
        ],
      },
    ],
  };

  assert.equal(projectCountdownState(nonMonotonicDoc, 20, 1), null);

  const pausedDoc = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "tl-test", title: "Test", story: { id: "dungeon-crawler-carl", title: "Story" } },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    initialState: { crawler: { name: "CARL", level: 1, attributes: {}, condition: {} } },
    events: [
      { id: "e1", sequence: 10, type: "NarrativeEvent", position: { floor: 1 }, summary: "Start", evidence: [{ sourceId: "src-1" }] },
      { id: "e2", sequence: 20, type: "CountdownPaused", countdownId: "cd-1", position: { floor: 1 }, summary: "Countdown paused by system", evidence: [{ sourceId: "src-1" }] },
      { id: "e3", sequence: 30, type: "NarrativeEvent", position: { floor: 1 }, summary: "End", evidence: [{ sourceId: "src-1" }] },
    ],
    countdowns: [
      {
        id: "cd-1",
        title: "Test Countdown",
        floor: 1,
        target: "floor-collapse",
        references: [
          { sequence: 10, remainingSeconds: 2000, evidence: [{ sourceId: "src-1" }] },
          { sequence: 30, remainingSeconds: 1000, evidence: [{ sourceId: "src-1" }] },
        ],
      },
    ],
  };

  assert.equal(projectCountdownState(pausedDoc, 15, 1), null);
  assert.equal(projectCountdownState(pausedDoc, 25, 1), null);
  assert.equal(projectCountdownState(pausedDoc, 40, 1), null);
});

test("imported timeline with no countdowns metadata returns null and handles floor navigation cleanly", () => {
  const legacyDoc = {
    schemaVersion: "crawler-timeline/v1",
    timeline: { id: "tl-legacy", title: "Legacy Timeline", story: { id: "dungeon-crawler-carl", title: "Story" } },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    initialState: { crawler: { name: "CARL", level: 1, attributes: {}, condition: {} } },
    events: [
      { id: "e1", sequence: 1, type: "NarrativeEvent", position: { floor: 1 }, summary: "Legacy Event 1", evidence: [{ sourceId: "src-1" }] },
      { id: "e2", sequence: 2, type: "NarrativeEvent", position: { floor: 1 }, summary: "Legacy Event 2", evidence: [{ sourceId: "src-1" }] },
    ],
  };

  assert.equal(projectCountdownState(legacyDoc, 1, 1), null);
  assert.equal(projectCountdownState(legacyDoc, 2, 1), null);

  const endSeq = getFloorEndSequence(legacyDoc.events, 1, 1);
  assert.equal(endSeq, 2);
});

test("live-action appends extend floor end sequence and preserve historical countdown state", () => {
  const events = [...compiledDoc.events];
  const lastSeq = events[events.length - 1].sequence;

  const appenedSeq = lastSeq + 1;
  const newEvent = {
    id: `evt-user-${appenedSeq}`,
    sequence: appenedSeq,
    type: "ItemEquipped",
    position: { floor: 1 },
    summary: "Carl equips live item",
    evidence: [{ sourceId: "src-book-1" }],
  };
  events.push(newEvent);

  const newEndSeq = getFloorEndSequence(events, 1, 19);
  assert.equal(newEndSeq, appenedSeq);

  const state = projectCountdownState({ events, countdowns: compiledDoc.countdowns }, floor1CountdownSequence, 1);
  assert.ok(state);
  assert.equal(state.status, "stated");
  assert.equal(state.remainingSeconds, 237600);
});

test("phase-aware countdown monotonicity accepts legitimate reset boundaries and rejects intra-phase increases", () => {
  const floorWithReset = {
    $schema: "https://g1ddy.github.io/crawler-command-interface/schema/crawler-floor.v2.schema.json",
    authoringVersion: "crawler-floor/v2",
    storyId: "dungeon-crawler-carl",
    floor: {
      id: "floor-reset-test",
      ordinal: 1,
      title: "Reset Floor",
      book: 1,
      bookTitle: "Book 1",
      continuity: "canonical",
      coverage: {
        kind: "curated-critical",
        statement: "Test floor coverage",
        completeness: "partial",
      },
    },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    catalog: { items: [], achievements: [] },
    events: [
      { id: "e1", order: 1, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Initial observation", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
      { id: "e2", order: 2, type: "CountdownReset", countdownId: "cd-reset", position: { floor: 1 }, summary: "System countdown reset for phase 2", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
      { id: "e3", order: 3, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Phase 2 observation", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
    ],
    countdowns: [
      {
        id: "cd-reset",
        title: "Phase Reset Countdown",
        target: "floor-collapse",
        references: [
          { anchorOrder: 1, remainingSeconds: 100, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
          { anchorOrder: 2, remainingSeconds: 500000, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
          { anchorOrder: 3, remainingSeconds: 400000, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
        ],
      },
    ],
  };

  const validFloorResult = validateCrawlerFloor(floorWithReset);
  assert.equal(validFloorResult.valid, true, validFloorResult.errors.join("; "));

  const floorWithoutReset = JSON.parse(JSON.stringify(floorWithReset));
  floorWithoutReset.events[1].type = "NarrativeEvent";
  floorWithoutReset.events[1].kind = "other";
  floorWithoutReset.events[1].summary = "Normal event without reset";
  delete floorWithoutReset.events[1].countdownId;

  const invalidFloorResult = validateCrawlerFloor(floorWithoutReset);
  assert.equal(invalidFloorResult.valid, false);
  assert.ok(invalidFloorResult.errors.some((err) => err.includes("increases from 100s at order #1 to 500000s at order #2")));

  const floorWithSecondIncrease = JSON.parse(JSON.stringify(floorWithReset));
  floorWithSecondIncrease.countdowns[0].references[2].remainingSeconds = 600000;

  const invalidSecondIncreaseResult = validateCrawlerFloor(floorWithSecondIncrease);
  assert.equal(invalidSecondIncreaseResult.valid, false);
  assert.ok(invalidSecondIncreaseResult.errors.some((err) => err.includes("increases from 500000s at order #2 to 600000s at order #3")));

  const timelineWithReset = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "tl-reset-test", title: "Reset Timeline", story: { id: "dungeon-crawler-carl", title: "Story" } },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    initialState: { crawler: { name: "CARL", level: 1, attributes: {}, condition: {} } },
    events: [
      { id: "te1", sequence: 10, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Initial observation", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
      { id: "te2", sequence: 20, type: "CountdownReset", countdownId: "cd-tl-reset", position: { floor: 1 }, summary: "Countdown reset by system", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
      { id: "te3", sequence: 30, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Subsequent observation", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
    ],
    countdowns: [
      {
        id: "cd-tl-reset",
        title: "Timeline Reset Countdown",
        floor: 1,
        target: "floor-collapse",
        references: [
          { sequence: 10, remainingSeconds: 200, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
          { sequence: 20, remainingSeconds: 600000, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
          { sequence: 30, remainingSeconds: 500000, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },
        ],
      },
    ],
  };

  const validTimelineResult = validateCrawlerTimeline(timelineWithReset);
  assert.equal(validTimelineResult.valid, true, validTimelineResult.errors.join("; "));

  const timelineWithoutReset = JSON.parse(JSON.stringify(timelineWithReset));
  timelineWithoutReset.events[1].type = "NarrativeEvent";
  timelineWithoutReset.events[1].kind = "other";
  timelineWithoutReset.events[1].summary = "Normal event without reset";
  delete timelineWithoutReset.events[1].countdownId;

  const invalidTimelineResult = validateCrawlerTimeline(timelineWithoutReset);
  assert.equal(invalidTimelineResult.valid, false);
  assert.ok(invalidTimelineResult.errors.some((err) => err.includes("increases from 200s at sequence #10 to 600000s at sequence #20")));
});
