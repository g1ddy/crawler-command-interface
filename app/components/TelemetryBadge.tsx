"use client";
import React from "react";
import type {
  ProjectedObservationValue,
  ProjectedItemObservation,
  ProjectedEquipmentObservation,
} from "../domain/types";

interface TelemetryBadgeProps {
  observation?: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null;
  causalValue?: unknown;
  onClick?: () => void;
  inline?: boolean;
}

export function TelemetryBadge({
  observation,
  causalValue,
  onClick,
  inline = true,
}: TelemetryBadgeProps) {
  if (observation) {
    const isStated = observation.status === "stated";
    const label = isStated ? "SOURCE" : "📡 ESTIMATED";
    return (
      <span
        className={`telemetry-pill ${isStated ? "stated" : "estimated"}`}
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        style={{
          display: inline ? "inline-flex" : "flex",
          alignItems: "center",
          gap: "3px",
          fontSize: isStated ? "8px" : "9px",
          fontWeight: "bold",
          padding: isStated ? "1px 3px" : "1px 5px",
          borderRadius: "3px",
          cursor: onClick ? "pointer" : "default",
          background: isStated ? "#082a38" : "#2a1e08",
          border: `1px solid ${isStated ? "#31515e" : "#ffb74d"}`,
          color: isStated ? "#7895a0" : "#ffd052",
          marginLeft: "6px",
          fontFamily: "monospace",
        }}
        title={`Click to inspect source evidence and observation provenance (${observation.status})`}
      >
        {label}
      </span>
    );
  }

  if (causalValue !== undefined && causalValue !== null) return null;

  return (
    <span
      className="telemetry-pill absent"
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "9px",
        fontWeight: "bold",
        padding: "1px 5px",
        borderRadius: "3px",
        background: "#180a0c",
        border: "1px solid #4a1d22",
        color: "#a85c64",
        marginLeft: "6px",
        fontFamily: "monospace",
      }}
      title="No observation or causal state available"
    >
      — ABSENT
    </span>
  );
}
