"use client";
import React, { useState, useMemo, useEffect } from "react";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline";
import { projectState, projectCountdownState, projectObservations } from "../app/domain/projection";
import { getFloorEndSequence } from "../app/domain/floors";
import type {
  ProjectedObservationsState,
  ProjectedObservationValue,
  ProjectedItemObservation,
  ProjectedEquipmentObservation,
  TimelineSource,
} from "../app/domain/types";
import { TelemetryInspectorModal } from "../app/components/TelemetryInspectorModal";
import { validateCrawlerTimeline } from "../app/domain/validation";
import { checkItemRequirements, getStatBreakdown } from "../app/domain/stats";
import { LocalDeviceStorageAdapter } from "../app/domain/persistence";
import type { StatBreakdown } from "../app/domain/stats";
import type { CrawlerEvent, CrawlerState, CrawlerTimelineDocument, InventoryItem } from "../app/domain/types";
import { TimelineScrubber } from "./features/timeline/TimelineScrubber";
import { StatInspectorModal } from "../app/components/StatInspectorModal";
import { RootNavigation, type RootView } from "./shell/navigation/RootNavigation";
import { availableRootViews, resolveRootView, selectedSequenceCapabilities } from "./shell/navigation/capabilities";
import { PersistentHud } from "./shell/hud/PersistentHud";
import { QuestsView } from "./features/quests/QuestsView";
import { TimelineHistory } from "./features/timeline/history/TimelineHistory";
import { TimelineEvidence } from "./features/timeline/evidence/TimelineEvidence";
import { FloorRules } from "./features/floor/FloorRules";
import { CrawlerView } from "./features/crawler/CrawlerView";
import { RatingsView } from "./features/ratings/RatingsView";
import { NotificationsView } from "./features/notifications/NotificationsView";
import { InventoryView } from "./features/inventory/InventoryView";
import { SkillsView } from "./features/skills/SkillsView";

type View = RootView;

export default function CrawlerApp() {
  const storageAdapter = useMemo(() => new LocalDeviceStorageAdapter(), []);

  // Hydrate persisted timeline from device local storage on initial state creation
  const [timelineDoc, setTimelineDoc] = useState<CrawlerTimelineDocument>(() => {
    if (typeof window !== 'undefined') {
      const adapter = new LocalDeviceStorageAdapter();
      const loaded = adapter.loadTimeline();
      if (loaded) return loaded;
    }
    return compiledTimeline;
  });

  const updateTimeline = (newDoc: CrawlerTimelineDocument) => {
    setTimelineDoc(newDoc);
    storageAdapter.saveTimeline(newDoc);
  };

  const events: CrawlerEvent[] = timelineDoc.events as unknown as CrawlerEvent[];

  const maxSeq = events[events.length - 1]?.sequence ?? 1;

  const latestFloor = useMemo(() => {
    return events[events.length - 1]?.position?.floor ?? timelineDoc.floors?.slice(-1)[0]?.ordinal ?? 1;
  }, [events, timelineDoc]);

  const defaultFloor = timelineDoc.floors?.slice(-1)[0]?.ordinal ?? latestFloor;
  const [selectedFloorOrdinal, setSelectedFloorOrdinal] = useState<number | 'all'>(defaultFloor);

  const [isLive, setIsLive] = useState<boolean>(true);
  const [selectedSeq, setSelectedSeq] = useState<number>(maxSeq);

  const handleReturnToLive = () => {
    setIsLive(true);
    setSelectedSeq(maxSeq);
    setSelectedFloorOrdinal(latestFloor);
  };

  const [view, setView] = useState<View>("crawler");
  const [time, setTime] = useState<number>(4 * 3600 + 17 * 60 + 32);

  const [inspectStat, setInspectStat] = useState<string | null>(null);
  const [inspectObservation, setInspectObservation] = useState<
    ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null
  >(null);
  const [provenanceItem, setProvenanceItem] = useState<InventoryItem | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);

  const [showFloorRules, setShowFloorRules] = useState<boolean>(false);
  const [showTimelineHistory, setShowTimelineHistory] = useState<boolean>(false);
  const [showTimelineEvidence, setShowTimelineEvidence] = useState<boolean>(false);

  // Navigation context state for equipment/inventory deep-linking
  const [inventoryFilter, setInventoryFilter] = useState<string>("ALL ITEMS");
  const [equipmentSlot, setEquipmentSlot] = useState<string>("TORSO");

  // Toast feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Floor collapse countdown timer
  useEffect(() => {
    const timer = setInterval(() => setTime((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentSeq = isLive ? maxSeq : selectedSeq;

  const projectedState: CrawlerState = useMemo(() => {
    return projectState(timelineDoc, currentSeq);
  }, [timelineDoc, currentSeq]);

  const projectedObservations: ProjectedObservationsState = useMemo(() => {
    return projectObservations(timelineDoc, currentSeq);
  }, [timelineDoc, currentSeq]);

  const capabilities = useMemo(() => selectedSequenceCapabilities(projectedState, projectedObservations, events, currentSeq), [projectedState, projectedObservations, events, currentSeq]);
  const resolvedView = resolveRootView(view, capabilities);

  const liveState: CrawlerState = useMemo(() => {
    return projectState(timelineDoc, maxSeq);
  }, [timelineDoc, maxSeq]);

  const statBreakdown: StatBreakdown | null = useMemo(() => {
    if (!inspectStat) return null;
    return getStatBreakdown(projectedState, inspectStat);
  }, [projectedState, inspectStat]);

  const h = String(Math.floor(time / 3600)).padStart(2, "0");
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");

  const currentFloorSegment = useMemo(() => {
    if (selectedFloorOrdinal === 'all') return null;
    return timelineDoc.floors?.find((f) => f.ordinal === selectedFloorOrdinal);
  }, [timelineDoc, selectedFloorOrdinal]);

  const activeCountdown = useMemo(() => {
    return projectCountdownState(timelineDoc, currentSeq, selectedFloorOrdinal);
  }, [timelineDoc, currentSeq, selectedFloorOrdinal]);

  // Persistent HUD chrome must use the same point-in-time telemetry as the
  // detailed views; otherwise a scrubbed replay presents conflicting values.
  const hudLevel = projectedObservations.xpProgress.level?.value ?? projectedState.crawler.level;
  const hudHealth = projectedObservations.condition.currentHealth?.value ?? projectedState.crawler.condition.currentHealth;
  const hudMaxHealth = projectedObservations.condition.maxHealth?.value ?? projectedState.crawler.condition.maxHealth;
  const hudMana = projectedObservations.condition.currentMana?.value ?? projectedState.crawler.condition.currentMana;
  const hudMaxMana = projectedObservations.condition.maxMana?.value ?? projectedState.crawler.condition.maxMana;
  const hudViewers = projectedObservations.broadcast.viewers?.value ?? projectedState.broadcast.viewers;

  const floorHudTitle = currentFloorSegment
    ? `FLOOR ${currentFloorSegment.ordinal}: ${currentFloorSegment.title}`
    : selectedFloorOrdinal === 'all'
    ? 'ALL FLOORS (WHOLE STORY)'
    : `FLOOR ${selectedFloorOrdinal}`;

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(timelineDoc, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `crawler-timeline-v2-seq-${projectedState.sequence}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(jsonText) as CrawlerTimelineDocument;
      const validation = validateCrawlerTimeline(parsed);
      if (validation.valid) {
        updateTimeline(parsed);
        setIsLive(true);
        const importedEvents = parsed.events || [];
        const lastSeq = importedEvents.slice(-1)[0]?.sequence ?? 1;
        const importedFloor = importedEvents.slice(-1)[0]?.position?.floor ?? parsed.floors?.slice(-1)[0]?.ordinal ?? 1;
        setSelectedSeq(lastSeq);
        setSelectedFloorOrdinal(importedFloor);
        setShowJsonModal(false);
        showToast("✓ Imported timeline successfully");
      } else {
        setImportError(validation.errors.join("\n"));
      }
    } catch (e: unknown) {
      const err = e as Error;
      setImportError(`JSON syntax error: ${err.message}`);
    }
  };

  const handleResetToDefaultFixture = () => {
    storageAdapter.clearTimeline();
    setTimelineDoc(compiledTimeline);
    const compiledEvents = compiledTimeline.events || [];
    const lastSeq = compiledEvents.slice(-1)[0]?.sequence ?? 1;
    const defaultFloorOrdinal = compiledEvents.slice(-1)[0]?.position?.floor ?? compiledTimeline.floors?.slice(-1)[0]?.ordinal ?? 1;
    setSelectedSeq(lastSeq);
    setSelectedFloorOrdinal(defaultFloorOrdinal);
    setIsLive(true);
    setShowJsonModal(false);
    showToast("🔄 Reset timeline to default fixture");
  };

  const handleSelectFloorOrdinal = (ordinal: number | 'all') => {
    setSelectedFloorOrdinal(ordinal);
    if (ordinal !== 'all') {
      const floorSeg = timelineDoc.floors?.find((f) => f.ordinal === ordinal);
      if (floorSeg) {
        const floorEndSequence = getFloorEndSequence(timelineDoc.events, ordinal, floorSeg.endSequence);
        setSelectedSeq(floorEndSequence);
        setIsLive(floorEndSequence === maxSeq);
      }
    }
  };

  const handleEmitEvent = (eventData: Partial<CrawlerEvent>) => {
    if (eventData.type === 'ItemEquipped') {
      const liveState = projectState(timelineDoc, maxSeq);
      const item = liveState.inventory.find((candidate) => candidate.instanceId === eventData.itemInstanceId);
      if (!item || !checkItemRequirements(liveState.crawler, item.requirements).met) {
        showToast("⚠️ Cannot equip: Requirements not met!");
        return;
      }
    }

    const nextSeq = maxSeq + 1;
    const summaryText = eventData.summary || `Recorded ${eventData.type}`;
    const newEvent: CrawlerEvent = {
      id: `evt-user-${Date.now()}`,
      sequence: nextSeq,
      occurred_at: projectedState.occurredAt,
      type: eventData.type || 'ItemEquipped',
      summary: summaryText,
      category: eventData.category || 'system',
      position: { floor: latestFloor, elapsedSeconds: 0 },
      evidence: [{ sourceId: 'src-wda-system-log', confidence: 'confirmed' }],
      ...eventData,
    } as CrawlerEvent;

    const updatedDoc = {
      ...timelineDoc,
      events: [...timelineDoc.events, newEvent],
      floors: timelineDoc.floors?.map((floor) =>
        floor.ordinal === latestFloor
          ? { ...floor, endSequence: Math.max(floor.endSequence, nextSeq) }
          : floor
      ),
    };

    updateTimeline(updatedDoc as CrawlerTimelineDocument);
    setSelectedSeq(nextSeq);
    setIsLive(true);
    showToast(`⚡ ${summaryText}`);
  };



  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
        return;
      }

      if (e.key === "Escape") {
        if (inspectStat) setInspectStat(null);
        else if (provenanceItem) setProvenanceItem(null);
        else if (showJsonModal) setShowJsonModal(false);
        return;
      }

      const destination = availableRootViews(capabilities)[Number(e.key) - 1];
      if (destination) setView(destination);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectStat, provenanceItem, showJsonModal, capabilities]);

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
        fallbackCountdown={`${h}:${m}:${s}`}
        isLive={isLive}
        sequence={projectedState.sequence}
        occurredAt={projectedState.occurredAt}
        hotlist={projectedState.hotlist}
        skills={projectedState.skills}
        onReturnToLive={handleReturnToLive}
      />

      <RootNavigation
        active={resolvedView}
        set={setView}
        capabilities={capabilities}
        onOpenTools={() => { setImportError(null); setJsonText(""); setShowJsonModal(true); }}
      />

      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}



      <div className="view">
        <TimelineScrubber
          events={events}
          floors={timelineDoc.floors}
          countdowns={timelineDoc.countdowns}
          observations={timelineDoc.observations}
          sources={timelineDoc.sources as TimelineSource[]}
          projectedObservations={projectedObservations}
          selectedFloorOrdinal={selectedFloorOrdinal}
          onSelectFloorOrdinal={handleSelectFloorOrdinal}
          selectedSequence={isLive ? maxSeq : selectedSeq}
          onSelectSequence={(seq) => {
            setSelectedSeq(seq);
            setIsLive(seq === maxSeq);
          }}
          isLive={isLive}
          onToggleLive={() => {
            if (!isLive) {
              handleReturnToLive();
            } else {
              setIsLive(false);
            }
          }}
          onInspectObservation={(obs) => setInspectObservation(obs)}
          onOpenFloorRules={() => setShowFloorRules(true)}
          onOpenTimelineHistory={() => setShowTimelineHistory(true)}
          onOpenTimelineEvidence={() => setShowTimelineEvidence(true)}
        />

        {resolvedView === "crawler" ? (
          <CrawlerView
            state={projectedState}
            observations={projectedObservations}
            onInspectStat={(stat) => setInspectStat(stat)}
            onInspectObservation={(obs) => setInspectObservation(obs)}
            onEmitEvent={handleEmitEvent}
          />
        ) : resolvedView === "ratings" ? (
          <RatingsView observations={projectedObservations.broadcast} isLive={isLive} sequence={currentSeq} onInspectObservation={(obs) => setInspectObservation(obs)} />
        ) : resolvedView === "notifications" ? (
          <NotificationsView events={events} sequence={currentSeq} onNavigateToSequence={(seq) => { setSelectedSeq(seq); setIsLive(seq === maxSeq); }} />
        ) : resolvedView === "inventory" ? (
          <InventoryView
            state={projectedState}
            liveState={liveState}
            observations={projectedObservations}
            sources={timelineDoc.sources as TimelineSource[]}
            events={events}
            provenanceItem={provenanceItem}
            setProvenanceItem={setProvenanceItem}
            filter={inventoryFilter}
            setFilter={setInventoryFilter}
            slot={equipmentSlot}
            setSlot={setEquipmentSlot}
            onNavigateToSequence={(seq) => {
              setSelectedSeq(seq);
              setIsLive(seq === maxSeq);
            }}
            onEmitEvent={handleEmitEvent}
            onInspectObservation={(obs) => setInspectObservation(obs)}
          />
        ) : resolvedView === "skills" ? (
          <SkillsView state={projectedState} onEmitEvent={handleEmitEvent} />
        ) : resolvedView === "quests" ? (
          <QuestsView quests={projectedState.quests} />
        ) : null}
      </div>

      {showFloorRules && (
        <FloorRules
          events={events}
          sequence={currentSeq}
          selectedFloorOrdinal={selectedFloorOrdinal}
          sources={timelineDoc.sources as TimelineSource[]}
          onNavigateToSequence={(seq) => {
            setSelectedSeq(seq);
            setIsLive(seq === maxSeq);
          }}
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
          sources={timelineDoc.sources as TimelineSource[]}
          onNavigateToSequence={(seq) => {
            setSelectedSeq(seq);
            setIsLive(seq === maxSeq);
          }}
          onClose={() => setShowTimelineHistory(false)}
          isModal
        />
      )}

      {showTimelineEvidence && (
        <TimelineEvidence
          observations={projectedObservations}
          sequence={currentSeq}
          sources={timelineDoc.sources as TimelineSource[]}
          onInspectObservation={(obs) => setInspectObservation(obs)}
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
          sources={timelineDoc.sources as TimelineSource[]}
          onClose={() => setInspectObservation(null)}
        />
      )}

      {showJsonModal && (
        <div className="modal-backdrop" onClick={() => setShowJsonModal(false)}>
          <div className="modal-content panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">PORTABLE CRAWLER TIMELINE (V1/V2)</p>
                <h2>IMPORT / EXPORT CRAWLER TIMELINE</h2>
              </div>
              <button className="close-btn" onClick={() => setShowJsonModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "11px", color: "#a4b7bf" }}>
              Export current versioned crawler-timeline JSON document or import a validated timeline envelope.
            </p>
            <div className="actions" style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={handleExportJson}>DOWNLOAD TIMELINE JSON</button>
              <button
                style={{ background: "#2a1518", borderColor: "#7a2a30", color: "#ff8a90" }}
                onClick={handleResetToDefaultFixture}
              >
                RESET TO DEFAULT FIXTURE 🔄
              </button>
            </div>

            {importError && (
              <div
                className="import-error-box"
                style={{
                  background: "#2a0808",
                  border: "1px solid #e53935",
                  color: "#ff8a80",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  marginBottom: "12px",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              >
                <strong>VALIDATION FAILED:</strong>
                {"\n" + importError}
              </div>
            )}

            <textarea
              rows={8}
              style={{
                width: "100%",
                background: "#060e15",
                color: "#9be2f3",
                border: "1px solid #1f3e4d",
                fontSize: "10px",
                padding: "8px",
                fontFamily: "monospace",
              }}
              placeholder="Paste crawler-timeline document JSON here to import..."
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setImportError(null);
              }}
            />
            <div className="modal-footer" style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              <button className="outline" onClick={handleImportJson}>IMPORT TIMELINE ENVELOPE</button>
              <button className="outline" onClick={() => setShowJsonModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
