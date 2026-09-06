import type { CrawlerEvent, FloorSegment, ProjectedCountdownState } from "../../../app/domain/types";

interface ReplayControlsProps {
  availableFloors: FloorSegment[];
  activeCountdown: ProjectedCountdownState | null;
  secondaryCountdowns: ProjectedCountdownState[];
  selectedFloorOrdinal: number | "all";
  onSelectFloorOrdinal: (ordinal: number | "all") => void;
  selectedSequence: number;
  onSelectSequence: (sequence: number) => void;
  scopedSequences: number[];
  currentEvent?: CrawlerEvent;
  isLive: boolean;
  onToggleLive: () => void;
  onOpenFloorRules?: () => void;
  onOpenTimelineHistory?: () => void;
  onOpenTimelineEvidence?: () => void;
  onOpenCountdownEvidence: () => void;
}

export function ReplayControls(props: ReplayControlsProps) {
  const currentFloorIdx = props.availableFloors.findIndex((floor) => floor.ordinal === props.selectedFloorOrdinal);
  const minSeq = props.scopedSequences[0] ?? 1;
  const maxSeq = props.scopedSequences[props.scopedSequences.length - 1] ?? 1;

  const currentIndex = (() => {
    let best = 0;
    for (let index = 0; index < props.scopedSequences.length; index += 1) {
      if (props.scopedSequences[index] <= props.selectedSequence) best = index;
      else break;
    }
    return best;
  })();

  const selectFloor = (ordinal: number | "all") => {
    props.onSelectFloorOrdinal(ordinal);
    if (ordinal === "all") return;
    const segment = props.availableFloors.find((floor) => floor.ordinal === ordinal);
    if (segment) props.onSelectSequence(segment.endSequence);
  };

  return <>
    <div className="floor-navigator-bar" style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "10px", marginBottom: "10px", borderBottom: "1px solid #1f3e4d", flexWrap: "wrap" }}>
      <div style={{ fontSize: "11px", color: "#ffb74d", fontWeight: "bold" }}>FLOOR NAVIGATOR:</div>
      <button className="mode-btn" disabled={props.selectedFloorOrdinal === "all" || currentFloorIdx <= 0} onClick={() => { if (currentFloorIdx > 0) selectFloor(props.availableFloors[currentFloorIdx - 1].ordinal); }} title="Previous Floor Context">◄ PREV FLOOR</button>
      <select aria-label="Floor timeline scope" value={props.selectedFloorOrdinal} onChange={(event) => selectFloor(event.target.value === "all" ? "all" : Number(event.target.value))} style={{ background: "#06131c", color: "#9be2f3", border: "1px solid #1f4252", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", fontFamily: "monospace" }}>
        <option value="all">★ All Floors (Whole Story Mode)</option>
        {props.availableFloors.map((floor) => <option key={floor.id} value={floor.ordinal}>Floor {floor.ordinal}: {floor.title}</option>)}
      </select>
      <button className="mode-btn" disabled={props.selectedFloorOrdinal === "all" || currentFloorIdx >= props.availableFloors.length - 1} onClick={() => { if (currentFloorIdx >= 0 && currentFloorIdx < props.availableFloors.length - 1) selectFloor(props.availableFloors[currentFloorIdx + 1].ordinal); }} title="Next Floor Context">NEXT FLOOR ►</button>
      <button className="mode-btn" onClick={props.onOpenFloorRules} title="Inspect floor directives and rules">📜 FLOOR RULES</button>
      {props.activeCountdown && <button className="countdown-details-link" onClick={props.onOpenCountdownEvidence} title="Inspect primary countdown evidence and reference points">⏱ COLLAPSE CLOCK EVIDENCE</button>}
      {props.secondaryCountdowns.map((countdown) => <div key={countdown.id} className="secondary-countdown" title={`${countdown.status} · ${countdown.basis} · ${countdown.target}`}><span>SECONDARY · {countdown.title.toUpperCase()}</span><b>{countdown.formattedLabel}</b><small>{countdown.target.replaceAll("-", " ").toUpperCase()}</small></div>)}
    </div>

    <div className="timeline-header">
      <div className="live-controls">
        <button className={`mode-btn ${props.isLive ? "live-on" : ""}`} onClick={() => { if (!props.isLive) props.onToggleLive(); }}>● LIVE</button>
        <button className={`mode-btn ${!props.isLive ? "replay-on" : ""}`} onClick={() => { if (props.isLive) props.onToggleLive(); }}>↺ REPLAY MODE</button>
      </div>
      <div className="time-display"><span className="eyebrow">SELECTED TIMELINE SEQUENCE</span><h2>SEQ #{props.selectedSequence} <small>({props.currentEvent?.occurred_at || "exact time not sourced"})</small></h2></div>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <button className="mode-btn" onClick={props.onOpenTimelineHistory} title="Open Timeline Event History Feed">📜 HISTORY</button>
        <button className="mode-btn" onClick={props.onOpenTimelineEvidence} title="Open Telemetry & Evidence Inspector">📡 TELEMETRY</button>
      </div>
      <div className="step-controls">
        <button disabled={currentIndex <= 0} onClick={() => currentIndex > 0 && props.onSelectSequence(props.scopedSequences[currentIndex - 1])} title="Previous Event in Selected Scope">◄ PREV</button>
        <button disabled={currentIndex >= props.scopedSequences.length - 1} onClick={() => currentIndex < props.scopedSequences.length - 1 && props.onSelectSequence(props.scopedSequences[currentIndex + 1])} title="Next Event in Selected Scope">NEXT ►</button>
        {!props.isLive && <button className="return-live-btn" onClick={props.onToggleLive}>RETURN TO LIVE ⚡</button>}
      </div>
    </div>

    <div className="slider-wrapper">
      <input aria-label="Selected timeline sequence" type="range" min={minSeq} max={maxSeq} value={props.selectedSequence} onChange={(event) => {
        const target = Number(event.target.value);
        const closest = props.scopedSequences.reduce((best, sequence) => Math.abs(sequence - target) < Math.abs(best - target) ? sequence : best, props.scopedSequences[0] ?? target);
        props.onSelectSequence(closest);
      }} className="timeline-range-slider" />
    </div>
  </>;
}
