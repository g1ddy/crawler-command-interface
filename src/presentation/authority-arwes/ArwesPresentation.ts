"use client";
import { createElement } from "react";
import type { CrawlerState, ProjectedCountdownState, ProjectedObservationsState, ProjectedObservationValue } from "../../../app/domain/types";
import { ArwesCompatibilityProbe } from "./compatibility/ArwesCompatibilityProbe.ts";

export function ArwesPresentation({
  state,
  floorTitle,
  isLive,
}: {
  state: CrawlerState;
  observations: ProjectedObservationsState;
  countdown: ProjectedCountdownState | null;
  floorTitle: string;
  isLive: boolean;
  onReturnToLive?: () => void;
  onInspectObservation?: (reading: ProjectedObservationValue) => void;
  onNavigateToSequence?: (sequence: number) => void;
}) {
  return createElement(
    "div",
    {
      className: "arwes-presentation-container",
      "data-presentation": "authority-arwes",
    },
    createElement(ArwesCompatibilityProbe, {
      crawlerName: state.crawler.name,
      floorTitle,
      sequence: state.sequence,
      isLive,
    })
  );
}
