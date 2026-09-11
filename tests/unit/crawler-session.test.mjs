import assert from "node:assert";
import { test } from "node:test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectObservations, projectState } from "../../app/domain/projection/index.ts";
import { evaluateCanonCapabilities } from "../../src/application/capabilities.ts";
import { deriveReplayPresentation } from "../../src/features/timeline/replay-presentation.ts";

test("session boundary preserves state, sequence, capabilities and domain contracts across presentation choices", () => {
  const document = compiledTimeline;
  const events = document.events;
  const sequence = 117; // Replay sequence where pet is acquired but not bonded

  const state1 = projectState(document, sequence);
  const obs1 = projectObservations(document, sequence);
  const capabilities1 = evaluateCanonCapabilities({
    state: state1,
    observations: obs1,
    events,
    sequence,
  });
  const replayPresentation1 = deriveReplayPresentation({
    events,
    floors: document.floors,
    countdowns: document.countdowns,
    observations: document.observations,
    selectedFloorOrdinal: 2,
    selectedSequence: sequence,
    isLive: false,
  });

  // Verify pet capability is false at seq 117 (acquired, not bonded)
  assert.strictEqual(capabilities1.pet, false);
  assert.strictEqual(capabilities1.party, true);

  // Changing presentation choice does not alter session truth
  const choices = ["production", "authority", "tactical", "theater"];
  for (const choice of choices) {
    const stateChoice = projectState(document, sequence);
    const obsChoice = projectObservations(document, sequence);
    const capabilitiesChoice = evaluateCanonCapabilities({
      state: stateChoice,
      observations: obsChoice,
      events,
      sequence,
    });
    const replayChoice = deriveReplayPresentation({
      events,
      floors: document.floors,
      countdowns: document.countdowns,
      observations: document.observations,
      selectedFloorOrdinal: 2,
      selectedSequence: sequence,
      isLive: false,
    });

    assert.deepStrictEqual(stateChoice, state1);
    assert.deepStrictEqual(obsChoice, obs1);
    assert.deepStrictEqual(capabilitiesChoice, capabilities1);
    assert.deepStrictEqual(replayChoice.position.selectedSequence, replayPresentation1.position.selectedSequence);
    assert.deepStrictEqual(replayChoice.position.previousSequence, replayPresentation1.position.previousSequence);
    assert.deepStrictEqual(replayChoice.position.nextSequence, replayPresentation1.position.nextSequence);
    assert.strictEqual(choice === "production" || choice === "authority" || choice === "tactical" || choice === "theater", true);
  }
});

test("presentation choice is decoupled from persistence and import/export payload", () => {
  const jsonDocument = JSON.stringify(compiledTimeline);
  assert.strictEqual(jsonDocument.includes("presentationChoice"), false);
  assert.strictEqual(jsonDocument.includes("hudPresentation"), false);
});
