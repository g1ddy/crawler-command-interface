import type { InventoryCategoryPresentation } from "./inventory-presentation.ts";
import { Panel } from "../../shared/ui/Panel.tsx";
import styles from "./InventoryView.module.css";

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
      <div className={styles.categories}>
        {categories.map((category) => (
          <button
            className={filter === category.id ? styles.on : ""}
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
