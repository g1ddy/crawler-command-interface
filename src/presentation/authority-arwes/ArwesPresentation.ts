"use client";
import { createElement } from "react";
import { ArwesAuthorityComposition } from "./ArwesAuthorityComposition.ts";
import type {
  HudCompositionModel,
  HudTelemetryPresentation,
} from "../../shell/hud/public.ts";

export interface ArwesPresentationProps {
  model: HudCompositionModel;
  telemetryItems?: HudTelemetryPresentation[];
  onInspectTelemetry?: (key: string) => void;
}

export function ArwesPresentation({
  model,
  telemetryItems,
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
      telemetryItems,
      onInspectTelemetry,
    })
  );
}
