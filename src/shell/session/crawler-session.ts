import type {
  CrawlerEvent,
  CrawlerState,
  CrawlerTimelineDocument,
  FloorSegment,
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
  ProjectedObservationsState,
  TimelineSource,
} from "../../../app/domain/types";
import type { StatBreakdown } from "../../../app/domain/stats";
import type { projectCountdownState } from "../../../app/domain/countdowns";
import type { ReplayPresentation, ReplayCommandCallbacks } from "../../features/timeline/public";
import type { CanonCapabilities } from "../../application/capabilities";
import type { RootView } from "../navigation/navigation-model";
import type { EquipmentSlot, ApplicationActions } from "../../application/crawler-action-contracts";
import type { HudPersistence, HudPresentation } from "../hud/hud-presentation";

export type PresentationChoice = HudPresentation;

export interface CrawlerSessionSnapshot {
  timelineDoc: CrawlerTimelineDocument;
  events: CrawlerEvent[];
  sources: TimelineSource[];
  maxSeq: number;
  latestFloor: number;
  selectedFloorOrdinal: number | "all";
  selectedSeq: number;
  currentSeq: number;
  isLive: boolean;
  projectedState: CrawlerState;
  projectedObservations: ProjectedObservationsState;
  liveState: CrawlerState;
  capabilities: CanonCapabilities;
  resolvedView: RootView;
  view: RootView;
  statBreakdown: StatBreakdown | null;
  currentFloorSegment: FloorSegment | null;
  activeCountdown: ReturnType<typeof projectCountdownState>;
  replayPresentation: ReplayPresentation;
  floorHudTitle: string;
  presentationChoice: PresentationChoice;
  hudPersistence: HudPersistence;
  inspectStat: string | null;
  inspectObservation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null;
  provenanceItem: InventoryItem | null;
  showJsonModal: boolean;
  jsonText: string;
  importError: string | null;
  showFloorRules: boolean;
  showTimelineHistory: boolean;
  showTimelineEvidence: boolean;
  inventoryFilter: string;
  equipmentSlot: EquipmentSlot;
  toastMessage: string | null;
}

export interface CrawlerSessionCommands {
  selectFloor: (ordinal: number | "all") => void;
  selectSequence: (sequence: number) => void;
  stepPrevious: () => void;
  stepNext: () => void;
  returnToLive: () => void;
  setLiveMode: (live: boolean) => void;
  setView: (view: RootView) => void;
  setPresentationChoice: (choice: PresentationChoice) => void;
  setInspectStat: (stat: string | null) => void;
  setInspectObservation: (
    obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null
  ) => void;
  setProvenanceItem: (item: InventoryItem | null) => void;
  setShowJsonModal: (show: boolean) => void;
  setJsonText: (text: string) => void;
  setImportError: (error: string | null) => void;
  setShowFloorRules: (show: boolean) => void;
  setShowTimelineHistory: (show: boolean) => void;
  setShowTimelineEvidence: (show: boolean) => void;
  setInventoryFilter: (filter: string) => void;
  setEquipmentSlot: (slot: EquipmentSlot) => void;
  setToastMessage: (msg: string | null) => void;
  actions: ApplicationActions;
  exportJson: () => void;
  importJson: () => void;
  resetTimeline: () => void;
  openTools: () => void;
  closeTools: () => void;
  replayCommands: ReplayCommandCallbacks;
}

export interface CrawlerSession {
  snapshot: CrawlerSessionSnapshot;
  commands: CrawlerSessionCommands;
}
