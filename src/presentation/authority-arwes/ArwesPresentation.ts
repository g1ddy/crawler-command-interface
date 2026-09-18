"use client";
import { createElement } from "react";
import { ArwesCompatibilityProbe } from "./compatibility/ArwesCompatibilityProbe.ts";

export interface ArwesProbeModel {
  crawlerName: string;
  floorTitle: string;
  sequence: number;
  temporalMode: "live" | "replay";
}

export function ArwesPresentation({ model }: { model: ArwesProbeModel }) {
  return createElement(
    "div",
    {
      className: "arwes-presentation-container",
      "data-presentation": "authority-arwes",
    },
    createElement(ArwesCompatibilityProbe, {
      crawlerName: model.crawlerName,
      floorTitle: model.floorTitle,
      sequence: model.sequence,
      isLive: model.temporalMode === "live",
    })
  );
}
