import assert from "node:assert/strict";
import test from "node:test";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline.ts";
import {
  projectObservationValue,
  projectObservations,
} from "../app/domain/observations.ts";

test("projectObservationValue produces exact stated fact when target sequence matches observation", () => {
  const magicSequence = compiledTimeline.events.find((event) => event.id === "evt-f1-006-trollskin-shirt").sequence;
  const projected = projectObservationValue(compiledTimeline, magicSequence, "crawler-condition.currentMana");
  assert.ok(projected);
  assert.equal(projected.status, "stated");
  assert.equal(projected.value, 3);
  assert.equal(projected.basis, "exact-observation");
  assert.deepEqual(projected.referenceObservationIds, ["obs-f1-magic-baseline"]);
  assert.ok(projected.evidence.length > 0);
});

test("projectObservationValue produces linear estimated value between two linear observation anchors", () => {
  const docWithLinear = {
    events: [
      { sequence: 10, position: { floor: 1, elapsedSeconds: 100 } },
      { sequence: 15, position: { floor: 1, elapsedSeconds: 150 } },
      { sequence: 20, position: { floor: 1, elapsedSeconds: 200 } },
    ],
    observations: [
      {
        id: "obs-hp-10",
        kind: "crawler-condition",
        sequence: 10,
        interpolation: "linear",
        currentHealth: 100,
        evidence: [{ sourceId: "src-book-1" }],
      },
      {
        id: "obs-hp-20",
        kind: "crawler-condition",
        sequence: 20,
        interpolation: "linear",
        currentHealth: 200,
        evidence: [{ sourceId: "src-book-1" }],
      },
    ],
  };

  const estimated = projectObservationValue(docWithLinear, 15, "crawler-condition.currentHealth");
  assert.ok(estimated);
  assert.equal(estimated.status, "estimated");
  assert.equal(estimated.value, 150);
  assert.equal(estimated.basis, "elapsed-duration");
  assert.deepEqual(estimated.referenceObservationIds, ["obs-hp-10", "obs-hp-20"]);
  assert.equal(estimated.evidence.length, 2);
});

test("discrete keys like level do not produce linear interpolation when target sequence is between samples", () => {
  const docWithDiscreteLevel = {
    events: [{ sequence: 10 }, { sequence: 15 }, { sequence: 20 }],
    observations: [
      {
        id: "obs-lvl-10",
        kind: "xp-progress",
        sequence: 10,
        interpolation: "linear",
        level: 5,
        evidence: [{ sourceId: "src-book-1" }],
      },
      {
        id: "obs-lvl-20",
        kind: "xp-progress",
        sequence: 20,
        interpolation: "linear",
        level: 10,
        evidence: [{ sourceId: "src-book-1" }],
      },
    ],
  };

  const discreteResult = projectObservationValue(docWithDiscreteLevel, 15, "xp-progress.level");
  assert.equal(discreteResult, null, "discrete keys like level must not interpolate");
});

test("absent observation keys return null without inventing values", () => {
  const projected = projectObservationValue(compiledTimeline, 1, "crawler-attributes.Bounty");
  assert.equal(projected, null, "unobserved key must remain null/absent");
});

test("projectObservations returns exact point-in-time HUD telemetry state when scrubbing forward and backward", () => {
  const toeRingSequence = compiledTimeline.events.find((event) => event.id === "evt-f1-toe-ring-equipped").sequence;
  const seq10Obs = projectObservations(compiledTimeline, toeRingSequence);
  assert.ok(seq10Obs.equipment["FEET"]);
  assert.equal(seq10Obs.equipment["FEET"].itemInstanceId, "inst-f1-toe-ring");

  const seq5Obs = projectObservations(compiledTimeline, toeRingSequence - 1);
  assert.equal(seq5Obs.equipment["FEET"], undefined, "scrubbing backward clears later observations");

  const seqEndObs = projectObservations(compiledTimeline, compiledTimeline.events.at(-1).sequence);
  assert.ok(seqEndObs.broadcast["viewers"]);
  assert.equal(seqEndObs.broadcast["viewers"].value, 212000000000);
});

test("floor population is exact, floor-scoped telemetry and never interpolated", () => {
  const startSequence = compiledTimeline.events.find((event) => event.id === "evt-f2-001-countdown-start").sequence;
  const firstPopulation = projectObservations(compiledTimeline, startSequence);
  assert.equal(firstPopulation.floor.remainingCrawlers.value, 1292526);

  const laterSequence = compiledTimeline.events.find((event) => event.id === "evt-f2-countdown-crawlers-1033992").sequence;
  const beforeLaterPopulation = projectObservationValue(compiledTimeline, laterSequence - 1, "floor-metrics.remainingCrawlers");
  assert.equal(beforeLaterPopulation, null, "population snapshots must not estimate deaths between reports");
});

test("linear interpolation never crosses a floor boundary", () => {
  const docCrossFloor = {
    events: [
      { sequence: 10, position: { floor: 1, elapsedSeconds: 100 } },
      { sequence: 15, position: { floor: 2, elapsedSeconds: 150 } },
      { sequence: 20, position: { floor: 2, elapsedSeconds: 200 } },
    ],
    observations: [
      {
        id: "obs-f1",
        kind: "crawler-condition",
        sequence: 10,
        interpolation: "linear",
        currentHealth: 100,
        evidence: [{ sourceId: "src-1" }],
      },
      {
        id: "obs-f2",
        kind: "crawler-condition",
        sequence: 20,
        interpolation: "linear",
        currentHealth: 200,
        evidence: [{ sourceId: "src-1" }],
      },
    ],
  };

  const result = projectObservationValue(docCrossFloor, 15, "crawler-condition.currentHealth");
  assert.equal(result, null, "linear interpolation must not cross floor boundaries");
});

test("linear interpolation never crosses a countdown phase break event", () => {
  const docPhaseBreak = {
    events: [
      { sequence: 10, position: { floor: 1 } },
      { sequence: 15, type: "CountdownReset", position: { floor: 1 } },
      { sequence: 20, position: { floor: 1 } },
    ],
    observations: [
      {
        id: "obs-1",
        kind: "crawler-condition",
        sequence: 10,
        interpolation: "linear",
        currentHealth: 100,
        evidence: [{ sourceId: "src-1" }],
      },
      {
        id: "obs-2",
        kind: "crawler-condition",
        sequence: 20,
        interpolation: "linear",
        currentHealth: 200,
        evidence: [{ sourceId: "src-1" }],
      },
    ],
  };

  const result = projectObservationValue(docPhaseBreak, 15, "crawler-condition.currentHealth");
  assert.equal(result, null, "linear interpolation must not cross phase break events");
});
