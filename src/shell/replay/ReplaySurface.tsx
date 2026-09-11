"use client";
import { useMemo, useState } from "react";
import type {
  CrawlerEvent,
  FloorSegment,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationsState,
  ProjectedObservationValue,
  TimelineCountdown,
  TimelineObservation,
  TimelineSource,
} from "../../../app/domain/types";
import {
  deriveReplayPresentation,
  type ReplayPresentation,
} from "./replay-presentation";
import { TimelineDiagnostics } from "../../features/timeline/diagnostics/TimelineDiagnostics";
import { CountdownEvidenceModal } from "../../features/timeline/evidence/CountdownEvidenceModal";
import { ReplayControls } from "./ReplayControls";

export interface ReplaySurfaceProps {
  model?: ReplayPresentation;
  events?: CrawlerEvent[];
  floors?: FloorSegment[];
  countdowns?: TimelineCountdown[];
  observations?: TimelineObservation[];
  sources?: TimelineSource[];
  projectedObservations?: ProjectedObservationsState;
  selectedFloorOrdinal: number | "all";
  onSelectFloorOrdinal: (ordinal: number | "all") => void;
  selectedSequence: number;
  onSelectSequence: (sequence: number) => void;
  isLive: boolean;
  onToggleLive: () => void;
  onInspectObservation?: (
    observation:
      | ProjectedObservationValue
      | ProjectedItemObservation
      | ProjectedEquipmentObservation,
  ) => void;
  onOpenFloorRules?: () => void;
  onOpenTimelineHistory?: () => void;
  onOpenTimelineEvidence?: () => void;
}

export function ReplaySurface(props: ReplaySurfaceProps) {
  const [showCountdownEvidence, setShowCountdownEvidence] = useState(false);

  const derivedModel = useMemo(
    () =>
      props.model ??
      deriveReplayPresentation({
        events: props.events,
        floors: props.floors,
        countdowns: props.countdowns,
        observations: props.observations,
        selectedFloorOrdinal: props.selectedFloorOrdinal,
        selectedSequence: props.selectedSequence,
        isLive: props.isLive,
      }),
    [
      props.model,
      props.events,
      props.floors,
      props.countdowns,
      props.observations,
      props.selectedFloorOrdinal,
      props.selectedSequence,
      props.isLive,
    ],
  );

  return (
    <aside className="timeline-scrubber-panel panel">
      <ReplayControls
        model={derivedModel}
        onSelectFloorOrdinal={props.onSelectFloorOrdinal}
        onSelectSequence={props.onSelectSequence}
        onToggleLive={props.onToggleLive}
        onOpenFloorRules={props.onOpenFloorRules}
        onOpenTimelineHistory={props.onOpenTimelineHistory}
        onOpenTimelineEvidence={props.onOpenTimelineEvidence}
        onOpenCountdownEvidence={() => setShowCountdownEvidence(true)}
      />
      <TimelineDiagnostics
        events={derivedModel.scope.floorEvents}
        observations={derivedModel.scope.floorObservations}
        selectedSequence={derivedModel.position.selectedSequence}
        minSequence={derivedModel.scope.minSequence}
        maxSequence={derivedModel.scope.maxSequence}
        projectedObservations={props.projectedObservations}
        onSelectSequence={props.onSelectSequence}
        onInspectObservation={props.onInspectObservation}
      />
      {showCountdownEvidence && derivedModel.countdowns.activeCountdown && (
        <CountdownEvidenceModal
          countdown={derivedModel.countdowns.activeCountdown}
          onClose={() => setShowCountdownEvidence(false)}
          onNavigateToSequence={props.onSelectSequence}
        />
      )}
    </aside>
  );
}
