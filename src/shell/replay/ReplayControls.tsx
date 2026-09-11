import type {
  ReplayCommandCallbacks,
  ReplayPresentation,
} from "../../features/timeline/public";
import { firstCountdownEvidenceSummary } from "../../features/timeline/evidence/evidencePresentation";

export interface ReplayControlsProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
}

export function ReplayControls({ model, commands }: ReplayControlsProps) {
  const selectFloor = (ordinal: number | "all") => {
    commands.selectFloor(ordinal);
  };

  return (
    <>
      <div
        className="floor-navigator-bar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingBottom: "10px",
          marginBottom: "10px",
          borderBottom: "1px solid #1f3e4d",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: "11px", color: "#ffb74d", fontWeight: "bold" }}>
          FLOOR NAVIGATOR:
        </div>
        <button
          className="mode-btn"
          disabled={!model.commands.canSelectPreviousFloor}
          onClick={() => {
            if (model.scope.previousFloorOrdinal !== null) {
              selectFloor(model.scope.previousFloorOrdinal);
            }
          }}
          title="Previous Floor Context"
        >
          ◄ PREV FLOOR
        </button>
        <select
          aria-label="Floor timeline scope"
          value={model.scope.selectedFloorOrdinal}
          onChange={(event) =>
            selectFloor(
              event.target.value === "all" ? "all" : Number(event.target.value),
            )
          }
          style={{
            background: "#06131c",
            color: "#9be2f3",
            border: "1px solid #1f4252",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            fontFamily: "monospace",
          }}
        >
          <option value="all">★ All Floors (Whole Story Mode)</option>
          {model.scope.availableFloors.map((floor) => (
            <option key={floor.id} value={floor.ordinal}>
              Floor {floor.ordinal}: {floor.title}
            </option>
          ))}
        </select>
        <button
          className="mode-btn"
          disabled={!model.commands.canSelectNextFloor}
          onClick={() => {
            if (model.scope.nextFloorOrdinal !== null) {
              selectFloor(model.scope.nextFloorOrdinal);
            }
          }}
          title="Next Floor Context"
        >
          NEXT FLOOR ►
        </button>
        {commands.openFloorRules && (
          <button
            className="mode-btn"
            onClick={commands.openFloorRules}
            title="Inspect floor directives and rules"
          >
            📜 FLOOR RULES
          </button>
        )}
        {model.countdowns.activeCountdown && commands.openCountdownEvidence && (
          <button
            className="countdown-details-link"
            onClick={commands.openCountdownEvidence}
            title="Inspect primary countdown evidence and reference points"
          >
            ⏱ COLLAPSE CLOCK EVIDENCE
          </button>
        )}
        {model.countdowns.secondaryCountdowns.map((countdown) => (
          <div
            key={countdown.id}
            className="secondary-countdown"
            title={`${countdown.status} · ${countdown.basis} · ${countdown.target}`}
          >
            <span>SECONDARY · {countdown.title.toUpperCase()}</span>
            <b>{countdown.formattedLabel}</b>
            <small>{countdown.target.replaceAll("-", " ").toUpperCase()}</small>
            <small>
              EVIDENCE: {firstCountdownEvidenceSummary(countdown.referencePoints)}
            </small>
          </div>
        ))}
      </div>

      <div className="timeline-header">
        <div className="live-controls">
          <button
            className={`mode-btn ${model.isLive ? "live-on" : ""}`}
            onClick={() => {
              if (!model.isLive) commands.setLiveMode(true);
            }}
          >
            ● LIVE
          </button>
          <button
            className={`mode-btn ${!model.isLive ? "replay-on" : ""}`}
            onClick={() => {
              if (model.isLive) commands.setLiveMode(false);
            }}
          >
            ↺ REPLAY MODE
          </button>
        </div>
        <div className="time-display">
          <span className="eyebrow">SELECTED TIMELINE SEQUENCE</span>
          <h2>
            SEQ #{model.position.selectedSequence}{" "}
            <small>
              ({model.position.currentEvent?.occurred_at || "exact time not sourced"})
            </small>
          </h2>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {commands.openTimelineHistory && (
            <button
              className="mode-btn"
              onClick={commands.openTimelineHistory}
              title="Open Timeline Event History Feed"
            >
              📜 HISTORY
            </button>
          )}
          {commands.openTimelineEvidence && (
            <button
              className="mode-btn"
              onClick={commands.openTimelineEvidence}
              title="Open Telemetry & Evidence Inspector"
            >
              📡 TELEMETRY
            </button>
          )}
        </div>
        <div className="step-controls">
          <button
            disabled={!model.commands.canStepPrevious}
            onClick={() => commands.stepPrevious()}
            title="Previous Event in Selected Scope"
          >
            ◄ PREV
          </button>
          <button
            disabled={!model.commands.canStepNext}
            onClick={() => commands.stepNext()}
            title="Next Event in Selected Scope"
          >
            NEXT ►
          </button>
          {!model.isLive && (
            <button className="return-live-btn" onClick={commands.returnToLive}>
              RETURN TO LIVE ⚡
            </button>
          )}
        </div>
      </div>

      <div className="slider-wrapper">
        <input
          aria-label="Selected timeline sequence"
          type="range"
          min={model.scope.minSequence}
          max={model.scope.maxSequence}
          value={model.position.selectedSequence}
          onChange={(event) => {
            const closest = model.position.closestSequence(Number(event.target.value));
            commands.selectSequence(closest);
          }}
          className="timeline-range-slider"
        />
      </div>
    </>
  );
}
