import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveEvidencePresentation,
  displayedReadingAuthority,
  evidenceConfidenceLabel,
  evidenceSummary,
  firstCountdownEvidenceSummary,
  formatEvidenceLocator,
  selectDisplayedReading,
} from "../../src/features/timeline/evidence/evidencePresentation.ts";

test("selectDisplayedReading uses causal provenance rather than a numeric default heuristic", () => {
  // Unchanged initial state can be represented by the available observation.
  assert.equal(selectDisplayedReading(50, 3, undefined), 3);
  assert.equal(displayedReadingAuthority(50, 3, undefined), "observation");

  // A later causal event remains authoritative even when it returns to 50.
  assert.equal(selectDisplayedReading(50, 3, 40), 50);
  assert.equal(displayedReadingAuthority(50, 3, 40), "causal");

  // Without an observation, causal state remains the only displayable value.
  assert.equal(selectDisplayedReading(50, undefined, undefined), 50);
  assert.equal(displayedReadingAuthority(50, undefined, undefined), "causal");
});

test("deriveEvidencePresentation derives current, last-known, estimated, causal-only, and unknown states", () => {
  const currentObs = {
    key: "crawler-condition.currentHealth",
    value: 100,
    status: "stated",
    basis: "exact-observation",
    evidence: [],
    referenceObservationIds: ["obs-1"],
    sequence: 10,
  };

  assert.deepEqual(deriveEvidencePresentation(currentObs, 10), {
    state: "current",
    label: "Observed",
    badgeLabel: "SOURCE",
    sourceSequence: 10,
    referenceObservationIds: ["obs-1"],
    inspectable: true,
  });

  assert.deepEqual(deriveEvidencePresentation(currentObs, 25), {
    state: "last-known",
    label: "Last known · sequence 10",
    badgeLabel: "LAST KNOWN · SEQ 10",
    sourceSequence: 10,
    referenceObservationIds: ["obs-1"],
    inspectable: true,
  });

  const estimatedObs = {
    key: "crawler-condition.currentMana",
    value: 50,
    status: "estimated",
    basis: "sequence-position",
    evidence: [],
    referenceObservationIds: ["obs-1", "obs-2"],
    sourceSequences: [10, 20],
  };

  assert.deepEqual(deriveEvidencePresentation(estimatedObs, 15), {
    state: "estimated",
    label: "Estimated",
    badgeLabel: "📡 ESTIMATED",
    sourceSequences: [10, 20],
    referenceObservationIds: ["obs-1", "obs-2"],
    inspectable: true,
  });

  assert.deepEqual(deriveEvidencePresentation(null, 15, 100), {
    state: "causal-only",
    label: "Causal state",
    badgeLabel: "CAUSAL",
    referenceObservationIds: [],
    inspectable: false,
  });

  assert.deepEqual(deriveEvidencePresentation(currentObs, 25, 100, "causal"), {
    state: "causal-only",
    label: "Causal state · last known · sequence 10",
    badgeLabel: "CAUSAL",
    sourceSequence: 10,
    referenceObservationIds: ["obs-1"],
    inspectable: true,
  });

  assert.deepEqual(deriveEvidencePresentation(null, 15, null), {
    state: "unknown",
    label: "Unknown",
    badgeLabel: "— ABSENT",
    referenceObservationIds: [],
    inspectable: false,
  });
});

test("evidence presentation preserves source, locator, and confidence", () => {
  const evidence = {
    sourceId: "src-floor-2",
    locator: { book: 1, chapter: 12, floor: 2, section: "Floor Timeline", timestamp: "01:23" },
    confidence: "corroborated",
  };

  assert.equal(
    formatEvidenceLocator(evidence),
    "Book 1 · Chapter 12 · Floor 2 · Floor Timeline · @ 01:23",
  );
  assert.equal(evidenceConfidenceLabel(evidence), "CORROBORATED");
  assert.equal(
    evidenceSummary(evidence),
    "src-floor-2 · Book 1 · Chapter 12 · Floor 2 · Floor Timeline · @ 01:23 [CORROBORATED]",
  );
});

test("missing evidence confidence retains the historical confirmed default", () => {
  assert.equal(evidenceConfidenceLabel({ sourceId: "src-primary" }), "CONFIRMED");
});

test("secondary countdown summary exposes its first sourced reference", () => {
  const references = [
    {
      sequence: 88,
      remainingSeconds: 403200,
      evidence: [
        {
          sourceId: "src-dcc-database-floor-2",
          locator: { section: "Floor Timeline & Patch Notes" },
          confidence: "corroborated",
        },
      ],
    },
  ];

  assert.equal(
    firstCountdownEvidenceSummary(references),
    "src-dcc-database-floor-2 · Floor Timeline & Patch Notes [CORROBORATED]",
  );
});
