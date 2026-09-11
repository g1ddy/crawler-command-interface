import type {
  CrawlerEvent,
  CrawlerState,
  CrawlerTimelineDocument,
  FloorSegment,
  ProjectedObservationsState,
  TimelineSource,
} from "../../app/domain/types";
import type { projectCountdownState } from "../../app/domain/countdowns";
import type { ReplayPresentation, ReplayCommandCallbacks } from "../features/timeline/replay-presentation.ts";
import type { CanonCapabilities } from "./capabilities";
import type { ApplicationActions } from "./crawler-action-contracts";

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
  currentFloorSegment: FloorSegment | null;
  activeCountdown: ReturnType<typeof projectCountdownState>;
  replayPresentation: ReplayPresentation;
  floorHudTitle: string;
}

export interface CrawlerSessionCommands {
  selectFloor: (ordinal: number | "all") => void;
  selectSequence: (sequence: number) => void;
  stepPrevious: () => void;
  stepNext: () => void;
  returnToLive: () => void;
  setLiveMode: (live: boolean) => void;
  updateTimeline: (document: CrawlerTimelineDocument) => void;
  resetTimeline: () => void;
  actions: ApplicationActions;
  exportJson: () => void;
  importJson: (jsonText: string) => { ok: true } | { ok: false; error: string };
  replayCommands: ReplayCommandCallbacks;
}

export interface CrawlerSession {
  snapshot: CrawlerSessionSnapshot;
  commands: CrawlerSessionCommands;
}
