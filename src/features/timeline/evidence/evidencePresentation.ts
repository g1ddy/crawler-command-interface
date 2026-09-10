import type {
  CountdownReference,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
  TimelineEvidence,
} from "../../../../app/domain/types";

export type EvidenceState = "current" | "last-known" | "estimated" | "causal-only" | "unknown";

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
 * When a causal transition has modified state beyond the initial default, or
 * if no observation exists, causal state is returned.
 * If causal state remains at its un-mutated initial default and a sourced observation exists,
 * the sourced observation value is displayed so default state does not hide valid telemetry.
 */
export function selectDisplayedReading<T extends number | string | undefined>(
  causalValue: T,
  observationValue: T,
  initialCausalDefault: T,
  sequence?: number
): T {
  const hasObservation = observationValue !== undefined && observationValue !== null;
  const isInitialDefault = causalValue === initialCausalDefault || sequence === 0;

  if (hasObservation && isInitialDefault) {
    return observationValue;
  }
  return causalValue ?? observationValue;
}

export function deriveEvidencePresentation(
  observation?: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null,
  selectedSequence?: number,
  causalValue?: unknown
): EvidencePresentation {
  if (observation) {
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

  if (causalValue !== undefined && causalValue !== null) {
    return {
      state: "causal-only",
      label: "Causal state",
      badgeLabel: "",
      referenceObservationIds: [],
      inspectable: false,
    };
  }

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
