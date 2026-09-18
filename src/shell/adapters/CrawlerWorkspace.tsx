"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActiveFeatureView } from "../ActiveFeatureView";
import { PersistentHud } from "../hud/PersistentHud";
import { ConceptHud } from "../hud/ConceptHud";
import { availableRootViews } from "../navigation/capabilities";
import { RootNavigation } from "../navigation/RootNavigation";
import { ReplaySurface } from "../replay/ReplaySurface";
import { WorkspaceOverlays } from "../overlays/WorkspaceOverlays";
import { ShellFrame } from "../ShellFrame";
import { useHudPresentation } from "./useHudPresentation";
import type { CrawlerSession } from "../../application/crawler-session";

import type {
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../../../app/domain/types";
import type { HudPresentation } from "../hud/hud-presentation";
import { resolveRootView } from "../navigation/capabilities";
import type { RootView } from "../navigation/navigation-model";
import type { EquipmentSlot } from "../../application/crawler-action-contracts";

/** Composition adapter for existing features; the replaceable frame only receives slots. */
export function CrawlerWorkspace({ session: { snapshot, commands }, hudPresentation, toastMessage, setToastMessage }: {
  session: {
    snapshot: Pick<CrawlerSession["snapshot"], "events" | "sources" | "currentSeq" | "selectedFloorOrdinal" |
      "isLive" | "projectedState" | "projectedObservations" | "liveState" | "capabilities" |
      "activeCountdown" | "replayPresentation" | "floorHudTitle">;
    commands: Pick<CrawlerSession["commands"], "selectSequence" | "returnToLive" | "replayCommands" |
      "actions" | "exportJson" | "importJson" | "resetTimeline">;
  };
  hudPresentation: HudPresentation;
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
}) {

  const {
    events,
    sources,
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

  const [presentationChoice, setPresentationChoice] = useHudPresentation(hudPresentation);

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

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage, setToastMessage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey ||
        target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (inspectStat || inspectObservation || provenanceItem || showJsonModal || showFloorRules || showTimelineHistory || showTimelineEvidence) return;
      const destination =
        availableRootViews(capabilities)[Number(event.key) - 1];
      if (destination) setView(destination);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectStat, inspectObservation, provenanceItem, showJsonModal, showFloorRules, showTimelineHistory, showTimelineEvidence, capabilities]);

  const usesConceptHud = presentationChoice !== "production";

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
  }, [commands, jsonText, setToastMessage]);

  const handleReset = useCallback(() => {
    commands.resetTimeline();
    setShowJsonModal(false);
    setToastMessage("🔄 Reset timeline to default fixture");
  }, [commands, setToastMessage]);

  const openTools = useCallback(() => {
    setImportError(null);
    setJsonText("");
    setShowJsonModal(true);
  }, []);

  const handleJsonTextChange = useCallback((value: string) => {
    setJsonText(value);
    setImportError(null);
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

  return <ShellFrame
    presentation={presentationChoice} isLive={isLive}
    hud={usesConceptHud ? (
      <ConceptHud state={projectedState} observations={projectedObservations}
        countdown={activeCountdown} floorTitle={floorHudTitle} isLive={isLive}
        onReturnToLive={commands.returnToLive} onInspectObservation={setInspectObservation}
        onNavigateToSequence={commands.selectSequence} />
    ) : (
      <PersistentHud state={projectedState} observations={projectedObservations}
        countdown={activeCountdown} floorTitle={floorHudTitle} isLive={isLive}
        onReturnToLive={commands.returnToLive} onInspectObservation={setInspectObservation}
        onNavigateToSequence={commands.selectSequence} />
    )}
    navigation={<RootNavigation active={resolvedView} set={setView}
      capabilities={capabilities} onOpenTools={openTools} />}
    replay={<ReplaySurface model={replayPresentation}
      commands={replayCommandsWithInspect} projectedObservations={projectedObservations} />}
    feedback={toastMessage && <div className="toast-notification" role="status" aria-live="polite">{toastMessage}</div>}
    overlays={<WorkspaceOverlays snapshot={snapshot} commands={commands}
      inspectStat={inspectStat} closeStat={() => setInspectStat(null)}
      inspectObservation={inspectObservation} closeObservation={() => setInspectObservation(null)}
      onInspectObservation={setInspectObservation}
      showFloorRules={showFloorRules} closeFloorRules={() => setShowFloorRules(false)}
      showTimelineHistory={showTimelineHistory} closeHistory={() => setShowTimelineHistory(false)}
      showTimelineEvidence={showTimelineEvidence} closeEvidence={() => setShowTimelineEvidence(false)}
      tools={showJsonModal ? {
        jsonText, importError, presentationChoice, onJsonTextChange: handleJsonTextChange,
        onSelectPresentation: setPresentationChoice, onImport: handleImportJson,
        onExport: handleExportJson, onReset: handleReset, onClose: () => setShowJsonModal(false),
      } : null} />}
  >
    <ActiveFeatureView view={resolvedView} state={projectedState} liveState={liveState}
      observations={projectedObservations} sources={sources} events={events} sequence={currentSeq}
      isLive={isLive} provenanceItem={provenanceItem} setProvenanceItem={setProvenanceItem}
      inventoryFilter={inventoryFilter} setInventoryFilter={setInventoryFilter}
      equipmentSlot={equipmentSlot} setEquipmentSlot={setEquipmentSlot}
      onNavigateToSequence={commands.selectSequence} actions={commands.actions}
      onInspectObservation={setInspectObservation} onInspectStat={setInspectStat} />
  </ShellFrame>;
}
