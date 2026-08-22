"use client";
import React, { useState, useMemo, useEffect } from "react";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline";
import { projectState } from "../app/domain/projection";
import { validateCrawlerTimeline } from "../app/domain/validation";
import { compareGearStats, checkItemRequirements, getStatBreakdown } from "../app/domain/stats";
import type { StatBreakdown } from "../app/domain/stats";
import type { CrawlerEvent, CrawlerState, CrawlerTimelineDocument, InventoryItem } from "../app/domain/types";
import { TimelineScrubber } from "../app/components/TimelineScrubber";
import { StatInspectorModal } from "../app/components/StatInspectorModal";
import { ItemProvenanceDrawer } from "../app/components/ItemProvenanceDrawer";

type View = "crawler" | "inventory" | "skills" | "journal";

export default function CrawlerApp() {
  const [timelineDoc, setTimelineDoc] = useState<CrawlerTimelineDocument>(compiledTimeline);
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
  const [provenanceItem, setProvenanceItem] = useState<InventoryItem | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);

  // Floor collapse countdown timer
  useEffect(() => {
    const timer = setInterval(() => setTime((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentSeq = isLive ? maxSeq : selectedSeq;

  const projectedState: CrawlerState = useMemo(() => {
    return projectState(timelineDoc, currentSeq);
  }, [timelineDoc, currentSeq]);

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
        setTimelineDoc(parsed);
        setIsLive(true);
        const importedEvents = parsed.events || [];
        const lastSeq = importedEvents.slice(-1)[0]?.sequence ?? 1;
        const importedFloor = importedEvents.slice(-1)[0]?.position?.floor ?? parsed.floors?.slice(-1)[0]?.ordinal ?? 1;
        setSelectedSeq(lastSeq);
        setSelectedFloorOrdinal(importedFloor);
        setShowJsonModal(false);
      } else {
        setImportError(validation.errors.join("\n"));
      }
    } catch (e: unknown) {
      const err = e as Error;
      setImportError(`JSON syntax error: ${err.message}`);
    }
  };

  const handleSelectFloorOrdinal = (ordinal: number | 'all') => {
    setSelectedFloorOrdinal(ordinal);
    if (ordinal !== 'all') {
      const floorSeg = timelineDoc.floors?.find((f) => f.ordinal === ordinal);
      if (floorSeg) {
        setSelectedSeq(floorSeg.endSequence);
        setIsLive(floorSeg.endSequence === maxSeq);
      }
    }
  };

  const handleEmitEvent = (eventData: Partial<CrawlerEvent>) => {
    const nextSeq = maxSeq + 1;
    const newEvent: CrawlerEvent = {
      id: `evt-user-${Date.now()}`,
      sequence: nextSeq,
      occurred_at: projectedState.occurredAt,
      type: eventData.type || 'ItemEquipped',
      summary: eventData.summary || `Recorded ${eventData.type}`,
      category: eventData.category || 'system',
      position: { floor: latestFloor, elapsedSeconds: 0 },
      evidence: [{ sourceId: 'src-wda-system-log', confidence: 'confirmed' }],
      ...eventData,
    } as CrawlerEvent;

    const updatedDoc = {
      ...timelineDoc,
      events: [...timelineDoc.events, newEvent],
    };

    setTimelineDoc(updatedDoc as CrawlerTimelineDocument);
    setSelectedSeq(nextSeq);
    setIsLive(true);
  };

  return (
    <main>
      <div className="timer">
        <span>{floorHudTitle.toUpperCase()}</span>
        <b>LEVEL COLLAPSE IN {h}:{m}:{s}</b>
        <span>● LIVE · {projectedState.broadcast.viewers.toLocaleString()} VIEWERS</span>
      </div>

      {!isLive && (
        <div className="replay-banner">
          <span>HISTORICAL VIEW · REPLAYING SEQUENCE #{projectedState.sequence} ({projectedState.occurredAt})</span>
          <button onClick={handleReturnToLive}>RETURN TO LIVE ⚡</button>
        </div>
      )}

      <Nav active={view} set={setView} onOpenJsonModal={() => { setImportError(null); setJsonText(""); setShowJsonModal(true); }} />

      <button className="bell" onClick={() => setNotes(!notes)}>
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
        />

        {view === "crawler" ? (
          <Crawler
            state={projectedState}
            onInspectStat={(stat) => setInspectStat(stat)}
            onNavigateView={(v) => setView(v)}
          />
        ) : view === "inventory" ? (
          <Inventory
            state={projectedState}
            events={events}
            provenanceItem={provenanceItem}
            setProvenanceItem={setProvenanceItem}
            onNavigateToSequence={(seq) => {
              setSelectedSeq(seq);
              setIsLive(seq === maxSeq);
            }}
            onEmitEvent={handleEmitEvent}
          />
        ) : view === "skills" ? (
          <Skills state={projectedState} />
        ) : (
          <Journal
            state={projectedState}
            onNavigateToSequence={(seq) => {
              setSelectedSeq(seq);
              setIsLive(seq === maxSeq);
            }}
          />
        )}
      </div>

      {statBreakdown && (
        <StatInspectorModal
          breakdown={statBreakdown}
          onClose={() => setInspectStat(null)}
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
            <div className="actions" style={{ marginBottom: "12px" }}>
              <button onClick={handleExportJson}>DOWNLOAD TIMELINE JSON</button>
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
    <nav className="nav">
      <b><span>WORLD DUNGEON</span> AUTHORITY</b>
      {(["crawler", "inventory", "skills", "journal"] as View[]).map((v) => (
        <button key={v} className={active === v ? "active" : ""} onClick={() => set(v)}>
          {v === "crawler" ? "CRAWLER" : v.toUpperCase()}
        </button>
      ))}
      <button style={{ marginLeft: "auto", border: "1px solid #1f4252", padding: "6px 10px" }} onClick={onOpenJsonModal}>
        ⚙ JSON
      </button>
    </nav>
  );
}

function Crawler({
  state,
  onInspectStat,
  onNavigateView,
}: {
  state: CrawlerState;
  onInspectStat: (stat: string) => void;
  onNavigateView: (v: View) => void;
}) {
  const [mode, setMode] = useState<string>("OVERVIEW");

  const c = state.crawler;
  const xpPct = Math.min(100, Math.round((c.xp / (c.maxXp || 1)) * 100));
  const hpPct = Math.min(100, Math.round((c.condition.currentHealth / (c.condition.maxHealth || 1)) * 100));
  const mpPct = Math.min(100, Math.round((c.condition.currentMana / (c.condition.maxMana || 1)) * 100));
  const stPct = Math.min(100, Math.round((c.condition.currentStamina / (c.condition.maxStamina || 1)) * 100));

  const equippedCount = Object.values(state.equippedSlots).filter(Boolean).length;

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
              <i>LEVEL {c.level}</i>
              <i>RACE: {c.race}</i>
              <i>CLASS: {c.class}</i>
            </div>
            <div className="xp">
              <span>
                EXPERIENCE&nbsp; <b>{c.xp.toLocaleString()} / {c.maxXp.toLocaleString()}</b>
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
                  ["Strength", c.attributes.Strength, "red"],
                  ["Dexterity", c.attributes.Dexterity, "green"],
                  ["Constitution", c.attributes.Constitution, "yellow"],
                  ["Intelligence", c.attributes.Intelligence, "blue"],
                  ["Charisma", c.attributes.Charisma, "purple"],
                ].map(([n, v, color]) => (
                  <p key={String(n)} className="stat-clickable" onClick={() => onInspectStat(String(n))}>
                    <span>{n} 🔍</span>
                    <b>{v}</b>
                    <em>
                      <i className={String(color)} style={{ width: Number(v) * 2 + "%" }} />
                    </em>
                  </p>
                ))}
              </div>
              <button className="outline">AVAILABLE POINTS ({c.availableAttributePoints})</button>
            </Panel>

            <Panel title="CURRENT CONDITION">
              <div className="meters">
                <Meter name="HEALTH" value={`${c.condition.currentHealth.toLocaleString()} / ${c.condition.maxHealth.toLocaleString()}`} pct={hpPct} c="red" />
                <Meter name="MANA" value={`${c.condition.currentMana.toLocaleString()} / ${c.condition.maxMana.toLocaleString()}`} pct={mpPct} c="blue" />
                <Meter name="STAMINA" value={`${c.condition.currentStamina.toLocaleString()} / ${c.condition.maxStamina.toLocaleString()}`} pct={stPct} c="yellow" />
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
                <button onClick={() => onNavigateView("inventory")}>Manage in Inventory →</button>
              </div>
            </Panel>

            <Panel title="BROADCAST STATUS">
              <div className="broadcast">
                <p>
                  <span>VIEWERS</span>
                  <b>{state.broadcast.viewers.toLocaleString()}</b>
                  <em>{state.broadcast.viewerDelta}</em>
                </p>
                <p>
                  <span>FOLLOWERS</span>
                  <b>{state.broadcast.followers.toLocaleString()}</b>
                </p>
                <p>
                  <span>FAME RANK</span>
                  <b>{state.broadcast.fameRank}</b>
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
      {mode === "BROADCAST" && <Broadcast broadcast={state.broadcast} logs={state.recentLogs} />}
    </section>
  );
}

function Meter({ name, value, pct, c }: { name: string; value: string; pct: number; c: string }) {
  return (
    <p className="meter">
      <span>{name}</span>
      <b>{value}</b>
      <em>
        <i className={c} style={{ width: pct + "%" }} />
      </em>
    </p>
  );
}

function Inventory({
  state,
  events,
  provenanceItem,
  setProvenanceItem,
  onNavigateToSequence,
  onEmitEvent,
}: {
  state: CrawlerState;
  events: CrawlerEvent[];
  provenanceItem: InventoryItem | null;
  setProvenanceItem: (item: InventoryItem | null) => void;
  onNavigateToSequence: (seq: number) => void;
  onEmitEvent: (evt: Partial<CrawlerEvent>) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [filter, setFilter] = useState<string>("ALL ITEMS");
  const [slot, setSlot] = useState<string>("TORSO");
  const [search, setSearch] = useState<string>("");

  const items = state.inventory;
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        filter === "ALL ITEMS"
          ? true
          : filter === "EQUIPMENT"
          ? item.category === "EQUIPMENT"
          : filter === "CONSUMABLES"
          ? item.category === "CONSUMABLES"
          : filter === "QUEST ITEMS"
          ? item.category === "QUEST ITEMS"
          : filter === "CRAFTING"
          ? item.category === "CRAFTING"
          : true;

      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, filter, search]);

  const selectedItem = filteredItems[selectedIdx] || filteredItems[0] || items[0];

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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button>SORT: NEWEST⌄</button>
              </div>

              {filteredItems.length > 0 ? (
                <div className="grid">
                  {filteredItems.map((x, idx) => (
                    <button
                      className={`item ${x.rarity} ${selectedItem?.instanceId === x.instanceId ? "selected" : ""}`}
                      key={x.instanceId}
                      onClick={() => setSelectedIdx(idx)}
                    >
                      <i>{x.icon}</i>
                      <b>{x.quantity}</b>
                      <small>{x.name}</small>
                    </button>
                  ))}
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
                  <p className="rarity">{selectedItem.rarity} {selectedItem.isEquipped ? "· EQUIPPED" : ""}</p>
                  <p>{selectedItem.description}</p>
                  <dl>
                    <div>
                      <dt>VALUE</dt>
                      <dd>{selectedItem.value} ⊙</dd>
                    </div>
                    <div>
                      <dt>STACK</dt>
                      <dd>{selectedItem.quantity} / {selectedItem.maxStack}</dd>
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
                        style={selectedItem.isEquipped ? { background: "#2a0e12", borderColor: "#d5555e", color: "#ff8a80" } : { background: "#0e3a24", borderColor: "#2de079", color: "#62ef98" }}
                        onClick={() =>
                          onEmitEvent({
                            type: selectedItem.isEquipped ? "ItemUnequipped" : "ItemEquipped",
                            itemInstanceId: selectedItem.instanceId,
                            slot: selectedItem.slot || "SPECIAL",
                            summary: `${selectedItem.isEquipped ? "Unequipped" : "Equipped"} ${selectedItem.name}`,
                          })
                        }
                      >
                        {selectedItem.isEquipped ? "UNEQUIP GEAR ✕" : "EQUIP GEAR ⚔"}
                      </button>
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
            slot={slot}
            setSlot={setSlot}
            onEmitEvent={onEmitEvent}
            onOpenProvenance={(item) => setProvenanceItem(item)}
          />
        )}
      </div>
    </section>
  );
}

function EquipmentView({
  state,
  slot,
  setSlot,
  onEmitEvent,
  onOpenProvenance,
}: {
  state: CrawlerState;
  slot: string;
  setSlot: (v: string) => void;
  onEmitEvent: (evt: Partial<CrawlerEvent>) => void;
  onOpenProvenance: (item: InventoryItem) => void;
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

  const equippedInstanceId = state.equippedSlots[slot];
  const equippedItem = state.inventory.find((i) => i.instanceId === equippedInstanceId);

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
    return checkItemRequirements(state.crawler, activeCandidate.requirements);
  }, [state.crawler, activeCandidate]);

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
            const occupant = state.inventory.find((item) => item.instanceId === occupantId);
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
                <span>{name}</span>
                <small>{occupant ? occupant.name : "— Empty Slot"}</small>
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

function Skills({ state }: { state: CrawlerState }) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [filter, setFilter] = useState<string>("ALL SKILLS");

  const skills = state.skills;
  const shown = skills.filter((s) => {
    if (filter === "ALL SKILLS") return true;
    if (filter === "ACTIVE") return s.category !== "passive";
    if (filter === "PASSIVE") return s.category === "passive";
    return s.category.toUpperCase() === filter;
  });

  const selectedSkill = shown[selectedIdx] || shown[0] || skills[0];

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
          </Panel>
        )}
      </div>

      <Panel title="QUICK HOTLIST" className="hotlist">
        <div>
          {Array.from({ length: 10 }).map((_, i) => {
            const skillId = state.hotlist[i];
            const skill = skills.find((s) => s.skillId === skillId);
            return (
              <button key={i}>
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
  onNavigateToSequence,
}: {
  state: CrawlerState;
  onNavigateToSequence: (seq: number) => void;
}) {
  const [tab, setTab] = useState<string>("ACTIVE");

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">OBJECTIVES & SYSTEM RECORDS</p>
          <h1>JOURNAL</h1>
        </div>
        <div className="subnav">
          {["ACTIVE", "FLOOR RULES", "LOG"].map((x) => (
            <button className={tab === x ? "on" : ""} onClick={() => setTab(x)} key={x}>
              {x}
            </button>
          ))}
        </div>
      </header>

      {tab === "ACTIVE" ? (
        <div className="journal">
          <div>
            {state.quests.map((q) => (
              <Quest key={q.questId} title={q.title} urgency={q.urgency} goals={q.goals} rewards={q.rewards} />
            ))}
          </div>

          <Panel title="RECENT PROGRESS & ACHIEVEMENTS">
            {state.achievements.map((ach) => (
              <div className="achievement" key={ach.achievementId}>
                <span>{ach.icon}</span>
                <div>
                  <p className="eyebrow">ACHIEVEMENT UNLOCKED (SEQ #{ach.unlockedAtSequence})</p>
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
}: {
  title: string;
  urgency: string;
  goals: string[];
  rewards: string;
}) {
  return (
    <article className="quest">
      <header>
        <h2>{title}</h2>
        <i>{urgency}</i>
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
  return (
    <div className="achievements">
      {achievements.map((ach) => (
        <div className="achievement" key={ach.achievementId}>
          <span>{ach.icon}</span>
          <div>
            <p className="eyebrow">ACHIEVEMENT UNLOCKED (SEQ #{ach.unlockedAtSequence})</p>
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
  logs,
}: {
  broadcast: CrawlerState["broadcast"];
  logs: CrawlerState["recentLogs"];
}) {
  return (
    <div className="broadcast-page">
      <Panel title="LIVE BROADCAST">
        <div className="viewer">
          <span>● LIVE AUDIENCE</span>
          <h1>{broadcast.viewers.toLocaleString()}</h1>
          <p>CURRENT VIEWERS</p>
          <b>{broadcast.viewerDelta} this encounter</b>
        </div>
      </Panel>

      <Panel title="AUDIENCE RESPONSE">
        <div className="audience">
          <p>
            <b>{broadcast.followers.toLocaleString()}</b> Followers
          </p>
          <p>
            <b>{broadcast.fameRank}</b> Floor Rank
          </p>
          {broadcast.sponsorInterest && <p className="sponsor">● Sponsor interest detected</p>}
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
