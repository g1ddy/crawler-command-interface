import type {
  CrawlerState,
  ProjectedCountdownState,
  ProjectedObservationsState,
} from "../../../app/domain/types";
import type { HudCompositionModel } from "./public";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/public";
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
  onInspectCountdown,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills">;
  observations: Pick<ProjectedObservationsState, "broadcast">;
  countdown: ProjectedCountdownState | null;
  floorTitle: string;
  isLive: boolean;
  onInspectCountdown?: () => void;
}) {
  const title = composition?.system.floorTitle ?? floorTitle;
  const activeCountdown = composition?.urgency.activeCountdown ?? countdown;
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
          {activeCountdown ? (() => {
            const evidence = deriveCountdownEvidencePresentation(activeCountdown);
            const marker = evidenceGlanceMarker(evidence.state);
            const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
            const ariaLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
            return (
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <strong>{activeCountdown.formattedTime}</strong>
                {isInspectable ? (
                  <button
                    type="button"
                    onClick={onInspectCountdown}
                    aria-label={ariaLabel}
                  >
                    {marker}
                  </button>
                ) : (
                  <span role="img" aria-label={ariaLabel}>
                    {marker}
                  </span>
                )}
              </div>
            );
          })() : null}
        </div>
        <div
          className={styles.mode}
          data-testid="hud-audience-mode"
          data-mode={liveMode ? "live" : "replay"}
        >
          <div className={styles.broadcastContext} aria-label="Broadcast context">
            Audience: {viewersObs?.value != null ? viewersObs.value.toLocaleString() : "—"}
          </div>
        </div>
      </div>

      <Hotlist hotlist={state.hotlist} skills={state.skills} />
    </header>
  );
}
