import type { InventoryItem } from "../../../app/domain/types";

export type InventorySortOrder =
  | "newest"
  | "oldest"
  | "rarity"
  | "value"
  | "name";

const rarityRank: Record<string, number> = {
  celestial: 9,
  legendary: 8,
  epic: 7,
  rare: 6,
  platinum: 5,
  gold: 4,
  silver: 3,
  bronze: 2,
  uncommon: 1,
  common: 0,
};

function matchesInventoryFilter(item: InventoryItem, filter: string) {
  switch (filter) {
    case "ALL ITEMS":
      return true;
    case "EQUIPMENT":
      return item.category === "EQUIPMENT" || item.category === "equipment";
    case "CONSUMABLES":
      return item.category === "CONSUMABLES" || item.category === "consumable";
    case "QUEST ITEMS":
      return item.category === "QUEST ITEMS" || item.category === "quest-item";
    case "CRAFTING":
      return item.category === "CRAFTING" || item.category === "crafting";
    default:
      return true;
  }
}

export function visibleInventoryItems(
  items: InventoryItem[],
  filter: string,
  search: string,
  sortOrder: InventorySortOrder,
) {
  const normalizedSearch = search.trim().toLowerCase();
  const matched = items.filter(
    (item) =>
      matchesInventoryFilter(item, filter) &&
      item.name.toLowerCase().includes(normalizedSearch),
  );

  return matched.sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        return b.acquiredAtSequence - a.acquiredAtSequence;
      case "oldest":
        return a.acquiredAtSequence - b.acquiredAtSequence;
      case "rarity":
        return (rarityRank[b.rarity] ?? -1) - (rarityRank[a.rarity] ?? -1);
      case "value":
        return b.value - a.value;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

export function resolveSelectedInventoryItem(
  visibleItems: InventoryItem[],
  selectedInstanceId: string | null,
) {
  if (selectedInstanceId) {
    const selectedItem = visibleItems.find(
      (item) => item.instanceId === selectedInstanceId,
    );
    if (selectedItem) return selectedItem;
  }

  return visibleItems[0];
}
