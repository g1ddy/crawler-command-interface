"use client";
import { useState } from "react";
import type { ProjectedObservationsState } from "../../../app/domain/types";
import type {
  ReplayCommandCallbacks,
  ReplayPresentation,
} from "../../features/timeline/public";
import { TimelineDiagnostics } from "../../features/timeline/diagnostics/TimelineDiagnostics";
import { CountdownEvidenceModal } from "../../features/timeline/evidence/CountdownEvidenceModal";
import { ReplayControls } from "./ReplayControls";

export interface ReplaySurfaceProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
  projectedObservations?: ProjectedObservationsState;
}

export function ReplaySurface({
  model,
  commands,
  projectedObservations,
}: ReplaySurfaceProps) {
  const [showCountdownEvidence, setShowCountdownEvidence] = useState(false);

  const activeCommands: ReplayCommandCallbacks = {
    ...commands,
    openCountdownEvidence: () => setShowCountdownEvidence(true),
  };

  return (
    <aside className="timeline-scrubber-panel panel">
      <ReplayControls model={model} commands={activeCommands} />
      <TimelineDiagnostics
        events={model.scope.floorEvents}
        observations={model.scope.floorObservations}
        selectedSequence={model.position.selectedSequence}
        minSequence={model.scope.minSequence}
        maxSequence={model.scope.maxSequence}
        projectedObservations={projectedObservations}
        onSelectSequence={commands.selectSequence}
        onInspectObservation={commands.inspectObservation}
      />
      {showCountdownEvidence && model.countdowns.activeCountdown && (
        <CountdownEvidenceModal
          countdown={model.countdowns.activeCountdown}
          onClose={() => setShowCountdownEvidence(false)}
          onNavigateToSequence={commands.selectSequence}
        />
      )}
    </aside>
  );
}
