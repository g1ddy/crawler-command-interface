import type {
  InventoryItem,
  ProjectedObservationsState,
} from "../../../app/domain/types";
import { Panel } from "../../shared/ui/Panel";
import type { InventorySortOrder } from "./inventoryItemBrowserModel";

export function InventoryItemBrowser({
  visibleItems,
  observations,
  filter,
  search,
  setSearch,
  sortOrder,
  setSortOrder,
  selectedInstanceId,
  setSelectedInstanceId,
}: {
  visibleItems: InventoryItem[];
  observations: ProjectedObservationsState;
  filter: string;
  search: string;
  setSearch: (search: string) => void;
  sortOrder: InventorySortOrder;
  setSortOrder: (sortOrder: InventorySortOrder) => void;
  selectedInstanceId: string | null;
  setSelectedInstanceId: (id: string | null) => void;
}) {
  return (
    <Panel title={filter}>
      <div className="tools">
        <input
          placeholder="Search items…"
          aria-label="Search items"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Sort items"
          value={sortOrder}
          onChange={(event) =>
            setSortOrder(event.target.value as InventorySortOrder)
          }
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
      {visibleItems.length > 0 ? (
        <div className="grid">
          {visibleItems.map((item) => {
            const observation = observations.inventory[item.instanceId];
            return (
              <button
                className={`item ${item.rarity} ${
                  selectedInstanceId === item.instanceId ? "selected" : ""
                }`}
                key={item.instanceId}
                onClick={() => setSelectedInstanceId(item.instanceId)}
                aria-label={`${item.name} (${item.rarity})`}
              >
                <i>{item.icon}</i>
                <b>
                  {item.quantityObject && !item.quantityObject.known
                    ? item.quantityObject.minimum
                      ? `≥${item.quantityObject.minimum}`
                      : "?"
                    : item.quantity}
                </b>
                {observation && (
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      fontSize: "9px",
                    }}
                  >
                    📡
                  </span>
                )}
                <small>{item.name}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize: "11px", color: "#8fa1aa" }}>
          No items match current filter.
        </p>
      )}
    </Panel>
  );
}
