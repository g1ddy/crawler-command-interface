"use client";
import { createElement } from "react";
import { ArwesCompatibilityProbe } from "./compatibility/ArwesCompatibilityProbe.ts";
import type { HudCompositionModel } from "../../shell/hud/public.ts";

export interface ArwesProbeModel {
  crawlerName: string;
  floorTitle: string;
  sequence: number;
  temporalMode: "live" | "replay";
}

export function ArwesPresentation({
  model,
}: {
  model: HudCompositionModel | ArwesProbeModel;
}) {
  const probeModel: ArwesProbeModel =
    "system" in model
      ? {
          crawlerName: model.system.crawlerName,
          floorTitle: model.system.floorTitle,
          sequence: model.system.sequence,
          temporalMode: model.temporal.mode,
        }
      : model;

  return createElement(
    "div",
    {
      className: "arwes-presentation-container",
      "data-presentation": "authority-arwes",
    },
    createElement(ArwesCompatibilityProbe, {
      crawlerName: probeModel.crawlerName,
      floorTitle: probeModel.floorTitle,
      sequence: probeModel.sequence,
      isLive: probeModel.temporalMode === "live",
    })
  );
}
