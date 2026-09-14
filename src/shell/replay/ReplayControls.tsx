import type { ReactNode } from "react";
import type { ReplayCommandCallbacks, ReplayPresentation } from "../../features/timeline/public";
import { firstCountdownEvidenceSummary } from "../../features/timeline/evidence/evidencePresentation";
import styles from "./ReplaySurface.module.css";

export interface ReplayControlsProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
  children?: ReactNode;
}

/** Pure replay controls: nearest sequence, scope and availability come from the shared model. */
export function ReplayControls({ model, commands, children }: ReplayControlsProps) {
  const { scope, position } = model;
  return <>
    <div className={styles.transport}>
      <div className={styles.modes} aria-label="Replay mode">
        <button aria-pressed={model.isLive} onClick={() => !model.isLive && commands.setLiveMode(true)}>● LIVE</button>
        <button aria-pressed={!model.isLive} onClick={() => model.isLive && commands.setLiveMode(false)}>↺ REPLAY MODE</button>
      </div>
      <div className={styles.position}>
        <h2>SEQ #{position.selectedSequence} <small>({position.currentEvent?.occurred_at || "exact time not sourced"})</small></h2>
        {!model.isLive && <p>HISTORICAL VIEW · REPLAYING SEQUENCE #{position.selectedSequence}</p>}
      </div>
      <div className={styles.steps}>
        <button disabled={!model.commands.canStepPrevious} onClick={commands.stepPrevious} title="Previous Event in Selected Scope">◄ PREV</button>
        <button disabled={!model.commands.canStepNext} onClick={commands.stepNext} title="Next Event in Selected Scope">NEXT ►</button>
        {!model.isLive && <button onClick={commands.returnToLive}>RETURN TO LIVE ⚡</button>}
      </div>
    </div>
    <input aria-label="Selected timeline sequence" type="range"
      min={scope.minSequence} max={scope.maxSequence} value={position.selectedSequence}
      disabled={!model.availability.hasScopedSequences}
      onChange={e => commands.selectSequence(position.closestSequence(Number(e.target.value)))}
      className={styles.scrubber} />
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
  </>;
}
