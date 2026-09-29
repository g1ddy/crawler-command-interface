import type { ReactNode } from "react";
import type { ReplayCommandCallbacks, ReplayPresentation } from "../../features/timeline/public";
import { firstCountdownEvidenceSummary } from "../../features/timeline/evidence/evidencePresentation";
import styles from "./ReplaySurface.module.css";

export interface ReplayControlsProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
  children?: ReactNode;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  // Backward compatibility
  isMobile?: boolean;
  isMobileExpanded?: boolean;
  onToggleMobileExpand?: () => void;
}

/** Pure replay controls: nearest sequence, scope and availability come from the shared model. */
export function ReplayControls({
  model,
  commands,
  children,
  isExpanded,
  onToggleExpand,
  isMobileExpanded,
  onToggleMobileExpand,
}: ReplayControlsProps) {
  const { scope, position } = model;
  const expanded = isExpanded ?? isMobileExpanded ?? false;
  const handleToggle = onToggleExpand ?? onToggleMobileExpand;

  return (
    <div className={styles.dockContainer}>
      {/* Expanded details drawer - opens UPWARD above the dock bar */}
      <div
        className={styles.transportContainer}
        data-expanded={expanded}
        data-testid="replay-transport-container"
        inert={!expanded ? true : undefined}
        hidden={!expanded}
      >
        <div className={styles.expandedHeader}>
          <h2 id="replay-expanded-heading" className={styles.expandedHeading}>
            TIMELINE SCOPE &amp; INSPECTION
          </h2>
          <div className={styles.steps}>
            <button
              type="button"
              disabled={!model.commands.canStepPrevious}
              onClick={commands.stepPrevious}
              title="Previous Event in Selected Scope"
            >
              ◄ PREV
            </button>
            <button
              type="button"
              disabled={!model.commands.canStepNext}
              onClick={commands.stepNext}
              title="Next Event in Selected Scope"
            >
              NEXT ►
            </button>
          </div>
        </div>

        <div className={styles.scope}>
          <label htmlFor="floor-scope">FLOOR NAVIGATOR:</label>
          <button
            type="button"
            disabled={!model.commands.canSelectPreviousFloor}
            onClick={() =>
              scope.previousFloorOrdinal !== null &&
              commands.selectFloor(scope.previousFloorOrdinal)
            }
            title="Previous Floor Context"
          >
            ◄ PREV FLOOR
          </button>
          <select
            id="floor-scope"
            aria-label="Floor timeline scope"
            value={scope.selectedFloorOrdinal}
            onChange={(e) =>
              commands.selectFloor(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">All Floors (Whole Story Mode)</option>
            {scope.availableFloors.map((floor) => (
              <option key={floor.id} value={floor.ordinal}>
                Floor {floor.ordinal}: {floor.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!model.commands.canSelectNextFloor}
            onClick={() =>
              scope.nextFloorOrdinal !== null &&
              commands.selectFloor(scope.nextFloorOrdinal)
            }
            title="Next Floor Context"
          >
            NEXT FLOOR ►
          </button>
        </div>

        <div
          className={styles.tools}
          role="group"
          aria-label="Replay inspection tools"
        >
          {commands.openFloorRules && (
            <button type="button" onClick={commands.openFloorRules}>
              📜 FLOOR RULES
            </button>
          )}
          {commands.openTimelineHistory && (
            <button type="button" onClick={commands.openTimelineHistory}>
              📜 HISTORY
            </button>
          )}
          {commands.openTimelineEvidence && (
            <button type="button" onClick={commands.openTimelineEvidence}>
              📡 TELEMETRY
            </button>
          )}
          {model.countdowns.activeCountdown && commands.openCountdownEvidence && (
            <button type="button" onClick={commands.openCountdownEvidence}>
              ⏱ COLLAPSE CLOCK EVIDENCE
            </button>
          )}
        </div>

        {model.countdowns.secondaryCountdowns.map((countdown) => (
          <div className="secondary-countdown" key={countdown.id}>
            <span>SECONDARY · {countdown.title.toUpperCase()}</span>
            <b>{countdown.formattedLabel}</b>
            <small>{countdown.target.replaceAll("-", " ").toUpperCase()}</small>
            <small>
              EVIDENCE: {firstCountdownEvidenceSummary(countdown.referencePoints)}
            </small>
          </div>
        ))}

        {children}
      </div>

      {/* Main Dock Bar - ALWAYS visible (in both collapsed & expanded states) */}
      <div className={styles.compactBar} data-testid="replay-compact-bar">
        <div className={styles.compactStatus}>
          <span
            className={styles.compactModeBadge}
            data-mode={model.mode}
            aria-label={`Current mode: ${model.isLive ? "Live" : "Replay"}`}
          >
            {model.isLive ? "● LIVE" : "↺ REPLAY"}
          </span>
          <span className={styles.compactSeq}>
            SEQ #{position.selectedSequence}
            {position.currentEvent?.occurred_at && (
              <small className={styles.timeReadout}>
                {" "}({position.currentEvent.occurred_at})
              </small>
            )}
          </span>
          {!model.isLive && (
            <span
              className={styles.historicalCue}
              data-testid="historical-context-cue"
            >
              HISTORICAL INSPECTION
            </span>
          )}
        </div>

        {/* Primary Timeline Scrubber - ALWAYS visible in dockBar */}
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

        <div className={styles.compactActions}>
          {!model.isLive && (
            <button
              type="button"
              className={styles.compactReturnBtn}
              onClick={commands.returnToLive}
              title="Return to Live sequence"
              aria-label="Return to Live sequence"
            >
              RETURN TO LIVE ⚡
            </button>
          )}
          {handleToggle && (
            <button
              type="button"
              className={styles.mobileToggleBtn}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? "Collapse replay controls"
                  : "Expand replay controls"
              }
              onClick={handleToggle}
            >
              {expanded ? "▲ CONTROLS" : "▼ CONTROLS"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
