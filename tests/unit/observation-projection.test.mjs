import assert from "node:assert/strict";
import test from "node:test";

import { projectObservationValue, projectObservations, projectState } from "../../app/domain/projection.ts";

const evidence = [{ sourceId: "test-source", confidence: "confirmed" }];
const events = [1, 2, 3].map((sequence) => ({
  id: `event-${sequence}`,
  sequence,
  type: "NarrativeEvent",
  kind: "other",
  position: { floor: 1, elapsedSeconds: sequence * 10 },
  summary: `Event ${sequence}`,
  evidence,
}));

test("observation projection records exact, carry-forward, and interpolation provenance", () => {
  const doc = {
    events,
    observations: [
      {
        id: "health-exact",
        kind: "crawler-condition",
        sequence: 1,
        evidence,
        currentHealth: 100,
        maxHealth: 100,
      },
      {
        id: "mana-start",
        kind: "crawler-condition",
        sequence: 1,
        interpolation: "linear",
        evidence,
        currentMana: 10,
      },
      {
        id: "mana-end",
        kind: "crawler-condition",
        sequence: 3,
        interpolation: "linear",
        evidence,
        currentMana: 30,
      },
    ],
  };

  assert.equal(projectObservationValue(doc, 1, "crawler-condition.currentHealth")?.sequence, 1);

  const atTwo = projectObservations(doc, 2);
  assert.equal(atTwo.condition.maxHealth.sequence, 1, "stepwise readings retain their source sequence");
  assert.deepEqual(atTwo.condition.currentMana.sourceSequences, [1, 3]);
  assert.equal(atTwo.condition.currentMana.status, "estimated");
});

test("causal provenance survives a later transition back to a nominal default", () => {
  const doc = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "test", title: "Test", story: { id: "test", title: "Test" } },
    sources: [],
    initialState: {
      crawler: {
        name: "Carl",
        level: 1,
        attributes: {},
        condition: { currentMana: 50 },
      },
    },
    events: [
      { ...events[0], type: "ConditionChanged", currentMana: 10 },
      { ...events[1], type: "ConditionChanged", currentMana: 50 },
    ],
  };

  const state = projectState(doc, 2);
  assert.equal(state.crawler.condition.currentMana, 50);
  assert.equal(state.causalProvenance.condition.currentMana, 2);
});

test("snapshots reconstruct causal provenance from events before their sequence", () => {
  const doc = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "snapshot-test", title: "Snapshot test", story: { id: "test", title: "Test" } },
    sources: [],
    initialState: {
      crawler: { name: "Carl", level: 1, attributes: {}, condition: { currentMana: 50 } },
    },
    events: [
      { ...events[0], type: "ConditionChanged", currentMana: 10 },
      { ...events[1], type: "NarrativeEvent" },
    ],
    snapshots: [{
      sequence: 1,
      state: {
        crawler: { name: "Carl", level: 1, attributes: {}, condition: { currentMana: 10 } },
      },
    }],
  };

  const fullReplay = projectState({ ...doc, snapshots: [] }, 2);
  const snapshotReplay = projectState(doc, 2);
  assert.deepEqual(snapshotReplay.causalProvenance, fullReplay.causalProvenance);
  assert.equal(snapshotReplay.causalProvenance.condition.currentMana, 1);
});

test("modifier-only attribute events do not override base attribute telemetry", () => {
  const doc = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "attribute-test", title: "Attribute test", story: { id: "test", title: "Test" } },
    sources: [],
    initialState: {
      crawler: { name: "Carl", level: 1, attributes: { Strength: 10 }, condition: {} },
    },
    events: [{
      ...events[0],
      type: "AttributeModified",
      attribute: "Strength",
      delta: 2,
      source: "permanent_modifier",
    }],
  };

  const state = projectState(doc, 1);
  assert.equal(state.crawler.attributes.Strength, 10);
  assert.equal(state.crawler.permanentAttributeModifiers.Strength, 2);
  assert.equal(state.causalProvenance.attributes.Strength, undefined);
});
