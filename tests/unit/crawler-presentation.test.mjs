import { createInitialState } from "../../app/domain/projection/helpers.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveCrawlerPresentation } from "../../src/features/crawler/crawler-presentation.ts";
import { checkItemRequirements } from "../../app/domain/stats.ts";

test("deriveCrawlerPresentation computes crawler presentation with evidence authority", () => {
  const mockState = {
    sequence: 12,
    causalProvenance: {
      availableAttributePoints: 2,
      attributes: { Strength: 24 },
      condition: { currentHealth: 3000 },
    },
    crawler: {
      name: "Carl",
      crawlerNumber: "4,122",
      race: "Primal",
      class: "Scout",
      level: 5,
      xp: 1500,
      maxXp: 5000,
      availableAttributePoints: 2,
      attributes: {
        Strength: 24,
        Dexterity: 18,
        Constitution: 20,
        Intelligence: 15,
        Charisma: 12,
      },
      permanentAttributeModifiers: { Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Charisma: 0 },
      condition: {
        currentHealth: 3000,
        maxHealth: 4000,
        currentMana: 500,
        maxMana: 1000,
        currentStamina: 200,
        maxStamina: 300,
      },
    },
    effects: [
      {
        effectId: "eff-1",
        name: "Minor Poison",
        type: "bad",
        icon: "☠️",
        durationSeconds: 30,
        appliedAtSequence: 10,
        description: "Deals poison damage over time.",
      },
    ],
  };

  const mockObservations = {
    xpProgress: {
      xp: { sequence: 10, key: "xp", value: 1500 },
      maxXp: { sequence: 10, key: "maxXp", value: 5000 },
    },
    attributes: {
      Strength: { sequence: 10, key: "Strength", value: 24 },
      Dexterity: { sequence: 8, key: "Dexterity", value: 18 },
    },
    condition: {
      currentHealth: { sequence: 11, key: "currentHealth", value: 3000 },
      maxHealth: { sequence: 11, key: "maxHealth", value: 4000 },
    },
  };

  const presentation = deriveCrawlerPresentation(mockState, mockObservations);

  assert.equal(presentation.name, "Carl");
  assert.equal(presentation.crawlerNumber, "4,122");
  assert.equal(presentation.level, 5);
  assert.equal(presentation.canAllocatePoints, true);
  assert.equal(presentation.attributes.length, 5);
  assert.equal(presentation.vitals.length, 3);
  assert.equal(presentation.effects.harmful.length, 1);
  assert.equal(presentation.effects.harmful[0].name, "Minor Poison");
});

test("deriveCrawlerPresentation handles unknown/unsourced telemetry without error", () => {
  const emptyState = {
    sequence: 1,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {
      name: "UNKNOWN CRAWLER",
      level: 1,
      race: "",
      class: "",
      xp: 0,
      maxXp: 100,
      availableAttributePoints: 0,
      attributes: { Strength: 10, Dexterity: 10, Constitution: 10, Intelligence: 10, Charisma: 10 },
      permanentAttributeModifiers: { Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Charisma: 0 },
      condition: { currentHealth: 100, maxHealth: 100, currentMana: 50, maxMana: 50, currentStamina: 50, maxStamina: 50 },
    },
    effects: [],
  };

  const emptyObservations = {
    xpProgress: {},
    attributes: {},
    condition: {},
  };

  const presentation = deriveCrawlerPresentation(emptyState, emptyObservations);

  assert.equal(presentation.name, "UNKNOWN CRAWLER");
  assert.equal(presentation.canAllocatePoints, false);
  assert.equal(presentation.effects.beneficial.length, 0);
  assert.equal(presentation.effects.harmful.length, 0);
});

test("crawler identity uses crawler name directly or falls back to dash when missing", () => {
  const stateWithSurname = {
    sequence: 1,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {
      name: "CARL",
      crawlerNumber: "4,122",
      level: 1,
      race: "HUMAN",
      class: "SCOUT",
      xp: 0,
      maxXp: 1000,
      availableAttributePoints: 0,
      attributes: { Strength: 10, Dexterity: 10, Constitution: 10, Intelligence: 10, Charisma: 10 },
      permanentAttributeModifiers: { Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Charisma: 0 },
      condition: { currentHealth: 100, maxHealth: 100, currentMana: 50, maxMana: 50, currentStamina: 50, maxStamina: 50 },
    },
    effects: [],
  };

  const presentation = deriveCrawlerPresentation(stateWithSurname, { xpProgress: {}, attributes: {}, condition: {} });
  assert.equal(presentation.name, "CARL");
  assert.equal(presentation.crawlerNumber, "4,122");
});

test("attribute allocation follows the displayed reading instead of causal state", () => {
  const state = {
    sequence: 20,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {
      name: "Carl",
      level: 5,
      race: "Primal",
      class: "Scout",
      xp: 1500,
      maxXp: 5000,
      availableAttributePoints: 3,
      attributes: { Strength: 20, Dexterity: 10, Constitution: 10, Intelligence: 10, Charisma: 10 },
      permanentAttributeModifiers: { Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Charisma: 0 },
      condition: { currentHealth: 100, maxHealth: 100, currentMana: 50, maxMana: 50, currentStamina: 50, maxStamina: 50 },
    },
    effects: [],
  };

  const historicalNoPoints = {
    xpProgress: {},
    attributes: {
      availableAttributePoints: { sequence: 12, key: "availableAttributePoints", value: 0 },
    },
    condition: {},
  };

  const historicalWithPoints = {
    ...historicalNoPoints,
    attributes: {
      availableAttributePoints: { sequence: 12, key: "availableAttributePoints", value: 2 },
    },
  };

  const historicalUnknown = {
    xpProgress: {},
    attributes: {},
    condition: {},
  };

  assert.equal(deriveCrawlerPresentation(state, historicalNoPoints).availablePoints, 0);
  assert.equal(deriveCrawlerPresentation(state, historicalNoPoints).canAllocatePoints, false);

  assert.equal(deriveCrawlerPresentation(state, historicalWithPoints).availablePoints, 2);
  assert.equal(deriveCrawlerPresentation(state, historicalWithPoints).canAllocatePoints, true);

  assert.equal(deriveCrawlerPresentation(state, historicalUnknown).availablePoints, undefined);
  assert.equal(deriveCrawlerPresentation(state, historicalUnknown).canAllocatePoints, false);
});

test("attribute provenance consolidates into sharedAttributesEvidence when observations match", () => {
  const sharedObs = { sequence: 10, status: "stated", referenceObservationIds: ["obs-1"], key: "attr", value: 20 };
  const state = {
    sequence: 10,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {
      name: "Carl",
      level: 1,
      race: "HUMAN",
      class: "SCOUT",
      xp: 0,
      maxXp: 1000,
      availableAttributePoints: 0,
      attributes: { Strength: 24, Dexterity: 18, Constitution: 20, Intelligence: 15, Charisma: 12 },
      permanentAttributeModifiers: { Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Charisma: 0 },
      condition: { currentHealth: 100, maxHealth: 100, currentMana: 50, maxMana: 50, currentStamina: 50, maxStamina: 50 },
    },
    effects: [],
  };

  const matchingObs = {
    xpProgress: {},
    attributes: {
      Strength: { ...sharedObs, key: "Strength", value: 24 },
      Dexterity: { ...sharedObs, key: "Dexterity", value: 18 },
      Constitution: { ...sharedObs, key: "Constitution", value: 20 },
      Intelligence: { ...sharedObs, key: "Intelligence", value: 15 },
      Charisma: { ...sharedObs, key: "Charisma", value: 12 },
    },
    condition: {},
  };

  const presentation = deriveCrawlerPresentation(state, matchingObs);
  assert.equal(presentation.hasSharedAttributesEvidence, true);
  assert.equal(presentation.sharedAttributesAuthority, "observation");
  assert.deepEqual(presentation.sharedAttributesObservation, matchingObs.attributes.Strength);
});

test("attribute provenance remains distinct per row when attribute observations differ", () => {
  const state = {
    sequence: 10,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {
      name: "Carl",
      level: 1,
      race: "HUMAN",
      class: "SCOUT",
      xp: 0,
      maxXp: 1000,
      availableAttributePoints: 0,
      attributes: { Strength: 24, Dexterity: 18, Constitution: 20, Intelligence: 15, Charisma: 12 },
      permanentAttributeModifiers: { Strength: 0, Dexterity: 0, Constitution: 0, Intelligence: 0, Charisma: 0 },
      condition: { currentHealth: 100, maxHealth: 100, currentMana: 50, maxMana: 50, currentStamina: 50, maxStamina: 50 },
    },
    effects: [],
  };

  const differingObs = {
    xpProgress: {},
    attributes: {
      Strength: { sequence: 10, status: "stated", referenceObservationIds: ["obs-1"], key: "Strength", value: 24 },
      Dexterity: { sequence: 8, status: "stated", referenceObservationIds: ["obs-2"], key: "Dexterity", value: 18 },
      Constitution: { sequence: 10, status: "stated", referenceObservationIds: ["obs-1"], key: "Constitution", value: 20 },
      Intelligence: { sequence: 10, status: "stated", referenceObservationIds: ["obs-1"], key: "Intelligence", value: 15 },
      Charisma: { sequence: 10, status: "stated", referenceObservationIds: ["obs-1"], key: "Charisma", value: 12 },
    },
    condition: {},
  };

  const presentation = deriveCrawlerPresentation(state, differingObs);
  assert.equal(presentation.hasSharedAttributesEvidence, false);
  assert.equal(presentation.sharedAttributesObservation, undefined);
});

test("isLive mutation gating invariant enforces isLive as strict mutation boundary regardless of points", () => {
  const stateWithPoints = {
    sequence: 5,
    causalProvenance: { availableAttributePoints: 3, attributes: {}, condition: {} },
    crawler: {
      name: "Carl",
      level: 5,
      race: "Primal",
      class: "Scout",
      availableAttributePoints: 3,
      attributes: { Strength: 20 },
      permanentAttributeModifiers: { Strength: 0 },
      condition: { currentHealth: 100, maxHealth: 100 },
    },
    effects: [],
  };

  const stateWithoutPoints = {
    ...stateWithPoints,
    crawler: { ...stateWithPoints.crawler, availableAttributePoints: 0 },
  };

  const emptyObs = { xpProgress: {}, attributes: {}, condition: {} };

  const presentationWithPoints = deriveCrawlerPresentation(stateWithPoints, emptyObs);
  const presentationWithoutPoints = deriveCrawlerPresentation(stateWithoutPoints, emptyObs);

  assert.equal(presentationWithPoints.canAllocatePoints, true);
  assert.equal(presentationWithoutPoints.canAllocatePoints, false);
});

test("checkItemRequirements handles known and unknown null level states correctly", () => {
  const crawlerKnown = {
    name: "CARL",
    level: 10,
    attributes: { Strength: 20, Dexterity: 10, Constitution: 10, Intelligence: 10, Charisma: 10 },
    race: "HUMAN",
    class: "SCOUT",
  };
  const crawlerNull = {
    name: "CARL",
    level: null,
    attributes: { Strength: 20, Dexterity: 10, Constitution: 10, Intelligence: 10, Charisma: 10 },
    race: "HUMAN",
    class: "SCOUT",
  };

  const reqs = { level: 5, Strength: 15 };

  const resKnown = checkItemRequirements(crawlerKnown, reqs);
  assert.equal(resKnown.met, true);
  assert.equal(resKnown.details.find((d) => d.key === "level")?.current, 10);

  const resNull = checkItemRequirements(crawlerNull, reqs);
  assert.equal(resNull.met, false);
  assert.equal(resNull.details.find((d) => d.key === "level")?.current, "N/A");
  assert.equal(resNull.details.find((d) => d.key === "Strength")?.met, true);
});

test("presentation exposes allocation eligibility independently of live mode", () => {
  const baseState = {
    sequence: 10,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {
      name: "Carl",
      level: 5,
      race: "Primal",
      class: "Scout",
      availableAttributePoints: 3,
      attributes: { Strength: 20 },
      permanentAttributeModifiers: { Strength: 0 },
      condition: { currentHealth: 100, maxHealth: 100 },
    },
    effects: [],
  };

  const emptyObs = { xpProgress: {}, attributes: {}, condition: {} };
  const zeroPointsObs = {
    xpProgress: {},
    attributes: { availableAttributePoints: { sequence: 10, key: "availableAttributePoints", value: 0 } },
    condition: {},
  };
  const positivePointsObs = {
    xpProgress: {},
    attributes: { availableAttributePoints: { sequence: 10, key: "availableAttributePoints", value: 3 } },
    condition: {},
  };

  // unknown points
  const c1 = deriveCrawlerPresentation(baseState, emptyObs);
  assert.equal(c1.availablePoints, undefined);
  assert.equal(c1.canAllocatePoints, false);

  // observed zero
  const c2 = deriveCrawlerPresentation(baseState, zeroPointsObs);
  assert.equal(c2.availablePoints, 0);
  assert.equal(c2.canAllocatePoints, false);

  // observed positive value
  const c3 = deriveCrawlerPresentation(baseState, positivePointsObs);
  assert.equal(c3.availablePoints, 3);
  assert.equal(c3.canAllocatePoints, true);
});

test("unestablished crawler has no shared attributes evidence", () => {
  const presentation = deriveCrawlerPresentation(createInitialState(), {
    xpProgress: {},
    attributes: {},
    condition: {},
  });

  assert.equal(presentation.hasSharedAttributesEvidence, false);
  assert.equal(presentation.sharedAttributesAuthority, undefined);
  assert.equal(presentation.sharedAttributesObservation, undefined);
});

test("health conditions presentation distinguishes known-empty, established, and unavailable status", () => {
  const emptyObs = { xpProgress: {}, attributes: {}, condition: {} };

  // 1. Authoritative empty effects (state.effects = []) -> status: "known-empty"
  const knownEmptyState = {
    sequence: 1,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {},
    effects: [],
  };
  const presEmpty = deriveCrawlerPresentation(knownEmptyState, emptyObs);
  assert.equal(presEmpty.effects.status, "known-empty");

  // 2. Unprojected / unavailable effects (state.effects = undefined) -> status: "unavailable"
  const unavailableState = {
    sequence: 1,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {},
    effects: undefined,
  };
  const presUnavailable = deriveCrawlerPresentation(unavailableState, emptyObs);
  assert.equal(presUnavailable.effects.status, "unavailable");

  // 3. Established active effects -> status: "established"
  const establishedState = {
    sequence: 1,
    causalProvenance: { attributes: {}, condition: {} },
    crawler: {},
    effects: [{ effectId: "eff-1", name: "Poison", type: "bad", icon: "☠️", durationSeconds: 10, appliedAtSequence: 1, description: "Poisoned" }],
  };
  const presEstablished = deriveCrawlerPresentation(establishedState, emptyObs);
  assert.equal(presEstablished.effects.status, "established");
  assert.equal(presEstablished.effects.harmful.length, 1);
  assert.equal(presEstablished.effects.beneficial.length, 0);
  assert.equal(presEstablished.effects.injuries.length, 0);
  assert.equal(presEstablished.effects.other.length, 0);
});
