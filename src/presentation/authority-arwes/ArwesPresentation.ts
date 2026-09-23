"use client";
import { createElement } from "react";
import { ArwesAuthorityComposition } from "./ArwesAuthorityComposition.ts";
import type {
  HudCompositionModel,
  HudTelemetryKey,
} from "../../shell/hud/public.ts";

/**
 * BOUNDARY RULE:
 * Renderer-neutral presentation describes semantic meaning and inspectability;
 * executable application actions are wired outside the composition model.
 * The renderer chooses the physical affordance, while the application owns the action.
 */
export interface ArwesPresentationProps {
  model: HudCompositionModel;
  onInspectTelemetry?: (key: HudTelemetryKey) => void;
}

export function ArwesPresentation({
  model,
  onInspectTelemetry,
}: ArwesPresentationProps) {
  return createElement(
    "div",
    {
      className: "arwes-presentation-container",
      "data-presentation": "authority-arwes",
    },
    createElement(ArwesAuthorityComposition, {
      composition: model,
      onInspectTelemetry,
    })
  );
}
