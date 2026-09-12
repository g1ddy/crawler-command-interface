import { useState } from "react";
import type { CrawlerState, ProjectedCountdownState, ProjectedObservationsState, ProjectedObservationValue } from "../../../app/domain/types";
import { CountdownEvidenceModal } from "../../features/timeline/evidence/CountdownEvidenceModal";
import { deriveEvidencePresentation } from "../../features/timeline/evidence/evidencePresentation";
import { ModalBoundary } from "../../shared/ui/ModalBoundary";
import { Hotlist } from "./hotlist/Hotlist";
import styles from "./PersistentHud.module.css";

function Reading({ label, observation, sequence, onInspect }: {
  label: string; observation?: ProjectedObservationValue; sequence: number;
  onInspect: (reading: ProjectedObservationValue) => void;
}) {
  const evidence = deriveEvidencePresentation(observation, sequence);
  return <div className={styles.reading} role="group" aria-label={`${label} reading`} data-evidence={evidence.state}>
    <span>{label}</span>
    <strong>{observation?.value.toLocaleString() ?? "—"}</strong>
    {observation ? <button onClick={() => onInspect(observation)} aria-label={`Inspect ${label} evidence`}>
      {evidence.label}
    </button> : <small>Unknown</small>}
  </div>;
}

/** Authority production HUD. Projected observations are labelled, never filled from defaults. */
export function PersistentHud({ state, observations, countdown, floorTitle, isLive,
  onReturnToLive, onInspectObservation, onNavigateToSequence }: {
  state: Pick<CrawlerState, "crawler" | "sequence" | "hotlist" | "skills">;
  observations: Pick<ProjectedObservationsState, "condition" | "xpProgress" | "broadcast">;
  countdown: ProjectedCountdownState | null;
  floorTitle: string; isLive: boolean;
  onReturnToLive: () => void;
  onInspectObservation: (reading: ProjectedObservationValue) => void;
  onNavigateToSequence: (sequence: number) => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  return <header className={styles.hud} aria-label="Crawler HUD" data-production-hud="authority">
    <div className={styles.masthead}>
      <div className={styles.identity}>
        <span className={styles.kicker}>CRAWLER INTERFACE</span>
        <h1>{state.crawler.name}</h1>
        <span>{state.crawler.class || "Class unknown"}</span>
      </div>
      <div className={styles.clock} data-stale={countdown?.isStale || undefined}>
        <span className={styles.kicker}>{floorTitle}</span>
        <strong>{countdown?.formattedLabel ?? "Collapse time unavailable"}</strong>
        {countdown ? <button onClick={() => setShowEvidence(true)} aria-label="Inspect collapse clock evidence">
          {countdown.isStale ? "Last known" : countdown.status === "estimated" ? "Estimated" : "Observed"}
          {" · "}{countdown.lifecycleStatus} · Evidence
        </button> : <small>No sourced countdown</small>}
      </div>
      <div className={styles.mode} data-testid="hud-audience-mode" data-mode={isLive ? "live" : "replay"}>
        <b>{isLive ? "LIVE" : "REPLAY"}</b>
        <span>Sequence {state.sequence}</span>
        {!isLive && <button onClick={onReturnToLive}>Return to live</button>}
      </div>
    </div>
    <div className={styles.readings} aria-label="Observed telemetry">
      <Reading label="Health" observation={observations.condition.currentHealth} sequence={state.sequence} onInspect={onInspectObservation} />
      <Reading label="Mana" observation={observations.condition.currentMana} sequence={state.sequence} onInspect={onInspectObservation} />
      <Reading label="Level" observation={observations.xpProgress.level} sequence={state.sequence} onInspect={onInspectObservation} />
      <Reading label="Viewers" observation={observations.broadcast.viewers} sequence={state.sequence} onInspect={onInspectObservation} />
    </div>
    <Hotlist hotlist={state.hotlist} skills={state.skills} />
    {showEvidence && countdown && <ModalBoundary label="Countdown evidence" onClose={() => setShowEvidence(false)}>
      <CountdownEvidenceModal countdown={countdown} onClose={() => setShowEvidence(false)} onNavigateToSequence={onNavigateToSequence} />
    </ModalBoundary>}
  </header>;
}
