"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { compiledTimeline } from "../../../app/domain/fixtures/compiled-timeline";
import { getFloorEndSequence } from "../../../app/domain/floors";
import { LocalDeviceStorageAdapter } from "../../../app/domain/persistence";
import {
  projectCountdownState,
  projectObservations,
  projectState,
} from "../../../app/domain/projection";
import { getStatBreakdown } from "../../../app/domain/stats";
import type {
  CrawlerEvent,
  CrawlerState,
  CrawlerTimelineDocument,
  FloorSegment,
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
  TimelineSource,
} from "../../../app/domain/types";
import { validateCrawlerTimeline } from "../../../app/domain/validation";
import { evaluateCanonCapabilities } from "../../application/capabilities";
import type { ActionResult, EquipmentSlot } from "../../application/crawler-action-contracts";
import { createApplicationActions } from "../../application/crawler-actions";
import type {
  CrawlerSession,
  CrawlerSessionCommands,
  CrawlerSessionSnapshot,
  PresentationChoice,
} from "./crawler-session";
import type { HudPersistence } from "../hud/hud-presentation";
import { resolveRootView } from "../navigation/capabilities";
import type { RootView } from "../navigation/navigation-model";
import {
  deriveReplayPresentation,
  type ReplayCommandCallbacks,
} from "../../features/timeline/public";

export interface UseCrawlerSessionOptions {
  initialPresentationChoice?: PresentationChoice;
  hudPersistence?: HudPersistence;
}

export function useCrawlerSession(options: UseCrawlerSessionOptions = {}): CrawlerSession {
  const { initialPresentationChoice = "production", hudPersistence = "normal" } = options;
  const [presentationChoice, setPresentationChoice] = useState<PresentationChoice>(initialPresentationChoice);

  const hasDevicePersistence = hudPersistence === "normal";
  const storageAdapter = useMemo(
    () => (hasDevicePersistence ? new LocalDeviceStorageAdapter() : null),
    [hasDevicePersistence],
  );

  const [timelineDoc, setTimelineDoc] = useState<CrawlerTimelineDocument>(() =>
    hasDevicePersistence && typeof window !== "undefined"
      ? (new LocalDeviceStorageAdapter().loadTimeline() ?? compiledTimeline)
      : compiledTimeline,
  );

  const updateTimeline = useCallback(
    (document: CrawlerTimelineDocument) => {
      setTimelineDoc(document);
      storageAdapter?.saveTimeline(document);
    },
    [storageAdapter],
  );

  const events = useMemo(
    () => (timelineDoc.events as unknown as CrawlerEvent[]) || [],
    [timelineDoc.events],
  );
  const maxSeq = events[events.length - 1]?.sequence ?? 1;
  const latestFloor = useMemo(
    () =>
      events[events.length - 1]?.position?.floor ??
      timelineDoc.floors?.slice(-1)[0]?.ordinal ??
      1,
    [events, timelineDoc],
  );

  const [selectedFloorOrdinal, setSelectedFloorOrdinal] = useState<number | "all">(
    timelineDoc.floors?.slice(-1)[0]?.ordinal ?? latestFloor,
  );
  const [isLive, setIsLive] = useState(true);
  const [selectedSeq, setSelectedSeq] = useState(maxSeq);
  const [view, setView] = useState<RootView>("crawler");
  const [inspectStat, setInspectStat] = useState<string | null>(null);
  const [inspectObservation, setInspectObservation] = useState<
    | ProjectedObservationValue
    | ProjectedItemObservation
    | ProjectedEquipmentObservation
    | null
  >(null);
  const [provenanceItem, setProvenanceItem] = useState<InventoryItem | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showFloorRules, setShowFloorRules] = useState(false);
  const [showTimelineHistory, setShowTimelineHistory] = useState(false);
  const [showTimelineEvidence, setShowTimelineEvidence] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState("ALL ITEMS");
  const [equipmentSlot, setEquipmentSlot] = useState<EquipmentSlot>("TORSO");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const currentSeq = isLive ? maxSeq : selectedSeq;

  const projectedState: CrawlerState = useMemo(
    () => projectState(timelineDoc, currentSeq),
    [timelineDoc, currentSeq],
  );

  const projectedObservations = useMemo(
    () => projectObservations(timelineDoc, currentSeq),
    [timelineDoc, currentSeq],
  );

  const capabilities = useMemo(
    () =>
      evaluateCanonCapabilities({
        state: projectedState,
        observations: projectedObservations,
        events,
        sequence: currentSeq,
      }),
    [projectedState, projectedObservations, events, currentSeq],
  );

  const resolvedView = resolveRootView(view, capabilities);

  const liveState: CrawlerState = useMemo(
    () => projectState(timelineDoc, maxSeq),
    [timelineDoc, maxSeq],
  );

  const statBreakdown = useMemo(
    () => (inspectStat ? getStatBreakdown(projectedState, inspectStat) : null),
    [projectedState, inspectStat],
  );

  const currentFloorSegment = useMemo(
    () =>
      selectedFloorOrdinal === "all"
        ? null
        : timelineDoc.floors?.find((floor: FloorSegment) => floor.ordinal === selectedFloorOrdinal) ?? null,
    [timelineDoc, selectedFloorOrdinal],
  );

  const activeCountdown = useMemo(
    () => projectCountdownState(timelineDoc, currentSeq, selectedFloorOrdinal),
    [timelineDoc, currentSeq, selectedFloorOrdinal],
  );

  const replayPresentation = useMemo(
    () =>
      deriveReplayPresentation({
        events,
        floors: timelineDoc.floors,
        countdowns: timelineDoc.countdowns,
        observations: timelineDoc.observations,
        selectedFloorOrdinal,
        selectedSequence: currentSeq,
        isLive,
      }),
    [
      events,
      timelineDoc.floors,
      timelineDoc.countdowns,
      timelineDoc.observations,
      selectedFloorOrdinal,
      currentSeq,
      isLive,
    ],
  );

  const navigateToSequence = useCallback(
    (sequence: number) => {
      setSelectedSeq(sequence);
      setIsLive(sequence === maxSeq);
    },
    [maxSeq],
  );

  const returnToLive = useCallback(() => {
    setIsLive(true);
    setSelectedSeq(maxSeq);
    setSelectedFloorOrdinal(latestFloor);
  }, [maxSeq, latestFloor]);

  const handleSelectFloorOrdinal = useCallback(
    (ordinal: number | "all") => {
      setSelectedFloorOrdinal(ordinal);
      if (ordinal === "all") return;
      const floor = timelineDoc.floors?.find((candidate: FloorSegment) => candidate.ordinal === ordinal);
      if (!floor) return;
      const end = getFloorEndSequence(timelineDoc.events, ordinal, floor.endSequence);
      setSelectedSeq(end);
      setIsLive(end === maxSeq);
    },
    [timelineDoc.floors, timelineDoc.events, maxSeq],
  );

  const replayCommands: ReplayCommandCallbacks = useMemo(
    () => ({
      selectFloor: handleSelectFloorOrdinal,
      selectSequence: navigateToSequence,
      stepPrevious: () => {
        if (replayPresentation.position.previousSequence !== null) {
          navigateToSequence(replayPresentation.position.previousSequence);
        }
      },
      stepNext: () => {
        if (replayPresentation.position.nextSequence !== null) {
          navigateToSequence(replayPresentation.position.nextSequence);
        }
      },
      returnToLive,
      setLiveMode: (live) => {
        if (live) {
          returnToLive();
        } else {
          setIsLive(false);
        }
      },
      openFloorRules: () => setShowFloorRules(true),
      openTimelineHistory: () => setShowTimelineHistory(true),
      openTimelineEvidence: () => setShowTimelineEvidence(true),
      inspectObservation: setInspectObservation,
    }),
    [
      handleSelectFloorOrdinal,
      navigateToSequence,
      replayPresentation.position.previousSequence,
      replayPresentation.position.nextSequence,
      returnToLive,
    ],
  );

  const floorHudTitle = currentFloorSegment
    ? `FLOOR ${currentFloorSegment.ordinal}: ${currentFloorSegment.title}`
    : selectedFloorOrdinal === "all"
      ? "ALL FLOORS (WHOLE STORY)"
      : `FLOOR ${selectedFloorOrdinal}`;

  const handleActionResult = useCallback(
    (result: ActionResult) => {
      if (!result.ok) {
        setToastMessage(`⚠️ ${result.error}`);
        return;
      }
      updateTimeline(result.document);
      setSelectedSeq(result.event.sequence);
      setIsLive(true);
      setToastMessage(`⚡ ${result.message}`);
    },
    [updateTimeline],
  );

  const actions = useMemo(
    () => createApplicationActions(timelineDoc, handleActionResult),
    [timelineDoc, handleActionResult],
  );

  const handleExportJson = useCallback(() => {
    const anchor = document.createElement("a");
    anchor.href =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(timelineDoc, null, 2));
    anchor.download = `crawler-timeline-v2-seq-${projectedState.sequence}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [timelineDoc, projectedState.sequence]);

  const handleImportJson = useCallback(() => {
    setImportError(null);
    try {
      const parsed = JSON.parse(jsonText) as CrawlerTimelineDocument;
      const validation = validateCrawlerTimeline(parsed);
      if (!validation.valid) {
        setImportError(validation.errors.join("\n"));
        return;
      }
      updateTimeline(parsed);
      const importedEvents = parsed.events || [];
      const last = importedEvents.slice(-1)[0]?.sequence ?? 1;
      setSelectedSeq(last);
      setSelectedFloorOrdinal(
        importedEvents.slice(-1)[0]?.position?.floor ??
          parsed.floors?.slice(-1)[0]?.ordinal ??
          1,
      );
      setIsLive(true);
      setShowJsonModal(false);
      setToastMessage("✓ Imported timeline successfully");
    } catch (error) {
      setImportError(`JSON syntax error: ${(error as Error).message}`);
    }
  }, [jsonText, updateTimeline]);

  const handleReset = useCallback(() => {
    storageAdapter?.clearTimeline();
    setTimelineDoc(compiledTimeline);
    const compiledEvents = compiledTimeline.events || [];
    const last = compiledEvents.slice(-1)[0]?.sequence ?? 1;
    setSelectedSeq(last);
    setSelectedFloorOrdinal(
      compiledEvents.slice(-1)[0]?.position?.floor ??
        compiledTimeline.floors?.slice(-1)[0]?.ordinal ??
        1,
    );
    setIsLive(true);
    setShowJsonModal(false);
    setToastMessage("🔄 Reset timeline to default fixture");
  }, [storageAdapter]);

  const openTools = useCallback(() => {
    setImportError(null);
    setJsonText("");
    setShowJsonModal(true);
  }, []);

  const closeTools = useCallback(() => {
    setShowJsonModal(false);
  }, []);

  const sources = useMemo(
    () => (timelineDoc.sources as TimelineSource[]) || [],
    [timelineDoc.sources],
  );

  const snapshot: CrawlerSessionSnapshot = useMemo(
    () => ({
      timelineDoc,
      events,
      sources,
      maxSeq,
      latestFloor,
      selectedFloorOrdinal,
      selectedSeq,
      currentSeq,
      isLive,
      projectedState,
      projectedObservations,
      liveState,
      capabilities,
      resolvedView,
      view,
      statBreakdown,
      currentFloorSegment,
      activeCountdown,
      replayPresentation,
      floorHudTitle,
      presentationChoice,
      hudPersistence,
      inspectStat,
      inspectObservation,
      provenanceItem,
      showJsonModal,
      jsonText,
      importError,
      showFloorRules,
      showTimelineHistory,
      showTimelineEvidence,
      inventoryFilter,
      equipmentSlot,
      toastMessage,
    }),
    [
      timelineDoc,
      events,
      sources,
      maxSeq,
      latestFloor,
      selectedFloorOrdinal,
      selectedSeq,
      currentSeq,
      isLive,
      projectedState,
      projectedObservations,
      liveState,
      capabilities,
      resolvedView,
      view,
      statBreakdown,
      currentFloorSegment,
      activeCountdown,
      replayPresentation,
      floorHudTitle,
      presentationChoice,
      hudPersistence,
      inspectStat,
      inspectObservation,
      provenanceItem,
      showJsonModal,
      jsonText,
      importError,
      showFloorRules,
      showTimelineHistory,
      showTimelineEvidence,
      inventoryFilter,
      equipmentSlot,
      toastMessage,
    ],
  );

  const commands: CrawlerSessionCommands = useMemo(
    () => ({
      selectFloor: handleSelectFloorOrdinal,
      selectSequence: navigateToSequence,
      stepPrevious: replayCommands.stepPrevious,
      stepNext: replayCommands.stepNext,
      returnToLive,
      setLiveMode: replayCommands.setLiveMode,
      setView,
      setPresentationChoice,
      setInspectStat,
      setInspectObservation,
      setProvenanceItem,
      setShowJsonModal,
      setJsonText,
      setImportError,
      setShowFloorRules,
      setShowTimelineHistory,
      setShowTimelineEvidence,
      setInventoryFilter,
      setEquipmentSlot,
      setToastMessage,
      actions,
      exportJson: handleExportJson,
      importJson: handleImportJson,
      resetTimeline: handleReset,
      openTools,
      closeTools,
      replayCommands,
    }),
    [
      handleSelectFloorOrdinal,
      navigateToSequence,
      returnToLive,
      actions,
      handleExportJson,
      handleImportJson,
      handleReset,
      openTools,
      closeTools,
      replayCommands,
    ],
  );

  return { snapshot, commands };
}
