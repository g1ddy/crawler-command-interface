"use client";
import { createElement } from "react";
import {
  ArwesAuthorityComposition,
  type ArwesTelemetryRowData,
} from "./ArwesAuthorityComposition.ts";
import type { HudCompositionModel } from "../../shell/hud/public.ts";

export interface ArwesPresentationProps {
  model: HudCompositionModel;
  telemetryItems: ArwesTelemetryRowData[];
}

export function ArwesPresentation({
  model,
  telemetryItems,
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
    })
  );
}
