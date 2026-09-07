import assert from "node:assert/strict";
import test from "node:test";
import {
  evidenceConfidenceLabel,
  evidenceSummary,
  firstCountdownEvidenceSummary,
  formatEvidenceLocator,
} from "../../src/features/timeline/evidence/evidencePresentation.ts";

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
