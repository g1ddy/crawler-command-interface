import { useMemo, type ComponentProps } from "react";
import { getStatBreakdown } from "../../../app/domain/stats";
import type { ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationValue } from "../../../app/domain/types";
import type { CrawlerSession } from "../../application/crawler-session";
import { StatInspectorModal } from "../../features/crawler/stats/StatInspectorModal";
import { FloorRules } from "../../features/floor/FloorRules";
import { TimelineEvidence } from "../../features/timeline/evidence/TimelineEvidence";
import { TelemetryInspectorModal } from "../../features/timeline/evidence/TelemetryInspectorModal";
import { TimelineHistory } from "../../features/timeline/history/TimelineHistory";
import { ModalBoundary } from "../../shared/ui/ModalBoundary";
import { TimelineToolsModal } from "../tools/TimelineToolsModal";

type Reading = ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation;

/** Feature-owned inspectors composed here, not inside the layout frame. */
export function WorkspaceOverlays({ snapshot, commands, inspectStat, closeStat,
  inspectObservation, closeObservation, onInspectObservation, showFloorRules, closeFloorRules,
  showTimelineHistory, closeHistory, showTimelineEvidence, closeEvidence, tools,
}: {
  snapshot: Pick<CrawlerSession["snapshot"], "projectedState" | "events" | "sources" | "currentSeq" | "selectedFloorOrdinal" | "projectedObservations">;
  commands: Pick<CrawlerSession["commands"], "selectSequence">;
  inspectStat: string | null; closeStat: () => void;
  inspectObservation: Reading | null; closeObservation: () => void;
  onInspectObservation: (reading: Reading) => void;
  showFloorRules: boolean; closeFloorRules: () => void;
  showTimelineHistory: boolean; closeHistory: () => void;
  showTimelineEvidence: boolean; closeEvidence: () => void;
  tools: ComponentProps<typeof TimelineToolsModal> | null;
}) {
  const { projectedState, events, sources, currentSeq, selectedFloorOrdinal, projectedObservations } = snapshot;
  const breakdown = useMemo(() => inspectStat ? getStatBreakdown(projectedState, inspectStat) : null, [projectedState, inspectStat]);
  const historyProps = { events, sources, sequence: currentSeq, selectedFloorOrdinal,
    onNavigateToSequence: commands.selectSequence, isModal: true };
  return <>
    {showFloorRules && <ModalBoundary label="Floor rules" onClose={closeFloorRules}>
      <FloorRules {...historyProps} onClose={closeFloorRules} />
    </ModalBoundary>}
    {showTimelineHistory && <ModalBoundary label="Timeline history" onClose={closeHistory}>
      <TimelineHistory {...historyProps} recentLogs={projectedState.recentLogs} onClose={closeHistory} />
    </ModalBoundary>}
    {showTimelineEvidence && <ModalBoundary label="Timeline evidence" onClose={closeEvidence}>
      <TimelineEvidence observations={projectedObservations} sequence={currentSeq} sources={sources}
        onInspectObservation={onInspectObservation} onClose={closeEvidence} isModal />
    </ModalBoundary>}
    {breakdown && <ModalBoundary label="Stat provenance" onClose={closeStat}>
      <StatInspectorModal breakdown={breakdown} onClose={closeStat} />
    </ModalBoundary>}
    {inspectObservation && <ModalBoundary label="Telemetry provenance" onClose={closeObservation}>
      <TelemetryInspectorModal observation={inspectObservation} sources={sources} onClose={closeObservation} />
    </ModalBoundary>}
    {tools && <ModalBoundary label="System tools" onClose={tools.onClose}>
      <TimelineToolsModal {...tools} />
    </ModalBoundary>}
  </>;
}
