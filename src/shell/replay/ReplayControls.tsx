import type { ReplayCommandCallbacks, ReplayPresentation } from "../../features/timeline/public";
import styles from "./ReplaySurface.module.css";

export interface ReplayControlsProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
}

/** Simplified replay dock: global sequence scrubber spanning full story timeline with Live boundary right edge. */
export function ReplayControls({ model, commands }: ReplayControlsProps) {
  const { scope, position } = model;

  const statusLabel = model.isLive ? "LIVE ●" : "HISTORICAL ●";

  return (
    <div className={styles.dockContainer}>
      <div className={styles.compactBar} data-testid="replay-compact-bar">
        <div className={styles.orientationRow}>
          <div
            className={styles.statusBadge}
            data-live={model.isLive}
            data-testid="replay-status-badge"
          >
            {statusLabel}
          </div>
          <div
            className={styles.temporalContext}
            data-live={model.isLive}
            data-testid="replay-temporal-context"
          >
            {position.elapsedTimeAgo}
          </div>
        </div>
        <div className={styles.scrubberRow}>
          <div className={styles.scrubberWrapper}>
            <input
              aria-label="Selected timeline sequence"
              type="range"
              min={scope.minSequence}
              max={scope.maxSequence}
              value={position.selectedSequence}
              disabled={!model.availability.hasScopedSequences}
              onChange={(e) =>
                commands.selectSequence(
                  position.closestSequence(Number(e.target.value))
                )
              }
              className={styles.scrubber}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
