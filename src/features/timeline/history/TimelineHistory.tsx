"use client";
import React from "react";
import type { CrawlerEvent, TimelineSource } from "../../../../app/domain/types";
import { SequenceBadge } from "../SequenceBadge";
import { formatSequencePosition, narrativeEventsAtOrBefore } from "../../../../app/domain/narrative-presentation";
import { Panel } from "../../../shared/ui/Panel";

interface TimelineHistoryProps {
  events: CrawlerEvent[];
  sequence: number;
  selectedFloorOrdinal: number | "all";
  recentLogs: { sequence: number; timestamp: string; message: string; category: string }[];
  sources: TimelineSource[];
  onNavigateToSequence: (seq: number) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function TimelineHistory({
  events,
  sequence,
  selectedFloorOrdinal,
  recentLogs,
  sources,
  onNavigateToSequence,
  onClose,
  isModal = false,
}: TimelineHistoryProps) {
  const narrativeEvents = narrativeEventsAtOrBefore(events, sequence, selectedFloorOrdinal);

  const sourceTitle = (sourceId: string) =>
    sources.find((source) => source.id === sourceId)?.title ?? sourceId;

  const content = (
    <Panel title="TIMELINE STORY & EVENT HISTORY">
      <p style={{ fontSize: "11px", color: "#8fa1aa", marginBottom: "12px" }}>
        Browse reverse-chronological typed narrative events and system logs at or before Sequence #{sequence}.
      </p>
      <div className="log">
        {narrativeEvents.slice().reverse().map((event) => (
          <article
            key={event.sequence}
            className={`typed-log-entry ${event.kind === "floor-collapsed" ? "terminal" : ""}`}
            tabIndex={0}
            role="button"
            onClick={() => {
              onNavigateToSequence(event.sequence);
              if (onClose) onClose();
            }}
            onKeyDown={(key) => {
              if (key.key === "Enter" || key.key === " ") {
                onNavigateToSequence(event.sequence);
                if (onClose) onClose();
              }
            }}
          >
            <header>
              <SequenceBadge kind={String(event.kind)} />
              <span>SEQ #{event.sequence}</span>
            </header>
            <strong>{event.summary}</strong>
            {Array.isArray(event.entities) && event.entities.length > 0 && (
              <p>Entities: {(event.entities as string[]).join(", ")}</p>
            )}
            <p>{formatSequencePosition(event.position, Array.isArray(event.evidence) ? event.evidence : [])}</p>
            {Array.isArray(event.evidence) &&
              event.evidence.map((evidence, index) => (
                <small key={`${evidence.sourceId}-${index}`}>
                  SOURCE: {sourceTitle(evidence.sourceId)}
                  {evidence.locator?.section ? ` · ${evidence.locator.section}` : ""} ·{" "}
                  {(evidence.confidence ?? "sourced").toUpperCase()}
                </small>
              ))}
          </article>
        ))}

        <details style={{ marginTop: "12px" }}>
          <summary style={{ cursor: "pointer", fontSize: "11px", color: "#8ca8b3", fontWeight: "bold" }}>
            GENERIC SYSTEM EVENTS ({recentLogs.filter((log) => !narrativeEvents.some((e) => e.sequence === log.sequence)).length})
          </summary>
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {recentLogs
              .filter((log) => !narrativeEvents.some((e) => e.sequence === log.sequence))
              .map((log) => (
                <p
                  key={log.sequence}
                  style={{ cursor: "pointer", fontSize: "10px", margin: 0, color: "#8ca8b3" }}
                  onClick={() => {
                    onNavigateToSequence(log.sequence);
                    if (onClose) onClose();
                  }}
                >
                  <span style={{ color: "#1bd9ff", fontWeight: "bold" }}>SEQ #{log.sequence}</span>{" "}
                  {log.timestamp ? `[${log.timestamp}] ` : ""}
                  {log.message}
                </p>
              ))}
          </div>
        </details>
      </div>
    </Panel>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "720px", maxHeight: "85vh", overflowY: "auto" }}>
        <div className="modal-header" style={{ marginBottom: "12px" }}>
          <div>
            <p className="eyebrow">TIMELINE HISTORY FEED</p>
            <h2>EVENT & NARRATIVE LOG</h2>
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
