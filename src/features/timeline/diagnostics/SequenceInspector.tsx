import type { CrawlerEvent, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue, TimelineObservation } from "../../../../app/domain/types";
import { SequenceBadge } from "../SequenceBadge";
import { TelemetryBadge } from "../evidence/TelemetryBadge";

export type TimelineFeedMode = "all" | "events-only" | "telemetry-only";

export function SequenceInspector({ sequence, events, observations, projectedObservations, feedMode, onInspectObservation }: {
  sequence: number;
  events: CrawlerEvent[];
  observations: TimelineObservation[];
  projectedObservations?: ProjectedObservationsState;
  feedMode: TimelineFeedMode;
  onInspectObservation?: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
}) {
  const currentEvent = events.find((event) => event.sequence === sequence);
  const currentObservations = observations.filter((observation) => observation.sequence === sequence);
  const narrativeKind = currentEvent?.type === "NarrativeEvent" ? String(currentEvent.kind) : undefined;
  const currentEvidence = Array.isArray(currentEvent?.evidence) ? currentEvent.evidence as unknown as TimelineObservation["evidence"] : [];
  const showEvents = feedMode !== "telemetry-only";
  const showTelemetry = feedMode !== "events-only";

  return <div className="sequence-inspector-card" style={{ background: "#06131c", border: "1px solid #1f4252", borderRadius: "4px", padding: "12px", fontSize: "11px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}><span className="eyebrow" style={{ margin: 0 }}>SEQUENCE #{sequence} STREAM & TELEMETRY DETAIL</span><span style={{ fontSize: "10px", color: "#7fa0ac", fontFamily: "monospace" }}>{currentEvent ? `Floor ${currentEvent.position?.floor ?? 1}${currentEvent.occurred_at ? ` · ${currentEvent.occurred_at}` : ""}` : `Seq #${sequence}`}</span></div>
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
      {showEvents && currentEvent && <div className="feed-row causal-event-row" style={{ background: "#0d1e29", borderLeft: "3px solid #ff7180", padding: "8px 10px", borderRadius: "2px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}><strong style={{ color: "#ff8a90", fontSize: "10px", letterSpacing: "0.08em" }}>{narrativeKind ? <SequenceBadge kind={narrativeKind} /> : `⚡ CAUSAL EVENT (${currentEvent.type || "EVENT"})`}</strong><span style={{ fontSize: "9px", color: "#8ca8b3" }}>Category: {currentEvent.category ? currentEvent.category.toUpperCase() : "SYSTEM"}</span></div><p style={{ margin: "2px 0 0 0", color: "#e6f3f7", fontSize: "11px" }}>{currentEvent.summary}</p>{currentEvidence.length > 0 && <div style={{ marginTop: "4px", fontSize: "9px", color: "#7fa0ac" }}>Evidence Source: <span style={{ color: "#ffb74d" }}>{currentEvidence[0].sourceId}</span>{currentEvidence[0].locator?.chapter ? ` (Chapter ${currentEvidence[0].locator.chapter})` : ""}</div>}</div>}
      {showTelemetry && currentObservations.map((observation) => <div key={observation.id} className="feed-row telemetry-row" style={{ background: "#07212e", borderLeft: "3px solid #1bd9ff", padding: "8px 10px", borderRadius: "2px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}><strong style={{ color: "#1bd9ff", fontSize: "10px", letterSpacing: "0.08em" }}>📡 SOURCED TELEMETRY OBSERVATION ({observation.kind.toUpperCase()})</strong><span style={{ fontSize: "9px", background: "#0a3447", color: "#7ee5ff", padding: "1px 5px", borderRadius: "3px" }}>{observation.interpolation === "linear" ? "LINEAR ESTIMATE CAPABLE" : "EXACT STATED FACT"}</span></div><p style={{ margin: "2px 0 0 0", color: "#d2f2fa", fontSize: "10px", fontFamily: "monospace" }}>Observed payload: {formatObservationPayload(observation)}</p></div>)}
      {(!currentEvent || !showEvents) && (!showTelemetry || currentObservations.length === 0) && <p style={{ margin: "4px 0", fontSize: "10px", color: "#6a8592", fontStyle: "italic" }}>No {feedMode === "events-only" ? "causal events" : feedMode === "telemetry-only" ? "sourced telemetry" : "events or telemetry"} directly anchored at Sequence #{sequence}. Showing point-in-time projected state below.</p>}
    </div>
    {projectedObservations && <div style={{ borderTop: "1px solid #183e4d", paddingTop: "8px" }}><span className="eyebrow" style={{ fontSize: "8px", color: "#688996" }}>POINT-IN-TIME PROJECTED TELEMETRY AT SEQ #{sequence}</span><div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>{[
      ...Object.entries(projectedObservations.condition).map(([key, value]) => [`Condition.${key}`, value] as const),
      ...Object.entries(projectedObservations.attributes).map(([key, value]) => [`Attr.${key}`, value] as const),
      ...Object.entries(projectedObservations.xpProgress).map(([key, value]) => [`XP.${key}`, value] as const),
      ...Object.entries(projectedObservations.broadcast).map(([key, value]) => [`Broadcast.${key}`, value] as const),
      ...Object.entries(projectedObservations.floor).map(([key, value]) => [`Floor.${key}`, value] as const),
    ].map(([label, value]) => <div key={label} style={{ background: "#081a26", border: "1px solid #1a3c4c", padding: "3px 7px", borderRadius: "3px", fontSize: "10px" }}><span style={{ color: "#7f9ea9" }}>{label}: </span><strong style={{ color: "#fff" }}>{value.value.toLocaleString()}</strong><TelemetryBadge observation={value} onClick={() => onInspectObservation?.(value)} /></div>)}</div></div>}
  </div>;
}

function formatObservationPayload(observation: TimelineObservation): string {
  const value = observation as unknown as Record<string, unknown>;
  if (observation.kind === "crawler-condition") return `HP: ${value.currentHealth ?? "—"}/${value.maxHealth ?? "—"}, MP: ${value.currentMana ?? "—"}/${value.maxMana ?? "—"}`;
  if (observation.kind === "crawler-attributes") { const attrs = value.attributes as Record<string, number> | undefined; return attrs ? Object.entries(attrs).map(([key, number]) => `${key}:${number}`).join(", ") : "Attributes update"; }
  if (observation.kind === "xp-progress") return `Level ${value.level ?? "—"}, XP: ${value.xp ?? "—"}/${value.maxXp ?? "—"}`;
  if (observation.kind === "broadcast-metrics") return `Viewers: ${value.viewers ? Number(value.viewers).toLocaleString() : "—"}, Followers: ${value.followers ? Number(value.followers).toLocaleString() : "—"}`;
  if (observation.kind === "inventory-state") return `Item ${value.itemInstanceId}: present=${value.present ?? true}, qty=${value.quantity ? JSON.stringify(value.quantity) : "1"}`;
  if (observation.kind === "equipment-state") return `Slot ${value.slot}: ${value.itemInstanceId || "EMPTY"}`;
  if (observation.kind === "countdown-remaining") return `Countdown ${value.countdownId}: ${value.remainingSeconds}s remaining${value.activationOffset !== undefined ? `, offset: ${value.activationOffset}s` : ""}`;
  return JSON.stringify(observation);
}
