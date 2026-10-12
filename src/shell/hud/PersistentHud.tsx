import type {
  CrawlerState,
  ProjectedCountdownState,
} from "../../../app/domain/types";
import type { HudCompositionModel } from "./public";
import { formatFloorDisplay, deriveNotificationAccessibleLabel } from "./hud-composition";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/public";
import { Hotlist } from "./hotlist/Hotlist";
import styles from "./PersistentHud.module.css";

/**
 * Persistent HUD renderer consuming the renderer-neutral composition contract.
 * Keeps the masthead to floor context, notification attention, countdown/evidence,
 * and source-backed crawler level.
 */
export function PersistentHud({
  composition,
  state,
  countdown,
  floorTitle,
  onInspectCountdown,
  onOpenNotifications,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills">;
  countdown?: ProjectedCountdownState | null;
  floorTitle?: string;

  onInspectCountdown?: () => void;
  onOpenNotifications?: () => void;
}) {
  const title = formatFloorDisplay(
    composition?.system.floorTitle ?? floorTitle ?? "",
    composition?.system.floorOrdinal,
  );
  const activeCountdown = composition?.urgency.activeCountdown ?? countdown;
  const attention = composition?.attention;
  const levelDisplay = composition?.progression.valueDisplay ?? "LVL —";
  const count = attention?.currentSequenceNotificationCount ?? 0;
  const hasAlerts = attention?.hasActiveAlerts ?? false;
  const ariaLabel = deriveNotificationAccessibleLabel(attention);

  return (
    <header
      className={styles.hud}
      aria-label="Crawler HUD"
      data-hud-composition="persistent"
      data-hud-renderer="persistent"
    >
      <div className={styles.masthead}>
        <div className={styles.row}>
          <div className={styles.floorTitle} data-testid="arwes-location-info">
            {title}
          </div>
          <div className={styles.attention}>
            <button
              type="button"
              className={styles.attentionButton}
              onClick={onOpenNotifications}
              aria-label={ariaLabel}
              data-testid="notification-bell"
              data-has-alerts={String(hasAlerts)}
              data-count={String(count)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {count > 0 && (
                <span
                  className={styles.noticeBadge}
                  aria-hidden="true"
                  data-testid="notification-count-badge"
                >
                  {count}
                </span>
              )}
              {hasAlerts && (
                <span
                  className={styles.alertBadge}
                  aria-hidden="true"
                  data-testid="notification-alert-badge"
                >
                  ⚠
                </span>
              )}
            </button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.urgency}>
            {activeCountdown && (() => {
              const evidence = deriveCountdownEvidencePresentation(activeCountdown);
              const marker = evidenceGlanceMarker(evidence.state);
              const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
              const evidenceLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
              return (
                <div
                  className={styles.countdownContainer}
                  data-testid="arwes-countdown-timer"
                  data-evidence={activeCountdown.isStale ? "stale" : activeCountdown.status}
                >
                  <strong>{activeCountdown.formattedTime}</strong>
                  {isInspectable ? (
                    <button
                      type="button"
                      onClick={onInspectCountdown}
                      aria-label={evidenceLabel}
                      className={styles.evidenceButton}
                      data-testid="arwes-countdown-badge"
                    >
                      {marker}
                    </button>
                  ) : (
                    <span
                      role="img"
                      aria-label={evidenceLabel}
                      className={styles.evidenceMarker}
                      data-testid="arwes-countdown-badge"
                    >
                      {marker}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
          <div className={styles.level} data-testid="persistent-level">
            {levelDisplay}
          </div>
        </div>
      </div>
      <Hotlist hotlist={state.hotlist} skills={state.skills} />
    </header>
  );
}
