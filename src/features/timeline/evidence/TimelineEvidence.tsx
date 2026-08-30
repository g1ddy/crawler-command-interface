"use client";
import React from "react";
import type {
  ProjectedObservationsState,
  ProjectedObservationValue,
  ProjectedItemObservation,
  ProjectedEquipmentObservation,
  TimelineSource,
} from "../../../../app/domain/types";
import { formatProjectedObservationValue } from "../../../../app/domain/observations";
import { TelemetryBadge } from "../../../../app/components/TelemetryBadge";
import { Panel } from "../../../shared/ui/Panel";

interface TimelineEvidenceProps {
  observations?: ProjectedObservationsState;
  sequence: number;
  sources: TimelineSource[];
  onInspectObservation?: (
    obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation
  ) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function TimelineEvidence({
  observations,
  sequence,
  onInspectObservation,
  onClose,
  isModal = false,
}: TimelineEvidenceProps) {
  const content = (
    <Panel title="POINT-IN-TIME SOURCED TELEMETRY & HUD READINGS">
      <p style={{ fontSize: "11px", color: "#8fa1aa", marginBottom: "12px" }}>
        The following Sourced Telemetry readings are projected at Sequence #{sequence}. Stated facts represent explicit source observations, while estimated values use bounded linear interpolation across phase boundaries.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {observations ? (
          <>
            <div style={{ background: "#06131c", border: "1px solid #1f4252", padding: "10px", borderRadius: "4px" }}>
              <h3 style={{ fontSize: "11px", color: "#1bd9ff", margin: "0 0 8px 0" }}>CRAWLER CONDITION & ATTRIBUTES</h3>
              {Object.keys(observations.condition).length === 0 && Object.keys(observations.attributes).length === 0 ? (
                <p style={{ fontSize: "10px", color: "#6a8592" }}>No condition or attribute observations at this sequence.</p>
              ) : (
                <div style={{ display: "grid", gap: "6px" }}>
                  {Object.entries(observations.condition).map(([k, val]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                      <span>Condition.{k}: <strong style={{ color: "#fff" }}>{val.value.toLocaleString()}</strong></span>
                      <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                    </div>
                  ))}
                  {Object.entries(observations.attributes).map(([k, val]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                      <span>Attribute.{k}: <strong style={{ color: "#fff" }}>{val.value.toLocaleString()}</strong></span>
                      <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#06131c", border: "1px solid #1f4252", padding: "10px", borderRadius: "4px" }}>
              <h3 style={{ fontSize: "11px", color: "#1bd9ff", margin: "0 0 8px 0" }}>XP PROGRESS & BROADCAST METRICS</h3>
              {Object.keys(observations.xpProgress).length === 0 && Object.keys(observations.broadcast).length === 0 ? (
                <p style={{ fontSize: "10px", color: "#6a8592" }}>No XP or broadcast observations at this sequence.</p>
              ) : (
                <div style={{ display: "grid", gap: "6px" }}>
                  {Object.entries(observations.xpProgress).map(([k, val]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                      <span>XP.{k}: <strong style={{ color: "#fff" }}>{val.value.toLocaleString()}</strong></span>
                      <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                    </div>
                  ))}
                  {Object.entries(observations.broadcast).map(([k, val]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                      <span>Broadcast.{k}: <strong style={{ color: "#fff" }}>{val.value.toLocaleString()}</strong></span>
                      <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#06131c", border: "1px solid #1f4252", padding: "10px", borderRadius: "4px", gridColumn: "1 / -1" }}>
              <h3 style={{ fontSize: "11px", color: "#1bd9ff", margin: "0 0 8px 0" }}>FLOOR METRICS</h3>
              {Object.keys(observations.floor).length === 0 ? (
                <p style={{ fontSize: "10px", color: "#6a8592" }}>No floor metrics sourced at this sequence.</p>
              ) : (
                Object.entries(observations.floor).map(([key, value]) => (
                  <div key={key} className="telemetry-metric-row">
                    <span>
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}:{" "}
                      <strong>{formatProjectedObservationValue(value)}</strong>
                    </span>
                    <TelemetryBadge observation={value} onClick={() => onInspectObservation?.(value)} />
                  </div>
                ))
              )}
            </div>

            <div style={{ background: "#06131c", border: "1px solid #1f4252", padding: "10px", borderRadius: "4px", gridColumn: "1 / -1" }}>
              <h3 style={{ fontSize: "11px", color: "#1bd9ff", margin: "0 0 8px 0" }}>OBSERVED INVENTORY & EQUIPMENT</h3>
              {Object.keys(observations.inventory).length === 0 && Object.keys(observations.equipment).length === 0 ? (
                <p style={{ fontSize: "10px", color: "#6a8592" }}>No inventory or equipment observations at this sequence.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "6px" }}>
                  {Object.values(observations.inventory).map((val) => (
                    <div key={`inventory-${val.itemInstanceId}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                      <span>Inventory.{val.itemInstanceId}: <strong style={{ color: "#fff" }}>{val.present === false ? "ABSENT" : "PRESENT"}</strong></span>
                      <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                    </div>
                  ))}
                  {Object.values(observations.equipment).map((val) => (
                    <div key={`equipment-${val.slot}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                      <span>Equipment.{val.slot}: <strong style={{ color: "#fff" }}>{val.itemInstanceId || "EMPTY"}</strong></span>
                      <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p style={{ fontSize: "11px", color: "#8fa1aa" }}>No telemetry projected.</p>
        )}
      </div>
    </Panel>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px", maxHeight: "85vh", overflowY: "auto" }}>
        <div className="modal-header" style={{ marginBottom: "12px" }}>
          <div>
            <p className="eyebrow">TELEMETRY & EVIDENCE INSPECTOR</p>
            <h2>SOURCED HUD OBSERVATIONS</h2>
          </div>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
        {content}
        <div className="modal-footer" style={{ marginTop: "12px" }}>
          <button className="outline" onClick={onClose}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
