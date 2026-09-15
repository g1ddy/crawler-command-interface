import type { EquippedGearSummaryItem } from "./inventory-presentation.ts";
import { Panel } from "../../shared/ui/Panel.tsx";
import styles from "./InventoryView.module.css";

export function EquippedGearSummary({
  equippedSummary,
  setFilter,
}: {
  equippedSummary: EquippedGearSummaryItem[];
  setFilter: (filter: string) => void;
}) {
  return (
    <Panel title="EQUIPPED GEAR SLOTS">
      <div className={styles.compact}>
        {equippedSummary.length > 0 ? (
          equippedSummary.map(({ slot, itemName }) => (
            <span key={slot}>
              {slot}: {itemName}
            </span>
          ))
        ) : (
          <span>No equipped gear is sourced at this sequence.</span>
        )}
      </div>
      <button className="link" onClick={() => setFilter("EQUIPMENT")}>
        Open equipment slot matrix →
      </button>
    </Panel>
  );
}
