"use client";
import type { ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationValue } from "../../../../app/domain/types";
import { deriveEvidencePresentation } from "./evidencePresentation";

export function TelemetryBadge({
  observation,
  causalValue,
  selectedSequence,
  onClick,
  inline = true,
}: {
  observation?: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null;
  causalValue?: unknown;
  selectedSequence?: number;
  onClick?: () => void;
  inline?: boolean;
}) {
  const descriptor = deriveEvidencePresentation(observation, selectedSequence, causalValue);

  if (descriptor.state === "causal-only") return null;

  const styleByState = {
    current: { background: "#082a38", border: "1px solid #31515e", color: "#7895a0", fontSize: "8px", padding: "1px 3px" },
    "last-known": { background: "#112638", border: "1px solid #2d5670", color: "#93cadb", fontSize: "8px", padding: "1px 4px" },
    estimated: { background: "#2a1e08", border: "1px solid #ffb74d", color: "#ffd052", fontSize: "9px", padding: "1px 5px" },
    unknown: { background: "#180a0c", border: "1px solid #4a1d22", color: "#a85c64", fontSize: "9px", padding: "1px 5px" },
  }[descriptor.state as "current" | "last-known" | "estimated" | "unknown"];

  return (
    <span
      className={`telemetry-pill ${descriptor.state}`}
      onClick={(event) => {
        if (onClick && descriptor.inspectable) {
          event.stopPropagation();
          onClick();
        }
      }}
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        gap: "3px",
        fontWeight: "bold",
        borderRadius: "3px",
        cursor: onClick && descriptor.inspectable ? "pointer" : "default",
        marginLeft: "6px",
        fontFamily: "monospace",
        ...styleByState,
      }}
      title={descriptor.inspectable ? `Click to inspect source evidence and observation provenance (${descriptor.label})` : "No observation or causal state available"}
    >
      {descriptor.badgeLabel}
    </span>
  );
}
