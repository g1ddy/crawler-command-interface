"use client";
import { useEffect, useMemo, useState } from "react";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline";
import { getFloorEndSequence } from "../app/domain/floors";
import { LocalDeviceStorageAdapter } from "../app/domain/persistence";
import {
  projectCountdownState,
  projectObservations,
  projectState,
} from "../app/domain/projection";
import { getStatBreakdown, type StatBreakdown } from "../app/domain/stats";
import type {
  CrawlerEvent,
  CrawlerState,
  CrawlerTimelineDocument,
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
  TimelineSource,
} from "../app/domain/types";
import { validateCrawlerTimeline } from "../app/domain/validation";
import { StatInspectorModal } from "./features/crawler/stats/StatInspectorModal";
import { FloorRules } from "./features/floor/FloorRules";
import { TimelineEvidence } from "./features/timeline/evidence/TimelineEvidence";
import { TelemetryInspectorModal } from "./features/timeline/evidence/TelemetryInspectorModal";
import { TimelineHistory } from "./features/timeline/history/TimelineHistory";
import { ActiveFeatureView } from "./shell/ActiveFeatureView";
import { PersistentHud } from "./shell/hud/PersistentHud";
import {
  availableRootViews,
  resolveRootView,
  selectedSequenceCapabilities,
} from "./shell/navigation/capabilities";
import { RootNavigation } from "./shell/navigation/RootNavigation";
import type { RootView } from "./shell/navigation/navigation-model";
import { ReplaySurface } from "./shell/replay/ReplaySurface";
import { TimelineToolsModal } from "./shell/tools/TimelineToolsModal";
import { createApplicationActions, type ActionResult } from "./application/crawler-actions";

export default function CrawlerApp() {
  const storageAdapter = useMemo(() => new LocalDeviceStorageAdapter(), []);
  const [timelineDoc, setTimelineDoc] = useState<CrawlerTimelineDocument>(() =>
    typeof window !== "undefined"
      ? (new LocalDeviceStorageAdapter().loadTimeline() ?? compiledTimeline)
      : compiledTimeline,
  );
  const updateTimeline = (document: CrawlerTimelineDocument) => {
    setTimelineDoc(document);
    storageAdapter.saveTimeline(document);
  };
  const events = timelineDoc.events as unknown as CrawlerEvent[];
  const maxSeq = events[events.length - 1]?.sequence ?? 1;
  const latestFloor = useMemo(
    () =>
      events[events.length - 1]?.position?.floor ??
      timelineDoc.floors?.slice(-1)[0]?.ordinal ??
      1,
    [events, timelineDoc],
  );
  const [selectedFloorOrdinal, setSelectedFloorOrdinal] = useState<
    number | "all"
  >(timelineDoc.floors?.slice(-1)[0]?.ordinal ?? latestFloor);
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
  const [provenanceItem, setProvenanceItem] = useState<InventoryItem | null>(
    null,
  );
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showFloorRules, setShowFloorRules] = useState(false);
  const [showTimelineHistory, setShowTimelineHistory] = useState(false);
  const [showTimelineEvidence, setShowTimelineEvidence] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState("ALL ITEMS");
  const [equipmentSlot, setEquipmentSlot] = useState("TORSO");
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
      selectedSequenceCapabilities(
        projectedState,
        projectedObservations,
        events,
        currentSeq,
      ),
    [projectedState, projectedObservations, events, currentSeq],
  );
  const resolvedView = resolveRootView(view, capabilities);
  const liveState: CrawlerState = useMemo(
    () => projectState(timelineDoc, maxSeq),
    [timelineDoc, maxSeq],
  );
  const statBreakdown: StatBreakdown | null = useMemo(
    () => (inspectStat ? getStatBreakdown(projectedState, inspectStat) : null),
    [projectedState, inspectStat],
  );
  const currentFloorSegment = useMemo(
    () =>
      selectedFloorOrdinal === "all"
        ? null
        : timelineDoc.floors?.find(
            (floor) => floor.ordinal === selectedFloorOrdinal,
          ),
    [timelineDoc, selectedFloorOrdinal],
  );
  const activeCountdown = useMemo(
    () => projectCountdownState(timelineDoc, currentSeq, selectedFloorOrdinal),
    [timelineDoc, currentSeq, selectedFloorOrdinal],
  );
  const navigateToSequence = (sequence: number) => {
    setSelectedSeq(sequence);
    setIsLive(sequence === maxSeq);
  };
  const returnToLive = () => {
    setIsLive(true);
    setSelectedSeq(maxSeq);
    setSelectedFloorOrdinal(latestFloor);
  };
  const floorHudTitle = currentFloorSegment
    ? `FLOOR ${currentFloorSegment.ordinal}: ${currentFloorSegment.title}`
    : selectedFloorOrdinal === "all"
      ? "ALL FLOORS (WHOLE STORY)"
      : `FLOOR ${selectedFloorOrdinal}`;

  const handleSelectFloorOrdinal = (ordinal: number | "all") => {
    setSelectedFloorOrdinal(ordinal);
    if (ordinal === "all") return;
    const floor = timelineDoc.floors?.find(
      (candidate) => candidate.ordinal === ordinal,
    );
    if (!floor) return;
    const end = getFloorEndSequence(
      timelineDoc.events,
      ordinal,
      floor.endSequence,
    );
    setSelectedSeq(end);
    setIsLive(end === maxSeq);
  };
  const handleActionResult = (result: ActionResult) => {
    if (!result.ok) { setToastMessage(`⚠️ ${result.error}`); return; }
    updateTimeline(result.document);
    setSelectedSeq(result.event.sequence);
    setIsLive(true);
    setToastMessage(`⚡ ${result.message}`);
  };
  const actions = createApplicationActions(timelineDoc, handleActionResult);
  const handleExportJson = () => {
    const anchor = document.createElement("a");
    anchor.href =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(timelineDoc, null, 2));
    anchor.download = `crawler-timeline-v2-seq-${projectedState.sequence}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };
  const handleImportJson = () => {
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
  };
  const handleReset = () => {
    storageAdapter.clearTimeline();
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
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (event.key === "Escape") {
        if (inspectStat) setInspectStat(null);
        else if (provenanceItem) setProvenanceItem(null);
        else if (showJsonModal) setShowJsonModal(false);
        return;
      }
      const destination =
        availableRootViews(capabilities)[Number(event.key) - 1];
      if (destination) setView(destination);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectStat, provenanceItem, showJsonModal, capabilities]);

  const hudLevel =
    projectedObservations.xpProgress.level?.value ??
    projectedState.crawler.level;
  const hudHealth =
    projectedObservations.condition.currentHealth?.value ??
    projectedState.crawler.condition.currentHealth;
  const hudMaxHealth =
    projectedObservations.condition.maxHealth?.value ??
    projectedState.crawler.condition.maxHealth;
  const hudMana =
    projectedObservations.condition.currentMana?.value ??
    projectedState.crawler.condition.currentMana;
  const hudMaxMana =
    projectedObservations.condition.maxMana?.value ??
    projectedState.crawler.condition.maxMana;
  const hudViewers =
    projectedObservations.broadcast.viewers?.value ??
    projectedState.broadcast.viewers;
  const sources = timelineDoc.sources as TimelineSource[];

  return (
    <main>
      <PersistentHud
        crawlerName={projectedState.crawler.name}
        crawlerClass={projectedState.crawler.class}
        level={hudLevel}
        health={hudHealth}
        maxHealth={hudMaxHealth}
        mana={hudMana}
        maxMana={hudMaxMana}
        viewers={hudViewers}
        floorTitle={floorHudTitle}
        countdown={activeCountdown}
        isLive={isLive}
        sequence={projectedState.sequence}
        occurredAt={projectedState.occurredAt}
        hotlist={projectedState.hotlist}
        skills={projectedState.skills}
        onReturnToLive={returnToLive}
      />
      <RootNavigation
        active={resolvedView}
        set={setView}
        capabilities={capabilities}
        onOpenTools={() => {
          setImportError(null);
          setJsonText("");
          setShowJsonModal(true);
        }}
      />
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
      <div className="view">
        <ReplaySurface
          events={events}
          floors={timelineDoc.floors}
          countdowns={timelineDoc.countdowns}
          observations={timelineDoc.observations}
          sources={sources}
          projectedObservations={projectedObservations}
          selectedFloorOrdinal={selectedFloorOrdinal}
          onSelectFloorOrdinal={handleSelectFloorOrdinal}
          selectedSequence={currentSeq}
          onSelectSequence={navigateToSequence}
          isLive={isLive}
          onToggleLive={() => (isLive ? setIsLive(false) : returnToLive())}
          onInspectObservation={setInspectObservation}
          onOpenFloorRules={() => setShowFloorRules(true)}
          onOpenTimelineHistory={() => setShowTimelineHistory(true)}
          onOpenTimelineEvidence={() => setShowTimelineEvidence(true)}
        />
        <ActiveFeatureView
          view={resolvedView}
          state={projectedState}
          liveState={liveState}
          observations={projectedObservations}
          sources={sources}
          events={events}
          sequence={currentSeq}
          isLive={isLive}
          provenanceItem={provenanceItem}
          setProvenanceItem={setProvenanceItem}
          inventoryFilter={inventoryFilter}
          setInventoryFilter={setInventoryFilter}
          equipmentSlot={equipmentSlot}
          setEquipmentSlot={setEquipmentSlot}
          onNavigateToSequence={navigateToSequence}
          actions={actions}
          onInspectObservation={setInspectObservation}
          onInspectStat={setInspectStat}
        />
      </div>
      {showFloorRules && (
        <FloorRules
          events={events}
          sequence={currentSeq}
          selectedFloorOrdinal={selectedFloorOrdinal}
          sources={sources}
          onNavigateToSequence={navigateToSequence}
          onClose={() => setShowFloorRules(false)}
          isModal
        />
      )}
      {showTimelineHistory && (
        <TimelineHistory
          events={events}
          sequence={currentSeq}
          selectedFloorOrdinal={selectedFloorOrdinal}
          recentLogs={projectedState.recentLogs}
          sources={sources}
          onNavigateToSequence={navigateToSequence}
          onClose={() => setShowTimelineHistory(false)}
          isModal
        />
      )}
      {showTimelineEvidence && (
        <TimelineEvidence
          observations={projectedObservations}
          sequence={currentSeq}
          sources={sources}
          onInspectObservation={setInspectObservation}
          onClose={() => setShowTimelineEvidence(false)}
          isModal
        />
      )}
      {statBreakdown && (
        <StatInspectorModal
          breakdown={statBreakdown}
          onClose={() => setInspectStat(null)}
        />
      )}
      {inspectObservation && (
        <TelemetryInspectorModal
          observation={inspectObservation}
          sources={sources}
          onClose={() => setInspectObservation(null)}
        />
      )}
      {showJsonModal && (
        <TimelineToolsModal
          jsonText={jsonText}
          importError={importError}
          onJsonTextChange={(value) => {
            setJsonText(value);
            setImportError(null);
          }}
          onImport={handleImportJson}
          onExport={handleExportJson}
          onReset={handleReset}
          onClose={() => setShowJsonModal(false)}
        />
      )}
    </main>
  );
}
