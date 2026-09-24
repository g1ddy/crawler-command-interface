"use client";
import { createElement, useEffect, useRef } from "react";
import { AuthorityFrame } from "./primitives/AuthorityFrame.ts";
import { AuthoritySurface } from "./primitives/AuthoritySurface.ts";
import { AuthorityText } from "./primitives/AuthorityText.ts";
import { AuthorityBackground } from "./primitives/AuthorityBackground.ts";
import { AuthorityTransition } from "./primitives/AuthorityTransition.ts";
import type { AuthorityMotionMode } from "./primitives/AuthorityTransition.ts";
import type {
  HudCompositionModel,
  HudTelemetryKey,
  HudTelemetryPresentation,
} from "../../shell/hud/public.ts";
import type { PresentationMotionIntent } from "../semantic/public.ts";

export interface ArwesAuthorityCompositionProps {
  composition: HudCompositionModel;
  onInspectTelemetry?: (key: HudTelemetryKey) => void;
  motionMode?: AuthorityMotionMode;
  temporalIntent?: PresentationMotionIntent;
  attentionIntent?: PresentationMotionIntent;
}

interface TelemetryRowProps {
  item: HudTelemetryPresentation;
  onInspect?: () => void;
  motionMode?: AuthorityMotionMode;
}

function TelemetryRow({ item, onInspect, motionMode }: TelemetryRowProps) {
  const { key, label, valueDisplay, badgeLabel, semantics } = item;
  const rowKey = key;
  const isInspectable = semantics.affordance === "inspect" && Boolean(onInspect);

  const rowMotionIntent: PresentationMotionIntent | undefined = semantics.motionIntent;

  const badgeElement = isInspectable
    ? createElement(
        "button",
        {
          type: "button",
          "data-testid": `telemetry-${rowKey}-badge`,
          onClick: onInspect,
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "#ffffff",
            backgroundColor: "#0284c7",
            border: "none",
            borderRadius: "3px",
            padding: "0.2rem 0.45rem",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          },
        },
        badgeLabel,
        createElement("span", { style: { fontSize: "0.6rem" } }, "🔍")
      )
    : createElement(
        "span",
        {
          "data-testid": `telemetry-${rowKey}-badge`,
          style: {
            display: "inline-flex",
            alignItems: "center",
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "#94a3b8",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "3px",
            padding: "0.2rem 0.45rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          },
        },
        badgeLabel
      );

  return createElement(
    AuthorityTransition,
    {
      motionIntent: rowMotionIntent,
      motionMode,
    },
    createElement(
      "div",
      {
        className: "arwes-telemetry-row",
        "data-testid": `telemetry-${rowKey}`,
        "data-status": semantics.status,
        ...(semantics.authority ? { "data-authority": semantics.authority } : {}),
        ...(semantics.temporal ? { "data-temporal": semantics.temporal } : {}),
        ...(rowMotionIntent ? { "data-motion-intent": rowMotionIntent } : {}),
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.35rem 0.5rem",
          borderBottom: "1px solid rgba(56, 189, 248, 0.12)",
        },
      },
      createElement(
        "div",
        { style: { display: "flex", flexDirection: "column" } },
        createElement(
          "span",
          {
            style: {
              fontSize: "0.68rem",
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
            "data-testid": `telemetry-${rowKey}-value`,
            style: {
              fontSize: "1.05rem",
              fontWeight: 700,
              color: semantics.status === "unknown" ? "#64748b" : "#f8fafc",
              fontFamily: "monospace",
            },
          },
          valueDisplay
        )
      ),
      createElement("div", { style: { display: "flex", alignItems: "center" } }, badgeElement)
    )
  );
}

export function ArwesAuthorityComposition({
  composition,
  onInspectTelemetry,
  motionMode = "enabled",
  temporalIntent: explicitTemporalIntent,
  attentionIntent: explicitAttentionIntent,
}: ArwesAuthorityCompositionProps) {
  const { system, temporal, urgency, attention, telemetryItems } = composition;

  /* eslint-disable react-hooks/refs */
  const prevIsLiveRef = useRef<boolean | null>(null);
  const prevAlertTitleRef = useRef<string | null>(null);
  const prevHasAlertsRef = useRef<boolean | null>(null);

  const currentTitle = attention.latestNotificationTitle ?? null;
  const currentHasAlerts = attention.hasActiveAlerts;

  const temporalIntent: PresentationMotionIntent | undefined =
    explicitTemporalIntent ??
    (prevIsLiveRef.current !== null && prevIsLiveRef.current !== temporal.isLive
      ? temporal.isLive
        ? "return-live"
        : "enter-replay"
      : undefined);

  const attentionIntent: PresentationMotionIntent | undefined =
    explicitAttentionIntent ??
    (prevHasAlertsRef.current !== null &&
    ((!prevHasAlertsRef.current && currentHasAlerts) ||
      (currentHasAlerts && prevAlertTitleRef.current !== currentTitle))
      ? "attention"
      : undefined);

  useEffect(() => {
    prevIsLiveRef.current = temporal.isLive;
    prevHasAlertsRef.current = currentHasAlerts;
    prevAlertTitleRef.current = currentTitle;
  }, [temporal.isLive, currentHasAlerts, currentTitle]);
  /* eslint-enable react-hooks/refs */

  return createElement(
    AuthoritySurface,
    {
      className: "arwes-authority-composition",
      "data-testid": "arwes-authority-composition",
      "data-motion-mode": motionMode,
      style: {
        position: "relative",
        padding: "0.85rem",
        backgroundColor: "rgba(10, 15, 30, 0.92)",
        border: "1px solid #1e3a8a",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        color: "#f8fafc",
      },
    },
    createElement(AuthorityBackground, { variant: "grid" }),

    /* --- PERSISTENT SYSTEM SPINE (HEADER) --- */
    createElement(
      AuthorityFrame,
      {
        significance: attention.hasActiveAlerts ? "critical" : "important",
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
            gap: "0.75rem",
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
            "CRAWLER HUD"
          ),
          createElement(
            "h2",
            {
              style: {
                margin: "0.1rem 0",
                fontSize: "1.3rem",
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
              padding: "0.35rem 0.75rem",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "4px",
            },
          },
          createElement(
            "div",
            {
              style: {
                fontSize: "0.68rem",
                color: "#7dd3fc",
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
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: "#38bdf8",
                    marginTop: "0.1rem",
                  },
                },
                urgency.activeCountdown.formattedTime
              )
            : createElement(
                "div",
                { style: { fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" } },
                "COLLAPSE TIMING UNAVAILABLE"
              )
        ),

        /* Temporal Context & Floor Location */
        createElement(
          AuthorityTransition,
          {
            motionIntent: temporalIntent,
            motionMode,
            "data-testid": "arwes-temporal-transition",
          },
          createElement(
            "div",
            {
              "data-testid": "hud-audience-mode",
              "data-mode": temporal.mode,
              "data-motion-intent": temporalIntent,
              style: {
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0.25rem",
              },
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
      )
    ),

    /* --- CONTEXTUAL FIELD (MAIN CONTENT) --- */
    createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "0.85rem",
        },
      },

      /* Vitals & Telemetry Surface */
      createElement(
        AuthorityFrame,
        {
          significance: "informational",
          variant: "lines",
          "data-testid": "arwes-vitals-frame",
        },
        createElement(
          "h3",
          {
            style: {
              margin: "0 0 0.5rem 0",
              fontSize: "0.8rem",
              color: "#7dd3fc",
              letterSpacing: "0.06em",
              fontWeight: 700,
              textTransform: "uppercase",
            },
          },
          "TELEMETRY & VITALS"
        ),
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          telemetryItems.map((item, idx) => {
            const rowKey = item.key as HudTelemetryKey;
            return createElement(TelemetryRow, {
              key: rowKey || idx,
              item,
              motionMode,
              onInspect: onInspectTelemetry
                ? () => onInspectTelemetry(rowKey)
                : undefined,
            });
          })
        )
      ),

      /* System Attention Surface */
      createElement(
        AuthorityTransition,
        {
          motionIntent: attentionIntent,
          motionMode,
          "data-testid": "arwes-attention-transition",
        },
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
                margin: "0 0 0.5rem 0",
                fontSize: "0.8rem",
                color: attention.hasActiveAlerts ? "#fca5a5" : "#7dd3fc",
                letterSpacing: "0.06em",
                fontWeight: 700,
                textTransform: "uppercase",
              },
            },
            "SYSTEM ATTENTION"
          ),
          createElement(
            "div",
            {
              "data-testid": "arwes-attention-alert",
              "data-has-alerts": String(attention.hasActiveAlerts),
              ...(attentionIntent ? { "data-motion-intent": attentionIntent } : {}),
              style: {
                padding: "0.6rem",
                background: attention.hasActiveAlerts
                  ? "rgba(225, 29, 72, 0.15)"
                  : "transparent",
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
              attention.hasActiveAlerts ? "⚠️ ATTENTION REQUIRED" : "✓ NOMINAL"
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
                  "No active notifications in current sequence."
                )
          )
        )
      )
    )
  );
}
