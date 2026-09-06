import { useMemo, useState } from "react";
import type { CrawlerEvent, CrawlerState, InventoryItem, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue, TimelineSource } from "../../../app/domain/types";
import { checkItemRequirements } from "../../../app/domain/stats";
import { TelemetryBadge } from "../timeline/evidence/TelemetryBadge";
import { Panel } from "../../shared/ui/Panel";
import { deriveAwardHistory } from "./awardHistory";
import { EquipmentView } from "./equipment/EquipmentView";
import { ItemProvenanceDrawer } from "./provenance/ItemProvenanceDrawer";

export function InventoryView({ state, liveState, observations, events, sequence, provenanceItem, setProvenanceItem, filter, setFilter, slot, setSlot, onNavigateToSequence, onEmitEvent, onInspectObservation }: {
  state: CrawlerState;
  liveState: CrawlerState;
  observations: ProjectedObservationsState;
  sources?: TimelineSource[];
  events: CrawlerEvent[];
  sequence: number;
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
  const [sortOrder, setSortOrder] = useState("newest");
  const [search, setSearch] = useState("");
  const items = state.inventory;
  const awards = useMemo(() => deriveAwardHistory(events, sequence, state.inventory), [events, sequence, state.inventory]);
  const effectiveFilter = filter;
  const filteredItems = useMemo(() => {
    const rarityRank: Record<string, number> = { celestial: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    const matched = items.filter((item) => {
      const matchesCategory = effectiveFilter === "ALL ITEMS" ? true : effectiveFilter === "EQUIPMENT" ? item.category === "EQUIPMENT" || item.category === "equipment" : effectiveFilter === "CONSUMABLES" ? item.category === "CONSUMABLES" || item.category === "consumable" : effectiveFilter === "QUEST ITEMS" ? item.category === "QUEST ITEMS" || item.category === "quest-item" : effectiveFilter === "CRAFTING" ? item.category === "CRAFTING" || item.category === "crafting" : true;
      return matchesCategory && item.name.toLowerCase().includes(search.toLowerCase());
    });
    return matched.sort((a, b) => sortOrder === "newest" ? b.acquiredAtSequence - a.acquiredAtSequence : sortOrder === "oldest" ? a.acquiredAtSequence - b.acquiredAtSequence : sortOrder === "rarity" ? (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0) : sortOrder === "value" ? b.value - a.value : sortOrder === "name" ? a.name.localeCompare(b.name) : 0);
  }, [items, effectiveFilter, search, sortOrder]);
  const selectedItem = useMemo(() => selectedInstanceId ? filteredItems.find((item) => item.instanceId === selectedInstanceId) ?? filteredItems[0] ?? items[0] : filteredItems[0] ?? items[0], [filteredItems, selectedInstanceId, items]);
  const selectedItemRequirements = useMemo(() => checkItemRequirements(liveState.crawler, selectedItem?.requirements), [liveState.crawler, selectedItem]);
  const selectedItemObservation = selectedItem ? observations.inventory[selectedItem.instanceId] : undefined;
  const selectedItemObservationDetails = selectedItemObservation ? [typeof selectedItemObservation.present === "boolean" ? selectedItemObservation.present ? "PRESENT" : "ABSENT" : null, selectedItemObservation.quantity?.known ? `QTY ${selectedItemObservation.quantity.value}` : null, typeof selectedItemObservation.isEquipped === "boolean" ? selectedItemObservation.isEquipped ? "EQUIPPED" : "UNEQUIPPED" : null].filter((detail): detail is string => detail !== null) : [];
  const categories = ["ALL ITEMS", "EQUIPMENT", "CONSUMABLES", "QUEST ITEMS", "CRAFTING", ...(awards.length > 0 || filter === "AWARDS / BOXES" ? ["AWARDS / BOXES"] : [])];

  return <section className="view-content">
    <header className="title"><div><p className="eyebrow">STORAGE SYSTEM</p><h1>INVENTORY</h1></div><b>{items.length} SOURCED ITEM{items.length === 1 ? "" : "S"}</b></header>
    <div className="inventory">
      <Panel title="CATEGORIES"><div className="categories">{categories.map((category) => <button className={effectiveFilter === category ? "on" : ""} onClick={() => setFilter(category)} key={category}>{category}<b>{category === "AWARDS / BOXES" ? awards.length : category === "ALL ITEMS" ? items.length : items.filter((item) => item.category === category).length}</b></button>)}</div></Panel>
      {effectiveFilter === "AWARDS / BOXES" ? <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(240px, 1fr)", gap: "18px" }}>
        <Panel title="AWARDS / BOXES"><p style={{ fontSize: "11px", color: "#9db3bd", marginTop: 0 }}>Source-backed awards are shown even after a box is opened. This is award history, not an assertion that every box remains in inventory.</p>{awards.length > 0 ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>{awards.map((award) => <article key={award.id} className={award.rarity} style={{ border: "1px solid #315462", background: "#091721", padding: "10px", minHeight: "118px" }} aria-label={`${award.name} award`}><i aria-hidden="true" style={{ display: "block", color: "#f3cc52", fontSize: "23px", fontStyle: "normal" }}>▣</i><strong style={{ display: "block", color: "#e4f2f6", fontSize: "11px", marginTop: "6px" }}>{award.name}</strong><small style={{ display: "block", color: "#f3cc52", fontSize: "9px", marginTop: "4px" }}>{award.openedAtSequence ? "OPENED" : award.isInInventory ? "IN INVENTORY" : "STATUS NOT SOURCED"}</small></article>)}</div> : <p style={{ fontSize: "11px", color: "#8fa1aa" }}>No source-backed awards are available at this replay sequence.</p>}</Panel>
        <Panel title="AWARD LEDGER">{awards.length > 0 ? <div className="compact">{awards.map((award) => <span key={award.id}><strong>{award.name}</strong><br />Awarded by {award.achievementTitle} · SEQ #{award.awardedAtSequence}<br />{award.openedAtSequence ? `Opened at SEQ #${award.openedAtSequence}` : award.isInInventory ? "Present in selected inventory state" : "Later status is not sourced"}</span>)}</div> : <p style={{ fontSize: "11px", color: "#8fa1aa" }}>Award history is unavailable until a replay-visible box acquisition is explicitly caused by an achievement unlock.</p>}</Panel>
      </div> : effectiveFilter !== "EQUIPMENT" ? <>
        <Panel title={filter}><div className="tools"><input placeholder="Search items…" aria-label="Search items" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Sort items" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} style={{ border: "1px solid #294650", background: "#09141d", color: "#b8ced5", padding: "9px", fontSize: "10px", borderRadius: "3px" }}><option value="newest">SORT: NEWEST ⌄</option><option value="oldest">SORT: OLDEST ⌄</option><option value="rarity">SORT: RARITY ⌄</option><option value="value">SORT: VALUE ⌄</option><option value="name">SORT: NAME ⌄</option></select></div>{filteredItems.length > 0 ? <div className="grid">{filteredItems.map((item) => { const observation = observations.inventory[item.instanceId]; return <button className={`item ${item.rarity} ${selectedItem?.instanceId === item.instanceId ? "selected" : ""}`} key={item.instanceId} onClick={() => setSelectedInstanceId(item.instanceId)} aria-label={`${item.name} (${item.rarity})`}><i>{item.icon}</i><b>{item.quantityObject && !item.quantityObject.known ? item.quantityObject.minimum ? `≥${item.quantityObject.minimum}` : "?" : item.quantity}</b>{observation && <span style={{ position: "absolute", top: "2px", right: "2px", fontSize: "9px" }}>📡</span>}<small>{item.name}</small></button>; })}</div> : <p style={{ fontSize: "11px", color: "#8fa1aa" }}>No items match current filter.</p>}</Panel>
        <div className="right">
          <Panel title="EQUIPPED GEAR SLOTS"><div className="compact">{Object.entries(state.equippedSlots).filter(([, itemId]) => itemId).length > 0 ? Object.entries(state.equippedSlots).filter(([, itemId]) => itemId).map(([gearSlot, itemId]) => <span key={gearSlot}>{gearSlot}: {state.inventory.find((item) => item.instanceId === itemId)?.name ?? "UNKNOWN ITEM"}</span>) : <span>No equipped gear is sourced at this sequence.</span>}</div><button className="link" onClick={() => setFilter("EQUIPMENT")}>Open equipment slot matrix →</button></Panel>
          {selectedItem && <Panel title="ITEM INSPECTOR"><div className={`large-icon ${selectedItem.rarity}`}>{selectedItem.icon}</div><h2>{selectedItem.name.toUpperCase()}</h2><p className="rarity">{selectedItem.rarity} {selectedItem.isEquipped ? "· EQUIPPED" : ""}{observations.inventory[selectedItem.instanceId] && <TelemetryBadge observation={observations.inventory[selectedItem.instanceId]} onClick={() => onInspectObservation(observations.inventory[selectedItem.instanceId])} />}</p><p>{selectedItem.description}</p>{selectedItemObservationDetails.length > 0 && <p style={{ fontSize: "10px", color: "#7ee5ff" }}>OBSERVED INVENTORY STATE: {selectedItemObservationDetails.join(" · ")}</p>}<dl><div><dt>VALUE</dt><dd>{selectedItem.value > 0 ? `${selectedItem.value} ⊙` : "NOT SOURCED"}</dd></div><div><dt>STACK</dt><dd>{selectedItem.quantityObject && !selectedItem.quantityObject.known ? selectedItem.quantityObject.minimum ? `≥${selectedItem.quantityObject.minimum} / ${selectedItem.maxStack} (Unknown)` : `Unknown / ${selectedItem.maxStack}` : `${selectedItem.quantity} / ${selectedItem.maxStack}`}</dd></div><div><dt>TYPE</dt><dd>{selectedItem.category}</dd></div><div><dt>ACQUIRED</dt><dd>SEQ #{selectedItem.acquiredAtSequence}</dd></div>{selectedItem.durability && <div><dt>DURABILITY</dt><dd>{selectedItem.durability.current} / {selectedItem.durability.max}</dd></div>}</dl>{selectedItem.stats && <div style={{ marginBottom: "12px", fontSize: "10px", color: "#6fe8f7" }}><strong>ITEM STATS:</strong>{Object.entries(selectedItem.stats).map(([key, value]) => <p key={key} style={{ margin: "2px 0" }}>+ {value} {key}</p>)}</div>}
            <div className="actions" style={{ flexWrap: "wrap", gap: "6px" }}>
              {(selectedItem.category === "CONSUMABLES" || selectedItem.category === "consumable") && <button style={{ background: "#0e3a24", borderColor: "#2de079", color: "#62ef98" }} onClick={() => onEmitEvent({ type: "ItemConsumed", itemInstanceId: selectedItem.instanceId, quantity: 1, healthRestored: selectedItem.name.toLowerCase().includes("health") ? 500 : undefined, summary: `Consumed ${selectedItem.name}` })}>USE CONSUMABLE 🧪</button>}
              {(selectedItem.category === "EQUIPMENT" || selectedItem.category === "equipment") && <button style={selectedItem.isEquipped ? { background: "#2a0e12", borderColor: "#d5555e", color: "#ff8a80" } : selectedItemRequirements.met ? { background: "#0e3a24", borderColor: "#2de079", color: "#62ef98" } : { background: "#2a1818", borderColor: "#633030", color: "#8a5858", cursor: "not-allowed" }} disabled={!selectedItem.isEquipped && !selectedItemRequirements.met} onClick={() => { if (!selectedItem.isEquipped && !selectedItemRequirements.met) return; onEmitEvent({ type: selectedItem.isEquipped ? "ItemUnequipped" : "ItemEquipped", itemInstanceId: selectedItem.instanceId, slot: selectedItem.slot || "SPECIAL", summary: `${selectedItem.isEquipped ? "Unequipped" : "Equipped"} ${selectedItem.name}` }); }}>{selectedItem.isEquipped ? "UNEQUIP GEAR ✕" : "EQUIP GEAR ⚔"}</button>}
              {!selectedItem.isEquipped && !selectedItemRequirements.met && <p style={{ width: "100%", margin: 0, color: "#ff737d", fontSize: "9px" }}>Requirements unmet: {selectedItemRequirements.details.filter((detail) => !detail.met).map((detail) => `${detail.key} ${detail.required} (current: ${detail.current})`).join(", ")}</p>}
              <button style={{ background: "#0e2330", borderColor: "#30729e", color: "#86cbff" }} onClick={() => onEmitEvent({ type: "ItemLockToggled", itemInstanceId: selectedItem.instanceId, summary: `${selectedItem.isLocked ? "Unlocked" : "Locked"} ${selectedItem.name}` })}>{selectedItem.isLocked ? "UNLOCK 🔒" : "LOCK 🔓"}</button>
              <button onClick={() => setProvenanceItem(selectedItem)}>PROVENANCE LIFECYCLE 🔍</button>
              {!selectedItem.isEquipped && <button style={{ background: selectedItem.isLocked ? "#201214" : "#2e1215", borderColor: selectedItem.isLocked ? "#4d2226" : "#d14b54", color: selectedItem.isLocked ? "#6e4246" : "#ff8a90", cursor: selectedItem.isLocked ? "not-allowed" : "pointer" }} disabled={selectedItem.isLocked} onClick={() => onEmitEvent({ type: "ItemDiscarded", itemInstanceId: selectedItem.instanceId, summary: `Discarded ${selectedItem.name}` })}>DISCARD 🗑️</button>}
            </div>
          </Panel>}
          {provenanceItem && <ItemProvenanceDrawer item={provenanceItem} events={events} onClose={() => setProvenanceItem(null)} onNavigateToSequence={onNavigateToSequence} />}
        </div>
      </> : <EquipmentView state={state} liveState={liveState} observations={observations} slot={slot} setSlot={setSlot} onEmitEvent={onEmitEvent} onOpenProvenance={(item) => setProvenanceItem(item)} onInspectObservation={onInspectObservation} />}
    </div>
  </section>;
}
