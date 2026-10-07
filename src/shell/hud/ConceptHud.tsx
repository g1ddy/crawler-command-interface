import type { CrawlerState, ProjectedCountdownState, ProjectedObservationsState, ProjectedObservationValue } from "../../../app/domain/types";
import {
  deriveCountdownEvidencePresentation,
  deriveEvidencePresentation,
  evidenceGlanceMarker,
  mapEvidenceToSemantics,
} from "../../features/timeline/evidence/evidencePresentation";
import { Hotlist } from "./hotlist/Hotlist";

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

export function ConceptHud({ state, observations, countdown, floorTitle, isLive, onInspectObservation, onInspectCountdown }: {
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills">;
  observations: Pick<ProjectedObservationsState, "broadcast">;
  countdown: ProjectedCountdownState | null;
  floorTitle: string;
  isLive: boolean;
  onInspectObservation?: (reading: ProjectedObservationValue) => void;
  onInspectCountdown?: () => void;
}) {
  return <header className="system-hud" aria-label="Crawler HUD" data-hud-renderer="concept">
    {countdown ? (() => {
      const evidence = deriveCountdownEvidencePresentation(countdown);
      const marker = evidenceGlanceMarker(evidence.state);
      const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
      const ariaLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
      return (
        <div className="hud-collapse" data-evidence={countdown.isStale ? "stale" : countdown.status}>
          <span className="hud-kicker">{floorTitle}</span>
          <strong>{countdown.formattedTime}</strong>
          {isInspectable ? (
            <button type="button" onClick={onInspectCountdown} aria-label={ariaLabel}>
              {marker}
            </button>
          ) : (
            <span role="img" aria-label={ariaLabel}>
              {marker}
            </span>
          )}
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
  </header>;
}
