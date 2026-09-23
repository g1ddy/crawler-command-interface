"use client";
import { createElement } from "react";
import { ArwesAuthorityComposition } from "./ArwesAuthorityComposition.ts";
import type {
  HudCompositionModel,
  HudTelemetryKey,
  HudTelemetryPresentation,
} from "../../shell/hud/public.ts";

/**
 * BOUNDARY RULE:
 * Renderer-neutral presentation describes semantic meaning and inspectability;
 * executable application actions are wired outside the composition model.
 * The renderer chooses the physical affordance, while the application owns the action.
 */
export interface ArwesPresentationProps {
  model: HudCompositionModel;
  telemetryItems?: HudTelemetryPresentation[];
  onInspectTelemetry?: (key: HudTelemetryKey) => void;
}

export function ArwesPresentation({
  model,
  telemetryItems,
  onInspectTelemetry,
}: ArwesPresentationProps) {
  const items = telemetryItems || model.telemetryItems || [];
  return createElement(
    "div",
    {
      className: "arwes-presentation-container",
      "data-presentation": "authority-arwes",
    },
    createElement(ArwesAuthorityComposition, {
      composition: model,
      telemetryItems: items,
      onInspectTelemetry,
    })
  );
}
