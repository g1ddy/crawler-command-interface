import type {
  CrawlerState,
  ProjectedCountdownState,
} from "../../../app/domain/types";
import type { HudCompositionModel } from "./public";
import { formatFloorDisplay } from "./hud-composition";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/public";
import { Hotlist } from "./hotlist/Hotlist";
import styles from "./PersistentHud.module.css";

/**
 * Persistent HUD renderer consuming the renderer-neutral composition contract.
 * Exposes persistent masthead context (floor title, notification attention, countdown clock, crawler level)
 * while crawler identity, progression details, and vitals are owned by feature views.
 */
export function PersistentHud({
  composition,
  state,
  countdown,
  floorTitle,
  onInspectCountdown,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills">;
  countdown?: ProjectedCountdownState | null;
  floorTitle?: string;
  isLive?: boolean;
  onInspectCountdown?: () => void;
}) {
  const title = formatFloorDisplay(
    composition?.system.floorTitle ?? floorTitle ?? "",
    composition?.system.floorOrdinal
  );
  const activeCountdown = composition?.urgency.activeCountdown ?? countdown;
  const attention = composition?.attention;
  const levelDisplay = composition?.progression.valueDisplay ?? "LVL —";

  return (
    <header
      className={styles.hud}
      aria-label="Crawler HUD"
      data-hud-composition="persistent"
      data-hud-renderer="persistent"
    >
      <div className={styles.masthead}>
        {/* Row 1 — floor orientation and attention */}
        <div className={styles.row}>
          <div className={styles.floorTitle}>{title}</div>
          <div className={styles.attention}>
            {attention?.hasActiveAlerts && (
              <span className={styles.alertIndicator}>⚠ ALERT</span>
            )}
            {attention && attention.totalNotificationsCount > 0 && (
              <span className={styles.noticeIndicator}>
                {attention.totalNotificationsCount} NOTICE
                {attention.totalNotificationsCount === 1 ? "" : "S"}
              </span>
            )}
          </div>
        </div>

        {/* Row 2 — countdown/evidence and progression */}
        <div className={styles.row}>
          <div className={styles.urgency}>
            {activeCountdown ? (
              (() => {
                const evidence = deriveCountdownEvidencePresentation(activeCountdown);
                const marker = evidenceGlanceMarker(evidence.state);
                const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
                const ariaLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
                return (
                  <div className={styles.countdownContainer}>
                    <strong>{activeCountdown.formattedTime}</strong>
                    {isInspectable ? (
                      <button
                        type="button"
                        onClick={onInspectCountdown}
                        aria-label={ariaLabel}
                        className={styles.evidenceButton}
                      >
                        {marker}
                      </button>
                    ) : (
                      <span role="img" aria-label={ariaLabel} className={styles.evidenceMarker}>
                        {marker}
                      </span>
                    )}
                  </div>
                );
              })()
            ) : null}
          </div>
          <div className={styles.level}>{levelDisplay}</div>
        </div>
      </div>

      <Hotlist hotlist={state.hotlist} skills={state.skills} />
    </header>
  );
}
