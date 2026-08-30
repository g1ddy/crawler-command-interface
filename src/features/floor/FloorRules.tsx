"use client";
import React, { useMemo } from "react";
import type { CrawlerEvent, TimelineSource } from "../../../app/domain/types";
import { narrativeEventsAtOrBefore, formatSequencePosition } from "../../../app/domain/narrative-presentation";
import { SequenceBadge } from "../timeline/SequenceBadge";
import { Panel } from "../../shared/ui/Panel";

interface FloorRulesProps {
  events: CrawlerEvent[];
  sequence: number;
  selectedFloorOrdinal: number | "all";
  sources: TimelineSource[];
  onNavigateToSequence: (seq: number) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function FloorRules({
  events,
  sequence,
  selectedFloorOrdinal,
  sources,
  onNavigateToSequence,
  onClose,
  isModal = false,
}: FloorRulesProps) {
  const ruleHistory = useMemo(
    () => narrativeEventsAtOrBefore(events, sequence, selectedFloorOrdinal, "rule-changed"),
    [events, sequence, selectedFloorOrdinal]
  );

  const sourceTitle = (sourceId: string) =>
    sources.find((source) => source.id === sourceId)?.title ?? sourceId;

  const content = (
    <Panel title="FLOOR RULES & DIRECTIVES">
      <p className="history-disclaimer" style={{ fontSize: "10px", color: "#8fa1aa", marginBottom: "12px" }}>
        HISTORICAL CHANGE LOG · Entries are source-recorded changes only; current, superseded, or revoked status is not inferred.
      </p>
      <div className="log">
        {ruleHistory.length > 0 ? (
          ruleHistory.map((event) => (
            <article key={event.sequence} className="typed-log-entry">
              <header>
                <SequenceBadge kind="rule-changed" />
                <button
                  onClick={() => {
                    onNavigateToSequence(event.sequence);
                    if (onClose) onClose();
                  }}
                  title="Click to jump timeline sequence"
                >
                  SEQ #{event.sequence}
                </button>
              </header>
              <strong>{event.summary}</strong>
              <p>{formatSequencePosition(event.position, Array.isArray(event.evidence) ? event.evidence : [])}</p>
              {Array.isArray(event.evidence) &&
                event.evidence.map((evidence, index) => (
                  <small key={`${evidence.sourceId}-${index}`}>
                    SOURCE: {sourceTitle(evidence.sourceId)}
                    {evidence.locator?.section ? ` · ${evidence.locator.section}` : ""}
                  </small>
                ))}
            </article>
          ))
        ) : (
          <p style={{ fontSize: "11px", color: "#8fa1aa" }}>
            No rule changes sourced in this floor scope at or before Sequence #{sequence}.
          </p>
        )}
      </div>
    </Panel>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px", maxHeight: "85vh", overflowY: "auto" }}>
        <div className="modal-header" style={{ marginBottom: "12px" }}>
          <div>
            <p className="eyebrow">FLOOR DIRECTIVES & CONSTRAINTS</p>
            <h2>FLOOR RULES</h2>
          </div>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
        {content}
        <div className="modal-footer" style={{ marginTop: "12px" }}>
          <button className="outline" onClick={onClose}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
