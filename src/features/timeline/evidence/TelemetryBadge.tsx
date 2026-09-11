"use client";
import type { ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationValue } from "../../../../app/domain/types";
import { deriveEvidencePresentation, type DisplayAuthority } from "./evidencePresentation";

export function TelemetryBadge({
  observation,
  causalValue,
  displayAuthority,
  selectedSequence,
  onClick,
  inline = true,
}: {
  observation?: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null;
  causalValue?: unknown;
  displayAuthority?: DisplayAuthority;
  selectedSequence?: number;
  onClick?: () => void;
  inline?: boolean;
}) {
  const descriptor = deriveEvidencePresentation(observation, selectedSequence, causalValue, displayAuthority);

  const styleByState = {
    current: {
      background: "var(--hud-evidence-current-bg)",
      border: "1px solid var(--hud-evidence-current-border)",
      color: "var(--hud-evidence-current-text)",
      fontSize: "8px",
      padding: "1px 3px",
    },
    "last-known": {
      background: "var(--hud-evidence-last-known-bg)",
      border: "1px solid var(--hud-evidence-last-known-border)",
      color: "var(--hud-evidence-last-known-text)",
      fontSize: "8px",
      padding: "1px 4px",
    },
    estimated: {
      background: "var(--hud-evidence-estimated-bg)",
      border: "1px solid var(--hud-evidence-estimated-border)",
      color: "var(--hud-evidence-estimated-text)",
      fontSize: "9px",
      padding: "1px 5px",
    },
    "causal-only": {
      background: "var(--hud-evidence-causal-bg)",
      border: "1px solid var(--hud-evidence-causal-border)",
      color: "var(--hud-evidence-causal-text)",
      fontSize: "8px",
      padding: "1px 4px",
    },
    unknown: {
      background: "var(--hud-evidence-unknown-bg)",
      border: "1px solid var(--hud-evidence-unknown-border)",
      color: "var(--hud-evidence-unknown-text)",
      fontSize: "9px",
      padding: "1px 5px",
    },
  }[descriptor.state];

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
      title={descriptor.inspectable ? `Click to inspect source evidence and observation provenance (${descriptor.label})` : descriptor.label}
    >
      {descriptor.badgeLabel}
    </span>
  );
}
