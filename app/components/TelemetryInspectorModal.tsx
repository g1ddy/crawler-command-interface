"use client";
import React from "react";
import type {
  ProjectedObservationValue,
  ProjectedItemObservation,
  ProjectedEquipmentObservation,
  TimelineSource,
} from "../domain/types";

interface TelemetryInspectorModalProps {
  observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation;
  sources?: TimelineSource[];
  onClose: () => void;
}

export function TelemetryInspectorModal({
  observation,
  sources = [],
  onClose,
}: TelemetryInspectorModalProps) {
  const isNumeric = "key" in observation;
  const isItem = "itemInstanceId" in observation && "present" in observation;
  const isEquipment = "slot" in observation && !("present" in observation);

  const keyLabel = isNumeric
    ? (observation as ProjectedObservationValue).key
    : isItem
    ? `Inventory Item ${(observation as ProjectedItemObservation).itemInstanceId}`
    : `Equipment Slot ${(observation as ProjectedEquipmentObservation).slot}`;

  const statusLabel = observation.status.toUpperCase();
  const basisLabel = observation.basis;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">TELEMETRY OBSERVATION & PROVENANCE</p>
            <h2>{keyLabel}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div
          style={{
            background: "#06131c",
            padding: "12px",
            border: "1px solid #1f4252",
            borderRadius: "4px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px" }}>
            <div>
              <span style={{ color: "#7fa0ac" }}>STATUS:</span>{" "}
              <strong
                style={{
                  color: observation.status === "stated" ? "#4ee88a" : "#ffd052",
                }}
              >
                {statusLabel} ({observation.status === "stated" ? "Exact Fact" : "Estimated / Interpolated"})
              </strong>
            </div>
            <div>
              <span style={{ color: "#7fa0ac" }}>CALCULATION BASIS:</span>{" "}
              <strong style={{ color: "#9be2f3" }}>{basisLabel}</strong>
            </div>
            {isNumeric && (
              <div>
                <span style={{ color: "#7fa0ac" }}>OBSERVED VALUE:</span>{" "}
                <strong style={{ color: "#1bd9ff", fontSize: "14px" }}>
                  {(observation as ProjectedObservationValue).value.toLocaleString()}
                </strong>
              </div>
            )}
            {isItem && (
              <div>
                <span style={{ color: "#7fa0ac" }}>ITEM PRESENCE:</span>{" "}
                <strong style={{ color: (observation as ProjectedItemObservation).present ? "#4ee88a" : "#ff5868" }}>
                  {(observation as ProjectedItemObservation).present ? "PRESENT" : "ABSENT"}
                </strong>
              </div>
            )}
            {isEquipment && (
              <div>
                <span style={{ color: "#7fa0ac" }}>EQUIPPED INSTANCE:</span>{" "}
                <strong style={{ color: "#9be2f3" }}>
                  {(observation as ProjectedEquipmentObservation).itemInstanceId || "EMPTY"}
                </strong>
              </div>
            )}
          </div>
        </div>

        <p className="eyebrow">
          ANCHOR OBSERVATIONS & PROVENANCE ({observation.referenceObservationIds.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
          {observation.referenceObservationIds.map((obsId) => (
            <div
              key={obsId}
              style={{
                background: "#091924",
                border: "1px solid #1d3e4e",
                padding: "6px 10px",
                borderRadius: "3px",
                fontSize: "10px",
                color: "#8ca8b3",
              }}
            >
              <strong>Observation ID:</strong> <span style={{ color: "#1bd9ff" }}>{obsId}</span>
            </div>
          ))}
        </div>

        <p className="eyebrow">CITED EVIDENCE & LOCATORS ({observation.evidence.length})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
          {observation.evidence.map((ev, idx) => {
            const sourceObj = sources.find((s) => s.id === ev.sourceId);
            const sourceTitle = sourceObj ? sourceObj.title : ev.sourceId;
            const locatorStr = ev.locator
              ? [
                  ev.locator.book ? `Book ${ev.locator.book}` : null,
                  ev.locator.chapter ? `Chapter ${ev.locator.chapter}` : null,
                  ev.locator.section ? ev.locator.section : null,
                  ev.locator.timestamp ? `@ ${ev.locator.timestamp}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "No specific locator";

            return (
              <div
                key={idx}
                style={{
                  background: "#081622",
                  border: "1px solid #1c3c4b",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  fontSize: "11px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ color: "#e2f4f6" }}>{sourceTitle}</strong>
                  <span
                    style={{
                      fontSize: "9px",
                      background: "#112a36",
                      padding: "1px 6px",
                      color: "#6fe8f7",
                      borderRadius: "3px",
                    }}
                  >
                    {ev.confidence || "confirmed"}
                  </span>
                </div>
                <p style={{ margin: "2px 0", color: "#8da5ae", fontSize: "10px" }}>
                  Locator: <span style={{ color: "#ffb74d" }}>{locatorStr}</span>
                </p>
                {ev.note && (
                  <p style={{ margin: "4px 0 0 0", fontStyle: "italic", color: "#a5b9c0", fontSize: "10px" }}>
                    Note: {ev.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-footer" style={{ marginTop: "12px" }}>
          <button className="outline" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
