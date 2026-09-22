"use client";
import { createElement, useMemo } from "react";
import {
  ArwesAuthorityComposition,
  type TelemetryPresentationItem,
} from "./ArwesAuthorityComposition.ts";
import { deriveEvidencePresentation, mapEvidenceToSemantics } from "../../features/timeline/public.ts";
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

function createTelemetryItem(
  key: "health" | "mana" | "level" | "viewers",
  label: string,
  observation: ProjectedObservationValue | undefined | null,
  sequence: number,
  onInspectObservation?: (
    observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation
  ) => void
): TelemetryPresentationItem {
  const evidence = deriveEvidencePresentation(observation, sequence);
  const semantics = mapEvidenceToSemantics(evidence);
  const valueDisplay =
    observation?.value !== undefined && observation?.value !== null
      ? `${observation.value}`
      : "— ABSENT";

  const isInspectable =
    Boolean(semantics.provenance?.inspectable) &&
    Boolean(observation) &&
    Boolean(onInspectObservation);

  return {
    key,
    label,
    valueDisplay,
    badgeLabel: evidence.badgeLabel,
    status: semantics.status,
    authority: semantics.authority,
    temporal: semantics.temporal,
    isInspectable,
    onInspect: isInspectable && observation && onInspectObservation
      ? () => onInspectObservation(observation)
      : undefined,
  };
}

export function ArwesPresentation({
  model,
  onInspectObservation,
}: ArwesPresentationProps) {
  const sequence = model.temporal.sequence;

  const telemetryItems = useMemo(
    () => [
      createTelemetryItem("health", "HEALTH", model.vitals.health, sequence, onInspectObservation),
      createTelemetryItem("mana", "MANA", model.vitals.mana, sequence, onInspectObservation),
      createTelemetryItem("level", "LEVEL", model.vitals.level, sequence, onInspectObservation),
      createTelemetryItem("viewers", "AUDIENCE VIEWERS", model.broadcast.viewers, sequence, onInspectObservation),
    ],
    [model.vitals, model.broadcast, sequence, onInspectObservation]
  );

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
