import { useState } from "react";
import type { CrawlerState, ProjectedCountdownState, ProjectedObservationsState, ProjectedObservationValue } from "../../../app/domain/types";
import { CountdownEvidenceModal } from "../../features/timeline/evidence/CountdownEvidenceModal";
import {
  deriveCountdownEvidencePresentation,
  deriveEvidencePresentation,
  evidenceGlanceMarker,
  mapEvidenceToSemantics,
} from "../../features/timeline/evidence/evidencePresentation";
import { Hotlist } from "./hotlist/Hotlist";
import { ModalBoundary } from "../../shared/ui/ModalBoundary";

/** Experimental presentation only. Never infer a reading from a visual default. */
function Reading({ label, observation, sequence, onInspect }: {
  label: string;
  observation?: ProjectedObservationValue;
  sequence: number;
  onInspect: (reading: ProjectedObservationValue) => void;
}) {
  const descriptor = deriveEvidencePresentation(observation, sequence);
  const semantics = mapEvidenceToSemantics(descriptor);
  const dataEvidence = descriptor.state === "current" ? "observed" : descriptor.state;

  return <div className="hud-reading" data-evidence={dataEvidence} {...(semantics.temporal ? { "data-temporal": semantics.temporal } : {})}>
    <span>{label}</span>
    <strong>{observation ? observation.value.toLocaleString() : "—"}</strong>
    {observation ? <button onClick={() => onInspect(observation)} aria-label={`Inspect ${label} evidence`}>
      {descriptor.label}
    </button> : <small>Unknown</small>}
  </div>;
}

export function ConceptHud({ state, observations, countdown, floorTitle, isLive, onInspectObservation, onNavigateToSequence }: {
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills">;
  observations: Pick<ProjectedObservationsState, "broadcast">;
  countdown: ProjectedCountdownState | null;
  floorTitle: string;
  isLive: boolean;
  onInspectObservation?: (reading: ProjectedObservationValue) => void;
  onNavigateToSequence: (sequence: number) => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  return <header className="system-hud" aria-label="Crawler HUD" data-hud-renderer="concept">
    {countdown ? (() => {
      const evidence = deriveCountdownEvidencePresentation(countdown);
      const marker = evidenceGlanceMarker(evidence.state);
      return (
        <div className="hud-collapse" data-evidence={countdown.isStale ? "stale" : countdown.status}>
          <span className="hud-kicker">{floorTitle}</span>
          <strong>{countdown.formattedTime}</strong>
          <button onClick={() => setShowEvidence(true)} aria-label="Inspect collapse clock evidence">
            {marker} Evidence
          </button>
        </div>
      );
    })() : (
      <div className="hud-collapse" data-evidence="unavailable">
        <span className="hud-kicker">{floorTitle}</span>
      </div>
    )}
    <div className="hud-readings" aria-label="Observed broadcast context">
      {onInspectObservation && (
        <Reading label="Viewers" observation={observations.broadcast.viewers} sequence={state.sequence} onInspect={onInspectObservation} />
      )}
    </div>
    <div className="hud-replay-state" data-testid="hud-audience-mode" data-mode={isLive ? "live" : "replay"} />
    <Hotlist hotlist={state.hotlist} skills={state.skills} />
    {showEvidence && countdown && <ModalBoundary label="Countdown evidence" onClose={() => setShowEvidence(false)}><CountdownEvidenceModal countdown={countdown} onClose={() => setShowEvidence(false)} onNavigateToSequence={onNavigateToSequence} /></ModalBoundary>}
  </header>;
}
