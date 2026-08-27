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
import { TelemetryBadge } from "../app/components/TelemetryBadge";
import { TelemetryInspectorModal } from "../app/components/TelemetryInspectorModal";
import { validateCrawlerTimeline } from "../app/domain/validation";
import { compareGearStats, checkItemRequirements, getStatBreakdown } from "../app/domain/stats";
import { LocalDeviceStorageAdapter } from "../app/domain/persistence";
import type { StatBreakdown } from "../app/domain/stats";
import type { CrawlerEvent, CrawlerState, CrawlerTimelineDocument, InventoryItem } from "../app/domain/types";
import { TimelineScrubber } from "../app/components/TimelineScrubber";
import { StatInspectorModal } from "../app/components/StatInspectorModal";
import { ItemProvenanceDrawer } from "../app/components/ItemProvenanceDrawer";

type View = "crawler" | "inventory" | "skills" | "journal";

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
  const [notes, setNotes] = useState<boolean>(false);

  const [inspectStat, setInspectStat] = useState<string | null>(null);
  const [inspectObservation, setInspectObservation] = useState<
    ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation | null
  >(null);
  const [provenanceItem, setProvenanceItem] = useState<InventoryItem | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);

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

  const handleNavigateToEquipmentSlot = (slot: string) => {
    setView("inventory");
    setInventoryFilter("EQUIPMENT");
    setEquipmentSlot(slot);
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
        else if (notes) setNotes(false);
        return;
      }

      if (e.key === "1") setView("crawler");
      if (e.key === "2") setView("inventory");
      if (e.key === "3") setView("skills");
      if (e.key === "4") setView("journal");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectStat, provenanceItem, showJsonModal, notes]);

  return (
    <main>
      {/* Mobile Compact Persistent HUD Header */}
      <div className="mobile-status-bar">
        <div className="mobile-crawler-info">
          <b>{projectedState.crawler.name}</b> (LVL {hudLevel} {projectedState.crawler.class})
        </div>
        <div className="mobile-meters">
          <span className="hp-mini">HP {hudHealth}/{hudMaxHealth}</span>
          <span className="mp-mini">MP {hudMana}/{hudMaxMana}</span>
        </div>
        <div className="mobile-mode">
          {isLive ? <span className="live-pill">● LIVE</span> : <span className="replay-pill">↺ SEQ #{projectedState.sequence}</span>}
        </div>
      </div>

      <div className="timer">
        <span>{floorHudTitle.toUpperCase()}</span>
        <b title={activeCountdown ? `${activeCountdown.status} · ${activeCountdown.basis}` : undefined}>
          {activeCountdown?.isStale
            ? `LATEST SOURCED COLLAPSE TIME: ${activeCountdown.formattedTime.toUpperCase()}`
            : activeCountdown?.lifecycleStatus === 'scheduled'
            ? activeCountdown.formattedTime.toUpperCase()
            : `LEVEL COLLAPSE IN ${activeCountdown ? activeCountdown.formattedTime.toUpperCase() : `${h}:${m}:${s}`}`}
        </b>
        <span>● LIVE · {hudViewers.toLocaleString()} VIEWERS</span>
      </div>

      {!isLive && (
        <div className="replay-banner">
          <span>HISTORICAL VIEW · REPLAYING SEQUENCE #{projectedState.sequence} ({projectedState.occurredAt})</span>
          <button onClick={handleReturnToLive}>RETURN TO LIVE ⚡</button>
        </div>
      )}

      <Nav active={view} set={setView} onOpenJsonModal={() => { setImportError(null); setJsonText(""); setShowJsonModal(true); }} />

      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <button className="bell" onClick={() => setNotes(!notes)} aria-label="Toggle system notices">
        ◔<b>{projectedState.recentLogs.length > 0 ? projectedState.recentLogs.length : 3}</b>
      </button>

      {notes && (
        <aside className="notices">
          <button onClick={() => setNotes(false)}>×</button>
          <p className="eyebrow">SYSTEM LOG NOTICE</p>
          {projectedState.recentLogs.slice(0, 3).map((log) => (
            <div key={log.sequence}>
              <b>[{log.timestamp}] {log.category.toUpperCase()}</b>
              <span>{log.message}</span>
              <hr />
            </div>
          ))}
        </aside>
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
        />

        {view === "crawler" ? (
          <Crawler
            state={projectedState}
            observations={projectedObservations}
            sources={timelineDoc.sources as TimelineSource[]}
            onInspectStat={(stat) => setInspectStat(stat)}
            onInspectObservation={(obs) => setInspectObservation(obs)}
            onNavigateView={(v) => setView(v)}
            onNavigateToEquipmentSlot={handleNavigateToEquipmentSlot}
            onEmitEvent={handleEmitEvent}
          />
        ) : view === "inventory" ? (
          <Inventory
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
        ) : view === "skills" ? (
          <Skills state={projectedState} onEmitEvent={handleEmitEvent} />
        ) : (
          <Journal
            state={projectedState}
            observations={projectedObservations}
            onNavigateToSequence={(seq) => {
              setSelectedSeq(seq);
              setIsLive(seq === maxSeq);
            }}
            onInspectObservation={(obs) => setInspectObservation(obs)}
          />
        )}
      </div>

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

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <article className={"panel " + className}>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function Nav({ active, set, onOpenJsonModal }: { active: View; set: (v: View) => void; onOpenJsonModal: () => void }) {
  return (
    <nav className="nav" aria-label="Main Navigation">
      <b><span>WORLD DUNGEON</span> AUTHORITY</b>
      {(["crawler", "inventory", "skills", "journal"] as View[]).map((v) => (
        <button
          key={v}
          className={active === v ? "active" : ""}
          onClick={() => set(v)}
          aria-pressed={active === v}
        >
          {v === "crawler" ? "CRAWLER" : v.toUpperCase()}
        </button>
      ))}
      <button
        style={{ marginLeft: "auto", border: "1px solid #1f4252", padding: "6px 10px" }}
        onClick={onOpenJsonModal}
        aria-label="Import/Export JSON Timeline"
      >
        ⚙ JSON
      </button>
    </nav>
  );
}

function Crawler({
  state,
  observations,
  onInspectStat,
  onInspectObservation,
  onNavigateView,
  onNavigateToEquipmentSlot,
  onEmitEvent,
}: {
  state: CrawlerState;
  observations: ProjectedObservationsState;
  sources?: TimelineSource[];
  onInspectStat: (stat: string) => void;
  onInspectObservation: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
  onNavigateView: (v: View) => void;
  onNavigateToEquipmentSlot: (slot: string) => void;
  onEmitEvent: (evt: Partial<CrawlerEvent>) => void;
}) {
  const [mode, setMode] = useState<string>("OVERVIEW");

  const c = state.crawler;
  const obsLevel = observations.xpProgress["level"];
  const obsXp = observations.xpProgress["xp"];
  const obsMaxXp = observations.xpProgress["maxXp"];

  const levelVal = obsLevel ? obsLevel.value : c.level;
  const xpVal = obsXp ? obsXp.value : c.xp;
  const maxXpVal = obsMaxXp ? obsMaxXp.value : c.maxXp;

  const xpPct = maxXpVal ? Math.min(100, Math.round(((xpVal || 0) / maxXpVal) * 100)) : 0;

  const obsHp = observations.condition["currentHealth"];
  const obsMaxHp = observations.condition["maxHealth"];
  const hpVal = obsHp ? obsHp.value : c.condition.currentHealth;
  const maxHpVal = obsMaxHp ? obsMaxHp.value : c.condition.maxHealth;
  const hpPct = maxHpVal ? Math.min(100, Math.round(((hpVal || 0) / maxHpVal) * 100)) : 0;

  const obsMp = observations.condition["currentMana"];
  const obsMaxMp = observations.condition["maxMana"];
  const mpVal = obsMp ? obsMp.value : c.condition.currentMana;
  const maxMpVal = obsMaxMp ? obsMaxMp.value : c.condition.maxMana;
  const mpPct = maxMpVal ? Math.min(100, Math.round(((mpVal || 0) / maxMpVal) * 100)) : 0;

  const obsSt = observations.condition["currentStamina"];
  const obsMaxSt = observations.condition["maxStamina"];
  const stVal = obsSt ? obsSt.value : c.condition.currentStamina;
  const maxStVal = obsMaxSt ? obsMaxSt.value : c.condition.maxStamina;
  const stPct = maxStVal ? Math.min(100, Math.round(((stVal || 0) / maxStVal) * 100)) : 0;

  const obsViewers = observations.broadcast["viewers"];
  const obsFollowers = observations.broadcast["followers"];
  const obsRank = observations.broadcast["leaderboardRank"];
  const viewersVal = obsViewers ? obsViewers.value : state.broadcast.viewers;
  const followersVal = obsFollowers ? obsFollowers.value : state.broadcast.followers;
  const fameRankVal = obsRank ? `#${obsRank.value}` : state.broadcast.fameRank;

  const equipmentSlots = new Set([...Object.keys(state.equippedSlots), ...Object.keys(observations.equipment)]);
  const equippedCount = Array.from(equipmentSlots).filter(
    (slot) => observations.equipment[slot] ? observations.equipment[slot].itemInstanceId : state.equippedSlots[slot]
  ).length;

  return (
    <section className="view-content">
      <div className="subnav">
        {["OVERVIEW", "ACHIEVEMENTS", "BROADCAST"].map((x) => (
          <button className={mode === x ? "on" : ""} key={x} onClick={() => setMode(x)}>
            {x}
          </button>
        ))}
      </div>

      {mode === "OVERVIEW" && (
        <>
          <header className="profile">
            <div className="portrait">C</div>
            <div>
              <p className="eyebrow">ACTIVE CRAWLER</p>
              <h1>{c.name}</h1>
              <i>
                LEVEL {levelVal !== undefined ? levelVal : "—"}
                <TelemetryBadge
                  observation={obsLevel}
                  causalValue={c.level}
                  onClick={() => obsLevel && onInspectObservation(obsLevel)}
                />
              </i>
              <i>RACE: {c.race || "—"}</i>
              <i>CLASS: {c.class || "—"}</i>
            </div>
            <div className="xp">
              <span>
                EXPERIENCE&nbsp;{" "}
                <b>
                  {xpVal !== undefined ? xpVal.toLocaleString() : "—"} /{" "}
                  {maxXpVal !== undefined ? maxXpVal.toLocaleString() : "—"}
                </b>
                <TelemetryBadge
                  observation={obsXp || obsMaxXp}
                  causalValue={c.xp}
                  onClick={() => (obsXp || obsMaxXp) && onInspectObservation((obsXp || obsMaxXp)!)}
                />
              </span>
              <em>
                <b style={{ width: `${xpPct}%` }} />
              </em>
            </div>
          </header>

          <div className="two-col">
            <Panel title="ATTRIBUTES · CLICK TO INSPECT PROVENANCE">
              <div className="stats">
                {[
                  ["Strength", "red"],
                  ["Dexterity", "green"],
                  ["Constitution", "yellow"],
                  ["Intelligence", "blue"],
                  ["Charisma", "purple"],
                ].map(([n, color]) => {
                  const attrName = String(n);
                  const obsAttr = observations.attributes[attrName];
                  const attrVal = obsAttr ? obsAttr.value : c.attributes[attrName as AttributeName];
                  const canAllocate = c.availableAttributePoints > 0;
                  return (
                    <div key={attrName} className="stat-row">
                      <p className="stat-clickable" onClick={() => onInspectStat(attrName)}>
                        <span>{attrName} 🔍</span>
                        <b>{attrVal !== undefined ? attrVal : "—"}</b>
                        <TelemetryBadge
                          observation={obsAttr}
                          causalValue={c.attributes[attrName as AttributeName]}
                          onClick={() => obsAttr && onInspectObservation(obsAttr)}
                        />
                        <em>
                          <i className={String(color)} style={{ width: Math.min(100, Number(attrVal || 0) * 2) + "%" }} />
                        </em>
                      </p>
                      <div className="attr-actions">
                        <button
                          className="attr-btn add"
                          disabled={!canAllocate}
                          title={canAllocate ? `Allocate +1 to ${attrName}` : "No attribute points available"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canAllocate) return;
                            onEmitEvent({
                              type: "AttributeModified",
                              attribute: attrName,
                              source: "allocation",
                              delta: 1,
                              summary: `Allocated +1 point to ${attrName}`,
                            });
                          }}
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="points-banner">
                <span>AVAILABLE POINTS</span>
                <b className={c.availableAttributePoints > 0 ? "has-points" : ""}>
                  {c.availableAttributePoints}
                </b>
                <TelemetryBadge
                  observation={observations.attributes["availableAttributePoints"]}
                  causalValue={c.availableAttributePoints}
                  onClick={() =>
                    observations.attributes["availableAttributePoints"] &&
                    onInspectObservation(observations.attributes["availableAttributePoints"])
                  }
                />
              </div>
            </Panel>

            <Panel title="CURRENT CONDITION">
              <div className="meters">
                <Meter
                  name="HEALTH"
                  value={`${hpVal !== undefined ? hpVal.toLocaleString() : "—"} / ${
                    maxHpVal !== undefined ? maxHpVal.toLocaleString() : "—"
                  }`}
                  pct={hpPct}
                  c="red"
                  observation={obsHp || obsMaxHp}
                  causalValue={c.condition.currentHealth}
                  onInspectObservation={onInspectObservation}
                />
                <Meter
                  name="MANA"
                  value={`${mpVal !== undefined ? mpVal.toLocaleString() : "—"} / ${
                    maxMpVal !== undefined ? maxMpVal.toLocaleString() : "—"
                  }`}
                  pct={mpPct}
                  c="blue"
                  observation={obsMp || obsMaxMp}
                  causalValue={c.condition.currentMana}
                  onInspectObservation={onInspectObservation}
                />
                <Meter
                  name="STAMINA"
                  value={`${stVal !== undefined ? stVal.toLocaleString() : "—"} / ${
                    maxStVal !== undefined ? maxStVal.toLocaleString() : "—"
                  }`}
                  pct={stPct}
                  c="yellow"
                  observation={obsSt || obsMaxSt}
                  causalValue={c.condition.currentStamina}
                  onInspectObservation={onInspectObservation}
                />
              </div>
              <div className="effects">
                {state.effects.length > 0 ? (
                  state.effects.map((eff) => (
                    <p key={eff.effectId} className={eff.type}>
                      {eff.icon} {eff.name} <b>{eff.durationSeconds}s</b>
                      <small>{eff.description}</small>
                    </p>
                  ))
                ) : (
                  <p className="good">NO ACTIVE STATUS EFFECTS</p>
                )}
              </div>
            </Panel>

            <Panel title="EQUIPPED GEAR">
              <div className="gear">
                <div>◉</div>
                <p>Equipped Slots: <b>{equippedCount} / 10</b></p>
                <p>Active Gear Items: <b>{equippedCount} Items</b></p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "10px 0" }}>
                  {Array.from(equipmentSlots).map((sName) => {
                    const equipmentObservation = observations.equipment[sName];
                    // An explicit null is a sourced empty-slot reading, not a
                    // missing value to be replaced with causal state.
                    const instId = equipmentObservation ? equipmentObservation.itemInstanceId : state.equippedSlots[sName];
                    const eqItem = state.inventory.find((i) => i.instanceId === instId);
                    return (
                      <button
                        key={sName}
                        style={{
                          fontSize: "9px",
                          padding: "3px 7px",
                          background: eqItem ? "#0d2633" : "#09141c",
                          border: `1px solid ${eqItem ? "#1bd9ff" : "#1a3542"}`,
                          color: eqItem ? "#7ee5ff" : "#7c97a2",
                          borderRadius: "3px",
                        }}
                        onClick={() => onNavigateToEquipmentSlot(sName)}
                        title={`Go to equipment matrix for ${sName}`}
                      >
                        {sName}: {eqItem ? eqItem.name : instId || "EMPTY"}
                        {equipmentObservation && (
                          <TelemetryBadge
                            observation={equipmentObservation}
                            onClick={() => onInspectObservation(equipmentObservation)}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => onNavigateView("inventory")}>Manage in Inventory →</button>
              </div>
            </Panel>

            <Panel title="BROADCAST STATUS">
              <div className="broadcast">
                <p>
                  <span>
                    VIEWERS
                    <TelemetryBadge
                      observation={obsViewers}
                      causalValue={state.broadcast.viewers}
                      onClick={() => obsViewers && onInspectObservation(obsViewers)}
                    />
                  </span>
                  <b>{viewersVal !== undefined ? viewersVal.toLocaleString() : "—"}</b>
                  <em>{state.broadcast.viewerDelta}</em>
                </p>
                <p>
                  <span>
                    FOLLOWERS
                    <TelemetryBadge
                      observation={obsFollowers}
                      causalValue={state.broadcast.followers}
                      onClick={() => obsFollowers && onInspectObservation(obsFollowers)}
                    />
                  </span>
                  <b>{followersVal !== undefined ? followersVal.toLocaleString() : "—"}</b>
                </p>
                <p>
                  <span>
                    FAME RANK
                    <TelemetryBadge
                      observation={obsRank}
                      causalValue={state.broadcast.fameRank}
                      onClick={() => obsRank && onInspectObservation(obsRank)}
                    />
                  </span>
                  <b>{fameRankVal}</b>
                </p>
                {state.broadcast.sponsorInterest && (
                  <p className="sponsor">● Sponsor interest detected</p>
                )}
              </div>
            </Panel>
          </div>
        </>
      )}

      {mode === "ACHIEVEMENTS" && <Achievements achievements={state.achievements} />}
      {mode === "BROADCAST" && (
        <Broadcast
          broadcast={state.broadcast}
          observations={observations.broadcast}
          logs={state.recentLogs}
          onInspectObservation={onInspectObservation}
        />
      )}
    </section>
  );
}

function Meter({
  name,
  value,
  pct,
  c,
  observation,
  causalValue,
  onInspectObservation,
}: {
  name: string;
  value: string;
  pct: number;
  c: string;
  observation?: ProjectedObservationValue | null;
  causalValue?: unknown;
  onInspectObservation?: (obs: ProjectedObservationValue) => void;
}) {
  return (
    <p className="meter">
      <span>
        {name}
        <TelemetryBadge
          observation={observation}
          causalValue={causalValue}
          onClick={() => observation && onInspectObservation?.(observation)}
        />
      </span>
      <b>{value}</b>
      <em>
        <i className={c} style={{ width: pct + "%" }} />
      </em>
    </p>
  );
}

function Inventory({
  state,
  liveState,
  observations,
  events,
  provenanceItem,
  setProvenanceItem,
  filter,
  setFilter,
  slot,
  setSlot,
  onNavigateToSequence,
  onEmitEvent,
  onInspectObservation,
}: {
  state: CrawlerState;
  liveState: CrawlerState;
  observations: ProjectedObservationsState;
  sources?: TimelineSource[];
  events: CrawlerEvent[];
  provenanceItem: InventoryItem | null;
  setProvenanceItem: (item: InventoryItem | null) => void;
  filter: string;
  setFilter: (f: string) => void;
  slot: string;
  setSlot: (s: string) => void;
  onNavigateToSequence: (seq: number) => void;
  onEmitEvent: (evt: Partial<CrawlerEvent>) => void;
  onInspectObservation: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
}) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [search, setSearch] = useState<string>("");

  const items = state.inventory;
  const filteredItems = useMemo(() => {
    const rarityRank: Record<string, number> = {
      celestial: 6,
      legendary: 5,
      epic: 4,
      rare: 3,
      uncommon: 2,
      common: 1,
    };

    const matched = items.filter((item) => {
      const matchesCategory =
        filter === "ALL ITEMS"
          ? true
          : filter === "EQUIPMENT"
          ? item.category === "EQUIPMENT" || item.category === "equipment"
          : filter === "CONSUMABLES"
          ? item.category === "CONSUMABLES" || item.category === "consumable"
          : filter === "QUEST ITEMS"
          ? item.category === "QUEST ITEMS" || item.category === "quest-item"
          : filter === "CRAFTING"
          ? item.category === "CRAFTING" || item.category === "crafting"
          : true;

      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return matched.sort((a, b) => {
      if (sortOrder === "newest") return b.acquiredAtSequence - a.acquiredAtSequence;
      if (sortOrder === "oldest") return a.acquiredAtSequence - b.acquiredAtSequence;
      if (sortOrder === "rarity") return (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0);
      if (sortOrder === "value") return b.value - a.value;
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [items, filter, search, sortOrder]);

  const selectedItem = useMemo(() => {
    if (selectedInstanceId) {
      const found = filteredItems.find((i) => i.instanceId === selectedInstanceId);
      if (found) return found;
    }
    return filteredItems[0] || items[0];
  }, [filteredItems, selectedInstanceId, items]);
  const selectedItemRequirements = useMemo(
    () => checkItemRequirements(liveState.crawler, selectedItem?.requirements),
    [liveState.crawler, selectedItem]
  );
  const selectedItemObservation = selectedItem ? observations.inventory[selectedItem.instanceId] : undefined;
  const selectedItemObservationDetails = selectedItemObservation
    ? [
        typeof selectedItemObservation.present === "boolean"
          ? selectedItemObservation.present ? "PRESENT" : "ABSENT"
          : null,
        selectedItemObservation.quantity?.known
          ? `QTY ${selectedItemObservation.quantity.value}`
          : null,
        typeof selectedItemObservation.isEquipped === "boolean"
          ? selectedItemObservation.isEquipped ? "EQUIPPED" : "UNEQUIPPED"
          : null,
      ].filter((detail): detail is string => detail !== null)
    : [];

  const categories = ["ALL ITEMS", "EQUIPMENT", "CONSUMABLES", "QUEST ITEMS", "CRAFTING"];

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">STORAGE SYSTEM</p>
          <h1>INVENTORY</h1>
        </div>
        <b>CAPACITY {items.length} / 100</b>
      </header>

      <div className="inventory">
        <Panel title="CATEGORIES">
          <div className="categories">
            {categories.map((x) => (
              <button className={filter === x ? "on" : ""} onClick={() => setFilter(x)} key={x}>
                {x}
                <b>
                  {x === "ALL ITEMS"
                    ? items.length
                    : items.filter((i) => i.category === x).length}
                </b>
              </button>
            ))}
          </div>
        </Panel>

        {filter !== "EQUIPMENT" ? (
          <>
            <Panel title={filter}>
              <div className="tools">
                <input
                  placeholder="Search items…"
                  aria-label="Search items"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  aria-label="Sort items"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    border: "1px solid #294650",
                    background: "#09141d",
                    color: "#b8ced5",
                    padding: "9px",
                    fontSize: "10px",
                    borderRadius: "3px",
                  }}
                >
                  <option value="newest">SORT: NEWEST ⌄</option>
                  <option value="oldest">SORT: OLDEST ⌄</option>
                  <option value="rarity">SORT: RARITY ⌄</option>
                  <option value="value">SORT: VALUE ⌄</option>
                  <option value="name">SORT: NAME ⌄</option>
                </select>
              </div>

              {filteredItems.length > 0 ? (
                <div className="grid">
                  {filteredItems.map((x) => {
                    const itemObs = observations.inventory[x.instanceId];
                    return (
                      <button
                        className={`item ${x.rarity} ${selectedItem?.instanceId === x.instanceId ? "selected" : ""}`}
                        key={x.instanceId}
                        onClick={() => setSelectedInstanceId(x.instanceId)}
                        aria-label={`${x.name} (${x.rarity})`}
                      >
                        <i>{x.icon}</i>
                        <b>{x.quantityObject && !x.quantityObject.known ? (x.quantityObject.minimum ? `≥${x.quantityObject.minimum}` : "?") : x.quantity}</b>
                        {itemObs && <span style={{ position: "absolute", top: "2px", right: "2px", fontSize: "9px" }}>📡</span>}
                        <small>{x.name}</small>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: "11px", color: "#8fa1aa" }}>No items match current filter.</p>
              )}
            </Panel>

            <div className="right">
              <Panel title="EQUIPPED GEAR SLOTS">
                <div className="compact">
                  HOOD <b>◉</b> VEST <b>◈</b> BOOTS <b>▰</b>
                </div>
                <button className="link" onClick={() => setFilter("EQUIPMENT")}>
                  Open equipment slot matrix →
                </button>
              </Panel>

              {selectedItem && (
                <Panel title="ITEM INSPECTOR">
                  <div className={`large-icon ${selectedItem.rarity}`}>{selectedItem.icon}</div>
                  <h2>{selectedItem.name.toUpperCase()}</h2>
                  <p className="rarity">
                    {selectedItem.rarity} {selectedItem.isEquipped ? "· EQUIPPED" : ""}
                    {observations.inventory[selectedItem.instanceId] && (
                      <TelemetryBadge
                        observation={observations.inventory[selectedItem.instanceId]}
                        onClick={() => onInspectObservation(observations.inventory[selectedItem.instanceId])}
                      />
                    )}
                  </p>
                  <p>{selectedItem.description}</p>
                  {selectedItemObservationDetails.length > 0 && (
                    <p style={{ fontSize: "10px", color: "#7ee5ff" }}>
                      OBSERVED INVENTORY STATE: {selectedItemObservationDetails.join(" · ")}
                    </p>
                  )}
                  <dl>
                    <div>
                      <dt>VALUE</dt>
                      <dd>{selectedItem.value} ⊙</dd>
                    </div>
                    <div>
                      <dt>STACK</dt>
                      <dd>
                        {selectedItem.quantityObject && !selectedItem.quantityObject.known
                          ? (selectedItem.quantityObject.minimum ? `≥${selectedItem.quantityObject.minimum} / ${selectedItem.maxStack} (Unknown)` : `Unknown / ${selectedItem.maxStack}`)
                          : `${selectedItem.quantity} / ${selectedItem.maxStack}`}
                      </dd>
                    </div>
                    <div>
                      <dt>TYPE</dt>
                      <dd>{selectedItem.category}</dd>
                    </div>
                    <div>
                      <dt>ACQUIRED</dt>
                      <dd>SEQ #{selectedItem.acquiredAtSequence}</dd>
                    </div>
                    {selectedItem.durability && (
                      <div>
                        <dt>DURABILITY</dt>
                        <dd>{selectedItem.durability.current} / {selectedItem.durability.max}</dd>
                      </div>
                    )}
                  </dl>

                  {selectedItem.stats && (
                    <div style={{ marginBottom: "12px", fontSize: "10px", color: "#6fe8f7" }}>
                      <strong>ITEM STATS:</strong>
                      {Object.entries(selectedItem.stats).map(([k, v]) => (
                        <p key={k} style={{ margin: "2px 0" }}>+ {v} {k}</p>
                      ))}
                    </div>
                  )}

                  <div className="actions" style={{ flexWrap: "wrap", gap: "6px" }}>
                    {(selectedItem.category === "CONSUMABLES" || selectedItem.category === "consumable") && (
                      <button
                        style={{ background: "#0e3a24", borderColor: "#2de079", color: "#62ef98" }}
                        onClick={() =>
                          onEmitEvent({
                            type: "ItemConsumed",
                            itemInstanceId: selectedItem.instanceId,
                            quantity: 1,
                            healthRestored: selectedItem.name.toLowerCase().includes("health") ? 500 : undefined,
                            summary: `Consumed ${selectedItem.name}`,
                          })
                        }
                      >
                        USE CONSUMABLE 🧪
                      </button>
                    )}

                    {(selectedItem.category === "EQUIPMENT" || selectedItem.category === "equipment") && (
                      <button
                        style={selectedItem.isEquipped
                          ? { background: "#2a0e12", borderColor: "#d5555e", color: "#ff8a80" }
                          : selectedItemRequirements.met
                          ? { background: "#0e3a24", borderColor: "#2de079", color: "#62ef98" }
                          : { background: "#2a1818", borderColor: "#633030", color: "#8a5858", cursor: "not-allowed" }}
                        disabled={!selectedItem.isEquipped && !selectedItemRequirements.met}
                        onClick={() => {
                          if (!selectedItem.isEquipped && !selectedItemRequirements.met) return;
                          onEmitEvent({
                            type: selectedItem.isEquipped ? "ItemUnequipped" : "ItemEquipped",
                            itemInstanceId: selectedItem.instanceId,
                            slot: selectedItem.slot || "SPECIAL",
                            summary: `${selectedItem.isEquipped ? "Unequipped" : "Equipped"} ${selectedItem.name}`,
                          });
                        }}
                      >
                        {selectedItem.isEquipped ? "UNEQUIP GEAR ✕" : "EQUIP GEAR ⚔"}
                      </button>
                    )}

                    {!selectedItem.isEquipped && !selectedItemRequirements.met && (
                      <p style={{ width: "100%", margin: 0, color: "#ff737d", fontSize: "9px" }}>
                        Requirements unmet: {selectedItemRequirements.details
                          .filter((detail) => !detail.met)
                          .map((detail) => `${detail.key} ${detail.required} (current: ${detail.current})`)
                          .join(", ")}
                      </p>
                    )}

                    <button
                      style={{ background: "#0e2330", borderColor: "#30729e", color: "#86cbff" }}
                      onClick={() =>
                        onEmitEvent({
                          type: "ItemLockToggled",
                          itemInstanceId: selectedItem.instanceId,
                          summary: `${selectedItem.isLocked ? "Unlocked" : "Locked"} ${selectedItem.name}`,
                        })
                      }
                    >
                      {selectedItem.isLocked ? "UNLOCK 🔒" : "LOCK 🔓"}
                    </button>

                    <button onClick={() => setProvenanceItem(selectedItem)}>
                      PROVENANCE LIFECYCLE 🔍
                    </button>

                    {!selectedItem.isEquipped && (
                      <button
                        style={{
                          background: selectedItem.isLocked ? "#201214" : "#2e1215",
                          borderColor: selectedItem.isLocked ? "#4d2226" : "#d14b54",
                          color: selectedItem.isLocked ? "#6e4246" : "#ff8a90",
                          cursor: selectedItem.isLocked ? "not-allowed" : "pointer",
                        }}
                        disabled={selectedItem.isLocked}
                        onClick={() =>
                          onEmitEvent({
                            type: "ItemDiscarded",
                            itemInstanceId: selectedItem.instanceId,
                            summary: `Discarded ${selectedItem.name}`,
                          })
                        }
                      >
                        DISCARD 🗑️
                      </button>
                    )}
                  </div>
                </Panel>
              )}

              {provenanceItem && (
                <ItemProvenanceDrawer
                  item={provenanceItem}
                  events={events}
                  onClose={() => setProvenanceItem(null)}
                  onNavigateToSequence={onNavigateToSequence}
                />
              )}
            </div>
          </>
        ) : (
          <EquipmentView
            state={state}
            liveState={liveState}
            observations={observations}
            slot={slot}
            setSlot={setSlot}
            onEmitEvent={onEmitEvent}
            onOpenProvenance={(item) => setProvenanceItem(item)}
            onInspectObservation={onInspectObservation}
          />
        )}
      </div>
    </section>
  );
}

function EquipmentView({
  state,
  liveState,
  observations,
  slot,
  setSlot,
  onEmitEvent,
  onOpenProvenance,
}: {
  state: CrawlerState;
  liveState: CrawlerState;
  observations: ProjectedObservationsState;
  slot: string;
  setSlot: (v: string) => void;
  onEmitEvent: (evt: Partial<CrawlerEvent>) => void;
  onOpenProvenance: (item: InventoryItem) => void;
  onInspectObservation?: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
}) {
  const slots = [
    ["HEAD", "◉", "Headgear"],
    ["FACE", "◌", "Visor/Mask"],
    ["NECK", "◇", "Amulet/Necklace"],
    ["TORSO", "◈", "Body Armor/Vest"],
    ["WRISTS", "▱", "Bracers"],
    ["RING", "💍", "Finger Ring"],
    ["WAIST", "▰", "Belt/Waistband"],
    ["LEGS", "╿", "Leg Armor"],
    ["FEET", "▰", "Footwear/Boots"],
    ["SPECIAL", "✦", "Relic/Special"],
  ];

  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    for (const item of state.inventory) {
      if (item.instanceId && !map.has(item.instanceId)) map.set(item.instanceId, item);
    }
    return map;
  }, [state.inventory]);

  const equippedInstanceId = state.equippedSlots[slot];
  const equippedItem = equippedInstanceId ? inventoryMap.get(equippedInstanceId) : undefined;

  const slotCandidates = useMemo(() => {
    return state.inventory.filter((item) => {
      const isEquipCat = item.category === "EQUIPMENT" || item.category === "equipment";
      if (!isEquipCat) return false;
      if (slot === "SPECIAL") return true;
      return item.slot === slot || !item.slot;
    });
  }, [state.inventory, slot]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const activeCandidate = useMemo(() => {
    if (selectedCandidateId) {
      const found = slotCandidates.find((c) => c.instanceId === selectedCandidateId);
      if (found) return found;
    }
    return slotCandidates.find((c) => c.instanceId !== equippedInstanceId) || slotCandidates[0] || equippedItem;
  }, [slotCandidates, selectedCandidateId, equippedInstanceId, equippedItem]);

  const reqResult = useMemo(() => {
    if (!activeCandidate) return { met: true, details: [] };
    return checkItemRequirements(liveState.crawler, activeCandidate.requirements);
  }, [liveState.crawler, activeCandidate]);

  const statDeltas = useMemo(() => {
    return compareGearStats(equippedItem, activeCandidate);
  }, [equippedItem, activeCandidate]);

  return (
    <div className="equipment-workspace">
      <Panel title="ADAPTIVE LOADOUT · PRIMAL">
        <p className="slot-note">Click a body slot to inspect equipped gear, compare inventory candidates, and evaluate stat deltas.</p>
        <div className="loadout-diagram">
          <div className="body-core">◉</div>
          {slots.map(([name, icon], i) => {
            const occupantId = state.equippedSlots[name];
            const occupant = occupantId ? inventoryMap.get(occupantId) : undefined;
            const slotObs = observations.equipment[name];
            const observedOccupant = slotObs && slotObs.itemInstanceId
              ? inventoryMap.get(slotObs.itemInstanceId)
              : undefined;
            return (
              <button
                key={name}
                className={`body-slot s${i} ${slot === name ? "selected" : ""}`}
                onClick={() => {
                  setSlot(name);
                  setSelectedCandidateId(null);
                }}
              >
                <i>{icon}</i>
                <span>
                  {name}
                  {slotObs && <span style={{ marginLeft: "4px", color: "#1bd9ff" }}>📡</span>}
                </span>
                <small>{slotObs ? (observedOccupant ? observedOccupant.name : slotObs.itemInstanceId || "— Empty Slot") : occupant ? occupant.name : "— Empty Slot"}</small>
              </button>
            );
          })}
        </div>
        <div className="slot-legend">
          <span>◉ Occupied</span>
          <span>◇ Special</span>
          <span>— Empty Slot</span>
        </div>
      </Panel>

      <div style={{ display: "grid", gap: "18px" }}>
        <Panel title={`SLOT INSPECTOR · ${slot}`}>
          {observations.equipment[slot] && (
            <p style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#7ee5ff" }}>
              SOURCED SLOT READING: {observations.equipment[slot].itemInstanceId || "EMPTY"}
              <TelemetryBadge
                observation={observations.equipment[slot]}
                onClick={() => onInspectObservation?.(observations.equipment[slot])}
              />
            </p>
          )}
          {equippedItem ? (
            <div style={{ marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid #1f3e4d" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="eyebrow">CURRENTLY EQUIPPED IN {slot}</p>
                  <h2>{equippedItem.name.toUpperCase()}</h2>
                </div>
                <button
                  style={{
                    background: "#2a0e12",
                    border: "1px solid #d5555e",
                    color: "#ff8a80",
                    fontSize: "9px",
                    padding: "6px 10px",
                  }}
                  onClick={() =>
                    onEmitEvent({
                      type: "ItemUnequipped",
                      itemInstanceId: equippedItem.instanceId,
                      slot,
                      summary: `Unequipped ${equippedItem.name} from ${slot} slot`,
                    })
                  }
                >
                  UNEQUIP ✕
                </button>
              </div>
              <p className="rarity">{equippedItem.rarity}</p>
              <p style={{ fontSize: "11px", color: "#a5b9c0" }}>{equippedItem.description}</p>
              {equippedItem.durability && (
                <p style={{ fontSize: "10px", color: "#f3cc52", marginTop: "4px" }}>
                  DURABILITY: {equippedItem.durability.current} / {equippedItem.durability.max}
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: "#7fa0ac", fontSize: "11px", marginBottom: "14px" }}>
              No gear currently equipped in {slot} slot.
            </p>
          )}

          <p className="eyebrow" style={{ marginTop: "10px" }}>
            CANDIDATE GEAR IN INVENTORY ({slotCandidates.length})
          </p>
          {slotCandidates.length > 0 ? (
            <div className="candidate-grid">
              {slotCandidates.map((cand) => (
                <button
                  key={cand.instanceId}
                  className={`candidate ${cand.rarity} ${
                    activeCandidate?.instanceId === cand.instanceId ? "selected" : ""
                  }`}
                  onClick={() => setSelectedCandidateId(cand.instanceId)}
                >
                  <i>{cand.icon}</i>
                  <span>{cand.name}</span>
                  <b>
                    {cand.isEquipped
                      ? "EQUIPPED"
                      : cand.isLocked
                      ? "🔒 LOCKED"
                      : cand.rarity.toUpperCase()}
                  </b>
                </button>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "11px", color: "#7fa0ac" }}>
              No alternative gear in inventory compatible with {slot} slot.
            </p>
          )}
        </Panel>

        {activeCandidate && (
          <Panel title={`GEAR STAT COMPARISON & DELTAS`}>
            <div className="comparison" style={{ marginBottom: "14px" }}>
              <div className="candidate-preview">
                <p className="eyebrow">EQUIPPED ({equippedItem ? slot : "NONE"})</p>
                <h2>{equippedItem ? equippedItem.name : "EMPTY"}</h2>
                <p>{equippedItem ? equippedItem.description : "No item equipped"}</p>
              </div>
              <b>➔</b>
              <div className="candidate-preview">
                <p className="eyebrow">CANDIDATE</p>
                <h2>{activeCandidate.name}</h2>
                <p>{activeCandidate.description}</p>
              </div>
            </div>

            <div style={{ background: "#08131a", padding: "12px", border: "1px solid #1d3e4c", marginBottom: "14px" }}>
              <p className="eyebrow">STAT DELTA BREAKDOWN</p>
              {statDeltas.length > 0 ? (
                <div style={{ display: "grid", gap: "6px", fontSize: "11px", marginTop: "8px" }}>
                  {statDeltas.map((d) => (
                    <div
                      key={d.statName}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        background: "#0c1b26",
                        borderLeft: `3px solid ${
                          d.delta > 0 ? "#4ee88a" : d.delta < 0 ? "#ff5868" : "#3b5866"
                        }`,
                      }}
                    >
                      <span>{d.statName}</span>
                      <span>
                        {d.equippedValue} ➔ {d.candidateValue}{" "}
                        <strong
                          style={{
                            color: d.delta > 0 ? "#4ee88a" : d.delta < 0 ? "#ff5868" : "#8fa8b2",
                            marginLeft: "6px",
                          }}
                        >
                          ({d.delta >= 0 ? `+${d.delta}` : d.delta})
                        </strong>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "10px", color: "#8fa8b2" }}>No direct stat modifiers recorded on either item.</p>
              )}
            </div>

            {/* Item Requirements */}
            <div style={{ marginBottom: "14px", fontSize: "10px", color: "#a5b9c0" }}>
              {reqResult.met ? (
                <p style={{ color: "#62ef98" }}>✓ ITEM REQUIREMENTS MET</p>
              ) : (
                <div style={{ color: "#ff737d" }}>
                  <p>❌ REQUIREMENTS UNMET:</p>
                  {reqResult.details
                    .filter((d) => !d.met)
                    .map((d) => (
                      <span key={d.key} style={{ display: "block", marginLeft: "10px" }}>
                        • Requires {d.key}: {d.required} (Current: {d.current})
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="actions" style={{ flexWrap: "wrap", gap: "6px" }}>
              {activeCandidate.instanceId !== equippedItem?.instanceId && (
                <button
                  style={{
                    background: reqResult.met ? "#0e3a24" : "#2a1818",
                    borderColor: reqResult.met ? "#2de079" : "#633030",
                    color: reqResult.met ? "#62ef98" : "#8a5858",
                    cursor: reqResult.met ? "pointer" : "not-allowed",
                  }}
                  disabled={!reqResult.met}
                  onClick={() =>
                    onEmitEvent({
                      type: "ItemEquipped",
                      itemInstanceId: activeCandidate.instanceId,
                      slot,
                      summary: `Equipped ${activeCandidate.name} to ${slot} slot`,
                    })
                  }
                >
                  EQUIP GEAR ⚔
                </button>
              )}

              {activeCandidate.durability && activeCandidate.durability.current < activeCandidate.durability.max && (
                <button
                  style={{ background: "#212d12", borderColor: "#86c934", color: "#bcf26d" }}
                  onClick={() =>
                    onEmitEvent({
                      type: "ItemRepaired",
                      itemInstanceId: activeCandidate.instanceId,
                      summary: `Repaired ${activeCandidate.name} to full durability`,
                    })
                  }
                >
                  REPAIR 🛠
                </button>
              )}

              <button
                style={{ background: "#0e2330", borderColor: "#30729e", color: "#86cbff" }}
                onClick={() =>
                  onEmitEvent({
                    type: "ItemLockToggled",
                    itemInstanceId: activeCandidate.instanceId,
                    summary: `${activeCandidate.isLocked ? "Unlocked" : "Locked"} ${activeCandidate.name}`,
                  })
                }
              >
                {activeCandidate.isLocked ? "UNLOCK 🔒" : "LOCK 🔓"}
              </button>

              <button
                style={{ background: "#0c1b26", borderColor: "#2d5266", color: "#a1d4e6" }}
                onClick={() => onOpenProvenance(activeCandidate)}
              >
                PROVENANCE 🔍
              </button>

              {!activeCandidate.isEquipped && (
                <button
                  style={{
                    background: activeCandidate.isLocked ? "#201214" : "#2e1215",
                    borderColor: activeCandidate.isLocked ? "#4d2226" : "#d14b54",
                    color: activeCandidate.isLocked ? "#6e4246" : "#ff8a90",
                    cursor: activeCandidate.isLocked ? "not-allowed" : "pointer",
                  }}
                  disabled={activeCandidate.isLocked}
                  onClick={() =>
                    onEmitEvent({
                      type: "ItemDiscarded",
                      itemInstanceId: activeCandidate.instanceId,
                      summary: `Discarded ${activeCandidate.name}`,
                    })
                  }
                >
                  DISCARD 🗑️
                </button>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Skills({
  state,
  onEmitEvent,
}: {
  state: CrawlerState;
  onEmitEvent: (evt: Partial<CrawlerEvent>) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [filter, setFilter] = useState<string>("ALL SKILLS");

  const skills = state.skills;
  const shown = useMemo(() => {
    return skills.filter((s) => {
      if (filter === "ALL SKILLS") return true;
      if (filter === "ACTIVE") return s.category !== "passive";
      if (filter === "PASSIVE") return s.category === "passive";
      return s.category.toUpperCase() === filter;
    });
  }, [skills, filter]);

  const selectedSkill = shown[selectedIdx] || shown[0] || skills[0];

  const handleAssignHotlist = (hotlistIndex: number) => {
    if (!selectedSkill) return;
    const currentHotlist = [...state.hotlist];
    currentHotlist[hotlistIndex] = selectedSkill.skillId;
    onEmitEvent({
      type: "HotlistUpdated",
      hotlist: currentHotlist,
      index: hotlistIndex,
      skillId: selectedSkill.skillId,
      summary: `Assigned ${selectedSkill.name} to hotlist slot #${hotlistIndex + 1}`,
    });
  };

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">ABILITY MANAGEMENT</p>
          <h1>SKILLS</h1>
        </div>
        <b>{skills.length} ABILITIES DISCOVERED</b>
      </header>

      <div className="skills">
        <Panel title="ABILITY TYPE">
          <div className="categories">
            {["ALL SKILLS", "ACTIVE", "PASSIVE", "COMBAT", "UTILITY"].map((x) => (
              <button className={filter === x ? "on" : ""} onClick={() => setFilter(x)} key={x}>
                {x}
                <b>{x === "ALL SKILLS" ? skills.length : 2}</b>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="SKILL LIBRARY">
          <div className="skill-list">
            {shown.map((x, idx) => (
              <button
                className={selectedSkill?.skillId === x.skillId ? "selected" : ""}
                key={x.skillId}
                onClick={() => setSelectedIdx(idx)}
              >
                <i>{x.icon}</i>
                <span>
                  <b>{x.name}</b>
                  <small>{x.description}</small>
                </span>
                <em>{x.cooldown}</em>
              </button>
            ))}
          </div>
        </Panel>

        {selectedSkill && (
          <Panel title="SKILL INSPECTOR">
            <div className="hero">{selectedSkill.icon}</div>
            <h1>{selectedSkill.name.toUpperCase()}</h1>
            <i>{selectedSkill.rank}</i>
            <i className="active-tag">{selectedSkill.category.toUpperCase()} ABILITY</i>
            <dl className="details">
              <div>
                <dt>EFFECT</dt>
                <dd>{selectedSkill.description}</dd>
              </div>
              <div>
                <dt>COOLDOWN</dt>
                <dd>{selectedSkill.cooldown}</dd>
              </div>
              {selectedSkill.cost && (
                <div>
                  <dt>RESOURCE COST</dt>
                  <dd>{selectedSkill.cost}</dd>
                </div>
              )}
            </dl>

            <div style={{ marginTop: "14px" }}>
              <p className="eyebrow">ASSIGN TO HOTLIST SLOT</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    style={{
                      padding: "5px 9px",
                      fontSize: "9px",
                      background: state.hotlist[i] === selectedSkill.skillId ? "#0e3443" : "#09141d",
                      border: `1px solid ${state.hotlist[i] === selectedSkill.skillId ? "#1bd9ff" : "#244452"}`,
                      color: state.hotlist[i] === selectedSkill.skillId ? "#1bd9ff" : "#8ca8b3",
                    }}
                    onClick={() => handleAssignHotlist(i)}
                  >
                    Slot #{i + 1}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </div>

      <Panel title="QUICK HOTLIST · CLICK TO ASSIGN SELECTED SKILL" className="hotlist">
        <div>
          {Array.from({ length: 10 }).map((_, i) => {
            const skillId = state.hotlist[i];
            const skill = skills.find((s) => s.skillId === skillId);
            const isSelectedSkillAssigned = selectedSkill && skillId === selectedSkill.skillId;
            return (
              <button
                key={i}
                className={isSelectedSkillAssigned ? "selected" : ""}
                onClick={() => handleAssignHotlist(i)}
                title={skill ? `Slot ${i + 1}: ${skill.name}` : `Slot ${i + 1}: Empty (Click to assign ${selectedSkill?.name || 'skill'})`}
              >
                <b>{i + 1}</b>
                <span>{skill ? skill.icon : "+"}</span>
                <small>{skill ? skill.name : "EMPTY"}</small>
              </button>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}

function Journal({
  state,
  observations,
  onNavigateToSequence,
  onInspectObservation,
}: {
  state: CrawlerState;
  observations?: ProjectedObservationsState;
  onNavigateToSequence: (seq: number) => void;
  onInspectObservation?: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
}) {
  const [tab, setTab] = useState<string>("ACTIVE");

  const activeQuests = useMemo(() => state.quests.filter((q) => !q.status || q.status === "active"), [state.quests]);
  const completedQuests = useMemo(() => state.quests.filter((q) => q.status === "completed"), [state.quests]);
  const failedQuests = useMemo(() => state.quests.filter((q) => q.status === "failed"), [state.quests]);

  const displayedQuests =
    tab === "ACTIVE"
      ? activeQuests
      : tab === "COMPLETED"
      ? completedQuests
      : tab === "FAILED"
      ? failedQuests
      : [];

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">OBJECTIVES & SYSTEM RECORDS</p>
          <h1>JOURNAL</h1>
        </div>
        <div className="subnav">
          {["ACTIVE", "COMPLETED", "FAILED", "FLOOR RULES", "TELEMETRY", "LOG"].map((x) => (
            <button className={tab === x ? "on" : ""} onClick={() => setTab(x)} key={x}>
              {x}
              {x === "ACTIVE" && ` (${activeQuests.length})`}
              {x === "COMPLETED" && ` (${completedQuests.length})`}
              {x === "FAILED" && ` (${failedQuests.length})`}
            </button>
          ))}
        </div>
      </header>

      {tab === "ACTIVE" || tab === "COMPLETED" || tab === "FAILED" ? (
        <div className="journal">
          <div>
            {displayedQuests.length > 0 ? (
              displayedQuests.map((q) => (
                <Quest
                  key={q.questId}
                  title={q.title}
                  urgency={q.urgency}
                  goals={q.goals}
                  rewards={q.rewards}
                  status={q.status}
                />
              ))
            ) : (
              <p style={{ fontSize: "11px", color: "#8fa1aa", padding: "12px 0" }}>
                {tab === "ACTIVE"
                  ? "No active quests."
                  : tab === "COMPLETED"
                  ? "No completed quests."
                  : "No failed quests."}
              </p>
            )}
          </div>

          <Panel title="RECENT PROGRESS & ACHIEVEMENTS">
            {[...state.achievements]
              .sort((a, b) => b.unlockedAtSequence - a.unlockedAtSequence)
              .map((ach) => (
                <div className="achievement" key={ach.achievementId}>
                  <span>{ach.icon}</span>
                  <div>
                    <p className="eyebrow">{ach.recipient ? `${ach.recipient.toUpperCase()} · ` : ""}ACHIEVEMENT UNLOCKED (SEQ #{ach.unlockedAtSequence})</p>
                    <h1>{ach.title}</h1>
                    <p>{ach.description}</p>
                    <b>{ach.rewards}</b>
                  </div>
                </div>
              ))}

            <div className="log">
              {state.recentLogs.slice(0, 5).map((l) => (
                <p
                  key={l.sequence}
                  style={{ cursor: "pointer" }}
                  onClick={() => onNavigateToSequence(l.sequence)}
                  title="Click to jump timeline sequence"
                >
                  <span>SEQ #{l.sequence}</span> {l.message}
                </p>
              ))}
            </div>
          </Panel>
        </div>
      ) : tab === "TELEMETRY" ? (
        <Panel title="POINT-IN-TIME SOURCED TELEMETRY & HUD READINGS">
          <p style={{ fontSize: "11px", color: "#8fa1aa", marginBottom: "12px" }}>
            The following Sourced Telemetry readings are projected at Sequence #{state.sequence}. Stated facts represent explicit source observations, while estimated values use bounded linear interpolation across phase boundaries.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {observations ? (
              <>
                <div style={{ background: "#06131c", border: "1px solid #1f4252", padding: "10px", borderRadius: "4px" }}>
                  <h3 style={{ fontSize: "11px", color: "#1bd9ff", margin: "0 0 8px 0" }}>CRAWLER CONDITION & ATTRIBUTES</h3>
                  {Object.keys(observations.condition).length === 0 && Object.keys(observations.attributes).length === 0 ? (
                    <p style={{ fontSize: "10px", color: "#6a8592" }}>No condition or attribute observations at this sequence.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "6px" }}>
                      {Object.entries(observations.condition).map(([k, val]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                          <span>Condition.{k}: <strong style={{ color: "#fff" }}>{val.value.toLocaleString()}</strong></span>
                          <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                        </div>
                      ))}
                      {Object.entries(observations.attributes).map(([k, val]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                          <span>Attribute.{k}: <strong style={{ color: "#fff" }}>{val.value.toLocaleString()}</strong></span>
                          <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: "#06131c", border: "1px solid #1f4252", padding: "10px", borderRadius: "4px" }}>
                  <h3 style={{ fontSize: "11px", color: "#1bd9ff", margin: "0 0 8px 0" }}>XP PROGRESS & BROADCAST METRICS</h3>
                  {Object.keys(observations.xpProgress).length === 0 && Object.keys(observations.broadcast).length === 0 ? (
                    <p style={{ fontSize: "10px", color: "#6a8592" }}>No XP or broadcast observations at this sequence.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "6px" }}>
                      {Object.entries(observations.xpProgress).map(([k, val]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                          <span>XP.{k}: <strong style={{ color: "#fff" }}>{val.value.toLocaleString()}</strong></span>
                          <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                        </div>
                      ))}
                      {Object.entries(observations.broadcast).map(([k, val]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                          <span>Broadcast.{k}: <strong style={{ color: "#fff" }}>{val.value.toLocaleString()}</strong></span>
                          <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ background: "#06131c", border: "1px solid #1f4252", padding: "10px", borderRadius: "4px", gridColumn: "1 / -1" }}>
                  <h3 style={{ fontSize: "11px", color: "#1bd9ff", margin: "0 0 8px 0" }}>OBSERVED INVENTORY & EQUIPMENT</h3>
                  {Object.keys(observations.inventory).length === 0 && Object.keys(observations.equipment).length === 0 ? (
                    <p style={{ fontSize: "10px", color: "#6a8592" }}>No inventory or equipment observations at this sequence.</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "6px" }}>
                      {Object.values(observations.inventory).map((val) => (
                        <div key={`inventory-${val.itemInstanceId}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                          <span>Inventory.{val.itemInstanceId}: <strong style={{ color: "#fff" }}>{val.present === false ? "ABSENT" : "PRESENT"}</strong></span>
                          <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                        </div>
                      ))}
                      {Object.values(observations.equipment).map((val) => (
                        <div key={`equipment-${val.slot}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", background: "#0b1c27", padding: "4px 8px" }}>
                          <span>Equipment.{val.slot}: <strong style={{ color: "#fff" }}>{val.itemInstanceId || "EMPTY"}</strong></span>
                          <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p style={{ fontSize: "11px", color: "#8fa1aa" }}>No telemetry projected.</p>
            )}
          </div>
        </Panel>
      ) : (
        <Panel title={tab === "LOG" ? "SYSTEM EVENT LOG" : "FLOOR RULES & DIRECTIVES"}>
          <div className="log">
            {tab === "LOG" ? (
              state.recentLogs.map((l) => (
                <p
                  key={l.sequence}
                  style={{ cursor: "pointer" }}
                  onClick={() => onNavigateToSequence(l.sequence)}
                >
                  <span>SEQ #{l.sequence}</span> [{l.timestamp}] {l.message}
                </p>
              ))
            ) : (
              [
                "LEVEL COLLAPSE: Remaining structures compress at zero.",
                "SAFETY ROOMS: Marked on discovered map tiles only.",
                "VIEWER EVENT: Audience favorites may receive sponsor attention.",
              ].map((x) => (
                <p key={x}>
                  <span>RULE</span> {x}
                </p>
              ))
            )}
          </div>
        </Panel>
      )}
    </section>
  );
}

function Quest({
  title,
  urgency,
  goals,
  rewards,
  status = "active",
}: {
  title: string;
  urgency: string;
  goals: string[];
  rewards: string;
  status?: string;
}) {
  return (
    <article className={`quest ${status}`}>
      <header>
        <h2>{title}</h2>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <i
            style={{
              fontStyle: "normal",
              fontSize: "9px",
              padding: "5px",
              background:
                status === "completed" ? "#133822" : status === "failed" ? "#4a1215" : "#103242",
              color:
                status === "completed" ? "#6bf1b1" : status === "failed" ? "#ff8a90" : "#86cbff",
              border: `1px solid ${
                status === "completed" ? "#288e58" : status === "failed" ? "#9e2d35" : "#1f5873"
              }`,
            }}
          >
            {status.toUpperCase()}
          </i>
          <i>{urgency}</i>
        </div>
      </header>
      <p>Dungeon conditions are unstable. Complete this before failure becomes permanent.</p>
      <ul>
        {goals.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <footer>
        REWARDS <b>{rewards}</b>
      </footer>
    </article>
  );
}

function Achievements({ achievements }: { achievements: CrawlerState["achievements"] }) {
  const sortedAchievements = [...achievements].sort(
    (a, b) => b.unlockedAtSequence - a.unlockedAtSequence
  );

  return (
    <div className="achievements">
      {sortedAchievements.map((ach) => (
        <div className="achievement" key={ach.achievementId}>
          <span>{ach.icon}</span>
          <div>
            <p className="eyebrow">{ach.recipient ? `${ach.recipient.toUpperCase()} · ` : ""}ACHIEVEMENT UNLOCKED (SEQ #{ach.unlockedAtSequence})</p>
            <h1>{ach.title}</h1>
            <p>{ach.description}</p>
            <b>{ach.rewards}</b>
          </div>
        </div>
      ))}

      <div className="award-grid">
        {["Dungeon King", "Team Player", "Monster Hunter", "Deep Runner", "First Steps", "Pyromaniac"].map(
          (x, i) => (
            <article key={x}>
              <i>{["♛", "♜", "☠", "↥", "➟", "♨"][i]}</i>
              <h2>{x}</h2>
              <p>{i % 2 === 0 ? "UNLOCKED" : "IN PROGRESS"}</p>
            </article>
          )
        )}
      </div>
    </div>
  );
}

function Broadcast({
  broadcast,
  observations,
  logs,
  onInspectObservation,
}: {
  broadcast: CrawlerState["broadcast"];
  observations: Record<string, ProjectedObservationValue>;
  logs: CrawlerState["recentLogs"];
  onInspectObservation: (obs: ProjectedObservationValue) => void;
}) {
  const viewers = observations.viewers?.value ?? broadcast.viewers;
  const followers = observations.followers?.value ?? broadcast.followers;
  const rank = observations.leaderboardRank ? `#${observations.leaderboardRank.value}` : broadcast.fameRank;
  const metrics = [
    ["VIEWERS", viewers, observations.viewers],
    ["FOLLOWERS", followers, observations.followers],
    ["FLOOR RANK", rank, observations.leaderboardRank],
    ["FAVORITES", observations.favorites?.value, observations.favorites],
    ["PATRONS", observations.patrons?.value, observations.patrons],
    ["BOUNTY", observations.bounty?.value, observations.bounty],
  ].filter(([, value]) => value !== undefined) as [string, string | number, ProjectedObservationValue | undefined][];
  return (
    <div className="broadcast-page">
      <Panel title="LIVE BROADCAST">
        <div className="viewer">
          <span>● LIVE AUDIENCE</span>
          <h1>{viewers.toLocaleString()}</h1>
          <p>CURRENT VIEWERS</p>
          <b>{broadcast.viewerDelta} this encounter</b>
        </div>
      </Panel>

      <Panel title="AUDIENCE RESPONSE">
        <div className="audience">
          <p>
            <b>{followers.toLocaleString()}</b> Followers
          </p>
          <p>
            <b>{rank}</b> Floor Rank
          </p>
          {broadcast.sponsorInterest && <p className="sponsor">● Sponsor interest detected</p>}
        </div>
      </Panel>

      <Panel title="SOURCED AUDIENCE TELEMETRY">
        <div className="audience">
          {metrics.map(([label, value, observation]) => (
            <p key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
              <span><b>{typeof value === "number" ? value.toLocaleString() : value}</b> {label}</span>
              <TelemetryBadge observation={observation} causalValue={observation ? undefined : value} onClick={() => observation && onInspectObservation(observation)} />
            </p>
          ))}
        </div>
      </Panel>

      <Panel title="RECENT EVENT STREAM">
        <div className="log">
          {logs.slice(0, 5).map((l) => (
            <p key={l.sequence}>
              <span>SEQ #{l.sequence}</span> {l.message}
            </p>
          ))}
        </div>
      </Panel>
    </div>
  );
}
