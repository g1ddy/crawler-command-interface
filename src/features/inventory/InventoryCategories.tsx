import type { InventoryItem } from "../../../app/domain/types";
import { Panel } from "../../shared/ui/Panel";

export function InventoryCategories({
  items,
  awardsCount,
  filter,
  setFilter,
}: {
  items: InventoryItem[];
  awardsCount: number;
  filter: string;
  setFilter: (f: string) => void;
}) {
  const categories = [
    "ALL ITEMS",
    "EQUIPMENT",
    "CONSUMABLES",
    "QUEST ITEMS",
    "CRAFTING",
    ...(awardsCount > 0 || filter === "AWARDS / BOXES"
      ? ["AWARDS / BOXES"]
      : []),
  ];

  return (
    <Panel title="CATEGORIES">
      <div className="categories">
        {categories.map((category) => (
          <button
            className={filter === category ? "on" : ""}
            onClick={() => setFilter(category)}
            key={category}
          >
            {category}
            <b>
              {category === "AWARDS / BOXES"
                ? awardsCount
                : category === "ALL ITEMS"
                  ? items.length
                  : items.filter((item) => item.category === category).length}
            </b>
          </button>
        ))}
      </div>
    </Panel>
  );
}
