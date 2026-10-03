"use client";
import { useEffect, useRef, useState } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const surfaceRef = useRef<HTMLElement>(null);
  const prevExpandedRef = useRef(isExpanded);

  if (model.isLive && isExpanded) {
    setIsExpanded(false);
  }
  if (model.isLive && showCountdownEvidence) {
    setShowCountdownEvidence(false);
  }

  // Focus management on expand/collapse
  useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    prevExpandedRef.current = isExpanded;

    if (!surfaceRef.current) return;

    if (!wasExpanded && isExpanded) {
      const target =
        surfaceRef.current.querySelector<HTMLElement>("#replay-expanded-heading") ||
        surfaceRef.current.querySelector<HTMLElement>(
          '[data-testid="replay-transport-container"] button, [data-testid="replay-transport-container"] select'
        );
      if (target) {
        target.tabIndex = -1;
        target.focus();
      }
    } else if (wasExpanded && !isExpanded) {
      const toggleBtn = surfaceRef.current.querySelector<HTMLElement>(
        `button[aria-label="Expand replay controls"]`
      );
      if (toggleBtn && document.activeElement && surfaceRef.current.contains(document.activeElement)) {
        toggleBtn.focus();
      }
    }
  }, [isExpanded]);

  const activeCommands: ReplayCommandCallbacks = {
    ...commands,
    openCountdownEvidence: () => setShowCountdownEvidence(true),
  };

  return (
    <aside
      ref={surfaceRef}
      className={styles.surface}
      aria-label="Replay controls"
      data-mode={model.mode}
      data-expanded={isExpanded}
      data-mobile-expanded={isExpanded}
    >
      <ReplayControls
        model={model}
        commands={activeCommands}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded((prev) => !prev)}
      >
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
