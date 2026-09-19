import { useState } from "react";
import type {
  CrawlerState,
  ProjectedCountdownState,
  ProjectedObservationsState,
  ProjectedObservationValue,
} from "../../../app/domain/types";
import type { HudCompositionModel } from "./public";
import { CountdownEvidenceModal } from "../../features/timeline/evidence/CountdownEvidenceModal";
import { deriveEvidencePresentation } from "../../features/timeline/evidence/evidencePresentation";
import { ModalBoundary } from "../../shared/ui/ModalBoundary";
import { Hotlist } from "./hotlist/Hotlist";
import styles from "./PersistentHud.module.css";

function Reading({
  label,
  observation,
  sequence,
  onInspect,
}: {
  label: string;
  observation?: ProjectedObservationValue;
  sequence: number;
  onInspect: (reading: ProjectedObservationValue) => void;
}) {
  const evidence = deriveEvidencePresentation(observation, sequence);
  return (
    <div
      className={styles.reading}
      role="group"
      aria-label={`${label} reading`}
      data-evidence={evidence.state}
    >
      <span>{label}</span>
      <strong>{observation?.value.toLocaleString() ?? "—"}</strong>
      {observation ? (
        <button
          onClick={() => onInspect(observation)}
          aria-label={`Inspect ${label} evidence`}
        >
          {evidence.label}
        </button>
      ) : (
        <small>Unknown</small>
      )}
    </div>
  );
}

/** Production HUD. Contextual presentation derived from renderer-neutral HUD composition model. */
export function PersistentHud({
  composition,
  state,
  observations,
  countdown,
  floorTitle,
  isLive,
  onReturnToLive,
  onInspectObservation,
  onNavigateToSequence,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "crawler" | "sequence" | "hotlist" | "skills">;
  observations: Pick<ProjectedObservationsState, "condition" | "xpProgress" | "broadcast">;
  countdown: ProjectedCountdownState | null;
  floorTitle: string;
  isLive: boolean;
  onReturnToLive: () => void;
  onInspectObservation: (reading: ProjectedObservationValue) => void;
  onNavigateToSequence: (sequence: number) => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);

  const crawlerName = composition?.system.crawlerName ?? state.crawler.name;
  const crawlerClass =
    composition?.system.crawlerClass ?? (state.crawler.class || "Class unknown");
  const title = composition?.system.floorTitle ?? floorTitle;
  const currentSeq = composition?.system.sequence ?? state.sequence;
  const activeCountdown = composition?.urgency.activeCountdown ?? countdown;
  const formattedClock =
    composition?.urgency.formattedLabel ??
    (activeCountdown?.formattedLabel ?? "Collapse time unavailable");
  const isUrgent = composition?.urgency.hasUrgentCollapse ?? false;
  const liveMode = composition?.temporal.isLive ?? isLive;
  const canReturn = composition?.temporal.canReturnToLive ?? !isLive;

  const attention = composition?.attention;
  const healthObs = composition?.vitals.health ?? observations.condition.currentHealth;
  const manaObs = composition?.vitals.mana ?? observations.condition.currentMana;
  const levelObs = composition?.vitals.level ?? observations.xpProgress.level;
  const viewersObs = composition?.broadcast.viewers ?? observations.broadcast.viewers;

  return (
    <header className={styles.hud} aria-label="Crawler HUD" data-production-hud="authority">
      <div className={styles.masthead}>
        <div className={styles.identity}>
          <div className={styles.identityHeader}>
            <span className={styles.kicker}>CRAWLER INTERFACE</span>
            {attention?.hasActiveAlerts && (
              <span className={styles.alertIndicator}>⚠ ALERT</span>
            )}
            {attention && attention.totalNotificationsCount > 0 && (
              <span className={styles.alertIndicator}>
                {attention.totalNotificationsCount} NOTICE
                {attention.totalNotificationsCount === 1 ? "" : "S"}
              </span>
            )}
          </div>
          <h1>{crawlerName}</h1>
          <span>{crawlerClass}</span>
        </div>
        <div
          className={styles.clock}
          data-stale={activeCountdown?.isStale || undefined}
          data-urgent={isUrgent ? "true" : undefined}
        >
          <span className={styles.kicker}>{title}</span>
          <strong>{formattedClock}</strong>
          {activeCountdown ? (
            <button
              onClick={() => setShowEvidence(true)}
              aria-label="Inspect collapse clock evidence"
            >
              {activeCountdown.isStale
                ? "Last known"
                : activeCountdown.status === "estimated"
                ? "Estimated"
                : "Observed"}
              {" · "}
              {activeCountdown.lifecycleStatus} · Evidence
            </button>
          ) : (
            <small>No sourced countdown</small>
          )}
        </div>
        <div
          className={styles.mode}
          data-testid="hud-audience-mode"
          data-mode={liveMode ? "live" : "replay"}
        >
          <b>{liveMode ? "LIVE" : "REPLAY"}</b>
          <span>Sequence {currentSeq}</span>
          <div className={styles.broadcastContext} aria-label="Broadcast context">
            Audience: {viewersObs?.value != null ? viewersObs.value.toLocaleString() : "—"}
          </div>
          {canReturn && <button onClick={onReturnToLive}>Return to live</button>}
        </div>
      </div>

      <div className={styles.readings} aria-label="Observed telemetry">
        <Reading
          label="Health"
          observation={healthObs}
          sequence={currentSeq}
          onInspect={onInspectObservation}
        />
        <Reading
          label="Mana"
          observation={manaObs}
          sequence={currentSeq}
          onInspect={onInspectObservation}
        />
        <Reading
          label="Level"
          observation={levelObs}
          sequence={currentSeq}
          onInspect={onInspectObservation}
        />
      </div>
      <Hotlist hotlist={state.hotlist} skills={state.skills} />
      {showEvidence && activeCountdown && (
        <ModalBoundary label="Countdown evidence" onClose={() => setShowEvidence(false)}>
          <CountdownEvidenceModal
            countdown={activeCountdown}
            onClose={() => setShowEvidence(false)}
            onNavigateToSequence={onNavigateToSequence}
          />
        </ModalBoundary>
      )}
    </header>
  );
}
