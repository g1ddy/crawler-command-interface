import type {
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";
import { Panel } from "../../shared/ui/Panel.tsx";
import { TelemetryBadge } from "../timeline/public.ts";
import type { InventoryActions } from "../../application/crawler-action-contracts.ts";
import type { InventoryItemActionCapabilities } from "./inventory-presentation.ts";
import type { RequirementDetail, RequirementResult } from "../../../app/domain/stats.ts";
import styles from "./InventoryView.module.css";

export function ItemInspector({
  selectedItem,
  observation,
  selectedSequence,
  requirementResult,
  actionCapabilities,
  actions,
  onOpenProvenance,
  onInspectObservation,
}: {
  selectedItem: InventoryItem;
  observation?: ProjectedItemObservation;
  selectedSequence?: number;
  requirementResult: RequirementResult;
  actionCapabilities: InventoryItemActionCapabilities;
  actions: InventoryActions;
  onOpenProvenance: (item: InventoryItem) => void;
  onInspectObservation: (
    obs:
      | ProjectedObservationValue
      | ProjectedItemObservation
      | ProjectedEquipmentObservation,
  ) => void;
}) {
  const selectedItemObservationDetails = observation
    ? [
        typeof observation.present === "boolean"
          ? observation.present
            ? "PRESENT"
            : "ABSENT"
          : null,
        observation.quantity?.known
          ? `QTY ${observation.quantity.value}`
          : null,
        typeof observation.isEquipped === "boolean"
          ? observation.isEquipped
            ? "EQUIPPED"
            : "UNEQUIPPED"
          : null,
      ].filter((detail): detail is string => detail !== null)
    : [];

  const isConsumable =
    selectedItem.category === "CONSUMABLES" || selectedItem.category === "consumable";
  const isEquipment =
    selectedItem.category === "EQUIPMENT" || selectedItem.category === "equipment";

  const rarityClass = styles[selectedItem.rarity as keyof typeof styles] ?? "";

  return (
    <Panel title="ITEM INSPECTOR">
      <div className={`${styles.largeIcon} ${rarityClass}`}>
        {selectedItem.icon}
      </div>
      <h2>{selectedItem.name.toUpperCase()}</h2>
      <p className="rarity">
        {selectedItem.rarity} {selectedItem.isEquipped ? "· EQUIPPED" : ""}
        {observation && (
          <TelemetryBadge
            observation={observation}
            selectedSequence={selectedSequence}
            onClick={() => onInspectObservation(observation)}
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
          <dd>
            {selectedItem.value > 0 ? `${selectedItem.value} ⊙` : "NOT SOURCED"}
          </dd>
        </div>
        <div>
          <dt>STACK</dt>
          <dd>
            {selectedItem.quantityObject && !selectedItem.quantityObject.known
              ? selectedItem.quantityObject.minimum
                ? `≥${selectedItem.quantityObject.minimum} / ${selectedItem.maxStack} (Unknown)`
                : `Unknown / ${selectedItem.maxStack}`
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
            <dd>
              {selectedItem.durability.current} / {selectedItem.durability.max}
            </dd>
          </div>
        )}
      </dl>
      {selectedItem.stats && (
        <div
          style={{
            marginBottom: "12px",
            fontSize: "10px",
            color: "#6fe8f7",
          }}
        >
          <strong>ITEM STATS:</strong>
          {Object.entries(selectedItem.stats).map(([key, value]) => (
            <p key={key} style={{ margin: "2px 0" }}>
              + {value} {key}
            </p>
          ))}
        </div>
      )}
      <div className={styles.actions} style={{ flexWrap: "wrap", gap: "6px" }}>
        {isConsumable && (
          <button
            style={{
              background: actionCapabilities.canConsume ? "#0e3a24" : "#1a241e",
              borderColor: actionCapabilities.canConsume ? "#2de079" : "#3b5e4c",
              color: actionCapabilities.canConsume ? "#62ef98" : "#6c8c77",
              cursor: actionCapabilities.canConsume ? "pointer" : "not-allowed",
            }}
            disabled={!actionCapabilities.canConsume}
            onClick={() =>
              actionCapabilities.canConsume && actions.consumeItem(selectedItem.instanceId)
            }
          >
            USE CONSUMABLE 🧪
          </button>
        )}
        {isEquipment && (
          <button
            style={
              selectedItem.isEquipped
                ? {
                    background: actionCapabilities.canUnequip ? "#2a0e12" : "#1a1214",
                    borderColor: actionCapabilities.canUnequip ? "#d5555e" : "#4a2226",
                    color: actionCapabilities.canUnequip ? "#ff8a80" : "#7e5256",
                    cursor: actionCapabilities.canUnequip ? "pointer" : "not-allowed",
                  }
                : actionCapabilities.canEquip
                  ? {
                      background: "#0e3a24",
                      borderColor: "#2de079",
                      color: "#62ef98",
                      cursor: "pointer",
                    }
                  : {
                      background: "#2a1818",
                      borderColor: "#633030",
                      color: "#8a5858",
                      cursor: "not-allowed",
                    }
            }
            disabled={
              selectedItem.isEquipped ? !actionCapabilities.canUnequip : !actionCapabilities.canEquip
            }
            onClick={() => {
              if (selectedItem.isEquipped) {
                if (actionCapabilities.canUnequip) actions.unequipItem(selectedItem.instanceId);
              } else {
                if (actionCapabilities.canEquip) actions.equipItem(selectedItem.instanceId);
              }
            }}
          >
            {selectedItem.isEquipped ? "UNEQUIP GEAR ✕" : "EQUIP GEAR ⚔"}
          </button>
        )}
        {!selectedItem.isEquipped && !requirementResult.met && (
          <p
            style={{
              width: "100%",
              margin: 0,
              color: "#ff737d",
              fontSize: "9px",
            }}
          >
            Requirements unmet:{" "}
            {requirementResult.details
              .filter((detail: RequirementDetail) => !detail.met)
              .map(
                (detail: RequirementDetail) =>
                  `${detail.key} ${detail.required} (current: ${detail.current})`,
              )
              .join(", ")}
          </p>
        )}
        <button
          style={{
            background: actionCapabilities.canToggleLock ? "#0e2330" : "#131b24",
            borderColor: actionCapabilities.canToggleLock ? "#30729e" : "#223d4f",
            color: actionCapabilities.canToggleLock ? "#86cbff" : "#577794",
            cursor: actionCapabilities.canToggleLock ? "pointer" : "not-allowed",
          }}
          disabled={!actionCapabilities.canToggleLock}
          onClick={() =>
            actionCapabilities.canToggleLock && actions.toggleItemLock(selectedItem.instanceId)
          }
        >
          {selectedItem.isLocked ? "UNLOCK 🔒" : "LOCK 🔓"}
        </button>
        <button onClick={() => onOpenProvenance(selectedItem)}>
          PROVENANCE LIFECYCLE 🔍
        </button>
        {!selectedItem.isEquipped && (
          <button
            style={{
              background: actionCapabilities.canDiscard ? "#2e1215" : "#201214",
              borderColor: actionCapabilities.canDiscard ? "#d14b54" : "#4d2226",
              color: actionCapabilities.canDiscard ? "#ff8a90" : "#6e4246",
              cursor: actionCapabilities.canDiscard ? "pointer" : "not-allowed",
            }}
            disabled={!actionCapabilities.canDiscard}
            onClick={() =>
              actionCapabilities.canDiscard && actions.discardItem(selectedItem.instanceId)
            }
          >
            DISCARD 🗑️
          </button>
        )}
      </div>
    </Panel>
  );
}
