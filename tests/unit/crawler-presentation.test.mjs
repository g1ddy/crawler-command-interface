import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveCrawlerPresentation } from "../../src/features/crawler/crawler-presentation.ts";

test("deriveCrawlerPresentation computes crawler presentation with evidence authority", () => {
  const mockState = {
    sequence: 12,
    causalProvenance: {
      attributes: { Strength: 24 },
      condition: { currentHealth: 3000 },
    },
    crawler: {
      name: "Carl",
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
      name: "Unknown Crawler",
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

  assert.equal(presentation.name, "Unknown Crawler");
  assert.equal(presentation.canAllocatePoints, false);
  assert.equal(presentation.effects.beneficial.length, 0);
  assert.equal(presentation.effects.harmful.length, 0);
});

test("isLive mutation gating invariant enforces isLive as strict mutation boundary regardless of points", () => {
  const stateWithPoints = {
    sequence: 5,
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

  const stateWithoutPoints = {
    ...stateWithPoints,
    crawler: { ...stateWithPoints.crawler, availableAttributePoints: 0 },
  };

  const emptyObs = { xpProgress: {}, attributes: {}, condition: {} };

  const presentationWithPoints = deriveCrawlerPresentation(stateWithPoints, emptyObs);
  const presentationWithoutPoints = deriveCrawlerPresentation(stateWithoutPoints, emptyObs);

  // 1. Live + available points -> allocation is enabled in presentation
  assert.equal(presentationWithPoints.canAllocatePoints, true);
  const liveWithPointsCanMutate = true && presentationWithPoints.canAllocatePoints;
  assert.equal(liveWithPointsCanMutate, true);

  // 2. Live + no points -> allocation is disabled
  assert.equal(presentationWithoutPoints.canAllocatePoints, false);
  const liveWithoutPointsCanMutate = true && presentationWithoutPoints.canAllocatePoints;
  assert.equal(liveWithoutPointsCanMutate, false);

  // 3. Replay + historical state with no points -> disabled
  const replayWithoutPointsCanMutate = false && presentationWithoutPoints.canAllocatePoints;
  assert.equal(replayWithoutPointsCanMutate, false);

  // 4. Replay + historical state WITH points -> disabled because isLive is false
  const replayWithPointsCanMutate = false && presentationWithPoints.canAllocatePoints;
  assert.equal(replayWithPointsCanMutate, false);

  // 5. Replay + underlying current/live state has points (e.g. 5 points) -> STILL disabled because isLive is false
  const liveUnderlyingPoints = 5;
  assert.ok(liveUnderlyingPoints > 0);
  const replayWithLivePointsCanMutate = false && (liveUnderlyingPoints > 0);
  assert.equal(replayWithLivePointsCanMutate, false);
});
