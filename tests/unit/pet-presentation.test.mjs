import assert from "node:assert/strict";
import test from "node:test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectState } from "../../app/domain/projection.ts";
import { derivePetPresentation } from "../../src/features/pet/public.ts";

test("derivePetPresentation handles empty or undefined pets array", () => {
  const empty = derivePetPresentation({ pets: undefined });
  assert.equal(empty.hasPets, false);
  assert.equal(empty.status, "unavailable");
  assert.equal(empty.petCount, 0);
  assert.equal(empty.badgeLabel, "NO PETS");
  assert.deepEqual(empty.pets, []);
});

test("derivePetPresentation defensively preserves unknown/unspecified fields without fabricating claims", () => {
  const incompletePet = {
    petId: "pet-unknown",
    // species, origin, classification, hostility, bondState all omitted
  };

  const pres = derivePetPresentation({ pets: [incompletePet] });
  assert.equal(pres.hasPets, true);
  const [pet] = pres.pets;

  assert.equal(pet.displayName, "pet-unknown");
  assert.equal(pet.species, "unknown");
  assert.equal(pet.originValueFormatted, "UNSPECIFIED");
  assert.equal(pet.classificationValueFormatted, "UNSPECIFIED");
  assert.equal(pet.hostilityState, "unknown");
  assert.equal(pet.hostilityLabel, "UNKNOWN");
  assert.equal(pet.bondState, "unknown");
  assert.equal(pet.bondStateLabel, "UNKNOWN");
  assert.equal(pet.bondHolderLabel, "UNKNOWN");
});

test("derivePetPresentation distinguishes unbonded, bonded-without-holder, and unknown-holder states", () => {
  const unbondedPet = {
    petId: "pet-1",
    species: "felis",
    bondState: "unbonded",
  };
  const bondedPetNoHolder = {
    petId: "pet-2",
    species: "canis",
    bondState: "bonded",
  };
  const bondedPetWithHolder = {
    petId: "pet-3",
    species: "ursus",
    bondState: "bonded",
    bondHolderCrawlerId: "crawler-carl",
  };

  const pres = derivePetPresentation({ pets: [unbondedPet, bondedPetNoHolder, bondedPetWithHolder] });
  const [p1, p2, p3] = pres.pets;

  assert.equal(p1.bondState, "unbonded");
  assert.equal(p1.bondHolderLabel, "NONE (UNBONDED)");

  assert.equal(p2.bondState, "bonded");
  assert.equal(p2.bondHolderLabel, "UNKNOWN (BONDED)");

  assert.equal(p3.bondState, "bonded");
  assert.equal(p3.bondHolderLabel, "crawler-carl");
});

test("derivePetPresentation formats acquired pet before bonding/naming", () => {
  const acquiredPet = {
    petId: "pet-mongo",
    species: "mongoliensis",
    origin: "dungeon-origin",
    classification: "pet-class",
    hostility: "hostile",
    bondState: "unbonded",
  };

  const pres = derivePetPresentation({ pets: [acquiredPet] });
  assert.equal(pres.hasPets, true);
  assert.equal(pres.petCount, 1);
  assert.equal(pres.badgeLabel, "1 PET");

  const [pet] = pres.pets;
  assert.equal(pet.petId, "pet-mongo");
  assert.equal(pet.displayName, "mongoliensis");
  assert.equal(pet.hasExplicitName, false);
  assert.equal(pet.speciesLabel, "Species: mongoliensis");
  assert.equal(pet.hostilityState, "hostile");
  assert.equal(pet.hostilityLabel, "HOSTILE");
  assert.equal(pet.bondState, "unbonded");
  assert.equal(pet.bondStateLabel, "UNBONDED");
  assert.equal(pet.bondHolderLabel, "NONE (UNBONDED)");
  assert.equal(pet.formattedTitle, undefined);
  assert.equal(pet.formattedLevel, undefined);
});

test("derivePetPresentation formats bonded and named pet with title", () => {
  const bondedPet = {
    petId: "pet-mongo",
    name: "Mongo",
    title: "Royal Steed",
    species: "mongoliensis",
    origin: "dungeon-origin",
    classification: "pet-class",
    hostility: "non-hostile",
    bondState: "bonded",
    bondHolderCrawlerId: "crawler-donut",
  };

  const pres = derivePetPresentation({ pets: [bondedPet] });
  const [pet] = pres.pets;

  assert.equal(pet.displayName, "Mongo");
  assert.equal(pet.hasExplicitName, true);
  assert.equal(pet.formattedTitle, "«Royal Steed»");
  assert.equal(pet.hostilityState, "non-hostile");
  assert.equal(pet.hostilityLabel, "NON-HOSTILE");
  assert.equal(pet.bondState, "bonded");
  assert.equal(pet.bondStateLabel, "BONDED");
  assert.equal(pet.bondHolderCrawlerId, "crawler-donut");
  assert.equal(pet.bondHolderLabel, "crawler-donut");
});

test("derivePetPresentation preserves temporal replay boundaries across compiled timeline sequence", () => {
  const acquiredEvent = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-acquired");
  const bondedEvent = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-bonded");
  assert.ok(acquiredEvent);
  assert.ok(bondedEvent);

  // Before acquisition
  const beforeAcqState = projectState(compiledTimeline, acquiredEvent.sequence - 1);
  const beforeAcqPres = derivePetPresentation({ pets: beforeAcqState.pets });
  assert.equal(beforeAcqPres.hasPets, false);

  // At acquisition
  const atAcqState = projectState(compiledTimeline, acquiredEvent.sequence);
  const atAcqPres = derivePetPresentation({ pets: atAcqState.pets });
  assert.equal(atAcqPres.hasPets, true);
  assert.equal(atAcqPres.pets[0].bondState, "unbonded");
  assert.equal(atAcqPres.pets[0].hostilityState, "hostile");

  // At bonding
  const atBondedState = projectState(compiledTimeline, bondedEvent.sequence);
  const atBondedPres = derivePetPresentation({ pets: atBondedState.pets });
  assert.equal(atBondedPres.hasPets, true);
  assert.equal(atBondedPres.pets[0].bondState, "bonded");
  assert.equal(atBondedPres.pets[0].displayName, "Mongo");
});

test("derivePetPresentation respects optional fields without fabricating mechanics when absent", () => {
  const petWithOptionals = {
    petId: "pet-test",
    species: "felis",
    origin: "surface-origin",
    classification: "dungeon-familiar",
    hostility: "non-hostile",
    bondState: "bonded",
    level: 3,
    deployment: "active",
    condition: { status: "healthy" },
  };

  const pres = derivePetPresentation({ pets: [petWithOptionals] });
  const [pet] = pres.pets;

  assert.equal(pet.formattedLevel, "Level 3");
  assert.equal(pet.formattedDeployment, "ACTIVE");
  assert.equal(pet.conditionStatus, "healthy");
});

test("shell feature presentation boundary receives replayed pet state rather than live state", () => {
  const acqSeq = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-acquired").sequence;
  const bondedSeq = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-bonded").sequence;

  const replayedAcquired = projectState(compiledTimeline, acqSeq);
  const liveState = projectState(compiledTimeline, bondedSeq);

  const replayedPres = derivePetPresentation({ pets: replayedAcquired.pets });
  const livePres = derivePetPresentation({ pets: liveState.pets });

  assert.equal(replayedPres.pets[0].bondState, "unbonded");
  assert.equal(replayedPres.pets[0].hasExplicitName, false);

  assert.equal(livePres.pets[0].bondState, "bonded");
  assert.equal(livePres.pets[0].hasExplicitName, true);
  assert.equal(livePres.pets[0].displayName, "Mongo");
});
