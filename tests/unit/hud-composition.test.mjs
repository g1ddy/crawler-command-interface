import assert from "node:assert/strict";
import test from "node:test";
import { deriveHudComposition } from "../../src/shell/hud/public.ts";
import { createInitialState, projectObservations } from "../../app/domain/projection.ts";
import { derivePartyPresentation } from "../../src/features/party/public.ts";
import { derivePetPresentation } from "../../src/features/pet/public.ts";

test("deriveHudComposition compiles renderer-neutral model for initial live state", () => {
  const state = createInitialState();
  const observations = projectObservations({ observations: [], events: [] }, 0);
  const composition = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 0,
    isLive: true,
    floorHudTitle: "FLOOR 1",
  });
  assert.equal(composition.system.crawlerName, state.crawler.name);
  assert.equal(composition.system.floorTitle, "FLOOR 1");
  assert.equal(composition.temporal.mode, "live");
  assert.equal(composition.temporal.isLive, true);
  assert.equal(composition.urgency.activeCountdown, null);
  assert.equal(composition.attention.totalNotificationsCount, 0);
  assert.equal(composition.attention.hasActiveAlerts, false);
  assert.equal(composition.vitals.health, undefined);
  assert.equal(composition.broadcast.viewers, undefined);
});

test("deriveHudComposition exposes active countdown state without inventing urgency policies", () => {
  const state = createInitialState();
  const observations = projectObservations({ observations: [], events: [] }, 10);
  const activeCountdown = {
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
  const composition = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown,
    sequence: 10,
    isLive: true,
    floorHudTitle: "FLOOR 1",
  });
  assert.deepEqual(composition.urgency.activeCountdown, activeCountdown);
  assert.equal(composition.urgency.formattedLabel, "LEVEL COLLAPSE IN 10:00");
  assert.equal(composition.urgency.lifecycleStatus, "active");
});

test("deriveHudComposition derives motionIntent for temporal and attention state transitions across calls", () => {
  const state = createInitialState();
  const observations = projectObservations({ observations: [], events: [] }, 0);

  // Call 1: Live initial -> motionIntents undefined
  const c1 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 0,
    isLive: true,
    floorHudTitle: "FLOOR 1",
  });
  assert.equal(c1.temporal.motionIntent, undefined);
  assert.equal(c1.attention.motionIntent, undefined);

  // Call 2: Live -> Replay transition -> enter-replay intent
  const c2 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 0,
    isLive: false,
    floorHudTitle: "FLOOR 1",
    previousComposition: c1,
  });
  assert.equal(c2.temporal.motionIntent, "enter-replay");

  // Call 3: Stay in Replay -> motionIntent undefined
  const c3 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 1,
    isLive: false,
    floorHudTitle: "FLOOR 1",
    previousComposition: c2,
  });
  assert.equal(c3.temporal.motionIntent, undefined);

  // Call 4: Replay -> Live transition -> return-live intent
  const c4 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 1,
    isLive: true,
    floorHudTitle: "FLOOR 1",
    previousComposition: c3,
  });
  assert.equal(c4.temporal.motionIntent, "return-live");

  // Call 5: Alert arrives -> attention intent
  const alertSummary = {
    totalNotificationsCount: 1,
    hasActiveAlerts: true,
    latestNotificationTitle: "ITEM CRAFTED",
  };
  const c5 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 1,
    isLive: true,
    floorHudTitle: "FLOOR 1",
    notificationsSummary: alertSummary,
    previousComposition: c4,
  });
  assert.equal(c5.attention.motionIntent, "attention");

  // Call 6: Alert unchanged -> motionIntent undefined
  const c6 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 2,
    isLive: true,
    floorHudTitle: "FLOOR 1",
    notificationsSummary: alertSummary,
    previousComposition: c5,
  });
  assert.equal(c6.attention.motionIntent, undefined);
});

test("feature presentation preserves not-established party state and known-empty pet state", () => {
  const partyPresentation = derivePartyPresentation({ party: undefined });
  assert.equal(partyPresentation.status, "not-established");
  assert.equal(partyPresentation.hasParty, false);
  assert.equal(partyPresentation.memberBadgeLabel, "NOT ESTABLISHED");

  const petPresentation = derivePetPresentation({ pets: [] });
  assert.equal(petPresentation.status, "known-empty");
  assert.equal(petPresentation.hasPets, false);
  assert.equal(petPresentation.petCount, 0);
  assert.equal(petPresentation.badgeLabel, "NO PETS");
});
