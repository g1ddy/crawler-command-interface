"use client";

import type {
  ReplayCommandCallbacks,
  ReplayPresentation,
} from "../../features/timeline/public";
import { firstCountdownEvidenceSummary } from "../../features/timeline/evidence/evidencePresentation";
import styles from "./TimelineControls.module.css";

export interface TimelineControlsProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
  onClose?: () => void;
}

export function TimelineControls({
  model,
  commands,
  onClose,
}: TimelineControlsProps) {
  const { scope, position } = model;

  return (
    <div className={styles.panel} role="region" aria-label="Timeline navigation panel">
      <div className={styles.header}>
        <h2 className={styles.title}>TIMELINE UTILITIES</h2>
        {onClose && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close timeline controls"
          >
            ✕
          </button>
        )}
      </div>

      {/* Floor Navigation */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Floor Navigation</h3>
        <div className={styles.row}>
          <button
            type="button"
            className={styles.button}
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
            className={styles.select}
            aria-label="Select floor context"
            value={scope.selectedFloorOrdinal}
            onChange={(e) =>
              commands.selectFloor(
                e.target.value === "all" ? "all" : Number(e.target.value),
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
            className={styles.button}
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
      </div>

      {/* Event Stepping */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Event Stepping</h3>
        <div className={styles.row}>
          <button
            type="button"
            className={styles.button}
            disabled={!model.commands.canStepPrevious}
            onClick={commands.stepPrevious}
            title="Previous Event in Sequence"
          >
            ◄ PREV EVENT
          </button>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            SEQ #{position.selectedSequence}
          </span>
          <button
            type="button"
            className={styles.button}
            disabled={!model.commands.canStepNext}
            onClick={commands.stepNext}
            title="Next Event in Sequence"
          >
            NEXT EVENT ►
          </button>
        </div>
      </div>

      {/* Inspection Overlays */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Inspection &amp; Diagnostics</h3>
        <div className={styles.row}>
          {commands.openFloorRules && (
            <button
              type="button"
              className={styles.button}
              onClick={commands.openFloorRules}
            >
              📜 FLOOR RULES
            </button>
          )}
          {commands.openTimelineHistory && (
            <button
              type="button"
              className={styles.button}
              onClick={commands.openTimelineHistory}
            >
              📜 HISTORY
            </button>
          )}
          {commands.openTimelineEvidence && (
            <button
              type="button"
              className={styles.button}
              onClick={commands.openTimelineEvidence}
            >
              📡 TELEMETRY
            </button>
          )}
          {model.countdowns.activeCountdown && commands.openCountdownEvidence && (
            <button
              type="button"
              className={styles.button}
              onClick={commands.openCountdownEvidence}
            >
              ⏱ Collapse clock evidence
            </button>
          )}
        </div>
      </div>

      {/* Secondary Countdowns */}
      {model.countdowns.hasSecondaryCountdowns && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Secondary Countdowns</h3>
          {model.countdowns.secondaryCountdowns.map((countdown) => (
            <div className={styles.secondaryCountdown} key={countdown.id}>
              <span>{countdown.title.toUpperCase()}: {countdown.formattedLabel}</span>
              <small>{countdown.target.replaceAll("-", " ").toUpperCase()}</small>
              <small>
                EVIDENCE: {firstCountdownEvidenceSummary(countdown.referencePoints)}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
