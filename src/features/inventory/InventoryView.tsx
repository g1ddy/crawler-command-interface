import { useMemo, useState } from "react";
import type { CrawlerEvent, CrawlerState, InventoryItem, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue, TimelineSource } from "../../../app/domain/types";
import { compareGearStats, checkItemRequirements } from "../../../app/domain/stats";
import { TelemetryBadge } from "../../../app/components/TelemetryBadge";
import { ItemProvenanceDrawer } from "../../../app/components/ItemProvenanceDrawer";
import { Panel } from "../../shared/ui/Panel";

export function InventoryView({
  state,
  liveState,
  observations,
  events,
  sequence,
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
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [search, setSearch] = useState<string>("");

  const items = state.inventory;
  const awards = useMemo(() => {
    const eventById = new Map(events.map((event) => [event.id, event]));

    return events
      .filter((event) => event.sequence <= sequence && event.type === "ItemAcquired")
      .flatMap((event) => {
        const item = event.item as { instanceId?: unknown; name?: unknown; category?: unknown; rarity?: unknown; description?: unknown } | undefined;
        if (!item || item.category !== "box" || typeof item.instanceId !== "string") return [];

        const openedBy = events.find(
          (candidate) =>
            candidate.sequence <= sequence &&
            candidate.type === "ItemDiscarded" &&
            candidate.itemInstanceId === item.instanceId &&
            candidate.reason === "opened"
        );
        const achievementEvent = typeof event.causationId === "string" ? eventById.get(event.causationId) : undefined;
        const achievement = achievementEvent?.achievement as { title?: unknown } | undefined;

        return [{
          id: item.instanceId,
          name: typeof item.name === "string" ? item.name : "Awarded Box",
          rarity: typeof item.rarity === "string" ? item.rarity : "unknown",
          description: typeof item.description === "string" ? item.description : "No box details are sourced.",
          awardedAtSequence: event.sequence,
          achievementTitle: typeof achievement?.title === "string" ? achievement.title : "Source-backed award",
          openedAtSequence: openedBy?.sequence,
          isInInventory: state.inventory.some((inventoryItem) => inventoryItem.instanceId === item.instanceId),
        }];
      });
  }, [events, sequence, state.inventory]);
  const effectiveFilter = filter === "AWARDS / BOXES" && awards.length === 0 ? "ALL ITEMS" : filter;
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
        effectiveFilter === "ALL ITEMS"
          ? true
          : effectiveFilter === "EQUIPMENT"
          ? item.category === "EQUIPMENT" || item.category === "equipment"
          : effectiveFilter === "CONSUMABLES"
          ? item.category === "CONSUMABLES" || item.category === "consumable"
          : effectiveFilter === "QUEST ITEMS"
          ? item.category === "QUEST ITEMS" || item.category === "quest-item"
          : effectiveFilter === "CRAFTING"
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
  }, [items, effectiveFilter, search, sortOrder]);

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

  const categories = ["ALL ITEMS", "EQUIPMENT", "CONSUMABLES", "QUEST ITEMS", "CRAFTING", ...(awards.length > 0 ? ["AWARDS / BOXES"] : [])];

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">STORAGE SYSTEM</p>
          <h1>INVENTORY</h1>
        </div>
        <b>{items.length} SOURCED ITEM{items.length === 1 ? "" : "S"}</b>
      </header>

      <div className="inventory">
        <Panel title="CATEGORIES">
          <div className="categories">
            {categories.map((x) => (
              <button className={effectiveFilter === x ? "on" : ""} onClick={() => setFilter(x)} key={x}>
                {x}
                <b>
                  {x === "AWARDS / BOXES"
                    ? awards.length
                    : x === "ALL ITEMS"
                    ? items.length
                    : items.filter((i) => i.category === x).length}
                </b>
              </button>
            ))}
          </div>
        </Panel>

        {effectiveFilter === "AWARDS / BOXES" ? (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(240px, 1fr)", gap: "18px" }}>
            <Panel title="AWARDS / BOXES">
              <p style={{ fontSize: "11px", color: "#9db3bd", marginTop: 0 }}>
                Source-backed awards are shown even after a box is opened. This is award history, not an assertion that every box remains in inventory.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                {awards.map((award) => (
                  <article
                    key={award.id}
                    className={award.rarity}
                    style={{ border: "1px solid #315462", background: "#091721", padding: "10px", minHeight: "118px" }}
                    aria-label={`${award.name} award`}
                  >
                    <i aria-hidden="true" style={{ display: "block", color: "#f3cc52", fontSize: "23px", fontStyle: "normal" }}>▣</i>
                    <strong style={{ display: "block", color: "#e4f2f6", fontSize: "11px", marginTop: "6px" }}>{award.name}</strong>
                    <small style={{ display: "block", color: "#f3cc52", fontSize: "9px", marginTop: "4px" }}>
                      {award.openedAtSequence ? "OPENED" : award.isInInventory ? "IN INVENTORY" : "STATUS NOT SOURCED"}
                    </small>
                  </article>
                ))}
              </div>
            </Panel>
            <Panel title="AWARD LEDGER">
              <div className="compact">
                {awards.map((award) => (
                  <span key={award.id}>
                    <strong>{award.name}</strong><br />
                    Awarded by {award.achievementTitle} · SEQ #{award.awardedAtSequence}<br />
                    {award.openedAtSequence
                      ? `Opened at SEQ #${award.openedAtSequence}`
                      : award.isInInventory
                      ? "Present in selected inventory state"
                      : "Later status is not sourced"}
                  </span>
                ))}
              </div>
            </Panel>
          </div>
        ) : effectiveFilter !== "EQUIPMENT" ? (
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
                  {Object.entries(state.equippedSlots).filter(([, itemId]) => itemId).length > 0
                    ? Object.entries(state.equippedSlots).filter(([, itemId]) => itemId).map(([slot, itemId]) => <span key={slot}>{slot}: {state.inventory.find((item) => item.instanceId === itemId)?.name ?? "UNKNOWN ITEM"}</span>)
                    : <span>No equipped gear is sourced at this sequence.</span>}
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
                      <dd>{selectedItem.value > 0 ? `${selectedItem.value} ⊙` : "NOT SOURCED"}</dd>
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
  onInspectObservation,
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
