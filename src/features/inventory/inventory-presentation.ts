import type {
  AttributeName,
  EquippedSlotMap,
  InventoryItem,
  ProjectedItemObservation,
} from "../../../app/domain/types.ts";
import { checkItemRequirements, type RequirementResult } from "../../../app/domain/stats.ts";
import {
  resolveSelectedInventoryItem,
  visibleInventoryItems,
  type InventorySortOrder,
} from "./inventoryItemBrowserModel.ts";
import type { EquipmentSlot } from "../../application/crawler-action-contracts.ts";

export interface InventoryCategoryPresentation {
  id: string;
  label: string;
  count: number;
}

export interface EquippedGearSummaryItem {
  slot: EquipmentSlot;
  itemInstanceId: string;
  itemName: string;
}

export interface InventoryItemActionCapabilities {
  canConsume: boolean;
  canEquip: boolean;
  canUnequip: boolean;
  canToggleLock: boolean;
  canDiscard: boolean;
}

export interface DerivedInventoryPresentation {
  items: InventoryItem[];
  itemCount: number;
  categories: InventoryCategoryPresentation[];
  visibleItems: InventoryItem[];
  selectedItem?: InventoryItem;
  selectedItemObservation?: ProjectedItemObservation;
  selectedItemRequirements: RequirementResult;
  selectedItemActions: InventoryItemActionCapabilities;
  equippedSummary: EquippedGearSummaryItem[];
}

export interface DeriveInventoryPresentationInput {
  inventory: InventoryItem[];
  equippedSlots: EquippedSlotMap | Record<string, string | null | undefined>;
  observations: Record<string, ProjectedItemObservation | undefined>;
  crawler: { attributes?: Partial<Record<AttributeName, number>>; level?: number; class?: string; race?: string };
  liveCrawler?: { attributes?: Partial<Record<AttributeName, number>>; level?: number; class?: string; race?: string };
  filter: string;
  search: string;
  sortOrder: InventorySortOrder;
  selectedInstanceId: string | null;
  awardsCount: number;
  isLive?: boolean;
}

export function deriveInventoryPresentation(
  input: DeriveInventoryPresentationInput,
): DerivedInventoryPresentation {
  const {
    inventory,
    equippedSlots,
    observations,
    crawler,
    liveCrawler = crawler,
    filter,
    search,
    sortOrder,
    selectedInstanceId,
    awardsCount,
    isLive = true,
  } = input;

  const visibleItems = visibleInventoryItems(inventory, filter, search, sortOrder);
  const selectedItem = resolveSelectedInventoryItem(visibleItems, selectedInstanceId);

  const selectedItemRequirements = checkItemRequirements(
    liveCrawler as Parameters<typeof checkItemRequirements>[0],
    selectedItem?.requirements,
  );

  const selectedItemObservation = selectedItem
    ? observations[selectedItem.instanceId]
    : undefined;

  const isConsumable =
    selectedItem?.category === "CONSUMABLES" || selectedItem?.category === "consumable";
  const isEquipment =
    selectedItem?.category === "EQUIPMENT" || selectedItem?.category === "equipment";

  const selectedItemActions: InventoryItemActionCapabilities = {
    canConsume: isLive && Boolean(isConsumable),
    canEquip: isLive && Boolean(isEquipment) && !selectedItem?.isEquipped && selectedItemRequirements.met,
    canUnequip: isLive && Boolean(isEquipment) && Boolean(selectedItem?.isEquipped),
    canToggleLock: isLive && Boolean(selectedItem),
    canDiscard: isLive && Boolean(selectedItem) && !selectedItem?.isEquipped && !selectedItem?.isLocked,
  };

  const inventoryByInstanceId = new Map(inventory.map((item) => [item.instanceId, item]));

  const equippedSummary: EquippedGearSummaryItem[] = Object.entries(equippedSlots)
    .filter((entry): entry is [EquipmentSlot, string] => Boolean(entry[1]))
    .map(([slot, itemId]) => ({
      slot: slot as EquipmentSlot,
      itemInstanceId: itemId,
      itemName: inventoryByInstanceId.get(itemId)?.name ?? "UNKNOWN ITEM",
    }));

  const categories = [
    "ALL ITEMS",
    "EQUIPMENT",
    "CONSUMABLES",
    "QUEST ITEMS",
    "CRAFTING",
    ...(awardsCount > 0 || filter === "AWARDS / BOXES" ? ["AWARDS / BOXES"] : []),
  ].map((cat) => {
    let count = 0;
    if (cat === "AWARDS / BOXES") {
      count = awardsCount;
    } else if (cat === "ALL ITEMS") {
      count = inventory.length;
    } else {
      count = inventory.filter((item) => item.category === cat).length;
    }
    return { id: cat, label: cat, count };
  });

  return {
    items: inventory,
    itemCount: inventory.length,
    categories,
    visibleItems,
    selectedItem,
    selectedItemObservation,
    selectedItemRequirements,
    selectedItemActions,
    equippedSummary,
  };
}
