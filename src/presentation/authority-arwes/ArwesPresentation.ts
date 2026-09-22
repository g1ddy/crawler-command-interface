"use client";
import { createElement } from "react";
import { ArwesAuthorityComposition } from "./ArwesAuthorityComposition.ts";
import type { HudCompositionModel } from "../../shell/hud/public.ts";
import type {
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";

export interface ArwesProbeModel {
  crawlerName: string;
  floorTitle: string;
  sequence: number;
  temporalMode: "live" | "replay";
}

export interface ArwesPresentationProps {
  model: HudCompositionModel | ArwesProbeModel;
  onInspectObservation?: (
    observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation
  ) => void;
}

export function ArwesPresentation({
  model,
  onInspectObservation,
}: ArwesPresentationProps) {
  const composition: HudCompositionModel =
    "system" in model
      ? model
      : {
          system: {
            crawlerName: model.crawlerName,
            crawlerClass: "Class unknown",
            floorTitle: model.floorTitle,
            sequence: model.sequence,
          },
          temporal: {
            mode: model.temporalMode,
            sequence: model.sequence,
            isLive: model.temporalMode === "live",
          },
          urgency: {
            activeCountdown: null,
            formattedLabel: "Collapse time unavailable",
          },
          attention: {
            totalNotificationsCount: 0,
            hasActiveAlerts: false,
          },
          vitals: {},
          broadcast: {},
        };

  return createElement(
    "div",
    {
      className: "arwes-presentation-container",
      "data-presentation": "authority-arwes",
    },
    createElement(ArwesAuthorityComposition, {
      composition,
      onInspectObservation,
    })
  );
}
