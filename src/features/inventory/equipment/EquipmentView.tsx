import { useMemo, useState } from "react";
import type { CrawlerState, InventoryItem, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue } from "../../../../app/domain/types";
import { compareGearStats, checkItemRequirements } from "../../../../app/domain/stats";
import { TelemetryBadge } from "../../timeline/public";
import { Panel } from "../../../shared/ui/Panel";
import type { EquipmentSlot, InventoryActions } from "../../../application/crawler-action-contracts";

export function EquipmentView({ state, liveState, observations, selectedSequence, slot, setSlot, actions, onOpenProvenance, onInspectObservation }: {
  state: CrawlerState;
  liveState: CrawlerState;
  observations: ProjectedObservationsState;
  selectedSequence?: number;
  slot: EquipmentSlot;
  setSlot: (v: EquipmentSlot) => void;
  actions: InventoryActions;
  onOpenProvenance: (item: InventoryItem) => void;
  onInspectObservation?: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
}) {
  const slots: readonly (readonly [EquipmentSlot, string, string])[] = [["HEAD", "◉", "Headgear"], ["FACE", "◌", "Visor/Mask"], ["NECK", "◇", "Amulet/Necklace"], ["TORSO", "◈", "Body Armor/Vest"], ["WRISTS", "▱", "Bracers"], ["RING", "💍", "Finger Ring"], ["WAIST", "▰", "Belt/Waistband"], ["LEGS", "╿", "Leg Armor"], ["FEET", "▰", "Footwear/Boots"], ["SPECIAL", "✦", "Relic/Special"]];
  const inventoryMap = useMemo(() => { const map = new Map<string, InventoryItem>(); for (const item of state.inventory) if (item.instanceId && !map.has(item.instanceId)) map.set(item.instanceId, item); return map; }, [state.inventory]);
  const equippedInstanceId = state.equippedSlots[slot];
  const equippedItem = equippedInstanceId ? inventoryMap.get(equippedInstanceId) : undefined;
  const slotCandidates = useMemo(() => state.inventory.filter((item) => { const isEquipment = item.category === "EQUIPMENT" || item.category === "equipment"; if (!isEquipment) return false; if (slot === "SPECIAL") return true; return item.slot === slot || !item.slot; }), [state.inventory, slot]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const activeCandidate = useMemo(() => selectedCandidateId ? slotCandidates.find((candidate) => candidate.instanceId === selectedCandidateId) ?? slotCandidates[0] ?? equippedItem : slotCandidates.find((candidate) => candidate.instanceId !== equippedInstanceId) ?? slotCandidates[0] ?? equippedItem, [slotCandidates, selectedCandidateId, equippedInstanceId, equippedItem]);
  const requirements = useMemo(() => activeCandidate ? checkItemRequirements(liveState.crawler, activeCandidate.requirements) : { met: true, details: [] }, [liveState.crawler, activeCandidate]);
  const statDeltas = useMemo(() => compareGearStats(equippedItem, activeCandidate), [equippedItem, activeCandidate]);

  return <div className="equipment-workspace">
    <Panel title="ADAPTIVE LOADOUT · PRIMAL">
      <p className="slot-note">Click a body slot to inspect equipped gear, compare inventory candidates, and evaluate stat deltas.</p>
      <div className="loadout-diagram"><div className="body-core">◉</div>{slots.map(([name, icon], index) => { const occupantId = state.equippedSlots[name]; const occupant = occupantId ? inventoryMap.get(occupantId) : undefined; const observation = observations.equipment[name]; const observedOccupant = observation?.itemInstanceId ? inventoryMap.get(observation.itemInstanceId) : undefined; return <button key={name} className={`body-slot s${index} ${slot === name ? "selected" : ""}`} onClick={() => { setSlot(name); setSelectedCandidateId(null); }}><i>{icon}</i><span>{name}{observation && <span style={{ marginLeft: "4px", color: "#1bd9ff" }}>📡</span>}</span><small>{observation ? (observedOccupant ? observedOccupant.name : observation.itemInstanceId || "— Empty Slot") : occupant ? occupant.name : "— Empty Slot"}</small></button>; })}</div>
      <div className="slot-legend"><span>◉ Occupied</span><span>◇ Special</span><span>— Empty Slot</span></div>
    </Panel>
    <div style={{ display: "grid", gap: "18px" }}>
      <Panel title={`SLOT INSPECTOR · ${slot}`}>
        {observations.equipment[slot] && <p style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#7ee5ff" }}>SLOT OBSERVATION: {observations.equipment[slot].itemInstanceId || "EMPTY"}<TelemetryBadge observation={observations.equipment[slot]} selectedSequence={selectedSequence} onClick={() => onInspectObservation?.(observations.equipment[slot])} /></p>}
        {equippedItem ? <div style={{ marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid #1f3e4d" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div><p className="eyebrow">CURRENTLY EQUIPPED IN {slot}</p><h2>{equippedItem.name.toUpperCase()}</h2></div><button style={{ background: "#2a0e12", border: "1px solid #d5555e", color: "#ff8a80", fontSize: "9px", padding: "6px 10px" }} onClick={() => actions.unequipItem(equippedItem.instanceId)}>UNEQUIP ✕</button></div><p className="rarity">{equippedItem.rarity}</p><p style={{ fontSize: "11px", color: "#a5b9c0" }}>{equippedItem.description}</p>{equippedItem.durability && <p style={{ fontSize: "10px", color: "#f3cc52", marginTop: "4px" }}>DURABILITY: {equippedItem.durability.current} / {equippedItem.durability.max}</p>}</div> : <p style={{ color: "#7fa0ac", fontSize: "11px", marginBottom: "14px" }}>No gear currently equipped in {slot} slot.</p>}
        <p className="eyebrow" style={{ marginTop: "10px" }}>CANDIDATE GEAR IN INVENTORY ({slotCandidates.length})</p>
        {slotCandidates.length > 0 ? <div className="candidate-grid">{slotCandidates.map((candidate) => <button key={candidate.instanceId} className={`candidate ${candidate.rarity} ${activeCandidate?.instanceId === candidate.instanceId ? "selected" : ""}`} onClick={() => setSelectedCandidateId(candidate.instanceId)}><i>{candidate.icon}</i><span>{candidate.name}</span><b>{candidate.isEquipped ? "EQUIPPED" : candidate.isLocked ? "🔒 LOCKED" : candidate.rarity.toUpperCase()}</b></button>)}</div> : <p style={{ fontSize: "11px", color: "#7fa0ac" }}>No alternative gear in inventory compatible with {slot} slot.</p>}
      </Panel>
      {activeCandidate && <Panel title="GEAR STAT COMPARISON & DELTAS">
        <div className="comparison" style={{ marginBottom: "14px" }}><div className="candidate-preview"><p className="eyebrow">EQUIPPED ({equippedItem ? slot : "NONE"})</p><h2>{equippedItem ? equippedItem.name : "EMPTY"}</h2><p>{equippedItem ? equippedItem.description : "No item equipped"}</p></div><b>➔</b><div className="candidate-preview"><p className="eyebrow">CANDIDATE</p><h2>{activeCandidate.name}</h2><p>{activeCandidate.description}</p></div></div>
        <div style={{ background: "#08131a", padding: "12px", border: "1px solid #1d3e4c", marginBottom: "14px" }}><p className="eyebrow">STAT DELTA BREAKDOWN</p>{statDeltas.length > 0 ? <div style={{ display: "grid", gap: "6px", fontSize: "11px", marginTop: "8px" }}>{statDeltas.map((delta) => <div key={delta.statName} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: "#0c1b26", borderLeft: `3px solid ${delta.delta > 0 ? "#4ee88a" : delta.delta < 0 ? "#ff5868" : "#3b5866"}` }}><span>{delta.statName}</span><span>{delta.equippedValue} ➔ {delta.candidateValue} <strong style={{ color: delta.delta > 0 ? "#4ee88a" : delta.delta < 0 ? "#ff5868" : "#8fa8b2", marginLeft: "6px" }}>({delta.delta >= 0 ? `+${delta.delta}` : delta.delta})</strong></span></div>)}</div> : <p style={{ fontSize: "10px", color: "#8fa8b2" }}>No direct stat modifiers recorded on either item.</p>}</div>
        <div style={{ marginBottom: "14px", fontSize: "10px", color: "#a5b9c0" }}>{requirements.met ? <p style={{ color: "#62ef98" }}>✓ ITEM REQUIREMENTS MET</p> : <div style={{ color: "#ff737d" }}><p>❌ REQUIREMENTS UNMET:</p>{requirements.details.filter((detail) => !detail.met).map((detail) => <span key={detail.key} style={{ display: "block", marginLeft: "10px" }}>• Requires {detail.key}: {detail.required} (Current: {detail.current})</span>)}</div>}</div>
        <div className="actions" style={{ flexWrap: "wrap", gap: "6px" }}>
          {activeCandidate.instanceId !== equippedItem?.instanceId && <button style={{ background: requirements.met ? "#0e3a24" : "#2a1818", borderColor: requirements.met ? "#2de079" : "#633030", color: requirements.met ? "#62ef98" : "#8a5858", cursor: requirements.met ? "pointer" : "not-allowed" }} disabled={!requirements.met} onClick={() => actions.equipItem(activeCandidate.instanceId, slot)}>EQUIP GEAR ⚔</button>}
          {activeCandidate.durability && activeCandidate.durability.current < activeCandidate.durability.max && <button style={{ background: "#212d12", borderColor: "#86c934", color: "#bcf26d" }} onClick={() => actions.repairItem(activeCandidate.instanceId)}>REPAIR 🛠</button>}
          <button style={{ background: "#0e2330", borderColor: "#30729e", color: "#86cbff" }} onClick={() => actions.toggleItemLock(activeCandidate.instanceId)}>{activeCandidate.isLocked ? "UNLOCK 🔒" : "LOCK 🔓"}</button>
          <button style={{ background: "#0c1b26", borderColor: "#2d5266", color: "#a1d4e6" }} onClick={() => onOpenProvenance(activeCandidate)}>PROVENANCE 🔍</button>
          {!activeCandidate.isEquipped && <button style={{ background: activeCandidate.isLocked ? "#201214" : "#2e1215", borderColor: activeCandidate.isLocked ? "#4d2226" : "#d14b54", color: activeCandidate.isLocked ? "#6e4246" : "#ff8a90", cursor: activeCandidate.isLocked ? "not-allowed" : "pointer" }} disabled={activeCandidate.isLocked} onClick={() => actions.discardItem(activeCandidate.instanceId)}>DISCARD 🗑️</button>}
        </div>
      </Panel>}
    </div>
  </div>;
}
