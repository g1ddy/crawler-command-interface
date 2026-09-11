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
  const obsBeforeAcq = projectObservations(compiledTimeline, acquiredEvent.sequence - 1);
  const capsBeforeAcq = evaluateCanonCapabilities({
    state: stateBeforeAcq,
    observations: obsBeforeAcq,
    events: compiledTimeline.events,
    sequence: acquiredEvent.sequence - 1,
  });
  assert.equal(capsBeforeAcq.pet, false, "Pet must be unavailable before acquisition");

  // Acquired but unbonded
  const stateAtAcq = projectState(compiledTimeline, acquiredEvent.sequence);
  const obsAtAcq = projectObservations(compiledTimeline, acquiredEvent.sequence);
  const capsAtAcq = evaluateCanonCapabilities({
    state: stateAtAcq,
    observations: obsAtAcq,
    events: compiledTimeline.events,
    sequence: acquiredEvent.sequence,
  });
  assert.equal(capsAtAcq.pet, false, "Pet must remain unavailable when acquired but unbonded");

  // Bonded
  const stateAtBond = projectState(compiledTimeline, bondedEvent.sequence);
  const obsAtBond = projectObservations(compiledTimeline, bondedEvent.sequence);
  const capsAtBond = evaluateCanonCapabilities({
    state: stateAtBond,
    observations: obsAtBond,
    events: compiledTimeline.events,
    sequence: bondedEvent.sequence,
  });
  assert.equal(capsAtBond.pet, true, "Pet must become available once bonded");
});

test("Ratings capability is available only when replay-visible broadcast/audience state exists on compiled timeline", () => {
  const broadcastSnapshot = compiledTimeline.events.find((e) => e.id === "evt-f2-broadcast-snapshot");
  assert.ok(broadcastSnapshot, "evt-f2-broadcast-snapshot exists in compiled timeline");

  const seqBefore = broadcastSnapshot.sequence - 1;
  const stateBefore = projectState(compiledTimeline, seqBefore);
  const obsBefore = projectObservations(compiledTimeline, seqBefore);
  const capsBefore = evaluateCanonCapabilities({
    state: stateBefore,
    observations: obsBefore,
    events: compiledTimeline.events,
    sequence: seqBefore,
  });
  assert.equal(capsBefore.ratings, false, "Ratings must be false before any broadcast observation exists");

  const seqAt = broadcastSnapshot.sequence;
  const stateAt = projectState(compiledTimeline, seqAt);
  const obsAt = projectObservations(compiledTimeline, seqAt);
  const capsAt = evaluateCanonCapabilities({
    state: stateAt,
    observations: obsAt,
    events: compiledTimeline.events,
    sequence: seqAt,
  });
  assert.equal(capsAt.ratings, true, "Ratings must be true when replay-visible broadcast observation exists");
});

test("Notifications capability is available only when crawler-visible delivered-notification semantics exist on compiled timeline", () => {
  const firstDeliveredEvent = compiledTimeline.events.find((e) => e.notificationDelivery?.delivered === true);
  assert.ok(firstDeliveredEvent, "First delivered notification event exists in compiled timeline");

  const seqBefore = firstDeliveredEvent.sequence - 1;
  const stateBefore = projectState(compiledTimeline, seqBefore);
  const obsBefore = projectObservations(compiledTimeline, seqBefore);
  const capsBefore = evaluateCanonCapabilities({
    state: stateBefore,
    observations: obsBefore,
    events: compiledTimeline.events,
    sequence: seqBefore,
  });
  assert.equal(capsBefore.notifications, false, "Notifications must be false before any delivered notification event");

  const seqAt = firstDeliveredEvent.sequence;
  const stateAt = projectState(compiledTimeline, seqAt);
  const obsAt = projectObservations(compiledTimeline, seqAt);
  const capsAt = evaluateCanonCapabilities({
    state: stateAt,
    observations: obsAt,
    events: compiledTimeline.events,
    sequence: seqAt,
  });
  assert.equal(capsAt.notifications, true, "Notifications must be true at/after delivered notification event");
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
