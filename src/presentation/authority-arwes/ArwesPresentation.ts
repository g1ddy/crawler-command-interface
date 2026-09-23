"use client";
import { createElement } from "react";
import { ArwesAuthorityComposition } from "./ArwesAuthorityComposition.ts";
import type {
  HudCompositionModel,
  HudTelemetryKey,
} from "../../shell/hud/public.ts";
import type { AuthorityMotionMode } from "./primitives/AuthorityTransition.ts";

/**
 * BOUNDARY RULE:
 * Renderer-neutral presentation describes semantic meaning and inspectability;
 * executable application actions are wired outside the composition model.
 * The renderer chooses the physical affordance, while the application owns the action.
 */
export interface ArwesPresentationProps {
  model: HudCompositionModel;
  onInspectTelemetry?: (key: HudTelemetryKey) => void;
  motionMode?: AuthorityMotionMode;
}

function resolveMotionMode(explicitMode?: AuthorityMotionMode): AuthorityMotionMode {
  if (explicitMode) return explicitMode;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const queryMotion = params.get("motion");
    if (queryMotion === "reduced" || queryMotion === "deterministic") {
      return queryMotion;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return "reduced";
    }
  }
  return "enabled";
}

export function ArwesPresentation({
  model,
  onInspectTelemetry,
  motionMode,
}: ArwesPresentationProps) {
  const activeMotionMode = resolveMotionMode(motionMode);

  return createElement(
    "div",
    {
      className: "arwes-presentation-container",
      "data-presentation": "authority-arwes",
      "data-hud-renderer": "authority-arwes",
      "data-motion-mode": activeMotionMode,
    },
    createElement(ArwesAuthorityComposition, {
      composition: model,
      onInspectTelemetry,
      motionMode: activeMotionMode,
    })
  );
}
