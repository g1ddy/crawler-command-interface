import assert from "node:assert/strict";
import test from "node:test";

import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectObservations } from "../../app/domain/observations.ts";
import { projectState } from "../../app/domain/projection.ts";
import { createInitialState } from "../../app/domain/projection/helpers.ts";
import { evaluateCanonCapabilities } from "../../src/application/capabilities.ts";

test("Party capability is unavailable before the Royal Court formation boundary and available after it", () => {
  const formation = compiledTimeline.events.find((event) => event.id === "evt-f1-party-royal-court-formed");
  assert.ok(formation, "evt-f1-party-royal-court-formed exists in compiled timeline");

  const stateBefore = projectState(compiledTimeline, formation.sequence - 1);
  const obsBefore = projectObservations(compiledTimeline, formation.sequence - 1);
  const capsBefore = evaluateCanonCapabilities({
    state: stateBefore,
    observations: obsBefore,
    events: compiledTimeline.events,
    sequence: formation.sequence - 1,
  });
  assert.equal(capsBefore.party, false, "Party must be unavailable before formation event");

  const stateAfter = projectState(compiledTimeline, formation.sequence);
  const obsAfter = projectObservations(compiledTimeline, formation.sequence);
  const capsAfter = evaluateCanonCapabilities({
    state: stateAfter,
    observations: obsAfter,
    events: compiledTimeline.events,
    sequence: formation.sequence,
  });
  assert.equal(capsAfter.party, true, "Party must be available at/after formation event");
});

test("Pet capability is unavailable before the useful sourced bond boundary, including acquired-but-unbonded state, and available after bonding", () => {
  const acquiredEvent = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-acquired");
  const bondedEvent = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-bonded");
  assert.ok(acquiredEvent && bondedEvent, "Acquisition and bonding events exist in compiled timeline");

  // Before acquisition
  const stateBeforeAcq = projectState(compiledTimeline, acquiredEvent.sequence - 1);
  const capsBeforeAcq = evaluateCanonCapabilities({
    state: stateBeforeAcq,
    observations: { broadcast: {} },
    events: compiledTimeline.events,
    sequence: acquiredEvent.sequence - 1,
  });
  assert.equal(capsBeforeAcq.pet, false, "Pet must be unavailable before acquisition");

  // Acquired but unbonded
  const stateAtAcq = projectState(compiledTimeline, acquiredEvent.sequence);
  const capsAtAcq = evaluateCanonCapabilities({
    state: stateAtAcq,
    observations: { broadcast: {} },
    events: compiledTimeline.events,
    sequence: acquiredEvent.sequence,
  });
  assert.equal(capsAtAcq.pet, false, "Pet must remain unavailable when acquired but unbonded");

  // Bonded
  const stateAtBond = projectState(compiledTimeline, bondedEvent.sequence);
  const capsAtBond = evaluateCanonCapabilities({
    state: stateAtBond,
    observations: { broadcast: {} },
    events: compiledTimeline.events,
    sequence: bondedEvent.sequence,
  });
  assert.equal(capsAtBond.pet, true, "Pet must become available once bonded");
});

test("Ratings capability is available only when replay-visible broadcast/audience state exists", () => {
  const emptyObs = { broadcast: {} };
  const initialState = createInitialState();
  const capsWithoutBroadcast = evaluateCanonCapabilities({
    state: initialState,
    observations: emptyObs,
    events: [],
    sequence: 1,
  });
  assert.equal(capsWithoutBroadcast.ratings, false, "Ratings must be false when no broadcast observations exist");

  const obsWithViewers = { broadcast: { viewers: { value: 12500 } } };
  const capsWithBroadcast = evaluateCanonCapabilities({
    state: initialState,
    observations: obsWithViewers,
    events: [],
    sequence: 1,
  });
  assert.equal(capsWithBroadcast.ratings, true, "Ratings must be true when broadcast observations exist");
});

test("Notifications capability is available only when crawler-visible delivered-notification semantics exist", () => {
  const base = { id: "e1", sequence: 1, type: "NarrativeEvent", summary: "Undelivered event", occurred_at: "2025-01-01", category: "system", position: { floor: 1 }, evidence: [] };
  const deliveredEvent = {
    ...base,
    id: "e2",
    sequence: 2,
    notificationDelivery: { delivered: true, kind: "achievement", severity: "warning" },
  };
  const events = [base, deliveredEvent];
  const initialState = createInitialState();

  const capsAtSeq1 = evaluateCanonCapabilities({
    state: initialState,
    observations: { broadcast: {} },
    events,
    sequence: 1,
  });
  assert.equal(capsAtSeq1.notifications, false, "Notifications must be false before any delivered notification event");

  const capsAtSeq2 = evaluateCanonCapabilities({
    state: initialState,
    observations: { broadcast: {} },
    events,
    sequence: 2,
  });
  assert.equal(capsAtSeq2.notifications, true, "Notifications must be true at/after delivered notification event");
});

test("Baseline domains (Crawler, Inventory, Skills) remain baseline available", () => {
  const initialState = createInitialState();
  const caps = evaluateCanonCapabilities({
    state: initialState,
    observations: { broadcast: {} },
    events: [],
    sequence: 1,
  });

  assert.equal(caps.crawler, true, "Crawler must be baseline available");
  assert.equal(caps.inventory, true, "Inventory must be baseline available");
  assert.equal(caps.skills, true, "Skills must be baseline available");
});

test("Deferred domains (Quests and Magic) remain gated or unexposed in CanonCapabilities", () => {
  const initialState = createInitialState();
  const caps = evaluateCanonCapabilities({
    state: initialState,
    observations: { broadcast: {} },
    events: [],
    sequence: 1,
  });

  assert.equal(caps.quests, false, "Quests must remain false when no quests exist in state");
  assert.equal(Object.hasOwn(caps, "magic"), false, "Magic must not be present in CanonCapabilities snapshot");
});

test("Non-shell consumer can drive custom composition directly using CanonCapabilities snapshot without shell or React imports", () => {
  // Simulate a minimal custom HUD or command-line capability consumer
  function buildMinimalCommandMenu(capabilities) {
    const commands = [];
    if (capabilities.crawler) commands.push("STATUS");
    if (capabilities.inventory) commands.push("ITEMS");
    if (capabilities.party) commands.push("ROSTER");
    if (capabilities.pet) commands.push("COMPANION");
    return commands;
  }

  const formation = compiledTimeline.events.find((e) => e.id === "evt-f1-party-royal-court-formed");
  const stateBefore = projectState(compiledTimeline, formation.sequence - 1);
  const obsBefore = projectObservations(compiledTimeline, formation.sequence - 1);
  const snapshotBefore = evaluateCanonCapabilities({
    state: stateBefore,
    observations: obsBefore,
    events: compiledTimeline.events,
    sequence: formation.sequence - 1,
  });

  assert.deepEqual(buildMinimalCommandMenu(snapshotBefore), ["STATUS", "ITEMS"]);

  const stateAfter = projectState(compiledTimeline, formation.sequence);
  const obsAfter = projectObservations(compiledTimeline, formation.sequence);
  const snapshotAfter = evaluateCanonCapabilities({
    state: stateAfter,
    observations: obsAfter,
    events: compiledTimeline.events,
    sequence: formation.sequence,
  });

  assert.deepEqual(buildMinimalCommandMenu(snapshotAfter), ["STATUS", "ITEMS", "ROSTER"]);
});
