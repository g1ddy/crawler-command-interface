import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { getFloorEndSequence } from "../../app/domain/floors.ts";
import { LocalDeviceStorageAdapter, type TimelinePersistenceAdapter } from "../../app/domain/persistence.ts";
import {
  projectCountdownState,
  projectObservations,
  projectState,
} from "../../app/domain/projection.ts";
import type {
  CrawlerEvent,
  CrawlerState,
  CrawlerTimelineDocument,
  FloorSegment,
  TimelineSource,
} from "../../app/domain/types.ts";
import { validateCrawlerTimeline } from "../../app/domain/validation.ts";
import { evaluateCanonCapabilities } from "./capabilities.ts";
import type { ActionResult } from "./crawler-action-contracts.ts";
import { createApplicationActions } from "./crawler-actions.ts";
import type {
  CrawlerSession,
  CrawlerSessionCommands,
  CrawlerSessionSnapshot,
} from "./crawler-session.ts";
import {
  deriveReplayPresentation,
  type ReplayCommandCallbacks,
} from "../features/timeline/replay-presentation.ts";

export interface CreateCrawlerSessionOptions {
  timelineDoc?: CrawlerTimelineDocument;
  storageAdapter?: TimelinePersistenceAdapter | null;
  onActionResult?: (result: ActionResult) => void;
}

export class CrawlerSessionController {
  private timelineDoc: CrawlerTimelineDocument;
  private storageAdapter: TimelinePersistenceAdapter | null;
  private listeners = new Set<() => void>();

  private selectedFloorOrdinal: number | "all";
  private isLive = true;
  private selectedSeq: number;

  constructor(options: CreateCrawlerSessionOptions = {}) {
    const hasWindow = typeof window !== "undefined";
    this.storageAdapter =
      options.storageAdapter !== undefined
        ? options.storageAdapter
        : hasWindow
          ? new LocalDeviceStorageAdapter()
          : null;

    const loaded = this.storageAdapter?.loadTimeline();
    this.timelineDoc =
      options.timelineDoc ??
      ((loaded && !(loaded instanceof Promise)) ? loaded : compiledTimeline);

    const events = (this.timelineDoc.events as unknown as CrawlerEvent[]) || [];
    const maxSeq = events[events.length - 1]?.sequence ?? 1;
    const latestFloor =
      events[events.length - 1]?.position?.floor ??
      this.timelineDoc.floors?.slice(-1)[0]?.ordinal ??
      1;

    this.selectedFloorOrdinal = this.timelineDoc.floors?.slice(-1)[0]?.ordinal ?? latestFloor;
    this.selectedSeq = maxSeq;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }

  public updateTimeline(document: CrawlerTimelineDocument) {
    this.timelineDoc = document;
    this.storageAdapter?.saveTimeline(document);
    this.notify();
  }

  public selectFloor(ordinal: number | "all") {
    this.selectedFloorOrdinal = ordinal;
    if (ordinal !== "all") {
      const floor = this.timelineDoc.floors?.find((candidate: FloorSegment) => candidate.ordinal === ordinal);
      if (floor) {
        const events = (this.timelineDoc.events as unknown as CrawlerEvent[]) || [];
        const maxSeq = events[events.length - 1]?.sequence ?? 1;
        const end = getFloorEndSequence(this.timelineDoc.events, ordinal, floor.endSequence);
        this.selectedSeq = end;
        this.isLive = end === maxSeq;
      }
    }
    this.notify();
  }

  public selectSequence(sequence: number) {
    const events = (this.timelineDoc.events as unknown as CrawlerEvent[]) || [];
    const maxSeq = events[events.length - 1]?.sequence ?? 1;
    this.selectedSeq = sequence;
    this.isLive = sequence === maxSeq;
    this.notify();
  }

  public returnToLive() {
    const events = (this.timelineDoc.events as unknown as CrawlerEvent[]) || [];
    const maxSeq = events[events.length - 1]?.sequence ?? 1;
    const latestFloor =
      events[events.length - 1]?.position?.floor ??
      this.timelineDoc.floors?.slice(-1)[0]?.ordinal ??
      1;
    this.isLive = true;
    this.selectedSeq = maxSeq;
    this.selectedFloorOrdinal = latestFloor;
    this.notify();
  }

  public setLiveMode(live: boolean) {
    if (live) {
      this.returnToLive();
    } else {
      this.isLive = false;
      this.notify();
    }
  }

  public resetTimeline() {
    this.storageAdapter?.clearTimeline();
    this.timelineDoc = compiledTimeline;
    const compiledEvents = (compiledTimeline.events as unknown as CrawlerEvent[]) || [];
    const maxSeq = compiledEvents[compiledEvents.length - 1]?.sequence ?? 1;
    const latestFloor =
      compiledEvents[compiledEvents.length - 1]?.position?.floor ??
      compiledTimeline.floors?.slice(-1)[0]?.ordinal ??
      1;
    this.selectedSeq = maxSeq;
    this.selectedFloorOrdinal = latestFloor;
    this.isLive = true;
    this.notify();
  }

  public importJson(jsonText: string): { ok: true } | { ok: false; error: string } {
    try {
      const parsed = JSON.parse(jsonText) as CrawlerTimelineDocument;
      const validation = validateCrawlerTimeline(parsed);
      if (!validation.valid) {
        return { ok: false, error: validation.errors.join("\n") };
      }
      this.updateTimeline(parsed);
      const importedEvents = (parsed.events as unknown as CrawlerEvent[]) || [];
      const last = importedEvents.slice(-1)[0]?.sequence ?? 1;
      this.selectedSeq = last;
      this.selectedFloorOrdinal =
        importedEvents.slice(-1)[0]?.position?.floor ??
        parsed.floors?.slice(-1)[0]?.ordinal ??
        1;
      this.isLive = true;
      this.notify();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: `JSON syntax error: ${(error as Error).message}` };
    }
  }

  public exportJson(): void {
    if (typeof document === "undefined") return;
    const events = (this.timelineDoc.events as unknown as CrawlerEvent[]) || [];
    const currentSeq = this.isLive ? events[events.length - 1]?.sequence ?? 1 : this.selectedSeq;
    const anchor = document.createElement("a");
    anchor.href =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(this.timelineDoc, null, 2));
    anchor.download = `crawler-timeline-v2-seq-${currentSeq}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  public getSnapshot(): CrawlerSessionSnapshot {
    const events = (this.timelineDoc.events as unknown as CrawlerEvent[]) || [];
    const sources = (this.timelineDoc.sources as TimelineSource[]) || [];
    const maxSeq = events[events.length - 1]?.sequence ?? 1;
    const latestFloor =
      events[events.length - 1]?.position?.floor ??
      this.timelineDoc.floors?.slice(-1)[0]?.ordinal ??
      1;

    const currentSeq = this.isLive ? maxSeq : this.selectedSeq;

    const projectedState: CrawlerState = projectState(this.timelineDoc, currentSeq);
    const projectedObservations = projectObservations(this.timelineDoc, currentSeq);
    const liveState: CrawlerState = projectState(this.timelineDoc, maxSeq);

    const capabilities = evaluateCanonCapabilities({
      state: projectedState,
      observations: projectedObservations,
      events,
      sequence: currentSeq,
    });

    const currentFloorSegment =
      this.selectedFloorOrdinal === "all"
        ? null
        : this.timelineDoc.floors?.find(
            (floor: FloorSegment) => floor.ordinal === this.selectedFloorOrdinal,
          ) ?? null;

    const activeCountdown = projectCountdownState(
      this.timelineDoc,
      currentSeq,
      this.selectedFloorOrdinal,
    );

    const replayPresentation = deriveReplayPresentation({
      events,
      floors: this.timelineDoc.floors,
      countdowns: this.timelineDoc.countdowns,
      observations: this.timelineDoc.observations,
      selectedFloorOrdinal: this.selectedFloorOrdinal,
      selectedSequence: currentSeq,
      isLive: this.isLive,
    });

    const floorHudTitle = currentFloorSegment
      ? `FLOOR ${currentFloorSegment.ordinal}: ${currentFloorSegment.title}`
      : this.selectedFloorOrdinal === "all"
        ? "ALL FLOORS (WHOLE STORY)"
        : `FLOOR ${this.selectedFloorOrdinal}`;

    return {
      timelineDoc: this.timelineDoc,
      events,
      sources,
      maxSeq,
      latestFloor,
      selectedFloorOrdinal: this.selectedFloorOrdinal,
      selectedSeq: this.selectedSeq,
      currentSeq,
      isLive: this.isLive,
      projectedState,
      projectedObservations,
      liveState,
      capabilities,
      currentFloorSegment,
      activeCountdown,
      replayPresentation,
      floorHudTitle,
    };
  }

  public getCommands(onActionResult?: (result: ActionResult) => void): CrawlerSessionCommands {
    const handleActionResult = (result: ActionResult) => {
      if (result.ok) {
        this.updateTimeline(result.document);
        this.selectSequence(result.event.sequence);
      }
      onActionResult?.(result);
    };

    const actions = createApplicationActions(this.timelineDoc, handleActionResult);

    const replayCommands: ReplayCommandCallbacks = {
      selectFloor: (ordinal) => this.selectFloor(ordinal),
      selectSequence: (seq) => this.selectSequence(seq),
      stepPrevious: () => {
        const snap = this.getSnapshot();
        if (snap.replayPresentation.position.previousSequence !== null) {
          this.selectSequence(snap.replayPresentation.position.previousSequence);
        }
      },
      stepNext: () => {
        const snap = this.getSnapshot();
        if (snap.replayPresentation.position.nextSequence !== null) {
          this.selectSequence(snap.replayPresentation.position.nextSequence);
        }
      },
      returnToLive: () => this.returnToLive(),
      setLiveMode: (live) => this.setLiveMode(live),
    };

    return {
      selectFloor: (ordinal) => this.selectFloor(ordinal),
      selectSequence: (seq) => this.selectSequence(seq),
      stepPrevious: () => replayCommands.stepPrevious(),
      stepNext: () => replayCommands.stepNext(),
      returnToLive: () => this.returnToLive(),
      setLiveMode: (live) => this.setLiveMode(live),
      updateTimeline: (doc) => this.updateTimeline(doc),
      resetTimeline: () => this.resetTimeline(),
      actions,
      exportJson: () => this.exportJson(),
      importJson: (text) => this.importJson(text),
      replayCommands,
    };
  }

  public getSession(onActionResult?: (result: ActionResult) => void): CrawlerSession {
    return {
      snapshot: this.getSnapshot(),
      commands: this.getCommands(onActionResult),
    };
  }
}
