"use client";
import { useState, useMemo, useEffect } from "react";
import { floor6Events, floor6Snapshots } from "./domain/fixtures/floor6";
import { projectState } from "./domain/projection";
import { getStatBreakdown, StatBreakdown } from "./domain/stats";
import { CrawlerEvent, CrawlerState, InventoryItem } from "./domain/types";
import { TimelineScrubber } from "./components/TimelineScrubber";
import { StatInspectorModal } from "./components/StatInspectorModal";
import { ItemProvenanceDrawer } from "./components/ItemProvenanceDrawer";

type View = "crawler" | "inventory" | "skills" | "journal";

export default function Home() {
  const [events, setEvents] = useState<CrawlerEvent[]>(floor6Events);
  const maxSeq = events[events.length - 1]?.sequence ?? 1;

  const [isLive, setIsLive] = useState<boolean>(true);
  const [selectedSeq, setSelectedSeq] = useState<number>(maxSeq);

  const [view, setView] = useState<View>("crawler");
  const [time, setTime] = useState<number>(4 * 3600 + 17 * 60 + 32);
  const [notes, setNotes] = useState<boolean>(false);

  const [inspectStat, setInspectStat] = useState<string | null>(null);
  const [provenanceItem, setProvenanceItem] = useState<InventoryItem | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>("");

  // Keep selected sequence aligned with maxSeq when live
  useEffect(() => {
    if (isLive) {
      setSelectedSeq(maxSeq);
    }
  }, [isLive, maxSeq]);

  // Floor collapse countdown timer
  useEffect(() => {
    const timer = setInterval(() => setTime((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const projectedState: CrawlerState = useMemo(() => {
    return projectState(events, isLive ? maxSeq : selectedSeq, floor6Snapshots);
  }, [events, isLive, selectedSeq, maxSeq]);

  const statBreakdown: StatBreakdown | null = useMemo(() => {
    if (!inspectStat) return null;
    return getStatBreakdown(projectedState, inspectStat);
  }, [projectedState, inspectStat]);

  const h = String(Math.floor(time / 3600)).padStart(2, "0");
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `crawler-timeline-seq-${projectedState.sequence}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].sequence) {
        setEvents(parsed);
        setIsLive(true);
        setShowJsonModal(false);
      } else {
        alert("Invalid event array format.");
      }
    } catch {
      alert("Failed to parse JSON.");
    }
  };

  return (
    <main>
      <div className="timer">
        <span>FLOOR 6</span>
        <b>LEVEL COLLAPSE IN {h}:{m}:{s}</b>
        <span>● LIVE · {projectedState.broadcast.viewers.toLocaleString()} VIEWERS</span>
      </div>

      {!isLive && (
        <div className="replay-banner">
          <span>HISTORICAL VIEW · REPLAYING SEQUENCE #{projectedState.sequence} ({projectedState.occurredAt})</span>
          <button onClick={() => setIsLive(true)}>RETURN TO LIVE ⚡</button>
        </div>
      )}

      <Nav active={view} set={setView} onOpenJsonModal={() => setShowJsonModal(true)} />

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
          selectedSequence={isLive ? maxSeq : selectedSeq}
          onSelectSequence={(seq) => {
            setSelectedSeq(seq);
            setIsLive(seq === maxSeq);
          }}
          isLive={isLive}
          onToggleLive={() => setIsLive(!isLive)}
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
                <p className="eyebrow">PORTABLE TIMELINE</p>
                <h2>IMPORT / EXPORT CRAWLER EVENTS</h2>
              </div>
              <button className="close-btn" onClick={() => setShowJsonModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: "11px", color: "#a4b7bf" }}>
              Export current crawler timeline fixture as JSON or import a custom sequence stream.
            </p>
            <div className="actions" style={{ marginBottom: "12px" }}>
              <button onClick={handleExportJson}>DOWNLOAD JSON TIMELINE</button>
            </div>
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
              placeholder="Paste JSON events array here to import..."
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
            <div className="modal-footer" style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              <button className="outline" onClick={handleImportJson}>IMPORT JSON STREAM</button>
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
  const xpPct = Math.min(100, Math.round((c.xp / c.maxXp) * 100));
  const hpPct = Math.min(100, Math.round((c.condition.currentHealth / c.condition.maxHealth) * 100));
  const mpPct = Math.min(100, Math.round((c.condition.currentMana / c.condition.maxMana) * 100));
  const stPct = Math.min(100, Math.round((c.condition.currentStamina / c.condition.maxStamina) * 100));

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
}: {
  state: CrawlerState;
  events: CrawlerEvent[];
  provenanceItem: InventoryItem | null;
  setProvenanceItem: (item: InventoryItem | null) => void;
  onNavigateToSequence: (seq: number) => void;
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
                  <p className="rarity">{selectedItem.rarity}</p>
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
                  </dl>

                  <div className="actions">
                    <button onClick={() => setProvenanceItem(selectedItem)}>
                      PROVENANCE LIFECYCLE 🔍
                    </button>
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
          <EquipmentView state={state} slot={slot} setSlot={setSlot} />
        )}
      </div>
    </section>
  );
}

function EquipmentView({
  state,
  slot,
  setSlot,
}: {
  state: CrawlerState;
  slot: string;
  setSlot: (v: string) => void;
}) {
  const slots = [
    ["HEAD", "◉", "Rogue's Hood"],
    ["FACE", "◌", "—"],
    ["NECK", "◇", "—"],
    ["TORSO", "◈", "Shadowweave Vest"],
    ["WRISTS", "▱", "—"],
    ["RING", "💍", "Echo Ring"],
    ["WAIST", "▰", "—"],
    ["LEGS", "╿", "—"],
    ["FEET", "▰", "Tracker Boots"],
    ["SPECIAL", "✦", "—"],
  ];

  const equippedInstanceId = state.equippedSlots[slot];
  const equippedItem = state.inventory.find((i) => i.instanceId === equippedInstanceId);

  return (
    <div className="equipment-workspace">
      <Panel title="ADAPTIVE LOADOUT · PRIMAL">
        <p className="slot-note">Slots change with race, class, transformations, and body modifications.</p>
        <div className="loadout-diagram">
          <div className="body-core">◉</div>
          {slots.map(([name, icon], i) => {
            const occupantId = state.equippedSlots[name];
            const occupant = state.inventory.find((item) => item.instanceId === occupantId);
            return (
              <button
                key={name}
                className={`body-slot s${i} ${slot === name ? "selected" : ""}`}
                onClick={() => setSlot(name)}
              >
                <i>{icon}</i>
                <span>{name}</span>
                <small>{occupant ? occupant.name : "—"}</small>
              </button>
            );
          })}
        </div>
        <div className="slot-legend">
          <span>◉ occupied</span>
          <span>◇ special</span>
          <span>— empty slot</span>
        </div>
      </Panel>

      <Panel title={`SLOT INSPECTOR · ${slot}`}>
        {equippedItem ? (
          <div>
            <p className="eyebrow">EQUIPPED ITEM</p>
            <h2>{equippedItem.name}</h2>
            <p className="rarity">{equippedItem.rarity}</p>
            <p>{equippedItem.description}</p>
            {equippedItem.stats && (
              <div style={{ marginTop: "10px", fontSize: "11px", color: "#6fe8f7" }}>
                {Object.entries(equippedItem.stats).map(([k, v]) => (
                  <p key={k}>
                    + {v} {k}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "#7fa0ac", fontSize: "11px" }}>No gear equipped in slot {slot}.</p>
        )}
      </Panel>
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
        <Panel title={tab === "LOG" ? "SYSTEM EVENT LOG" : "FLOOR 6 · CLOCKWORK CATACOMBS"}>
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
