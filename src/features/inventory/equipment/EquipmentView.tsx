import type {
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../../../../app/domain/types.ts";
import { TelemetryBadge } from "../../timeline/public.ts";
import { Panel } from "../../../shared/ui/Panel.tsx";
import type { EquipmentSlot, InventoryActions } from "../../../application/crawler-action-contracts.ts";
import type { DerivedEquipmentPresentation } from "./equipment-presentation.ts";
import type { RequirementDetail } from "../../../../app/domain/stats.ts";
import styles from "./EquipmentView.module.css";

export function EquipmentView({
  presentation,
  selectedSequence,
  slot,
  setSlot,
  setSelectedCandidateId,
  actions,
  onOpenProvenance,
  onInspectObservation,
}: {
  presentation: DerivedEquipmentPresentation;
  selectedSequence?: number;
  slot: EquipmentSlot;
  setSlot: (v: EquipmentSlot) => void;
  setSelectedCandidateId: (id: string | null) => void;
  actions: InventoryActions;
  onOpenProvenance: (item: InventoryItem) => void;
  onInspectObservation?: (
    obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation,
  ) => void;
}) {
  const {
    slots,
    equippedItem,
    slotObservation,
    slotCandidates,
    activeCandidate,
    requirements,
    statDeltas,
    candidateActions,
    canUnequipEquipped,
  } = presentation;

  return (
    <div className={styles.equipmentWorkspace}>
      <Panel title="ADAPTIVE LOADOUT · PRIMAL">
        <p className={styles.slotNote}>
          Click a body slot to inspect equipped gear, compare inventory candidates, and evaluate stat deltas.
        </p>
        <div className={styles.loadoutDiagram}>
          <div className={styles.bodyCore}>◉</div>
          {slots.map((s, index) => {
            const isSelected = slot === s.slot;
            const slotIndexClass = styles[`s${index}` as keyof typeof styles] ?? "";
            return (
              <button
                key={s.slot}
                className={`${styles.bodySlot} ${slotIndexClass} ${isSelected ? styles.selected : ""}`}
                onClick={() => {
                  setSlot(s.slot);
                  setSelectedCandidateId(null);
                }}
              >
                <i>{s.icon}</i>
                <span>
                  {s.slot}
                  {s.observation && (
                    <span style={{ marginLeft: "4px", color: "#1bd9ff" }}>📡</span>
                  )}
                </span>
                <small>
                  {s.observation
                    ? s.observedOccupant
                      ? s.observedOccupant.name
                      : s.observation.itemInstanceId || "— Empty Slot"
                    : s.occupant
                      ? s.occupant.name
                      : "— Empty Slot"}
                </small>
              </button>
            );
          })}
        </div>
        <div className={styles.slotLegend}>
          <span>◉ Occupied</span>
          <span>◇ Special</span>
          <span>— Empty Slot</span>
        </div>
      </Panel>

      <div style={{ display: "grid", gap: "18px" }}>
        <Panel title={`SLOT INSPECTOR · ${slot}`}>
          {slotObservation && (
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10px",
                color: "#7ee5ff",
              }}
            >
              SLOT OBSERVATION: {slotObservation.itemInstanceId || "EMPTY"}
              <TelemetryBadge
                observation={slotObservation}
                selectedSequence={selectedSequence}
                onClick={() => onInspectObservation?.(slotObservation)}
              />
            </p>
          )}

          {equippedItem ? (
            <div
              style={{
                marginBottom: "14px",
                paddingBottom: "12px",
                borderBottom: "1px solid #1f3e4d",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <p className="eyebrow">CURRENTLY EQUIPPED IN {slot}</p>
                  <h2>{equippedItem.name.toUpperCase()}</h2>
                </div>
                <button
                  style={{
                    background: canUnequipEquipped ? "#2a0e12" : "#1a1214",
                    border: canUnequipEquipped ? "1px solid #d5555e" : "1px solid #4a2226",
                    color: canUnequipEquipped ? "#ff8a80" : "#7e5256",
                    fontSize: "9px",
                    padding: "6px 10px",
                    cursor: canUnequipEquipped ? "pointer" : "not-allowed",
                  }}
                  disabled={!canUnequipEquipped}
                  onClick={() => canUnequipEquipped && actions.unequipItem(equippedItem.instanceId)}
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
            <div className={styles.candidateGrid}>
              {slotCandidates.map((candidate) => {
                const rarityClass = styles[candidate.rarity as keyof typeof styles] ?? "";
                return (
                  <button
                    key={candidate.instanceId}
                    className={`${styles.candidate} ${rarityClass} ${
                      activeCandidate?.instanceId === candidate.instanceId ? styles.selected : ""
                    }`}
                    onClick={() => setSelectedCandidateId(candidate.instanceId)}
                  >
                    <i>{candidate.icon}</i>
                    <span>{candidate.name}</span>
                    <b>
                      {candidate.isEquipped
                        ? "EQUIPPED"
                        : candidate.isLocked
                          ? "🔒 LOCKED"
                          : candidate.rarity.toUpperCase()}
                    </b>
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: "11px", color: "#7fa0ac" }}>
              No alternative gear in inventory compatible with {slot} slot.
            </p>
          )}
        </Panel>

        {activeCandidate && (
          <Panel title="GEAR STAT COMPARISON & DELTAS">
            <div className={styles.comparison} style={{ marginBottom: "14px" }}>
              <div className={styles.candidatePreview}>
                <p className="eyebrow">EQUIPPED ({equippedItem ? slot : "NONE"})</p>
                <h2>{equippedItem ? equippedItem.name : "EMPTY"}</h2>
                <p>{equippedItem ? equippedItem.description : "No item equipped"}</p>
              </div>
              <b>➔</b>
              <div className={styles.candidatePreview}>
                <p className="eyebrow">CANDIDATE</p>
                <h2>{activeCandidate.name}</h2>
                <p>{activeCandidate.description}</p>
              </div>
            </div>

            <div
              style={{
                background: "#08131a",
                padding: "12px",
                border: "1px solid #1d3e4c",
                marginBottom: "14px",
              }}
            >
              <p className="eyebrow">STAT DELTA BREAKDOWN</p>
              {statDeltas.length > 0 ? (
                <div style={{ display: "grid", gap: "6px", fontSize: "11px", marginTop: "8px" }}>
                  {statDeltas.map((delta) => (
                    <div
                      key={delta.statName}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        background: "#0c1b26",
                        borderLeft: `3px solid ${
                          delta.delta > 0 ? "#4ee88a" : delta.delta < 0 ? "#ff5868" : "#3b5866"
                        }`,
                      }}
                    >
                      <span>{delta.statName}</span>
                      <span>
                        {delta.equippedValue} ➔ {delta.candidateValue}{" "}
                        <strong
                          style={{
                            color:
                              delta.delta > 0
                                ? "#4ee88a"
                                : delta.delta < 0
                                  ? "#ff5868"
                                  : "#8fa8b2",
                            marginLeft: "6px",
                          }}
                        >
                          ({delta.delta >= 0 ? `+${delta.delta}` : delta.delta})
                        </strong>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "10px", color: "#8fa8b2" }}>
                  No direct stat modifiers recorded on either item.
                </p>
              )}
            </div>

            <div style={{ marginBottom: "14px", fontSize: "10px", color: "#a5b9c0" }}>
              {requirements.met ? (
                <p style={{ color: "#62ef98" }}>✓ ITEM REQUIREMENTS MET</p>
              ) : (
                <div style={{ color: "#ff737d" }}>
                  <p>❌ REQUIREMENTS UNMET:</p>
                  {requirements.details
                    .filter((detail: RequirementDetail) => !detail.met)
                    .map((detail: RequirementDetail) => (
                      <span key={detail.key} style={{ display: "block", marginLeft: "10px" }}>
                        • Requires {detail.key}: {detail.required} (Current: {detail.current})
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="actions" style={{ flexWrap: "wrap", gap: "6px" }}>
              {activeCandidate.instanceId !== equippedItem?.instanceId && (
                <button
                  style={{
                    background: candidateActions.canEquip ? "#0e3a24" : "#2a1818",
                    borderColor: candidateActions.canEquip ? "#2de079" : "#633030",
                    color: candidateActions.canEquip ? "#62ef98" : "#8a5858",
                    cursor: candidateActions.canEquip ? "pointer" : "not-allowed",
                  }}
                  disabled={!candidateActions.canEquip}
                  onClick={() =>
                    candidateActions.canEquip && actions.equipItem(activeCandidate.instanceId, slot)
                  }
                >
                  EQUIP GEAR ⚔
                </button>
              )}
              {activeCandidate.durability &&
                activeCandidate.durability.current < activeCandidate.durability.max && (
                  <button
                    style={{
                      background: candidateActions.canRepair ? "#212d12" : "#141c10",
                      borderColor: candidateActions.canRepair ? "#86c934" : "#3b581e",
                      color: candidateActions.canRepair ? "#bcf26d" : "#5d783d",
                      cursor: candidateActions.canRepair ? "pointer" : "not-allowed",
                    }}
                    disabled={!candidateActions.canRepair}
                    onClick={() =>
                      candidateActions.canRepair && actions.repairItem(activeCandidate.instanceId)
                    }
                  >
                    REPAIR 🛠
                  </button>
                )}
              <button
                style={{
                  background: candidateActions.canToggleLock ? "#0e2330" : "#111a24",
                  borderColor: candidateActions.canToggleLock ? "#30729e" : "#234054",
                  color: candidateActions.canToggleLock ? "#86cbff" : "#51748f",
                  cursor: candidateActions.canToggleLock ? "pointer" : "not-allowed",
                }}
                disabled={!candidateActions.canToggleLock}
                onClick={() =>
                  candidateActions.canToggleLock && actions.toggleItemLock(activeCandidate.instanceId)
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
                    background: candidateActions.canDiscard ? "#2e1215" : "#201214",
                    borderColor: candidateActions.canDiscard ? "#d14b54" : "#4d2226",
                    color: candidateActions.canDiscard ? "#ff8a90" : "#6e4246",
                    cursor: candidateActions.canDiscard ? "pointer" : "not-allowed",
                  }}
                  disabled={!candidateActions.canDiscard}
                  onClick={() =>
                    candidateActions.canDiscard && actions.discardItem(activeCandidate.instanceId)
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
