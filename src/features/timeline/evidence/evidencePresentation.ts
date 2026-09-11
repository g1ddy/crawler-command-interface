import type {
  CountdownReference,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
  TimelineEvidence,
} from "../../../../app/domain/types";

export type EvidenceState = "current" | "last-known" | "estimated" | "causal-only" | "unknown";
export type DisplayAuthority = "causal" | "observation";

export interface EvidencePresentation {
  state: EvidenceState;
  label: string;
  badgeLabel: string;
  sourceSequence?: number;
  sourceSequences?: [number, number];
  referenceObservationIds: string[];
  inspectable: boolean;
}

/**
 * Selects the authoritative display value for domain vitals/stats.
 * An event-derived causal value is authoritative even when it happens to equal
 * an initial/default value. Otherwise a source-backed observation supplies the
 * displayed telemetry when one is available.
 */
export function selectDisplayedReading<T extends number | string | undefined>(
  causalValue: T,
  observationValue: T,
  causalSequence?: number
): T {
  const hasObservation = observationValue !== undefined && observationValue !== null;

  if (hasObservation && causalSequence === undefined) {
    return observationValue;
  }
  return causalValue ?? observationValue;
}

export function displayedReadingAuthority(
  causalValue: unknown,
  observationValue: unknown,
  causalSequence?: number
): DisplayAuthority {
  const hasObservation = observationValue !== undefined && observationValue !== null;
  const hasCausalValue = causalValue !== undefined && causalValue !== null;
  return hasObservation && (!hasCausalValue || causalSequence === undefined) ? "observation" : "causal";
}

function deriveObservationPresentation(
  observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation,
  selectedSequence?: number
): EvidencePresentation {
  const referenceObservationIds = observation.referenceObservationIds || [];
  if ("status" in observation && observation.status === "estimated") {
    const sourceSequences = "sourceSequences" in observation ? observation.sourceSequences : undefined;
    return {
      state: "estimated",
      label: "Estimated",
      badgeLabel: "📡 ESTIMATED",
      sourceSequences,
      referenceObservationIds,
      inspectable: true,
    };
  }

  const sourceSequence = observation.sequence;
  const isLastKnown =
    selectedSequence !== undefined &&
    sourceSequence !== undefined &&
    sourceSequence < selectedSequence;

  if (isLastKnown) {
    return {
      state: "last-known",
      label: `Last known · sequence ${sourceSequence}`,
      badgeLabel: `LAST KNOWN · SEQ ${sourceSequence}`,
      sourceSequence,
      referenceObservationIds,
      inspectable: true,
    };
  }

  return {
    state: "current",
    label: "Observed",
    badgeLabel: "SOURCE",
    sourceSequence,
    referenceObservationIds,
    inspectable: true,
  };
}

export function deriveEvidencePresentation(
  observation?: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null,
  selectedSequence?: number,
  causalValue?: unknown,
  displayAuthority: DisplayAuthority = observation ? "observation" : "causal"
): EvidencePresentation {
  if (displayAuthority === "causal" && causalValue !== undefined && causalValue !== null) {
    const observed = observation ? deriveObservationPresentation(observation, selectedSequence) : null;
    return {
      state: "causal-only",
      label: observed ? `Causal state · ${observed.label.toLowerCase()}` : "Causal state",
      badgeLabel: "CAUSAL",
      ...(observed?.sourceSequence !== undefined ? { sourceSequence: observed.sourceSequence } : {}),
      ...(observed?.sourceSequences !== undefined ? { sourceSequences: observed.sourceSequences } : {}),
      referenceObservationIds: observed?.referenceObservationIds ?? [],
      inspectable: Boolean(observed),
    };
  }

  if (observation) return deriveObservationPresentation(observation, selectedSequence);

  return {
    state: "unknown",
    label: "Unknown",
    badgeLabel: "— ABSENT",
    referenceObservationIds: [],
    inspectable: false,
  };
}

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
