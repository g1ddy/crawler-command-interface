import assert from "node:assert/strict";
import test from "node:test";
import { deriveAuthorityComposition } from "../../src/shell/authority/public.ts";
import { createInitialState, projectObservations } from "../../app/domain/projection.ts";
import { evaluateCanonCapabilities } from "../../src/application/capabilities.ts";

test("deriveAuthorityComposition compiles layout-neutral model for initial live state", () => {
  const state = createInitialState();
  const doc = { observations: [], events: [] };
  const observations = projectObservations(doc, 0);
  const capabilities = evaluateCanonCapabilities({
    state,
    observations,
    events: [],
    sequence: 0,
  });

  const composition = deriveAuthorityComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    events: [],
    sequence: 0,
    isLive: true,
    floorHudTitle: "FLOOR 1",
    capabilities,
    activeView: "crawler",
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

  // Source honesty boundaries
  assert.equal(composition.domains.party.status, "unavailable");
  assert.equal(composition.domains.party.hasParty, false);

  assert.equal(composition.domains.pet.status, "unavailable");
  assert.equal(composition.domains.pet.hasPets, false);

  assert.equal(composition.navigation.activeView, "crawler");
  assert.deepEqual(composition.navigation.availableViews, ["crawler", "inventory", "skills"]);
});

test("deriveAuthorityComposition preserves party and pet established states when present", () => {
  const state = createInitialState();
  state.party = {
    partyId: "party-01",
    name: "Alpha Squad",
    members: [{ crawlerId: "c1", name: "Carl", role: "leader" }],
  };
  state.pets = [
    {
      petId: "pet-01",
      name: "Dungeon Hound",
      species: "Canine",
      hostility: "non-hostile",
      bondState: "bonded",
      bondHolderCrawlerId: "c1",
    },
  ];

  const doc = { observations: [], events: [] };
  const observations = projectObservations(doc, 5);
  const capabilities = evaluateCanonCapabilities({
    state,
    observations,
    events: [],
    sequence: 5,
  });

  const composition = deriveAuthorityComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: null,
    events: [],
    sequence: 5,
    isLive: false,
    floorHudTitle: "FLOOR 1",
    capabilities,
    activeView: "party",
  });

  assert.equal(composition.temporal.mode, "replay");
  assert.equal(composition.temporal.isLive, false);
  assert.equal(composition.temporal.canReturnToLive, true);

  assert.equal(composition.domains.party.status, "established");
  assert.equal(composition.domains.party.hasParty, true);
  assert.equal(composition.domains.party.memberCount, 1);

  assert.equal(composition.domains.pet.status, "established");
  assert.equal(composition.domains.pet.hasPets, true);
  assert.equal(composition.domains.pet.petCount, 1);
});

test("deriveAuthorityComposition detects urgent countdown collapse and attention alerts", () => {
  const state = createInitialState();
  const doc = { observations: [], events: [] };
  const observations = projectObservations(doc, 10);
  const capabilities = evaluateCanonCapabilities({
    state,
    observations,
    events: [],
    sequence: 10,
  });

  const urgentCountdown = {
    countdownId: "collapse-01",
    label: "LEVEL COLLAPSE",
    formattedLabel: "LEVEL COLLAPSE IN 02:30",
    formattedTime: "02:30",
    remainingSeconds: 150,
    status: "observed",
    lifecycleStatus: "active",
    isStale: false,
    targetSequence: 200,
  };

  const alertEvents = [
    {
      id: "evt-1",
      type: "NarrativeEvent",
      sequence: 1,
      summary: "Boss alert",
      notificationDelivery: {
        delivered: true,
        kind: "progression",
        severity: "critical",
        title: "BOSS ENGAGED",
        message: "A dungeon boss has appeared!",
      },
    },
  ];

  const composition = deriveAuthorityComposition({
    projectedState: state,
    projectedObservations: observations,
    activeCountdown: urgentCountdown,
    events: alertEvents,
    sequence: 10,
    isLive: true,
    floorHudTitle: "FLOOR 1",
    capabilities,
    activeView: "crawler",
  });

  assert.equal(composition.urgency.hasUrgentCollapse, true);
  assert.equal(composition.urgency.formattedLabel, "LEVEL COLLAPSE IN 02:30");

  assert.equal(composition.attention.totalNotificationsCount, 1);
  assert.equal(composition.attention.hasActiveAlerts, true);
});
