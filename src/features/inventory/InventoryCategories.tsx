import type { InventoryCategoryPresentation } from "./inventory-presentation";
import { Panel } from "../../shared/ui/Panel";

export function InventoryCategories({
  categories,
  filter,
  setFilter,
}: {
  categories: InventoryCategoryPresentation[];
  filter: string;
  setFilter: (f: string) => void;
}) {
  return (
    <Panel title="CATEGORIES">
      <div className="categories">
        {categories.map((category) => (
          <button
            className={filter === category.id ? "on" : ""}
            onClick={() => setFilter(category.id)}
            key={category.id}
          >
            {category.label}
            <b>{category.count}</b>
          </button>
        ))}
      </div>
    </Panel>
  );
}
