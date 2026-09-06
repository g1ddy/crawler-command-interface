"use client";
import { useMemo, useState } from "react";
import type { CrawlerEvent, EventCategory, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue, TimelineObservation } from "../../../../app/domain/types";
import { getNarrativePresentation } from "../../../../app/domain/narrative-presentation";
import { SequenceBadge } from "../SequenceBadge";
import { SequenceInspector, type TimelineFeedMode } from "./SequenceInspector";

export function TimelineDiagnostics({ events, observations, selectedSequence, minSequence, maxSequence, projectedObservations, onSelectSequence, onInspectObservation }: {
  events: CrawlerEvent[];
  observations: TimelineObservation[];
  selectedSequence: number;
  minSequence: number;
  maxSequence: number;
  projectedObservations?: ProjectedObservationsState;
  onSelectSequence: (sequence: number) => void;
  onInspectObservation?: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
}) {
  const [filterCategory, setFilterCategory] = useState<EventCategory | "all">("all");
  const [feedMode, setFeedMode] = useState<TimelineFeedMode>("all");
  const [semanticFilter, setSemanticFilter] = useState<"all" | "rules" | "broadcasts" | "encounters" | "floor-transitions">("all");
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showObservationMarkers, setShowObservationMarkers] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<CrawlerEvent | null>(null);
  const [hoveredObservation, setHoveredObservation] = useState<TimelineObservation | null>(null);

  const markerEvents = useMemo(() => feedMode === "telemetry-only" ? [] : events.filter((event) => {
    if (filterCategory !== "all" && event.category !== filterCategory) return false;
    if (semanticFilter === "all") return true;
    return event.type === "NarrativeEvent" && getNarrativePresentation(String(event.kind)).group === semanticFilter;
  }), [events, feedMode, filterCategory, semanticFilter]);
  const markerObservations = showObservationMarkers && feedMode !== "events-only" ? observations : [];

  return <div style={{ marginTop: "14px", borderTop: "1px solid #183e4d", paddingTop: "10px" }}>
    <button className="outline" aria-expanded={showDiagnostics} onClick={() => setShowDiagnostics((shown) => !shown)} style={{ fontSize: "10px", color: "#8ca8b3", borderColor: "#294b5a" }}>{showDiagnostics ? "▾ HIDE REPLAY DIAGNOSTICS" : "▸ REPLAY DIAGNOSTICS"}</button>
    {!showDiagnostics && <span style={{ marginLeft: "10px", fontSize: "10px", color: "#637f8c" }}>History filters, event markers, and telemetry inspection are available when needed.</span>}
    {showDiagnostics && <div className="timeline-meta" style={{ flexDirection: "column", alignItems: "stretch", gap: "12px", marginTop: "12px" }}>
      <div className="filters semantic-filters" aria-label="Semantic sequence filters"><span className="filter-label">STORY:</span>{(["all", "rules", "broadcasts", "encounters", "floor-transitions"] as const).map((group) => <button key={group} className={`filter-chip ${semanticFilter === group ? "active" : ""}`} aria-pressed={semanticFilter === group} onClick={() => setSemanticFilter(group)}>{group === "all" ? "ALL" : group.replace("-", " ").toUpperCase()}</button>)}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div className="filters"><span className="filter-label">EVENT MARKERS:</span>{(["all", "loot", "combat", "skills", "quest", "levelup", "system"] as const).map((category) => <button key={category} className={`filter-chip ${filterCategory === category ? "active" : ""}`} onClick={() => setFilterCategory(category)}>{category.toUpperCase()}</button>)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span className="filter-label">FEED MODE:</span>{(["all", "events-only", "telemetry-only"] as const).map((mode) => <button key={mode} className={`filter-chip ${feedMode === mode ? "active" : ""}`} onClick={() => setFeedMode(mode)}>{mode === "all" ? "ALL" : mode === "events-only" ? "EVENTS ONLY" : "TELEMETRY ONLY"}</button>)}<button className={`filter-chip ${showObservationMarkers ? "active" : ""}`} onClick={() => setShowObservationMarkers((shown) => !shown)}>{showObservationMarkers ? "📡 TELEMETRY MARKERS [ON]" : "📡 TELEMETRY MARKERS [OFF]"}</button></div>
      </div>
      <div className="slider-wrapper"><div className="event-markers">{markerEvents.map((event) => { const pct = ((event.sequence - minSequence) / (maxSequence - minSequence || 1)) * 100; return <button key={`event-${event.sequence}`} style={{ left: `${pct}%` }} className={`marker marker-${event.category} ${event.type === "NarrativeEvent" ? `typed-marker marker-${getNarrativePresentation(String(event.kind)).group}` : ""} ${event.sequence === selectedSequence ? "active" : ""}`} onClick={() => onSelectSequence(event.sequence)} onMouseEnter={() => setHoveredEvent(event)} onMouseLeave={() => setHoveredEvent(null)} aria-label={event.type === "NarrativeEvent" ? `${getNarrativePresentation(String(event.kind)).accessibleLabel}: ${event.summary}` : event.summary} />; })}{markerObservations.map((observation) => { const pct = ((observation.sequence - minSequence) / (maxSequence - minSequence || 1)) * 100; return <button key={`observation-${observation.id}`} style={{ left: `${pct}%` }} className={`marker obs-marker ${observation.sequence === selectedSequence ? "active" : ""}`} onClick={() => onSelectSequence(observation.sequence)} onMouseEnter={() => setHoveredObservation(observation)} onMouseLeave={() => setHoveredObservation(null)} title={`[Sourced Telemetry · Seq #${observation.sequence}] ${observation.kind}`} />; })}</div></div>
      {(hoveredEvent || hoveredObservation) && <div className="event-card-preview" style={{ background: hoveredObservation ? "#07202b" : "#0d1f2b", borderColor: "#1bd9ff" }}>{hoveredEvent ? <>{hoveredEvent.type === "NarrativeEvent" ? <SequenceBadge kind={String(hoveredEvent.kind)} /> : <span className="tag">{hoveredEvent.category.toUpperCase()}</span>}<b>⚡ CAUSAL EVENT · FLOOR {hoveredEvent.position?.floor ?? 1} · SEQ #{hoveredEvent.sequence} ({hoveredEvent.occurred_at || "exact time not sourced"})</b><p>{hoveredEvent.summary}</p></> : hoveredObservation ? <><span className="tag" style={{ background: "#0a3a4c", color: "#8de9ff" }}>📡 SOURCED TELEMETRY</span><b>OBSERVATION ({hoveredObservation.kind}) · SEQ #{hoveredObservation.sequence}</b><p style={{ margin: "4px 0 0 0", color: "#b2e2f0" }}>Interpolation: {hoveredObservation.interpolation || "stated exact fact"} · Evidence: {hoveredObservation.evidence[0]?.sourceId || "Sourced"}{hoveredObservation.note ? ` — ${hoveredObservation.note}` : ""}</p></> : null}</div>}
      <SequenceInspector sequence={selectedSequence} events={events} observations={observations} projectedObservations={projectedObservations} feedMode={feedMode} onInspectObservation={onInspectObservation} />
    </div>}
  </div>;
}
