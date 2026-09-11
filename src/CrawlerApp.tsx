"use client";
import { useEffect } from "react";
import { StatInspectorModal } from "./features/crawler/stats/StatInspectorModal";
import { FloorRules } from "./features/floor/FloorRules";
import { TimelineEvidence } from "./features/timeline/evidence/TimelineEvidence";
import { TelemetryInspectorModal } from "./features/timeline/evidence/TelemetryInspectorModal";
import { TimelineHistory } from "./features/timeline/history/TimelineHistory";
import { ActiveFeatureView } from "./shell/ActiveFeatureView";
import { PersistentHud } from "./shell/hud/PersistentHud";
import { ConceptHud } from "./shell/hud/ConceptHud";
import { availableRootViews } from "./shell/navigation/capabilities";
import { RootNavigation } from "./shell/navigation/RootNavigation";
import { ReplaySurface } from "./shell/replay/ReplaySurface";
import { TimelineToolsModal } from "./shell/tools/TimelineToolsModal";

import { useCallback, useMemo, useState } from "react";
import { getStatBreakdown, type StatBreakdown } from "../app/domain/stats";
import type {
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../app/domain/types";
import { resolveHudPresentation, type HudPersistence, type HudPresentation } from "./shell/hud/hud-presentation";
import { resolveRootView } from "./shell/navigation/capabilities";
import type { RootView } from "./shell/navigation/navigation-model";
import type { EquipmentSlot } from "./application/crawler-action-contracts";
import { useCrawlerSession } from "./application/useCrawlerSession";
import { LocalDeviceStorageAdapter } from "../app/domain/persistence";

export interface CrawlerAppProps {
  hudPresentation?: HudPresentation;
  hudPersistence?: HudPersistence;
}

export default function CrawlerApp({
  hudPresentation = "production",
  hudPersistence = "normal",
}: CrawlerAppProps = {}) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleActionResult = useCallback((result: { ok: boolean; message?: string; error?: string }) => {
    if (!result.ok) {
      setToastMessage(`⚠️ ${result.error}`);
    } else if (result.message) {
      setToastMessage(`⚡ ${result.message}`);
    }
  }, []);

  const storageAdapter = useMemo(
    () => (hudPersistence === "normal" ? new LocalDeviceStorageAdapter() : null),
    [hudPersistence],
  );

  const { snapshot, commands } = useCrawlerSession({
    storageAdapter,
    onActionResult: handleActionResult,
  });

  const {
    events,
    sources,
    selectedFloorOrdinal,
    currentSeq,
    isLive,
    projectedState,
    projectedObservations,
    liveState,
    capabilities,
    activeCountdown,
    replayPresentation,
    floorHudTitle,
  } = snapshot;

  const [presentationState, setPresentationState] = useState<{
    choice: HudPresentation;
    prop: HudPresentation;
  }>(() => {
    let initialChoice = hudPresentation;
    if (typeof window !== "undefined") {
      const urlChoice = new URLSearchParams(window.location.search).get("hud");
      if (urlChoice) initialChoice = resolveHudPresentation(urlChoice);
    }
    return { choice: initialChoice, prop: hudPresentation };
  });

  const presentationChoice =
    presentationState.prop !== hudPresentation
      ? hudPresentation
      : presentationState.choice;

  const setPresentationChoice = useCallback((choice: HudPresentation) => {
    setPresentationState({ choice, prop: hudPresentation });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (choice === "production") {
        url.searchParams.delete("hud");
      } else {
        url.searchParams.set("hud", choice);
      }
      window.history.replaceState(null, "", url);
    }
  }, [hudPresentation]);

  const [view, setView] = useState<RootView>("crawler");
  const resolvedView = resolveRootView(view, capabilities);

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

  const statBreakdown: StatBreakdown | null = useMemo(
    () => (inspectStat ? getStatBreakdown(projectedState, inspectStat) : null),
    [projectedState, inspectStat],
  );

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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

  const usesConceptHud = presentationChoice !== "production";

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

  const handleExportJson = useCallback(() => {
    commands.exportJson();
  }, [commands]);

  const handleImportJson = useCallback(() => {
    setImportError(null);
    const result = commands.importJson(jsonText);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setShowJsonModal(false);
    setToastMessage("✓ Imported timeline successfully");
  }, [commands, jsonText]);

  const handleReset = useCallback(() => {
    commands.resetTimeline();
    setShowJsonModal(false);
    setToastMessage("🔄 Reset timeline to default fixture");
  }, [commands]);

  const openTools = useCallback(() => {
    setImportError(null);
    setJsonText("");
    setShowJsonModal(true);
  }, []);

  const replayCommandsWithInspect = useMemo(
    () => ({
      ...commands.replayCommands,
      openFloorRules: () => setShowFloorRules(true),
      openTimelineHistory: () => setShowTimelineHistory(true),
      openTimelineEvidence: () => setShowTimelineEvidence(true),
      inspectObservation: setInspectObservation,
    }),
    [commands.replayCommands],
  );

  const mainContent = (
    <main data-mode={isLive ? "live" : "replay"} data-presentation={presentationChoice} data-concept={presentationChoice}>
      {usesConceptHud ? (
        <ConceptHud
          state={projectedState}
          observations={projectedObservations}
          countdown={activeCountdown}
          floorTitle={floorHudTitle}
          isLive={isLive}
          onReturnToLive={commands.returnToLive}
          onInspectObservation={setInspectObservation}
          onNavigateToSequence={commands.selectSequence}
        />
      ) : (
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
          onReturnToLive={commands.returnToLive}
        />
      )}
      <RootNavigation
        active={resolvedView}
        set={setView}
        capabilities={capabilities}
        onOpenTools={openTools}
      />
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
      <div className="view">
        <ReplaySurface
          model={replayPresentation}
          commands={replayCommandsWithInspect}
          projectedObservations={projectedObservations}
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
          onNavigateToSequence={commands.selectSequence}
          actions={commands.actions}
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
          onNavigateToSequence={commands.selectSequence}
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
          onNavigateToSequence={commands.selectSequence}
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
          presentationChoice={presentationChoice}
          onJsonTextChange={setJsonText}
          onSelectPresentation={setPresentationChoice}
          onImport={handleImportJson}
          onExport={handleExportJson}
          onReset={handleReset}
          onClose={() => setShowJsonModal(false)}
        />
      )}
    </main>
  );

  if (usesConceptHud) {
    return (
      <div
        className="concept-lab concept-hud-wrapper"
        data-concept={presentationChoice}
        data-hud-presentation={presentationChoice}
      >
        {mainContent}
      </div>
    );
  }

  return mainContent;
}
