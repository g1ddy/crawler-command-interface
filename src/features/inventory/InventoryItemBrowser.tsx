import type {
  InventoryItem,
  ProjectedItemObservation,
} from "../../../app/domain/types.ts";
import { Panel } from "../../shared/ui/Panel.tsx";
import type { InventorySortOrder } from "./inventoryItemBrowserModel.ts";
import styles from "./InventoryView.module.css";

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
  observations: Record<string, ProjectedItemObservation | undefined>;
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
      <div className={styles.tools}>
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
        >
          <option value="newest">SORT: NEWEST ⌄</option>
          <option value="oldest">SORT: OLDEST ⌄</option>
          <option value="rarity">SORT: RARITY ⌄</option>
          <option value="value">SORT: VALUE ⌄</option>
          <option value="name">SORT: NAME ⌄</option>
        </select>
      </div>
      {visibleItems.length > 0 ? (
        <div className={styles.grid}>
          {visibleItems.map((item) => {
            const observation = observations[item.instanceId];
            const rarityClass = styles[item.rarity as keyof typeof styles] ?? "";
            return (
              <button
                className={`${styles.item} ${rarityClass} ${
                  selectedInstanceId === item.instanceId ? styles.selected : ""
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
