import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { deriveHudComposition, deriveWorkspacePetSummary } from "../../src/shell/hud/public.ts";
import { createInitialState, projectObservations, projectState } from "../../app/domain/projection.ts";
import { derivePartyPresentation } from "../../src/features/party/public.ts";
import { derivePetPresentation, mapPetStatusToSemantics } from "../../src/features/pet/public.ts";

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

test("feature presentation preserves not-established party state and not-established pet state", () => {
  const partyPresentation = derivePartyPresentation({ party: undefined });
  assert.equal(partyPresentation.status, "not-established");
  assert.equal(partyPresentation.hasParty, false);
  assert.equal(partyPresentation.memberBadgeLabel, "NOT ESTABLISHED");

  const petPresentation = derivePetPresentation({ pets: [] });
  assert.equal(petPresentation.status, "not-established");
  assert.equal(petPresentation.hasPets, false);
  assert.equal(petPresentation.petCount, 0);
  assert.equal(petPresentation.badgeLabel, "NO PETS");
});

test("integration: deriveHudComposition with deriveWorkspacePetSummary across promoted timeline sequences", () => {
  const rawTimeline = JSON.parse(fs.readFileSync("data/compiled-timeline.json", "utf8"));

  // 1. Seq 1: Pre-acquisition state (replay mode)
  const state1 = projectState(rawTimeline, 1);
  const obs1 = projectObservations(rawTimeline, 1);
  const petSummary1 = deriveWorkspacePetSummary({
    pets: state1.pets,
    events: rawTimeline.events,
    currentSeq: 1,
    isLivePetTransition: false,
  });
  const comp1 = deriveHudComposition({
    projectedState: state1,
    projectedObservations: obs1,
    activeCountdown: null,
    sequence: 1,
    isLive: false,
    floorHudTitle: "FLOOR 1",
    petSummary: petSummary1,
  });

  assert.equal(comp1.pet?.hasPets, false);
  assert.equal(comp1.pet?.semantics.status, "not-established");
  assert.equal(comp1.pet?.primaryPet, undefined);

  // 2. Seq 116: PetAcquired (historical replay vs live transition)
  const state116 = projectState(rawTimeline, 116);
  const obs116 = projectObservations(rawTimeline, 116);

  // 2a. Replay scrubbing at Seq 116
  const petSummary116Replay = deriveWorkspacePetSummary({
    pets: state116.pets,
    events: rawTimeline.events,
    currentSeq: 116,
    isLivePetTransition: false,
  });
  const comp116Replay = deriveHudComposition({
    projectedState: state116,
    projectedObservations: obs116,
    activeCountdown: null,
    sequence: 116,
    isLive: false,
    floorHudTitle: "FLOOR 2",
    petSummary: petSummary116Replay,
  });

  assert.equal(comp116Replay.pet?.hasPets, true);
  assert.equal(comp116Replay.pet?.semantics.status, "present");
  assert.equal(comp116Replay.pet?.semantics.change, "newly-established");
  assert.equal(comp116Replay.pet?.motionIntent, undefined); // Replay mode -> no motion intent!
  assert.equal(comp116Replay.pet?.primaryPet?.species, "mongoliensis");

  // 2b. Live transition at Seq 116
  const petSummary116Live = deriveWorkspacePetSummary({
    pets: state116.pets,
    events: rawTimeline.events,
    currentSeq: 116,
    isLivePetTransition: true,
  });
  assert.equal(petSummary116Live.semantics.status, "present");
  assert.equal(petSummary116Live.semantics.change, "newly-established");
  assert.equal(petSummary116Live.motionIntent, "established"); // Live transition -> motion intent emitted!

  // 3. Seq 117: PetHostilityChanged
  const state117 = projectState(rawTimeline, 117);
  const obs117 = projectObservations(rawTimeline, 117);
  const petSummary117 = deriveWorkspacePetSummary({
    pets: state117.pets,
    events: rawTimeline.events,
    currentSeq: 117,
    isLivePetTransition: false,
  });
  const comp117 = deriveHudComposition({
    projectedState: state117,
    projectedObservations: obs117,
    activeCountdown: null,
    sequence: 117,
    isLive: false,
    floorHudTitle: "FLOOR 2",
    petSummary: petSummary117,
  });

  assert.equal(comp117.pet?.semantics.status, "present");
  assert.equal(comp117.pet?.semantics.change, "changed");
  assert.equal(comp117.pet?.motionIntent, undefined);
  assert.equal(comp117.pet?.primaryPet?.hostilityState, "non-hostile");

  // 4. Seq 118: PetBonded (Mongo, Royal Steed)
  const state118 = projectState(rawTimeline, 118);
  const obs118 = projectObservations(rawTimeline, 118);
  const petSummary118 = deriveWorkspacePetSummary({
    pets: state118.pets,
    events: rawTimeline.events,
    currentSeq: 118,
    isLivePetTransition: false,
  });
  const comp118 = deriveHudComposition({
    projectedState: state118,
    projectedObservations: obs118,
    activeCountdown: null,
    sequence: 118,
    isLive: false,
    floorHudTitle: "FLOOR 2",
    petSummary: petSummary118,
  });

  assert.equal(comp118.pet?.semantics.status, "present");
  assert.equal(comp118.pet?.semantics.change, "changed");
  assert.equal(comp118.pet?.motionIntent, undefined);
  assert.equal(comp118.pet?.primaryPet?.displayName, "Mongo");
  assert.equal(comp118.pet?.primaryPet?.formattedTitle, "«Royal Steed»");

  // 5. Seq 119: After PetBonded (next event e.g. AchievementUnlocked)
  const state119 = projectState(rawTimeline, 119);
  const obs119 = projectObservations(rawTimeline, 119);
  const petSummary119 = deriveWorkspacePetSummary({
    pets: state119.pets,
    events: rawTimeline.events,
    currentSeq: 119,
    isLivePetTransition: false,
  });
  const comp119 = deriveHudComposition({
    projectedState: state119,
    projectedObservations: obs119,
    activeCountdown: null,
    sequence: 119,
    isLive: false,
    floorHudTitle: "FLOOR 2",
    petSummary: petSummary119,
  });

  assert.equal(comp119.pet?.semantics.status, "present");
  assert.equal(comp119.pet?.semantics.change, undefined); // No longer marked newly-established or changed!
  assert.equal(comp119.pet?.motionIntent, undefined);
});
