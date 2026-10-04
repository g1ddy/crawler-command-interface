import type { ReplayCommandCallbacks, ReplayPresentation } from "../../features/timeline/public";
import styles from "./ReplaySurface.module.css";

export interface ReplayControlsProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
}

/** Simplified replay dock: global sequence scrubber spanning full story timeline with Live boundary right edge. */
export function ReplayControls({ model, commands }: ReplayControlsProps) {
  const { scope, position } = model;

  return (
    <div className={styles.dockContainer}>
      <div className={styles.compactBar} data-testid="replay-compact-bar">
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
        <div className={styles.liveIndicator} data-live={model.isLive} aria-hidden="true">
          LIVE ●
        </div>
      </div>
    </div>
  );
}
