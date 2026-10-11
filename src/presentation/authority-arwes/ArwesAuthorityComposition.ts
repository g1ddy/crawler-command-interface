"use client";
import { createElement } from "react";
import { AuthorityFrame } from "./primitives/AuthorityFrame.ts";
import { AuthoritySurface } from "./primitives/AuthoritySurface.ts";
import { AuthorityBackground } from "./primitives/AuthorityBackground.ts";
import { AuthorityTransition } from "./primitives/AuthorityTransition.ts";
import { AuthorityIndicator } from "./primitives/AuthorityIndicator.ts";
import type { AuthorityMotionMode } from "./primitives/AuthorityTransition.ts";
import { formatFloorDisplay, type HudCompositionModel } from "../../shell/hud/public.ts";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/public.ts";

export interface ArwesAuthorityCompositionProps {
  composition: HudCompositionModel;
  onInspectCountdown?: () => void;
  motionMode?: AuthorityMotionMode;
}

interface PetSurfaceProps {
  pet?: HudCompositionModel["pet"];
  activeView?: HudCompositionModel["activeView"];
  motionMode?: AuthorityMotionMode;
}

function PetSurface({ pet, activeView, motionMode }: PetSurfaceProps) {
  if (activeView !== "pet" || !pet) return null;

  const { badgeLabel, semantics, primaryPet, motionIntent } = pet;
  const isPresent = semantics.status === "present";

  return createElement(
    AuthorityTransition,
    {
      motionIntent,
      motionMode,
      "data-testid": "arwes-pet-transition",
    },
    createElement(
      AuthorityFrame,
      {
        significance: isPresent ? "active" : "informational",
        variant: "corners",
        "data-testid": "arwes-pet-frame",
      },
      createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
          },
        },
        createElement(
          "h3",
          {
            style: {
              margin: 0,
              fontSize: "0.8rem",
              color: isPresent ? "#38bdf8" : "#7dd3fc",
              letterSpacing: "0.06em",
              fontWeight: 700,
              textTransform: "uppercase",
            },
          },
          "PET & FAMILIAR"
        ),
        createElement(
          "span",
          {
            "data-testid": "arwes-pet-badge",
            style: {
              fontSize: "0.65rem",
              fontWeight: 700,
              color: isPresent ? "#ffffff" : "#94a3b8",
              backgroundColor: isPresent ? "#0284c7" : "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "3px",
              padding: "0.2rem 0.45rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            },
          },
          badgeLabel
        )
      ),
      createElement(
        "div",
        {
          "data-testid": "arwes-pet-summary",
          "data-status": semantics.status,
          ...(semantics.change ? { "data-change": semantics.change } : {}),
          ...(motionIntent ? { "data-motion-intent": motionIntent } : {}),
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            padding: "0.5rem",
            background: isPresent ? "rgba(15, 23, 42, 0.5)" : "transparent",
            borderRadius: "4px",
          },
        },
        isPresent && primaryPet
          ? [
              createElement(
                "div",
                {
                  key: "name-row",
                  style: {
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.5rem",
                  },
                },
                createElement(
                  "span",
                  {
                    "data-testid": "arwes-pet-display-name",
                    style: {
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "#f8fafc",
                    },
                  },
                  primaryPet.displayName
                ),
                primaryPet.formattedTitle
                  ? createElement(
                      "span",
                      {
                        "data-testid": "arwes-pet-title",
                        style: {
                          fontSize: "0.75rem",
                          color: "#f59e0b",
                          fontWeight: 700,
                          fontStyle: "italic",
                        },
                      },
                      primaryPet.formattedTitle
                    )
                  : null
              ),
              createElement(
                "div",
                {
                  key: "species-row",
                  "data-testid": "arwes-pet-species",
                  style: {
                    fontSize: "0.75rem",
                    color: "#cbd5e1",
                    fontWeight: 600,
                  },
                },
                primaryPet.speciesLabel
              ),
              createElement(
                "div",
                {
                  key: "status-row",
                  style: {
                    display: "flex",
                    gap: "0.75rem",
                    fontSize: "0.7rem",
                    marginTop: "0.2rem",
                  },
                },
                createElement(
                  "span",
                  {
                    "data-testid": "arwes-pet-hostility",
                    style: {
                      fontWeight: 700,
                      color:
                        primaryPet.hostilityState === "hostile"
                          ? "#ef4444"
                          : primaryPet.hostilityState === "non-hostile"
                          ? "#22c55e"
                          : "#94a3b8",
                      background: "rgba(15, 23, 42, 0.8)",
                      padding: "0.15rem 0.35rem",
                      borderRadius: "3px",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                    },
                  },
                  `HOSTILITY: ${primaryPet.hostilityLabel}`
                ),
                createElement(
                  "span",
                  {
                    "data-testid": "arwes-pet-bond-state",
                    style: {
                      fontWeight: 700,
                      color:
                        primaryPet.bondState === "bonded"
                          ? "#38bdf8"
                          : primaryPet.bondState === "unbonded"
                          ? "#f59e0b"
                          : "#94a3b8",
                      background: "rgba(15, 23, 42, 0.8)",
                      padding: "0.15rem 0.35rem",
                      borderRadius: "3px",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                    },
                  },
                  `BOND: ${primaryPet.bondStateLabel}`
                )
              ),
            ]
          : createElement(
              "div",
              {
                style: {
                  fontSize: "0.75rem",
                  color: "#64748b",
                  fontStyle: "italic",
                },
              },
              semantics.status === "not-established"
                ? "Pet domain not established."
                : semantics.status === "unavailable"
                ? "Pet domain unavailable."
                : "No pet or familiar established in current timeline sequence."
            )
      )
    )
  );
}

export function ArwesAuthorityComposition({
  composition,
  onInspectCountdown,
  motionMode = "enabled",
}: ArwesAuthorityCompositionProps) {
  const { system, urgency, attention, progression, pet } = composition;

  const attentionIntent = attention.motionIntent;
  const title = formatFloorDisplay(system.floorTitle, system.floorOrdinal);

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
            flexDirection: "column",
            gap: "0.5rem",
            width: "100%",
          },
        },

        /* Row 1: Floor location and Attention treatment */
        createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
            },
          },
          createElement(
            "div",
            {
              "data-testid": "arwes-location-info",
              style: {
                fontSize: "0.9rem",
                color: "#cbd5e1",
                fontWeight: "700",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                flex: "1 1 auto",
              },
            },
            title
          ),
          createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                flexShrink: 0,
              },
            },
            attention.hasActiveAlerts
              ? createElement(
                  "span",
                  {
                    style: {
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#ef4444",
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid rgba(239, 68, 68, 0.5)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "2px",
                      fontFamily: "monospace",
                    },
                  },
                  "⚠️ ALERT"
                )
              : null,
            attention.currentSequenceNotificationCount > 0
              ? createElement(
                  "span",
                  {
                    style: {
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#38bdf8",
                      background: "rgba(56, 189, 248, 0.15)",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "2px",
                      fontFamily: "monospace",
                    },
                  },
                  `${attention.currentSequenceNotificationCount} NOTICE${attention.currentSequenceNotificationCount === 1 ? "" : "S"}`
                )
              : null
          )
        ),

        /* Row 2: Countdown / Evidence and Crawler Level */
        createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
            },
          },
          urgency.activeCountdown
            ? (() => {
                const evidence = deriveCountdownEvidencePresentation(urgency.activeCountdown);
                const marker = evidenceGlanceMarker(evidence.state);
                const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
                const indicatorLabel = isInspectable
                  ? `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`
                  : `Collapse clock evidence: ${evidence.label.toLowerCase()}`;

                return createElement(
                  "div",
                  {
                    "data-testid": "arwes-urgency-panel",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: "4px",
                      padding: "0.2rem 0.5rem",
                      minWidth: 0,
                      flex: "1 1 auto",
                    },
                  },
                  createElement(
                    "div",
                    {
                      "data-testid": "arwes-countdown-timer",
                      style: {
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        fontFamily: "monospace",
                        color: "#38bdf8",
                      },
                    },
                    urgency.activeCountdown.formattedTime
                  ),
                  createElement(AuthorityIndicator, {
                    marker,
                    label: indicatorLabel,
                    onActivate: isInspectable ? onInspectCountdown : undefined,
                    testId: "arwes-countdown-badge",
                  })
                );
              })()
            : createElement("div", { style: { flex: "1 1 auto" } }),
          createElement(
            "div",
            {
              "data-testid": "arwes-level-display",
              style: {
                fontSize: "1rem",
                fontWeight: 800,
                fontFamily: "monospace",
                color: "#38bdf8",
                flexShrink: 0,
                whiteSpace: "nowrap",
              },
            },
            progression?.valueDisplay ?? "LVL —"
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
      ),

      /* Pet Surface */
      createElement(PetSurface, {
        pet,
        activeView: composition.activeView,
        motionMode,
      })
    )
  );
}
