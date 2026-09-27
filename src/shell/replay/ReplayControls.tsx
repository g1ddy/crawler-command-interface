import type { ReactNode } from "react";
import type { ReplayCommandCallbacks, ReplayPresentation } from "../../features/timeline/public";
import { firstCountdownEvidenceSummary } from "../../features/timeline/evidence/evidencePresentation";
import styles from "./ReplaySurface.module.css";

export interface ReplayControlsProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
  children?: ReactNode;
  isMobile?: boolean;
  isMobileExpanded?: boolean;
  onToggleMobileExpand?: () => void;
}

/** Pure replay controls: nearest sequence, scope and availability come from the shared model. */
export function ReplayControls({
  model,
  commands,
  children,
  isMobile = false,
  isMobileExpanded = false,
  onToggleMobileExpand,
}: ReplayControlsProps) {
  const { scope, position } = model;
  const isCollapsedMobile = isMobile && !isMobileExpanded;

  return (
    <>
      <div className={styles.compactBar} data-testid="replay-compact-bar">
        <div className={styles.compactStatus}>
          <span
            className={styles.compactModeBadge}
            data-mode={model.mode}
            aria-label={`Current mode: ${model.isLive ? "Live" : "Replay"}`}
          >
            {model.isLive ? "● LIVE" : "↺ REPLAY"}
          </span>
          <span className={styles.compactSeq}>SEQ #{position.selectedSequence}</span>
        </div>
        <div className={styles.compactActions}>
          {!model.isLive && isCollapsedMobile && (
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
          {onToggleMobileExpand && (
            <button
              type="button"
              className={styles.mobileToggleBtn}
              aria-expanded={isMobileExpanded}
              aria-label={isMobileExpanded ? "Collapse replay controls" : "Expand replay controls"}
              onClick={onToggleMobileExpand}
            >
              {isMobileExpanded ? "▲ CONTROLS" : "▼ CONTROLS"}
            </button>
          )}
        </div>
      </div>

      <div
        className={styles.transportContainer}
        data-expanded={isMobileExpanded}
        data-testid="replay-transport-container"
        inert={isCollapsedMobile ? true : undefined}
        hidden={isCollapsedMobile ? true : undefined}
      >
        <div className={styles.transport}>
          <div className={styles.modes} aria-label="Replay mode">
            <button
              type="button"
              aria-pressed={model.isLive}
              onClick={() => !model.isLive && commands.setLiveMode(true)}
            >
              ● LIVE
            </button>
            <button
              type="button"
              aria-pressed={!model.isLive}
              onClick={() => model.isLive && commands.setLiveMode(false)}
            >
              ↺ REPLAY MODE
            </button>
          </div>
          <div className={styles.position}>
            <h2>
              SEQ #{position.selectedSequence}{" "}
              <small>({position.currentEvent?.occurred_at || "exact time not sourced"})</small>
            </h2>
            {false && !model.isLive && (
              <p className={styles.historicalBanner} data-testid="historical-context-banner">
                HISTORICAL VIEW · REPLAYING SEQUENCE #{position.selectedSequence}
              </p>
            )}
          </div>
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
            {!model.isLive && (
              <button type="button" onClick={commands.returnToLive}>
                RETURN TO LIVE ⚡
              </button>
            )}
          </div>
        </div>
        <input
          aria-label="Selected timeline sequence"
          type="range"
          min={scope.minSequence}
          max={scope.maxSequence}
          value={position.selectedSequence}
          disabled={!model.availability.hasScopedSequences}
          onChange={(e) =>
            commands.selectSequence(position.closestSequence(Number(e.target.value)))
          }
          className={styles.scrubber}
        />
        <details className={styles.context}>
      <summary>Replay context &amp; tools · {scope.selectedFloorOrdinal === "all" ? "Whole story" : `Floor ${scope.selectedFloorOrdinal}`}</summary>
    <div className={styles.scope}>
      <label htmlFor="floor-scope">FLOOR NAVIGATOR:</label>
      <button disabled={!model.commands.canSelectPreviousFloor}
        onClick={() => scope.previousFloorOrdinal !== null && commands.selectFloor(scope.previousFloorOrdinal)}
        title="Previous Floor Context">◄ PREV FLOOR</button>
      <select id="floor-scope" aria-label="Floor timeline scope" value={scope.selectedFloorOrdinal}
        onChange={e => commands.selectFloor(e.target.value === "all" ? "all" : Number(e.target.value))}>
        <option value="all">All Floors (Whole Story Mode)</option>
        {scope.availableFloors.map(floor => <option key={floor.id} value={floor.ordinal}>Floor {floor.ordinal}: {floor.title}</option>)}
      </select>
      <button disabled={!model.commands.canSelectNextFloor}
        onClick={() => scope.nextFloorOrdinal !== null && commands.selectFloor(scope.nextFloorOrdinal)}
        title="Next Floor Context">NEXT FLOOR ►</button>
    </div>
    <div className={styles.tools} role="group" aria-label="Replay inspection tools">
      {commands.openFloorRules && <button onClick={commands.openFloorRules}>📜 FLOOR RULES</button>}
      {commands.openTimelineHistory && <button onClick={commands.openTimelineHistory}>📜 HISTORY</button>}
      {commands.openTimelineEvidence && <button onClick={commands.openTimelineEvidence}>📡 TELEMETRY</button>}
      {model.countdowns.activeCountdown && commands.openCountdownEvidence &&
        <button onClick={commands.openCountdownEvidence}>⏱ COLLAPSE CLOCK EVIDENCE</button>}
    </div>
    {model.countdowns.secondaryCountdowns.map(countdown => <div className="secondary-countdown" key={countdown.id}>
      <span>SECONDARY · {countdown.title.toUpperCase()}</span>
      <b>{countdown.formattedLabel}</b>
      <small>{countdown.target.replaceAll("-", " ").toUpperCase()}</small>
      <small>EVIDENCE: {firstCountdownEvidenceSummary(countdown.referencePoints)}</small>
    </div>)}
    {children}
    </details>
    </div>
    </>
  );
}
