import { useMemo, useState } from "react";
import type {
  InventoryItem,



  ProjectedObservationsState,
} from "../../../app/domain/types";
import { Panel } from "../../shared/ui/Panel";

export function InventoryItemBrowser({
  items,
  observations,
  filter,
  selectedInstanceId,
  setSelectedInstanceId,
}: {
  items: InventoryItem[];
  observations: ProjectedObservationsState;
  filter: string;
  selectedInstanceId: string | null;
  setSelectedInstanceId: (id: string | null) => void;
}) {
  const [sortOrder, setSortOrder] = useState("newest");
  const [search, setSearch] = useState("");

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
        filter === "ALL ITEMS"
          ? true
          : filter === "EQUIPMENT"
            ? item.category === "EQUIPMENT" || item.category === "equipment"
            : filter === "CONSUMABLES"
              ? item.category === "CONSUMABLES" ||
                item.category === "consumable"
              : filter === "QUEST ITEMS"
                ? item.category === "QUEST ITEMS" ||
                  item.category === "quest-item"
                : filter === "CRAFTING"
                  ? item.category === "CRAFTING" || item.category === "crafting"
                  : true;
      return (
        matchesCategory &&
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    });
    return matched.sort((a, b) =>
      sortOrder === "newest"
        ? b.acquiredAtSequence - a.acquiredAtSequence
        : sortOrder === "oldest"
          ? a.acquiredAtSequence - b.acquiredAtSequence
          : sortOrder === "rarity"
            ? (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0)
            : sortOrder === "value"
              ? b.value - a.value
              : sortOrder === "name"
                ? a.name.localeCompare(b.name)
                : 0,
    );
  }, [items, filter, search, sortOrder]);

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
          onChange={(event) => setSortOrder(event.target.value)}
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
          {filteredItems.map((item) => {
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
