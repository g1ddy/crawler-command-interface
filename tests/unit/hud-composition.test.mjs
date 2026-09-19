import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveHudComposition,
  URGENT_COLLAPSE_THRESHOLD_SECONDS,
} from "../../src/shell/hud/public.ts";
import { createInitialState, projectObservations } from "../../app/domain/projection.ts";
import { derivePartyPresentation } from "../../src/features/party/public.ts";
import { derivePetPresentation } from "../../src/features/pet/public.ts";

test("deriveHudComposition compiles renderer-neutral model for initial live state", () => {
  const state = createInitialState();
  const doc = { observations: [], events: [] };
  const observations = projectObservations(doc, 0);

  const composition = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 0,
    isLive: true,
    floorHudTitle: "FLOOR 1",
    events: [],
  });

  assert.equal(composition.system.crawlerName, state.crawler.name);
  assert.equal(composition.system.floorTitle, "FLOOR 1");
  assert.equal(composition.system.sequence, 0);

  assert.equal(composition.temporal.mode, "live");
  assert.equal(composition.temporal.isLive, true);
  assert.equal(composition.temporal.canReturnToLive, false);

  assert.equal(composition.urgency.activeCountdown, null);
  assert.equal(composition.urgency.hasUrgentCollapse, false);

  assert.equal(composition.attention.totalNotificationsCount, 0);
  assert.equal(composition.attention.hasActiveAlerts, false);

  assert.equal(composition.vitals.health, undefined);
  assert.equal(composition.broadcast.viewers, undefined);
});

test("deriveHudComposition evaluates 300s collapse urgency threshold policy", () => {
  const state = createInitialState();
  const doc = { observations: [], events: [] };
  const observations = projectObservations(doc, 10);

  const nonUrgentCountdown = {
    countdownId: "collapse-01",
    label: "LEVEL COLLAPSE",
    formattedLabel: "LEVEL COLLAPSE IN 10:00",
    formattedTime: "10:00",
    remainingSeconds: 600,
    status: "observed",
    lifecycleStatus: "active",
    isStale: false,
    targetSequence: 200,
  };

  const compositionNonUrgent = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: nonUrgentCountdown,
    sequence: 10,
    isLive: true,
    floorHudTitle: "FLOOR 1",
  });

  assert.equal(compositionNonUrgent.urgency.hasUrgentCollapse, false);

  const urgentCountdown = {
    ...nonUrgentCountdown,
    formattedLabel: "LEVEL COLLAPSE IN 04:59",
    remainingSeconds: URGENT_COLLAPSE_THRESHOLD_SECONDS - 1,
  };

  const compositionUrgent = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: urgentCountdown,
    sequence: 10,
    isLive: true,
    floorHudTitle: "FLOOR 1",
  });

  assert.equal(compositionUrgent.urgency.hasUrgentCollapse, true);
});

test("Party and Pet feature presentation contracts preserve semantic truth boundaries", () => {
  // Absent party preserves unavailable/unestablished without claiming empty list is active party
  const partyPresentation = derivePartyPresentation({ party: undefined });
  assert.equal(partyPresentation.status, "unavailable");
  assert.equal(partyPresentation.hasParty, false);

  // Empty pet array preserves status distinction without fabricating unsupplied fields
  const petPresentation = derivePetPresentation({ pets: [] });
  assert.equal(petPresentation.hasPets, false);
  assert.equal(petPresentation.petCount, 0);
  assert.equal(petPresentation.badgeLabel, "NO PETS");
});
