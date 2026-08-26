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
const floor2References = compiledDoc.countdowns
  .find((countdown) => countdown.id === "countdown-floor-2-collapse")
  .references;
const floor2EntryCountdownSequence = floor2References.find((r) => r.activationOffset === -7200).sequence;
const floor2MidFloorCountdownSequence = floor2References.find((r) => r.remainingSeconds === 360000).sequence;

test("formatCountdownDuration formats scheduled, active, and completed durations properly", () => {
  assert.equal(formatCountdownDuration(518400, false, -7200, "scheduled"), "COUNTDOWN STARTS IN 2h");
  assert.equal(formatCountdownDuration(518400, true, -7200, "scheduled"), "COUNTDOWN STARTS IN ~2h");
  assert.equal(formatCountdownDuration(417600, false, undefined, "active"), "4d 20h left");
  assert.equal(formatCountdownDuration(417600, true, undefined, "active"), "~4d 20h left");
  assert.equal(formatCountdownDuration(169200, false), "1d 23h left");
  assert.equal(formatCountdownDuration(3600, false), "1h left");
  assert.equal(formatCountdownDuration(150, false), "2m 30s left");
  assert.equal(formatCountdownDuration(0, false), "0s left");
  assert.equal(formatCountdownDuration(0, true), "~0s left");
});

test("projection at pre-activation sequence returns scheduled countdown state with starts-in display", () => {
  const earlyAccessSeq = compiledDoc.events.find((e) => e.id === "evt-f2-001-early-access").sequence;
  const enteredSeq = compiledDoc.events.find((e) => e.id === "evt-f2-001-entered").sequence;
  const startSeq = compiledDoc.events.find((e) => e.id === "evt-f2-001-countdown-start").sequence;

  const earlyAccessState = projectCountdownState(compiledDoc, earlyAccessSeq, 2);
  assert.ok(earlyAccessState);
  assert.equal(earlyAccessState.lifecycleStatus, "scheduled");
  assert.equal(earlyAccessState.status, "stated");
  assert.equal(earlyAccessState.activationOffset, -21600);
  assert.equal(earlyAccessState.remainingSeconds, 540000);
  assert.equal(earlyAccessState.formattedTime, "COUNTDOWN STARTS IN 6h");
  assert.equal(earlyAccessState.formattedLabel, "COUNTDOWN STARTS IN 6h · scheduled");
  assert.equal(earlyAccessState.formattedTime.includes("left"), false);

  const arrivalState = projectCountdownState(compiledDoc, enteredSeq, 2);
  assert.ok(arrivalState);
  assert.equal(arrivalState.lifecycleStatus, "scheduled");
  assert.equal(arrivalState.activationOffset, -7200);
  assert.equal(arrivalState.formattedTime, "COUNTDOWN STARTS IN 2h");
  assert.equal(arrivalState.formattedTime.includes("left"), false);

  const activeState = projectCountdownState(compiledDoc, startSeq, 2);
  assert.ok(activeState);
  assert.equal(activeState.lifecycleStatus, "active");
  assert.equal(activeState.status, "stated");
  assert.equal(activeState.activationOffset, 0);
  assert.equal(activeState.remainingSeconds, 518400);
  assert.equal(activeState.formattedTime, "6d 0h left");
  assert.equal(activeState.formattedLabel, "6d 0h left · stated");
});

test("validation rejects negative remainingSeconds while accepting valid activationOffset", () => {
  const invalidNegativeRemaining = {
    $schema: "https://g1ddy.github.io/crawler-command-interface/schema/crawler-floor.v2.schema.json",
    authoringVersion: "crawler-floor/v2",
    storyId: "dungeon-crawler-carl",
    floor: { id: "floor-neg-test", ordinal: 1, title: "Neg Test", book: 1, continuity: "canonical", coverage: { kind: "partial", statement: "Test", completeness: "partial" } },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    catalog: { items: [], achievements: [] },
    events: [{ id: "e1", order: 1, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Obs", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] }],
    countdowns: [{ id: "cd-neg", title: "Neg Countdown", target: "floor-collapse", references: [{ anchorOrder: 1, remainingSeconds: -500, evidence: [{ sourceId: "src-1", confidence: "confirmed" }] }] }],
  };

  const res = validateCrawlerFloor(invalidNegativeRemaining);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some((err) => err.includes("must be >= 0") || err.includes("remainingSeconds")));
});

test("Floor 1's authored collapse-clock opening reference is visible at its exact sequence", () => {
  const state = projectCountdownState(compiledDoc, floor1CountdownSequence, 1);
  assert.ok(state);
  assert.equal(state.status, "stated");
  assert.equal(state.basis, "exact-reference");
  assert.equal(state.remainingSeconds, 432000);
  assert.equal(state.formattedLabel, "5d 0h left · stated");
  assert.equal(state.referencePoints.length, 1);
  assert.equal(state.referencePoints[0].sequence, floor1CountdownSequence);
});

test("evidence boundary: returns null before the first sourced countdown reference", () => {
  assert.equal(projectCountdownState(compiledDoc, 0, 1), null);

  // Sequence 1 is also before Floor 2's first countdown reference (early access)
  const earlyAccessSeq = compiledDoc.events.find((e) => e.id === "evt-f2-001-early-access").sequence;
  assert.equal(projectCountdownState(compiledDoc, earlyAccessSeq - 1, 2), null);
});

test("scheduled countdown references retain time-to-collapse as well as time-to-activation", () => {
  const earlyAccessSeq = compiledDoc.events.find((e) => e.id === "evt-f2-001-early-access").sequence;
  const enteredSeq = compiledDoc.events.find((e) => e.id === "evt-f2-001-entered").sequence;

  const earlyAccessState = projectCountdownState(compiledDoc, earlyAccessSeq, 2);
  assert.ok(earlyAccessState);
  assert.equal(earlyAccessState.lifecycleStatus, "scheduled");
  assert.equal(earlyAccessState.remainingSeconds, 540000);

  const arrivalState = projectCountdownState(compiledDoc, enteredSeq, 2);
  assert.ok(arrivalState);
  assert.equal(arrivalState.lifecycleStatus, "scheduled");
  assert.equal(arrivalState.remainingSeconds, 525600);
});

test("scheduled after-final extrapolation advances activationOffset toward zero while remainingSeconds remains constant", () => {
  const docWithScheduledEnd = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "tl-scheduled-test", title: "Scheduled Timeline", story: { id: "dungeon-crawler-carl", title: "Story" } },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    initialState: { crawler: { name: "CARL", level: 1, attributes: {}, condition: {} } },
    events: [
      { id: "e1", sequence: 10, type: "NarrativeEvent", position: { floor: 2 }, summary: "First early access", evidence: [{ sourceId: "src-1" }] },
      { id: "e2", sequence: 20, type: "NarrativeEvent", position: { floor: 2 }, summary: "Second early access", evidence: [{ sourceId: "src-1" }] },
      { id: "e3", sequence: 30, type: "NarrativeEvent", position: { floor: 2 }, summary: "Later sequence", evidence: [{ sourceId: "src-1" }] },
    ],
    countdowns: [
      {
        id: "cd-sched",
        title: "Scheduled Extrapolation Test",
        floor: 2,
        target: "floor-collapse",
        references: [
          { sequence: 10, remainingSeconds: 518400, activationOffset: -20000, evidence: [{ sourceId: "src-1" }] },
          { sequence: 20, remainingSeconds: 518400, activationOffset: -10000, evidence: [{ sourceId: "src-1" }] },
        ],
      },
    ],
  };

  const extrapolated = projectCountdownState(docWithScheduledEnd, 25, 2);
  assert.ok(extrapolated);
  assert.equal(extrapolated.lifecycleStatus, "scheduled");
  assert.equal(extrapolated.status, "estimated");
  assert.equal(extrapolated.remainingSeconds, 518400); // Collapse duration remains unchanged
  assert.equal(extrapolated.activationOffset, -5000); // Advanced from -10000 toward 0
});

test("Floor 1 retains sourced readings through its collapse anchor", () => {
  const stated = projectCountdownState(compiledDoc, floor1CountdownSequence, 1);
  assert.ok(stated);
  assert.equal(stated.status, "stated");
  assert.equal(stated.remainingSeconds, 432000);
  const collapseSequence = compiledDoc.events.find((event) => event.id === "evt-f1-countdown-collapse").sequence;
  const collapse = projectCountdownState(compiledDoc, collapseSequence, 1);
  assert.ok(collapse);
  assert.equal(collapse.remainingSeconds, 0);
  assert.equal(collapse.status, "stated");
});

test("Floor 2's authored collapse-clock references are monotonic", () => {
  const stateSeq20 = projectCountdownState(compiledDoc, floor2EntryCountdownSequence, 2);
  assert.ok(stateSeq20);
  assert.equal(stateSeq20.status, "stated");
  assert.equal(stateSeq20.lifecycleStatus, "scheduled");
  assert.equal(stateSeq20.remainingSeconds, 525600);
  assert.equal(stateSeq20.activationOffset, -7200);

  const stateSeq23 = projectCountdownState(compiledDoc, floor2MidFloorCountdownSequence, 2);
  assert.ok(stateSeq23);
  assert.equal(stateSeq23.status, "stated");
  assert.equal(stateSeq23.lifecycleStatus, "active");
  assert.equal(stateSeq23.remainingSeconds, 360000);

  const lastKnown = projectCountdownState(compiledDoc, compiledDoc.floors.find((floor) => floor.ordinal === 2).endSequence, 2);
  assert.ok(lastKnown);
  assert.equal(lastKnown.status, "stated");
  assert.equal(lastKnown.remainingSeconds, 0);
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
      { id: "e4", sequence: 35, type: "CountdownReset", countdownId: "cd-1", newRemainingSeconds: 5000, position: { floor: 1 }, summary: "Countdown reset by system", evidence: [{ sourceId: "src-1" }] },
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
  assert.equal(state.remainingSeconds, 432000);
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
