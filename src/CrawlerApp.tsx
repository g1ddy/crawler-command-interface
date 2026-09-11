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

import { useCrawlerSession } from "./shell/session/useCrawlerSession";
import type { PresentationChoice } from "./shell/session/crawler-session";
import type { HudPersistence } from "./shell/hud/hud-presentation";

export interface CrawlerAppProps {
  hudPresentation?: PresentationChoice;
  hudPersistence?: HudPersistence;
}

export default function CrawlerApp({
  hudPresentation = "production",
  hudPersistence = "normal",
}: CrawlerAppProps = {}) {
  const { snapshot, commands } = useCrawlerSession({
    initialPresentationChoice: hudPresentation,
    hudPersistence,
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
    resolvedView,
    statBreakdown,
    activeCountdown,
    replayPresentation,
    floorHudTitle,
    presentationChoice,
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
  } = snapshot;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (event.key === "Escape") {
        if (inspectStat) commands.setInspectStat(null);
        else if (provenanceItem) commands.setProvenanceItem(null);
        else if (showJsonModal) commands.closeTools();
        return;
      }
      const destination =
        availableRootViews(capabilities)[Number(event.key) - 1];
      if (destination) commands.setView(destination);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectStat, provenanceItem, showJsonModal, capabilities, commands]);

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

  return (
    <main data-mode={isLive ? "live" : "replay"} data-presentation={presentationChoice}>
      {usesConceptHud ? (
        <ConceptHud
          state={projectedState}
          observations={projectedObservations}
          countdown={activeCountdown}
          floorTitle={floorHudTitle}
          isLive={isLive}
          onReturnToLive={commands.returnToLive}
          onInspectObservation={commands.setInspectObservation}
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
        set={commands.setView}
        capabilities={capabilities}
        onOpenTools={commands.openTools}
      />
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
      <div className="view">
        <ReplaySurface
          model={replayPresentation}
          commands={commands.replayCommands}
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
          setProvenanceItem={commands.setProvenanceItem}
          inventoryFilter={inventoryFilter}
          setInventoryFilter={commands.setInventoryFilter}
          equipmentSlot={equipmentSlot}
          setEquipmentSlot={commands.setEquipmentSlot}
          onNavigateToSequence={commands.selectSequence}
          actions={commands.actions}
          onInspectObservation={commands.setInspectObservation}
          onInspectStat={commands.setInspectStat}
        />
      </div>
      {showFloorRules && (
        <FloorRules
          events={events}
          sequence={currentSeq}
          selectedFloorOrdinal={selectedFloorOrdinal}
          sources={sources}
          onNavigateToSequence={commands.selectSequence}
          onClose={() => commands.setShowFloorRules(false)}
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
          onClose={() => commands.setShowTimelineHistory(false)}
          isModal
        />
      )}
      {showTimelineEvidence && (
        <TimelineEvidence
          observations={projectedObservations}
          sequence={currentSeq}
          sources={sources}
          onInspectObservation={commands.setInspectObservation}
          onClose={() => commands.setShowTimelineEvidence(false)}
          isModal
        />
      )}
      {statBreakdown && (
        <StatInspectorModal
          breakdown={statBreakdown}
          onClose={() => commands.setInspectStat(null)}
        />
      )}
      {inspectObservation && (
        <TelemetryInspectorModal
          observation={inspectObservation}
          sources={sources}
          onClose={() => commands.setInspectObservation(null)}
        />
      )}
      {showJsonModal && (
        <TimelineToolsModal
          jsonText={jsonText}
          importError={importError}
          presentationChoice={presentationChoice}
          onJsonTextChange={commands.setJsonText}
          onSelectPresentation={commands.setPresentationChoice}
          onImport={commands.importJson}
          onExport={commands.exportJson}
          onReset={commands.resetTimeline}
          onClose={commands.closeTools}
        />
      )}
    </main>
  );
}
