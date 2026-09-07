import type { CrawlerState } from "../../../app/domain/types";
import { Panel } from "../../shared/ui/Panel";

export function EquippedGearSummary({
  state,
  setFilter,
}: {
  state: CrawlerState;
  setFilter: (filter: string) => void;
}) {
  return (
    <Panel title="EQUIPPED GEAR SLOTS">
      <div className="compact">
        {Object.entries(state.equippedSlots).filter(([, itemId]) => itemId)
          .length > 0 ? (
          Object.entries(state.equippedSlots)
            .filter(([, itemId]) => itemId)
            .map(([gearSlot, itemId]) => (
              <span key={gearSlot}>
                {gearSlot}:{" "}
                {state.inventory.find((item) => item.instanceId === itemId)
                  ?.name ?? "UNKNOWN ITEM"}
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
