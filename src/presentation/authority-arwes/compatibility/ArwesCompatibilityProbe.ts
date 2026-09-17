"use client";
import { useState, createElement } from "react";
import { AuthorityFrame } from "../primitives/AuthorityFrame.ts";
import { AuthorityTransition, type AuthorityMotionMode } from "../primitives/AuthorityTransition.ts";
import { AuthorityText } from "../primitives/AuthorityText.ts";
import { AuthorityBackground } from "../primitives/AuthorityBackground.ts";
import { AuthoritySurface } from "../primitives/AuthoritySurface.ts";

export interface ArwesCompatibilityProbeProps {
  crawlerName?: string;
  floorTitle?: string;
  sequence?: number;
  isLive?: boolean;
}

export function ArwesCompatibilityProbe({
  crawlerName = "CRAWLER-01",
  floorTitle = "FLOOR 1",
  sequence = 0,
  isLive = true,
}: ArwesCompatibilityProbeProps) {
  const [mounted, setMounted] = useState(true);
  const [renderCount, setRenderCount] = useState(0);
  const [motionMode, setMotionMode] = useState<AuthorityMotionMode>("enabled");

  return createElement(
    AuthoritySurface,
    {
      className: "arwes-compatibility-probe",
      "data-testid": "arwes-compatibility-probe",
      style: {
        backgroundColor: "rgba(10, 15, 30, 0.85)",
        border: "1px solid #1e3a8a",
        borderRadius: "4px",
        padding: "1rem",
        marginBottom: "1rem",
      },
    },
    createElement(AuthorityBackground, { variant: "grid" }),
    createElement(
      AuthorityFrame,
      {
        significance: "important",
        variant: "header",
        "data-testid": "probe-header-frame",
      },
      createElement(
        "header",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        createElement(
          "div",
          null,
          createElement(
            AuthorityText,
            { delivery: "instant", style: { fontSize: "0.75rem", opacity: 0.7, textTransform: "uppercase" } },
            "AUTHORITY ARWES COMPATIBILITY PROBE"
          ),
          createElement(
            "h2",
            { style: { margin: "0.25rem 0", fontSize: "1.25rem", color: "#38bdf8" } },
            createElement(
              AuthorityText,
              { delivery: "decoded", motionMode },
              crawlerName
            )
          )
        ),
        createElement(
          "div",
          { style: { textAlign: "right" } },
          createElement(
            "span",
            {
              style: {
                fontSize: "0.85rem",
                background: isLive ? "#15803d" : "#b45309",
                padding: "0.2rem 0.5rem",
                borderRadius: "3px",
              },
            },
            isLive ? "LIVE" : "REPLAY"
          ),
          createElement(
            "div",
            { style: { fontSize: "0.75rem", marginTop: "0.25rem" } },
            `${floorTitle} · SEQ ${sequence}`
          )
        )
      )
    ),
    createElement(
      "div",
      { style: { marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" } },
      createElement(
        AuthorityFrame,
        {
          significance: "active",
          variant: "corners",
          "data-testid": "probe-controls-frame",
        },
        createElement(
          "h3",
          { style: { margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#7dd3fc" } },
          "Probe Controls"
        ),
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "0.5rem" } },
          createElement(
            "div",
            null,
            createElement(
              "button",
              {
                "data-testid": "probe-toggle-mount",
                onClick: () => setMounted((prev) => !prev),
                style: {
                  background: "#1e293b",
                  color: "#f8fafc",
                  border: "1px solid #38bdf8",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer",
                  borderRadius: "3px",
                  fontSize: "0.85rem",
                  width: "100%",
                },
              },
              mounted ? "Unmount Sub-surface" : "Mount Sub-surface"
            )
          ),
          createElement(
            "div",
            null,
            createElement(
              "button",
              {
                "data-testid": "probe-increment-render",
                onClick: () => setRenderCount((c) => c + 1),
                style: {
                  background: "#1e293b",
                  color: "#f8fafc",
                  border: "1px solid #38bdf8",
                  padding: "0.4rem 0.8rem",
                  cursor: "pointer",
                  borderRadius: "3px",
                  fontSize: "0.85rem",
                  width: "100%",
                },
              },
              `Trigger Render Update (Count: ${renderCount})`
            )
          ),
          createElement(
            "div",
            { style: { display: "flex", gap: "0.25rem", alignItems: "center", fontSize: "0.8rem", marginTop: "0.25rem" } },
            createElement("span", null, "Motion:"),
            (["enabled", "reduced", "deterministic"] as const).map((mode) =>
              createElement(
                "button",
                {
                  key: mode,
                  "data-testid": `motion-mode-${mode}`,
                  onClick: () => setMotionMode(mode),
                  style: {
                    background: motionMode === mode ? "#0284c7" : "#0f172a",
                    color: "#ffffff",
                    border: "1px solid #38bdf8",
                    padding: "0.2rem 0.4rem",
                    cursor: "pointer",
                    borderRadius: "2px",
                    fontSize: "0.75rem",
                  },
                },
                mode
              )
            )
          )
        )
      ),
      createElement(
        AuthorityFrame,
        {
          significance: "critical",
          variant: "lines",
          "data-testid": "probe-surface-frame",
        },
        createElement(
          "h3",
          { style: { margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#fca5a5" } },
          "Sub-surface Area"
        ),
        mounted
          ? createElement(
              AuthorityTransition,
              {
                state: "entered",
                motionMode,
                "data-testid": "probe-animated-surface",
              },
              createElement(
                AuthoritySurface,
                {
                  style: {
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px dashed #ef4444",
                    padding: "0.75rem",
                  },
                  "data-testid": "probe-mounted-content",
                },
                createElement(AuthorityText, { delivery: "instant" }, "Mounted Arwes Sub-surface"),
                createElement(
                  "p",
                  { style: { margin: "0.5rem 0 0 0", fontSize: "0.8rem", opacity: 0.8 } },
                  "Render state counter: ",
                  createElement("strong", { "data-testid": "probe-render-count" }, String(renderCount))
                ),
                createElement(
                  "p",
                  { style: { margin: "0.25rem 0 0 0", fontSize: "0.8rem", opacity: 0.8 } },
                  "Active motion mode: ",
                  createElement("strong", { "data-testid": "probe-motion-mode-label" }, motionMode)
                )
              )
            )
          : createElement(
              "div",
              {
                "data-testid": "probe-unmounted-placeholder",
                style: { padding: "0.75rem", opacity: 0.5, fontStyle: "italic" },
              },
              "Sub-surface currently unmounted."
            )
      )
    )
  );
}
