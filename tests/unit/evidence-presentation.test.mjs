import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveEvidencePresentation,
  evidenceConfidenceLabel,
  evidenceSummary,
  firstCountdownEvidenceSummary,
  formatEvidenceLocator,
  selectDisplayedReading,
} from "../../src/features/timeline/evidence/evidencePresentation.ts";

test("selectDisplayedReading respects initial causal default vs sourced observation vs causal transition", () => {
  // Case 1: Causal state is at initial default (50), observation exists (3) -> Sourced observation selected (3)
  assert.equal(selectDisplayedReading(50, 3, 50, 34), 3);

  // Case 2: Causal state was modified (120 != 50) -> Causal state selected (120)
  assert.equal(selectDisplayedReading(120, 3, 50, 40), 120);

  // Case 3: No observation exists -> Causal state selected (50)
  assert.equal(selectDisplayedReading(50, undefined, 50, 34), 50);

  // Case 4: Sequence 0 -> Sourced observation selected if available (3)
  assert.equal(selectDisplayedReading(50, 3, 50, 0), 3);
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
    badgeLabel: "",
    referenceObservationIds: [],
    inspectable: false,
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
