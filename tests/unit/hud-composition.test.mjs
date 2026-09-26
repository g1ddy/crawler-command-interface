import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { deriveHudComposition } from "../../src/shell/hud/public.ts";
import { createInitialState, projectObservations, projectState } from "../../app/domain/projection.ts";
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

test("deriveHudComposition exposes explicit command-driven temporal and attention motionIntents", () => {
  const state = createInitialState();
  const observations = projectObservations({ observations: [], events: [] }, 0);

  // Initial call without motion intents -> undefined
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

  // Live -> Replay transition intent passed explicitly
  const c2 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 0,
    isLive: false,
    floorHudTitle: "FLOOR 1",
    temporalMotionIntent: "enter-replay",
  });
  assert.equal(c2.temporal.motionIntent, "enter-replay");

  // Subsequent replay render without transition intent -> undefined
  const c3 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 1,
    isLive: false,
    floorHudTitle: "FLOOR 1",
  });
  assert.equal(c3.temporal.motionIntent, undefined);

  // Explicit attention motion intent passed
  const c4 = deriveHudComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    sequence: 1,
    isLive: true,
    floorHudTitle: "FLOOR 1",
    attentionMotionIntent: "attention",
  });
  assert.equal(c4.attention.motionIntent, "attention");
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

test("deriveHudComposition embeds Pet domain summary and transition semantics across sequence checkpoints", () => {
  const rawTimeline = JSON.parse(fs.readFileSync("data/compiled-timeline.json", "utf8"));

  // Seq 1: Initial state before pet acquisition
  const state1 = projectState(rawTimeline, 1);
  const obs1 = projectObservations(rawTimeline, 1);
  const comp1 = deriveHudComposition({
    projectedState: state1,
    projectedObservations: obs1,
    activeCountdown: null,
    sequence: 1,
    isLive: false,
    floorHudTitle: "FLOOR 1",
  });
  assert.equal(comp1.pet?.hasPets, false);
  assert.equal(comp1.pet?.semantics.status, "known-empty");
  assert.equal(comp1.pet?.primaryPet, undefined);

  // Seq 116: PetAcquired (mongoliensis, hostile, unbonded)
  const state116 = projectState(rawTimeline, 116);
  const obs116 = projectObservations(rawTimeline, 116);
  const comp116 = deriveHudComposition({
    projectedState: state116,
    projectedObservations: obs116,
    activeCountdown: null,
    sequence: 116,
    isLive: false,
    floorHudTitle: "FLOOR 2",
    petSummary: {
      hasPets: true,
      petCount: 1,
      badgeLabel: "1 PET",
      semantics: { status: "present", change: "newly-established", affordance: "none" },
      primaryPet: {
        petId: "pet-mongo",
        displayName: "mongoliensis",
        hasExplicitName: false,
        species: "mongoliensis",
        speciesLabel: "Species: mongoliensis",
        hostilityState: "hostile",
        hostilityLabel: "HOSTILE",
        bondState: "unbonded",
        bondStateLabel: "UNBONDED",
        bondHolderLabel: "NONE (UNBONDED)",
      },
      motionIntent: "established",
    },
  });
  assert.equal(comp116.pet?.hasPets, true);
  assert.equal(comp116.pet?.semantics.status, "present");
  assert.equal(comp116.pet?.semantics.change, "newly-established");
  assert.equal(comp116.pet?.motionIntent, "established");
  assert.equal(comp116.pet?.primaryPet?.species, "mongoliensis");

  // Seq 117: PetHostilityChanged (non-hostile)
  const state117 = projectState(rawTimeline, 117);
  const obs117 = projectObservations(rawTimeline, 117);
  const comp117 = deriveHudComposition({
    projectedState: state117,
    projectedObservations: obs117,
    activeCountdown: null,
    sequence: 117,
    isLive: false,
    floorHudTitle: "FLOOR 2",
    petSummary: {
      hasPets: true,
      petCount: 1,
      badgeLabel: "1 PET",
      semantics: { status: "present", change: "changed", affordance: "none" },
      primaryPet: {
        petId: "pet-mongo",
        displayName: "mongoliensis",
        hasExplicitName: false,
        species: "mongoliensis",
        speciesLabel: "Species: mongoliensis",
        hostilityState: "non-hostile",
        hostilityLabel: "NON-HOSTILE",
        bondState: "unbonded",
        bondStateLabel: "UNBONDED",
        bondHolderLabel: "NONE (UNBONDED)",
      },
      motionIntent: "changed",
    },
  });
  assert.equal(comp117.pet?.semantics.change, "changed");
  assert.equal(comp117.pet?.motionIntent, "changed");
  assert.equal(comp117.pet?.primaryPet?.hostilityState, "non-hostile");

  // Seq 118: PetBonded (Mongo, Royal Steed)
  const state118 = projectState(rawTimeline, 118);
  const obs118 = projectObservations(rawTimeline, 118);
  const comp118 = deriveHudComposition({
    projectedState: state118,
    projectedObservations: obs118,
    activeCountdown: null,
    sequence: 118,
    isLive: false,
    floorHudTitle: "FLOOR 2",
    petSummary: {
      hasPets: true,
      petCount: 1,
      badgeLabel: "1 PET",
      semantics: { status: "present", change: "changed", affordance: "none" },
      primaryPet: {
        petId: "pet-mongo",
        displayName: "Mongo",
        hasExplicitName: true,
        species: "mongoliensis",
        speciesLabel: "Species: mongoliensis",
        hostilityState: "non-hostile",
        hostilityLabel: "NON-HOSTILE",
        bondState: "bonded",
        bondStateLabel: "BONDED",
        bondHolderLabel: "crawler-donut",
        title: "Royal Steed",
        formattedTitle: "«Royal Steed»",
      },
      motionIntent: "changed",
    },
  });
  assert.equal(comp118.pet?.semantics.change, "changed");
  assert.equal(comp118.pet?.primaryPet?.displayName, "Mongo");
  assert.equal(comp118.pet?.primaryPet?.title, "Royal Steed");
});
