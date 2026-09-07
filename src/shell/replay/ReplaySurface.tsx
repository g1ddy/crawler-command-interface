"use client";
import { useMemo, useState } from "react";
import type { CrawlerEvent, FloorSegment, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue, TimelineCountdown, TimelineObservation, TimelineSource } from "../../../app/domain/types";
import { getFloorEndSequence } from "../../../app/domain/floors";
import { projectCountdownState } from "../../../app/domain/countdowns";
import { TimelineDiagnostics } from "../../features/timeline/diagnostics/TimelineDiagnostics";
import { CountdownEvidenceModal } from "../../features/timeline/evidence/CountdownEvidenceModal";
import { ReplayControls } from "./ReplayControls";

export function ReplaySurface({ events, floors = [], countdowns = [], observations = [], projectedObservations, selectedFloorOrdinal, onSelectFloorOrdinal, selectedSequence, onSelectSequence, isLive, onToggleLive, onInspectObservation, onOpenFloorRules, onOpenTimelineHistory, onOpenTimelineEvidence }: {
  events: CrawlerEvent[];
  floors?: FloorSegment[];
  countdowns?: TimelineCountdown[];
  observations?: TimelineObservation[];
  sources?: TimelineSource[];
  projectedObservations?: ProjectedObservationsState;
  selectedFloorOrdinal: number | "all";
  onSelectFloorOrdinal: (ordinal: number | "all") => void;
  selectedSequence: number;
  onSelectSequence: (sequence: number) => void;
  isLive: boolean;
  onToggleLive: () => void;
  onInspectObservation?: (observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
  onOpenFloorRules?: () => void;
  onOpenTimelineHistory?: () => void;
  onOpenTimelineEvidence?: () => void;
}) {
  const [showCountdownEvidence, setShowCountdownEvidence] = useState(false);
  const availableFloors = useMemo(() => {
    const baseFloors = floors.length > 0 ? floors : Array.from(events.reduce((map, event) => {
      const ordinal = event.position?.floor ?? 1;
      const existing = map.get(ordinal);
      if (existing) existing.endSequence = Math.max(existing.endSequence, event.sequence);
      else map.set(ordinal, { id: `floor-${ordinal}`, ordinal, title: `Floor ${ordinal}`, startSequence: event.sequence, endSequence: event.sequence });
      return map;
    }, new Map<number, FloorSegment>()).values()).sort((a, b) => a.ordinal - b.ordinal);
    return baseFloors.map((floor) => ({ ...floor, endSequence: getFloorEndSequence(events, floor.ordinal, floor.endSequence) }));
  }, [events, floors]);
  const activeCountdown = useMemo(() => projectCountdownState({ events, countdowns }, selectedSequence, selectedFloorOrdinal), [events, countdowns, selectedSequence, selectedFloorOrdinal]);
  const secondaryCountdowns = useMemo(() => countdowns.filter((countdown) => countdown.target !== "floor-collapse" && (selectedFloorOrdinal === "all" || countdown.floor === selectedFloorOrdinal)).map((countdown) => projectCountdownState({ events, countdowns: [countdown] }, selectedSequence, countdown.floor)).filter((countdown): countdown is NonNullable<typeof countdown> => countdown !== null), [events, countdowns, selectedSequence, selectedFloorOrdinal]);
  const floorEvents = useMemo(() => selectedFloorOrdinal === "all" ? events : events.filter((event) => event.position?.floor === selectedFloorOrdinal), [events, selectedFloorOrdinal]);
  const floorObservations = useMemo(() => { if (selectedFloorOrdinal === "all") return observations; const sequences = new Set(floorEvents.map((event) => event.sequence)); return observations.filter((observation) => sequences.has(observation.sequence)); }, [observations, floorEvents, selectedFloorOrdinal]);
  const scopedSequences = useMemo(() => Array.from(new Set([...floorEvents.map((event) => event.sequence), ...floorObservations.map((observation) => observation.sequence)])).sort((a, b) => a - b), [floorEvents, floorObservations]);
  const currentEvent = useMemo(() => { let current: CrawlerEvent | undefined; for (const event of events) { if (event.sequence <= selectedSequence) current = event; else break; } return current; }, [events, selectedSequence]);
  const minSequence = scopedSequences[0] ?? 1;
  const maxSequence = scopedSequences[scopedSequences.length - 1] ?? 1;

  return <aside className="timeline-scrubber-panel panel">
    <ReplayControls availableFloors={availableFloors} activeCountdown={activeCountdown} secondaryCountdowns={secondaryCountdowns} selectedFloorOrdinal={selectedFloorOrdinal} onSelectFloorOrdinal={onSelectFloorOrdinal} selectedSequence={selectedSequence} onSelectSequence={onSelectSequence} scopedSequences={scopedSequences} currentEvent={currentEvent} isLive={isLive} onToggleLive={onToggleLive} onOpenFloorRules={onOpenFloorRules} onOpenTimelineHistory={onOpenTimelineHistory} onOpenTimelineEvidence={onOpenTimelineEvidence} onOpenCountdownEvidence={() => setShowCountdownEvidence(true)} />
    <TimelineDiagnostics events={floorEvents} observations={floorObservations} selectedSequence={selectedSequence} minSequence={minSequence} maxSequence={maxSequence} projectedObservations={projectedObservations} onSelectSequence={onSelectSequence} onInspectObservation={onInspectObservation} />
    {showCountdownEvidence && activeCountdown && <CountdownEvidenceModal countdown={activeCountdown} onClose={() => setShowCountdownEvidence(false)} onNavigateToSequence={onSelectSequence} />}
  </aside>;
}
