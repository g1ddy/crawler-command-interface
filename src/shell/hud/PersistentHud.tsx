import { useState } from "react";
import type {
  CrawlerState,
  ProjectedCountdownState,
  ProjectedObservationsState,
} from "../../../app/domain/types";
import type { HudCompositionModel } from "./public";
import { CountdownEvidenceModal } from "../../features/timeline/evidence/CountdownEvidenceModal";
import { ModalBoundary } from "../../shared/ui/ModalBoundary";
import { Hotlist } from "./hotlist/Hotlist";
import styles from "./PersistentHud.module.css";

/**
 * Persistent HUD renderer consuming the renderer-neutral composition contract.
 * Exposes cross-cutting system context (floor, level collapse clock, live/replay mode, audience)
 * while crawler identity, progression, and vitals are owned by the Crawler feature.
 */
export function PersistentHud({
  composition,
  state,
  observations,
  countdown,
  floorTitle,
  isLive,
  onNavigateToSequence,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills">;
  observations: Pick<ProjectedObservationsState, "broadcast">;
  countdown: ProjectedCountdownState | null;
  floorTitle: string;
  isLive: boolean;
  onNavigateToSequence: (sequence: number) => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);

  const title = composition?.system.floorTitle ?? floorTitle;
  const activeCountdown = composition?.urgency.activeCountdown ?? countdown;
  const formattedClock = composition?.urgency.formattedLabel ?? activeCountdown?.formattedLabel ?? "Collapse time unavailable";
  const liveMode = composition?.temporal.isLive ?? isLive;
  const attention = composition?.attention;
  const viewersObs = composition?.broadcast.viewers ?? observations.broadcast.viewers;

  return (
    <header className={styles.hud} aria-label="Crawler HUD" data-hud-composition="persistent" data-hud-renderer="persistent">
      <div className={styles.masthead}>
        <div className={styles.clock} data-stale={activeCountdown?.isStale || undefined}>
          <div className={styles.clockHeader}>
            <span className={styles.kicker}>{title}</span>
            {attention?.hasActiveAlerts && <span className={styles.alertIndicator}>⚠ ALERT</span>}
            {attention && attention.totalNotificationsCount > 0 && (
              <span className={styles.alertIndicator}>
                {attention.totalNotificationsCount} NOTICE{attention.totalNotificationsCount === 1 ? "" : "S"}
              </span>
            )}
          </div>
          <strong>{formattedClock}</strong>
          {activeCountdown ? (
            <button onClick={() => setShowEvidence(true)} aria-label="Inspect collapse clock evidence">
              {activeCountdown.isStale ? "Last known" : activeCountdown.status === "estimated" ? "Estimated" : "Observed"}
              {" · "}{activeCountdown.lifecycleStatus} · Evidence
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
          <div className={styles.broadcastContext} aria-label="Broadcast context">
            Audience: {viewersObs?.value != null ? viewersObs.value.toLocaleString() : "—"}
          </div>
        </div>
      </div>

      <Hotlist hotlist={state.hotlist} skills={state.skills} />
      {showEvidence && activeCountdown && (
        <ModalBoundary label="Countdown evidence" onClose={() => setShowEvidence(false)}>
          <CountdownEvidenceModal countdown={activeCountdown} onClose={() => setShowEvidence(false)} onNavigateToSequence={onNavigateToSequence} />
        </ModalBoundary>
      )}
    </header>
  );
}
