import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveEvidencePresentation,
  mapEvidenceToSemantics,
} from "../../src/features/timeline/public.ts";
import {
  derivePartyPresentation,
  mapPartyStatusToSemantics,
} from "../../src/features/party/public.ts";
import {
  derivePetPresentation,
  mapPetStatusToSemantics,
} from "../../src/features/pet/public.ts";

test("HUD Semantics: current observed telemetry mapping", () => {
  const currentObs = {
    sequence: 10,
    timestamp: "2026-03-31T00:00:00Z",
    referenceObservationIds: ["obs-10"],
    value: 100,
  };
  const evidence = deriveEvidencePresentation(currentObs, 10);
  const semantic = mapEvidenceToSemantics(evidence);

  assert.deepEqual(semantic, {
    status: "present",
    temporal: "current",
    authority: "observed",
    affordance: "inspect",
    provenance: { inspectable: true },
  });
});

test("HUD Semantics: last-known telemetry mapping", () => {
  const staleObs = {
    sequence: 10,
    timestamp: "2026-03-31T00:00:00Z",
    referenceObservationIds: ["obs-10"],
    value: 80,
  };
  const evidence = deriveEvidencePresentation(staleObs, 25);
  const semantic = mapEvidenceToSemantics(evidence);

  assert.deepEqual(semantic, {
    status: "present",
    temporal: "last-known",
    authority: "observed",
    affordance: "inspect",
    provenance: { inspectable: true },
  });
});

test("HUD Semantics: estimated telemetry mapping", () => {
  const estimatedObs = {
    sequence: 15,
    status: "estimated",
    sourceSequences: [10, 20],
    referenceObservationIds: ["obs-10", "obs-20"],
    value: 50,
  };
  const evidence = deriveEvidencePresentation(estimatedObs, 15);
  const semantic = mapEvidenceToSemantics(evidence);

  assert.deepEqual(semantic, {
    status: "present",
    temporal: "current",
    authority: "estimated",
    affordance: "inspect",
    provenance: { inspectable: true },
  });
});

test("HUD Semantics: causal-only telemetry mapping produces causal authority without implied temporal status", () => {
  const evidence = deriveEvidencePresentation(null, 15, 100);
  const semantic = mapEvidenceToSemantics(evidence);

  assert.equal(semantic.temporal, undefined);
  assert.deepEqual(semantic, {
    status: "present",
    authority: "causal",
    affordance: "none",
    provenance: { inspectable: false },
  });
});

test("HUD Semantics: unknown telemetry mapping", () => {
  const evidence = deriveEvidencePresentation(null, 15, null);
  const semantic = mapEvidenceToSemantics(evidence);

  assert.deepEqual(semantic, {
    status: "unknown",
    affordance: "none",
    provenance: { inspectable: false },
  });
});

test("HUD Semantics: Party semantic states (not-established vs established vs known-empty)", () => {
  const unestablishedParty = derivePartyPresentation({});
  assert.equal(unestablishedParty.status, "not-established");
  const unestablishedSemantic = mapPartyStatusToSemantics(unestablishedParty.status);
  assert.deepEqual(unestablishedSemantic, {
    status: "not-established",
    affordance: "none",
  });

  const establishedParty = derivePartyPresentation({
    party: {
      partyId: "p1",
      name: "The Princess Posse",
      members: [{ crawlerId: "c1", name: "Carl", role: "leader" }],
    },
  });
  assert.equal(establishedParty.status, "established");

  const newlyEstablishedSemantic = mapPartyStatusToSemantics(
    establishedParty.status,
    "newly-established"
  );
  assert.deepEqual(newlyEstablishedSemantic, {
    status: "present",
    change: "newly-established",
    affordance: "none",
  });

  const changedSemantic = mapPartyStatusToSemantics(
    establishedParty.status,
    "changed"
  );
  assert.deepEqual(changedSemantic, {
    status: "present",
    change: "changed",
    affordance: "none",
  });

  const emptyParty = derivePartyPresentation({
    party: { partyId: "p2", name: "Empty Guild", members: [] },
  });
  assert.equal(emptyParty.status, "known-empty");
  const emptySemantic = mapPartyStatusToSemantics(emptyParty.status);
  assert.deepEqual(emptySemantic, {
    status: "known-empty",
    affordance: "none",
  });
});

test("HUD Semantics: Pet semantic states (known-empty vs established vs unavailable)", () => {
  const emptyPet = derivePetPresentation({ pets: [] });
  assert.equal(emptyPet.status, "known-empty");
  const emptySemantic = mapPetStatusToSemantics(emptyPet.status);
  assert.deepEqual(emptySemantic, {
    status: "known-empty",
    affordance: "none",
  });

  const establishedPet = derivePetPresentation({
    pets: [
      {
        petId: "pet-1",
        species: "Cat",
        bondState: "bonded",
      },
    ],
  });
  assert.equal(establishedPet.status, "established");
  const establishedSemantic = mapPetStatusToSemantics(
    establishedPet.status,
    "newly-established"
  );
  assert.deepEqual(establishedSemantic, {
    status: "present",
    change: "newly-established",
    affordance: "none",
  });

  const unavailableSemantic = mapPetStatusToSemantics("unavailable");
  assert.deepEqual(unavailableSemantic, {
    status: "unavailable",
    affordance: "none",
  });
});
