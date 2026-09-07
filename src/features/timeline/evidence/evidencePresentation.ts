import type { CountdownReference, TimelineEvidence } from "../../../../app/domain/types";

export function evidenceConfidenceLabel(evidence: TimelineEvidence): string {
  return (evidence.confidence ?? "confirmed").toUpperCase();
}

export function formatEvidenceLocator(evidence: TimelineEvidence): string {
  if (!evidence.locator) return "No specific locator";

  const parts = [
    evidence.locator.book !== undefined ? `Book ${evidence.locator.book}` : null,
    evidence.locator.chapter !== undefined ? `Chapter ${evidence.locator.chapter}` : null,
    evidence.locator.floor !== undefined ? `Floor ${evidence.locator.floor}` : null,
    evidence.locator.section ?? null,
    evidence.locator.timestamp ? `@ ${evidence.locator.timestamp}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" · ") : "No specific locator";
}

export function evidenceSummary(evidence: TimelineEvidence): string {
  const locator = formatEvidenceLocator(evidence);
  const locatorSuffix = locator === "No specific locator" ? "" : ` · ${locator}`;
  return `${evidence.sourceId}${locatorSuffix} [${evidenceConfidenceLabel(evidence)}]`;
}

export function firstCountdownEvidenceSummary(referencePoints: CountdownReference[]): string {
  const evidence = referencePoints.flatMap((reference) => reference.evidence ?? [])[0];
  return evidence ? evidenceSummary(evidence) : "not sourced at this sequence";
}
