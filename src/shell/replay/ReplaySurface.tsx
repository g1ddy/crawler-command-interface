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
import { ModalBoundary } from "../../shared/ui/ModalBoundary";
import styles from "./ReplaySurface.module.css";

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
    <aside className={styles.surface} aria-label="Replay controls" data-mode={model.mode}>
      <ReplayControls model={model} commands={activeCommands}>
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
      </ReplayControls>
      {showCountdownEvidence && model.countdowns.activeCountdown && (
        <ModalBoundary label="Countdown evidence" onClose={() => setShowCountdownEvidence(false)}>
        <CountdownEvidenceModal
          countdown={model.countdowns.activeCountdown}
          onClose={() => setShowCountdownEvidence(false)}
          onNavigateToSequence={commands.selectSequence}
        />
        </ModalBoundary>
      )}
    </aside>
  );
}
