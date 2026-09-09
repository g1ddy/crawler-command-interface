import { useState } from "react";
import type { CrawlerState, ProjectedCountdownState, ProjectedObservationsState, ProjectedObservationValue } from "../../../app/domain/types";
import { CountdownEvidenceModal } from "../../features/timeline/evidence/CountdownEvidenceModal";
import { Hotlist } from "./hotlist/Hotlist";

/** Experimental presentation only. Never infer a reading from a visual default. */
function Reading({ label, observation, onInspect }: {
  label: string;
  observation?: ProjectedObservationValue;
  onInspect: (reading: ProjectedObservationValue) => void;
}) {
  return <div className="hud-reading" data-evidence={observation?.status ?? "unknown"}>
    <span>{label}</span>
    <strong>{observation ? observation.value.toLocaleString() : "—"}</strong>
    {observation ? <button onClick={() => onInspect(observation)} aria-label={`Inspect ${label} evidence`}>
      {observation.status === "estimated" ? "Estimated" : "Observed"}
    </button> : <small>Unknown</small>}
  </div>;
}

export function ConceptHud({ state, observations, countdown, floorTitle, isLive, onReturnToLive, onInspectObservation, onNavigateToSequence }: {
  state: CrawlerState;
  observations: ProjectedObservationsState;
  countdown: ProjectedCountdownState | null;
  floorTitle: string;
  isLive: boolean;
  onReturnToLive: () => void;
  onInspectObservation: (reading: ProjectedObservationValue) => void;
  onNavigateToSequence: (sequence: number) => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  return <header className="system-hud" aria-label="Crawler HUD">
    <div className="hud-identity">
      <span className="hud-kicker">Crawler interface</span>
      <h1>{state.crawler.name}</h1>
      <span>{state.crawler.class || "Class unknown"}</span>
    </div>
    <div className="hud-collapse" data-evidence={countdown ? countdown.isStale ? "stale" : countdown.status : "unavailable"}>
      <span className="hud-kicker">{floorTitle}</span>
      <strong>{countdown?.formattedLabel ?? "Collapse time unavailable"}</strong>
      {countdown ? <button onClick={() => setShowEvidence(true)}>{`${countdown.isStale ? "Last known" : countdown.status === "estimated" ? "Estimated" : "Observed"} · ${countdown.lifecycleStatus}`} · Evidence</button> : <span>No sourced countdown</span>}
    </div>
    <div className="hud-readings" aria-label="Observed vitals">
      <Reading label="Health" observation={observations.condition.currentHealth} onInspect={onInspectObservation} />
      <Reading label="Mana" observation={observations.condition.currentMana} onInspect={onInspectObservation} />
      <Reading label="Viewers" observation={observations.broadcast.viewers} onInspect={onInspectObservation} />
    </div>
    <div className="hud-replay-state" data-testid="hud-audience-mode">
      <b>{isLive ? "LIVE" : "REPLAY"}</b><span>Sequence {state.sequence}</span>
      {!isLive && <button onClick={onReturnToLive}>Return to live</button>}
    </div>
    <Hotlist hotlist={state.hotlist} skills={state.skills} />
    {showEvidence && countdown && <CountdownEvidenceModal countdown={countdown} onClose={() => setShowEvidence(false)} onNavigateToSequence={onNavigateToSequence} />}
  </header>;
}
