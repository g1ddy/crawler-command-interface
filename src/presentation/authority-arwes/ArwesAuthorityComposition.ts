"use client";
import { createElement } from "react";
import { AuthorityFrame } from "./primitives/AuthorityFrame.ts";
import { AuthoritySurface } from "./primitives/AuthoritySurface.ts";
import { AuthorityText } from "./primitives/AuthorityText.ts";
import { AuthorityBackground } from "./primitives/AuthorityBackground.ts";
import {
  deriveEvidencePresentation,
  mapEvidenceToSemantics,
} from "../../features/timeline/public.ts";
import type { HudCompositionModel } from "../../shell/hud/public.ts";
import type {
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";

export interface ArwesAuthorityCompositionProps {
  composition: HudCompositionModel;
  onInspectObservation?: (
    observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation
  ) => void;
}

interface TelemetryRowProps {
  label: string;
  testId: string;
  observation?: ProjectedObservationValue | null;
  selectedSequence: number;
  onInspectObservation?: (
    observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation
  ) => void;
  unit?: string;
}

function TelemetryRow({
  label,
  testId,
  observation,
  selectedSequence,
  onInspectObservation,
  unit = "",
}: TelemetryRowProps) {
  const evidence = deriveEvidencePresentation(observation, selectedSequence);
  const semantics = mapEvidenceToSemantics(evidence);

  const valueDisplay =
    observation?.value !== undefined && observation?.value !== null
      ? `${observation.value}${unit}`
      : "— ABSENT";

  const isInspectable = semantics.provenance?.inspectable && Boolean(observation) && Boolean(onInspectObservation);

  const getBadgeColor = () => {
    switch (semantics.authority) {
      case "observed":
        return semantics.temporal === "last-known" ? "#f59e0b" : "#38bdf8";
      case "estimated":
        return "#a855f7";
      case "causal":
        return "#3b82f6";
      default:
        return "#64748b";
    }
  };

  return createElement(
    "div",
    {
      className: "arwes-telemetry-row",
      "data-testid": testId,
      "data-status": semantics.status,
      "data-authority": semantics.authority || "none",
      "data-temporal": semantics.temporal || "current",
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.5rem 0.75rem",
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        borderRadius: "3px",
      },
    },
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "0.15rem" } },
      createElement(
        "span",
        {
          style: {
            fontSize: "0.7rem",
            color: "#94a3b8",
            letterSpacing: "0.05em",
            fontWeight: 600,
            textTransform: "uppercase",
          },
        },
        label
      ),
      createElement(
        "span",
        {
          "data-testid": `${testId}-value`,
          style: {
            fontSize: "1.1rem",
            fontWeight: 700,
            color: semantics.status === "unknown" ? "#64748b" : "#f8fafc",
            fontFamily: "monospace",
          },
        },
        valueDisplay
      )
    ),
    createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "0.5rem" } },
      createElement(
        "button",
        {
          type: "button",
          "data-testid": `${testId}-badge`,
          disabled: !isInspectable,
          onClick: () => {
            if (isInspectable && observation && onInspectObservation) {
              onInspectObservation(observation);
            }
          },
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "#ffffff",
            backgroundColor: getBadgeColor(),
            border: "none",
            borderRadius: "3px",
            padding: "0.2rem 0.45rem",
            cursor: isInspectable ? "pointer" : "default",
            opacity: isInspectable ? 1 : 0.75,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          },
        },
        evidence.badgeLabel,
        isInspectable
          ? createElement("span", { style: { fontSize: "0.6rem" } }, "🔍")
          : null
      )
    )
  );
}

export function ArwesAuthorityComposition({
  composition,
  onInspectObservation,
}: ArwesAuthorityCompositionProps) {
  const { system, temporal, urgency, attention, vitals, broadcast } = composition;

  const isUrgent =
    urgency.activeCountdown &&
    urgency.activeCountdown.remainingSeconds <= 300 &&
    urgency.activeCountdown.lifecycleStatus === "active";

  return createElement(
    AuthoritySurface,
    {
      className: "arwes-authority-composition",
      "data-testid": "arwes-authority-composition",
      style: {
        position: "relative",
        padding: "1rem",
        backgroundColor: "rgba(10, 15, 30, 0.92)",
        border: "1px solid #1e3a8a",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        color: "#f8fafc",
      },
    },
    createElement(AuthorityBackground, { variant: "grid" }),

    /* --- PERSISTENT SYSTEM SPINE (HEADER) --- */
    createElement(
      AuthorityFrame,
      {
        significance: isUrgent ? "critical" : "important",
        variant: "header",
        "data-testid": "arwes-spine-header",
      },
      createElement(
        "header",
        {
          style: {
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          },
        },
        /* Identity */
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          createElement(
            AuthorityText,
            {
              delivery: "instant",
              style: {
                fontSize: "0.68rem",
                color: "#0284c7",
                letterSpacing: "0.08em",
                fontWeight: 700,
                textTransform: "uppercase",
              },
            },
            "AUTHORITY CONTROL ARCHITECTURE"
          ),
          createElement(
            "h2",
            {
              style: {
                margin: "0.15rem 0",
                fontSize: "1.35rem",
                color: "#38bdf8",
                fontWeight: 700,
                letterSpacing: "0.04em",
              },
            },
            createElement(
              AuthorityText,
              { delivery: "decoded" },
              system.crawlerName
            )
          ),
          createElement(
            "span",
            { style: { fontSize: "0.75rem", color: "#94a3b8" } },
            system.crawlerClass
          )
        ),

        /* Urgency / Collapse Context */
        createElement(
          "div",
          {
            "data-testid": "arwes-urgency-panel",
            style: {
              textAlign: "center",
              padding: "0.4rem 0.8rem",
              background: isUrgent ? "rgba(225, 29, 72, 0.2)" : "rgba(15, 23, 42, 0.7)",
              border: isUrgent ? "1px solid #f43f5e" : "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "4px",
            },
          },
          createElement(
            "div",
            {
              style: {
                fontSize: "0.68rem",
                color: isUrgent ? "#fca5a5" : "#7dd3fc",
                fontWeight: 700,
                letterSpacing: "0.05em",
              },
            },
            urgency.formattedLabel.toUpperCase()
          ),
          urgency.activeCountdown
            ? createElement(
                "div",
                {
                  "data-testid": "arwes-countdown-timer",
                  style: {
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: isUrgent ? "#ffe4e6" : "#38bdf8",
                    marginTop: "0.1rem",
                  },
                },
                urgency.activeCountdown.formattedTime
              )
            : createElement(
                "div",
                { style: { fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" } },
                "COLLAPSE TIMING UNMONITORED"
              )
        ),

        /* Temporal Context & Floor Location */
        createElement(
          "div",
          {
            "data-testid": "hud-audience-mode",
            "data-mode": temporal.mode,
            style: { textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" },
          },
          createElement(
            "span",
            {
              "data-testid": "arwes-mode-badge",
              style: {
                fontSize: "0.75rem",
                fontWeight: 800,
                background: temporal.isLive ? "#15803d" : "#b45309",
                color: "#ffffff",
                padding: "0.2rem 0.55rem",
                borderRadius: "3px",
                letterSpacing: "0.06em",
              },
            },
            temporal.mode.toUpperCase()
          ),
          createElement(
            "div",
            {
              "data-testid": "arwes-location-info",
              style: { fontSize: "0.78rem", color: "#cbd5e1", fontWeight: "600" },
            },
            `${system.floorTitle} · SEQ ${system.sequence}`
          )
        )
      )
    ),

    /* --- CONTEXTUAL FIELD (MAIN CONTENT) --- */
    createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        },
      },

      /* Vitals & Telemetry Surface */
      createElement(
        AuthorityFrame,
        {
          significance: "active",
          variant: "lines",
          "data-testid": "arwes-vitals-frame",
        },
        createElement(
          "h3",
          {
            style: {
              margin: "0 0 0.75rem 0",
              fontSize: "0.85rem",
              color: "#7dd3fc",
              letterSpacing: "0.06em",
              fontWeight: 700,
              textTransform: "uppercase",
            },
          },
          "CRAWLER TELEMETRY & VITALS"
        ),
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "0.5rem" } },
          createElement(TelemetryRow, {
            label: "HEALTH",
            testId: "telemetry-health",
            observation: vitals.health,
            selectedSequence: temporal.sequence,
            onInspectObservation,
          }),
          createElement(TelemetryRow, {
            label: "MANA",
            testId: "telemetry-mana",
            observation: vitals.mana,
            selectedSequence: temporal.sequence,
            onInspectObservation,
          }),
          createElement(TelemetryRow, {
            label: "LEVEL",
            testId: "telemetry-level",
            observation: vitals.level,
            selectedSequence: temporal.sequence,
            onInspectObservation,
          }),
          createElement(TelemetryRow, {
            label: "AUDIENCE VIEWERS",
            testId: "telemetry-viewers",
            observation: broadcast.viewers,
            selectedSequence: temporal.sequence,
            onInspectObservation,
          })
        )
      ),

      /* System Attention & Historical Context Surface */
      createElement(
        AuthorityFrame,
        {
          significance: attention.hasActiveAlerts ? "critical" : "informational",
          variant: "corners",
          "data-testid": "arwes-attention-frame",
        },
        createElement(
          "h3",
          {
            style: {
              margin: "0 0 0.75rem 0",
              fontSize: "0.85rem",
              color: attention.hasActiveAlerts ? "#fca5a5" : "#7dd3fc",
              letterSpacing: "0.06em",
              fontWeight: 700,
              textTransform: "uppercase",
            },
          },
          "SYSTEM ATTENTION & LOGS"
        ),
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "0.75rem" } },

          /* Notification / Alert Status Signal */
          createElement(
            "div",
            {
              "data-testid": "arwes-attention-alert",
              "data-has-alerts": String(attention.hasActiveAlerts),
              style: {
                padding: "0.6rem 0.8rem",
                background: attention.hasActiveAlerts
                  ? "rgba(225, 29, 72, 0.15)"
                  : "rgba(15, 23, 42, 0.6)",
                border: attention.hasActiveAlerts
                  ? "1px solid #f43f5e"
                  : "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "4px",
              },
            },
            createElement(
              "div",
              {
                style: {
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: attention.hasActiveAlerts ? "#f43f5e" : "#22c55e",
                  letterSpacing: "0.05em",
                  marginBottom: "0.25rem",
                },
              },
              attention.hasActiveAlerts ? "⚠️ ATTENTION REQUIRED" : "✓ SYSTEM NOMINAL"
            ),
            attention.latestNotificationTitle
              ? createElement(
                  "div",
                  { style: { fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" } },
                  attention.latestNotificationTitle
                )
              : null,
            attention.latestNotificationMessage
              ? createElement(
                  "div",
                  { style: { fontSize: "0.78rem", color: "#cbd5e1", marginTop: "0.15rem" } },
                  attention.latestNotificationMessage
                )
              : createElement(
                  "div",
                  { style: { fontSize: "0.75rem", color: "#64748b" } },
                  "No active alerts in current temporal sequence."
                )
          ),

          /* Historical & Non-Actionable Information */
          createElement(
            "div",
            {
              "data-testid": "arwes-historical-info",
              style: {
                padding: "0.6rem 0.8rem",
                background: "rgba(15, 23, 42, 0.4)",
                border: "1px dashed rgba(148, 163, 184, 0.3)",
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              },
            },
            createElement(
              "span",
              {
                style: {
                  fontSize: "0.68rem",
                  color: "#94a3b8",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                },
              },
              "HISTORICAL TIMELINE METADATA"
            ),
            createElement(
              "span",
              { style: { fontSize: "0.78rem", color: "#cbd5e1", fontFamily: "monospace" } },
              `ANCHOR: ${system.floorTitle} @ SEQ ${system.sequence}`
            ),
            createElement(
              "span",
              {
                "data-affordance": "none",
                style: {
                  fontSize: "0.7rem",
                  color: "#64748b",
                  fontStyle: "italic",
                },
              },
              "Informational record · Read-only historical anchor"
            )
          )
        )
      )
    )
  );
}
