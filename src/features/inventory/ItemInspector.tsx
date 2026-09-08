import type {
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../../../app/domain/types";
import { Panel } from "../../shared/ui/Panel";
import { TelemetryBadge } from "../timeline/evidence/TelemetryBadge";
import type { InventoryActions } from "../../application/crawler-actions";

export function ItemInspector({
  selectedItem,
  observation,
  requirementResult,
  actions,
  onOpenProvenance,
  onInspectObservation,
}: {
  selectedItem: InventoryItem;
  observation?: ProjectedItemObservation | ProjectedEquipmentObservation;
  requirementResult: { met: boolean; details: { key: string; required: number; current: number; met: boolean }[] };
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

  return (
    <Panel title="ITEM INSPECTOR">
      <div className={`large-icon ${selectedItem.rarity}`}>
        {selectedItem.icon}
      </div>
      <h2>{selectedItem.name.toUpperCase()}</h2>
      <p className="rarity">
        {selectedItem.rarity} {selectedItem.isEquipped ? "· EQUIPPED" : ""}
        {observation && (
          <TelemetryBadge
            observation={observation}
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
      <div className="actions" style={{ flexWrap: "wrap", gap: "6px" }}>
        {(selectedItem.category === "CONSUMABLES" ||
          selectedItem.category === "consumable") && (
          <button
            style={{
              background: "#0e3a24",
              borderColor: "#2de079",
              color: "#62ef98",
            }}
            onClick={() =>
              actions.consumeItem(selectedItem.instanceId)
            }
          >
            USE CONSUMABLE 🧪
          </button>
        )}
        {(selectedItem.category === "EQUIPMENT" ||
          selectedItem.category === "equipment") && (
          <button
            style={
              selectedItem.isEquipped
                ? {
                    background: "#2a0e12",
                    borderColor: "#d5555e",
                    color: "#ff8a80",
                  }
                : requirementResult.met
                  ? {
                      background: "#0e3a24",
                      borderColor: "#2de079",
                      color: "#62ef98",
                    }
                  : {
                      background: "#2a1818",
                      borderColor: "#633030",
                      color: "#8a5858",
                      cursor: "not-allowed",
                    }
            }
            disabled={!selectedItem.isEquipped && !requirementResult.met}
            onClick={() => {
              if (!selectedItem.isEquipped && !requirementResult.met) return;
              if (selectedItem.isEquipped) actions.unequipItem(selectedItem.instanceId);
              else actions.equipItem(selectedItem.instanceId);
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
              .filter((detail) => !detail.met)
              .map(
                (detail) =>
                  `${detail.key} ${detail.required} (current: ${detail.current})`,
              )
              .join(", ")}
          </p>
        )}
        <button
          style={{
            background: "#0e2330",
            borderColor: "#30729e",
            color: "#86cbff",
          }}
          onClick={() =>
            actions.toggleItemLock(selectedItem.instanceId)
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
              background: selectedItem.isLocked ? "#201214" : "#2e1215",
              borderColor: selectedItem.isLocked ? "#4d2226" : "#d14b54",
              color: selectedItem.isLocked ? "#6e4246" : "#ff8a90",
              cursor: selectedItem.isLocked ? "not-allowed" : "pointer",
            }}
            disabled={selectedItem.isLocked}
            onClick={() =>
              actions.discardItem(selectedItem.instanceId)
            }
          >
            DISCARD 🗑️
          </button>
        )}
      </div>
    </Panel>
  );
}
