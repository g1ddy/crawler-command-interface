"use client";
import { createElement } from "react";
import { ArwesAuthorityComposition } from "./ArwesAuthorityComposition.ts";
import type { HudCompositionModel } from "../../shell/hud/public.ts";
import type {
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";

export interface ArwesPresentationProps {
  model: HudCompositionModel;
  onInspectObservation?: (
    observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation
  ) => void;
}

export function ArwesPresentation({
  model,
  onInspectObservation,
}: ArwesPresentationProps) {
  return createElement(
    "div",
    {
      className: "arwes-presentation-container",
      "data-presentation": "authority-arwes",
    },
    createElement(ArwesAuthorityComposition, {
      composition: model,
      onInspectObservation,
    })
  );
}
