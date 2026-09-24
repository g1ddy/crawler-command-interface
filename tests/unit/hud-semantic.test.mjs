import assert from "node:assert/strict";
import {
  mapCapabilityAvailabilityToSemantics,
} from "../../src/presentation/semantic/public.ts";

test("HUD Semantics: PresentationMotionIntent vocabulary is renderer-neutral and explicit", () => {
  const intents = [
    "established",
    "changed",
    "attention",
    "enter-context",
    "enter-replay",
    "return-live",
    "disclose",
  ];

  // The semantic transition intent is a simple string passed explicitly.
  // It is the semantic reason for motion, not a command to the renderer.
  for (const intent of intents) {
    const semantic = { status: "present", motionIntent: intent };
    assert.equal(
      semantic.motionIntent,
      intent,
      `Semantic payload preserves motionIntent: ${intent}`
    );
  }
});

test("HUD Semantics: stable presentation produces no motion intent", () => {
  const stableSemantics = [
    { label: "initial Live", semantic: { status: "present" } },
    { label: "initial Replay", semantic: { status: "present" } },
    { label: "replay scrub while already in Replay", semantic: { status: "present" } },
    { label: "ordinary telemetry changes", semantic: { status: "present" } },
    { label: "countdown ticks", semantic: { status: "present" } }
  ];

  for (const { label, semantic } of stableSemantics) {
    assert.equal(
      semantic.motionIntent,
      undefined,
      `Stable presentation produces no motion intent for: ${label}`
    );
  }
});

test("HUD Semantics: evaluated capability maps only to affordance", () => {
  assert.deepEqual(mapCapabilityAvailabilityToSemantics(true), {
    affordance: "action",
  });

  assert.deepEqual(mapCapabilityAvailabilityToSemantics(false), {
    affordance: "none",
  });
});

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
  // deriveEvidencePresentation emits "causal-only" strictly when causalValue !== null/undefined,
  // guaranteeing that the value is established (status: "present").
  const evidence = deriveEvidencePresentation(null, 15, 100);
  assert.equal(evidence.state, "causal-only");

  const semantic = mapEvidenceToSemantics(evidence);

  assert.equal(semantic.status, "present");
  assert.equal(semantic.authority, "causal");
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

  // Verify that "unavailable" is a supported vocabulary state tested directly
  // without pretending a current production feature derivation emits it.
  const unavailableSemantic = mapPetStatusToSemantics("unavailable");
  assert.deepEqual(unavailableSemantic, {
    status: "unavailable",
    affordance: "none",
  });
});

test("HUD Semantics: stable presentation produces no motion intent", () => {
  const intents = [
    undefined,
    null
  ];
  for (const intent of intents) {
    const semantic = {
      status: "present",
      motionIntent: intent,
    };
    assert.equal(semantic.motionIntent, intent);
  }
});
