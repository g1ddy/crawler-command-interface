import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { compileFloorFiles } from "../app/domain/compiler.ts";
import { projectCountdownState, formatCountdownDuration } from "../app/domain/projection.ts";
import { getFloorEndSequence } from "../app/domain/floors.ts";

const floor1AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-1.json", "utf8"));
const floor2AuthoredDoc = JSON.parse(fs.readFileSync("data/floors/floor-2.json", "utf8"));
const compiledDoc = compileFloorFiles([floor1AuthoredDoc, floor2AuthoredDoc]);

test("formatCountdownDuration formats exact and estimated durations properly", () => {
  assert.equal(formatCountdownDuration(417600, false), "4d 20h left");
  assert.equal(formatCountdownDuration(417600, true), "~4d 20h left");
  assert.equal(formatCountdownDuration(169200, false), "1d 23h left");
  assert.equal(formatCountdownDuration(3600, false), "1h left");
  assert.equal(formatCountdownDuration(150, false), "2m 30s left");
  assert.equal(formatCountdownDuration(0, false), "0s left");
  assert.equal(formatCountdownDuration(0, true), "~0s left");
});

test("Floor 1's authored collapse-clock references are visible at their exact sequences", () => {
  // Exact reference 1 at sequence 4
  const stateSeq4 = projectCountdownState(compiledDoc, 4, 1);
  assert.ok(stateSeq4);
  assert.equal(stateSeq4.status, "stated");
  assert.equal(stateSeq4.basis, "exact-reference");
  assert.equal(stateSeq4.remainingSeconds, 417600);
  assert.equal(stateSeq4.formattedLabel, "4d 20h left · stated");
  assert.equal(stateSeq4.referencePoints.length, 1);
  assert.equal(stateSeq4.referencePoints[0].sequence, 4);

  // Exact reference 2 at sequence 11
  const stateSeq11 = projectCountdownState(compiledDoc, 11, 1);
  assert.ok(stateSeq11);
  assert.equal(stateSeq11.status, "stated");
  assert.equal(stateSeq11.remainingSeconds, 266400);
  assert.equal(stateSeq11.referencePoints[0].sequence, 11);

  // Exact reference at sequence 15
  const stateSeq15 = projectCountdownState(compiledDoc, 15, 1);
  assert.ok(stateSeq15);
  assert.equal(stateSeq15.status, "stated");
  assert.equal(stateSeq15.basis, "exact-reference");
  assert.equal(stateSeq15.remainingSeconds, 169200);
  assert.equal(stateSeq15.formattedLabel, "1d 23h left · stated");
  assert.equal(stateSeq15.referencePoints.length, 1);
  assert.equal(stateSeq15.referencePoints[0].sequence, 15);
});

test("timeline shows an estimate only between stated references and not before or after", () => {
  // Before first reference (seq 1, 2, 3)
  assert.equal(projectCountdownState(compiledDoc, 1, 1), null);
  assert.equal(projectCountdownState(compiledDoc, 3, 1), null);

  // Between references (seq 10, bounded by the newly authored seq 11 reference)
  const stateSeq10 = projectCountdownState(compiledDoc, 10, 1);
  assert.ok(stateSeq10);
  assert.equal(stateSeq10.status, "estimated");
  assert.equal(stateSeq10.referencePoints.length, 2);
  assert.equal(stateSeq10.referencePoints[0].sequence, 4);
  assert.equal(stateSeq10.referencePoints[1].sequence, 11);

  // Sequence 16 is now an exact reference; only sequences after it lack a supported estimate.
  const stateSeq16 = projectCountdownState(compiledDoc, 16, 1);
  assert.ok(stateSeq16);
  assert.equal(stateSeq16.status, "stated");
  assert.equal(stateSeq16.remainingSeconds, 169200);
  assert.equal(projectCountdownState(compiledDoc, 19, 1), null);
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

  // At sequence 20: elapsed time is 700s out of total 1000s (from 100s to 1100s). Fraction = 600/1000 = 0.6.
  // Sequence fraction would be (20-10)/(30-10) = 0.5.
  // Elapsed duration calculation should produce remaining = 10000 - 0.6 * 10000 = 4000s.
  const elapsedEstimate = projectCountdownState(docWithElapsed, 20, 1);
  assert.ok(elapsedEstimate);
  assert.equal(elapsedEstimate.basis, "elapsed-duration");
  assert.equal(elapsedEstimate.remainingSeconds, 4000);
  assert.equal(elapsedEstimate.confidence, "confirmed");

  // Remove elapsedSeconds to test sequence-position fallback
  const docWithoutElapsed = JSON.parse(JSON.stringify(docWithElapsed));
  delete docWithoutElapsed.events[0].position.elapsedSeconds;

  const sequenceEstimate = projectCountdownState(docWithoutElapsed, 20, 1);
  assert.ok(sequenceEstimate);
  assert.equal(sequenceEstimate.basis, "sequence-position");
  assert.equal(sequenceEstimate.confidence, "low-confidence");
  assert.equal(sequenceEstimate.remainingSeconds, 5000); // 0.5 fraction -> 5000s
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
    ],
    countdowns: [
      {
        id: "cd-1",
        title: "Test Countdown",
        floor: 1,
        target: "floor-collapse",
        references: [
          { sequence: 10, remainingSeconds: 1000, evidence: [{ sourceId: "src-1" }] },
          { sequence: 30, remainingSeconds: 2000, evidence: [{ sourceId: "src-1" }] }, // non-monotonic increase
        ],
      },
    ],
  };

  assert.equal(projectCountdownState(nonMonotonicDoc, 20, 1), null);

  // Test pause/resume break
  const pausedDoc = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "tl-test", title: "Test", story: { id: "dungeon-crawler-carl", title: "Story" } },
    sources: [{ id: "src-1", kind: "official-text", trust: "primary", title: "S1", url: "https://example.com" }],
    initialState: { crawler: { name: "CARL", level: 1, attributes: {}, condition: {} } },
    events: [
      { id: "e1", sequence: 10, type: "NarrativeEvent", position: { floor: 1 }, summary: "Start", evidence: [{ sourceId: "src-1" }] },
      { id: "e2", sequence: 20, type: "NarrativeEvent", position: { floor: 1 }, summary: "Countdown paused by system", evidence: [{ sourceId: "src-1" }] },
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

  // Append a new live event to Floor 1
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

  // Historical sequence 4 remains exact stated reference
  const stateSeq4 = projectCountdownState({ events, countdowns: compiledDoc.countdowns }, 4, 1);
  assert.ok(stateSeq4);
  assert.equal(stateSeq4.status, "stated");
  assert.equal(stateSeq4.remainingSeconds, 417600);
});
