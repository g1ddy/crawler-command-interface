import type { CrawlerState, ItemCategory, ItemRarity } from '../types.ts';
import { getItemIcon, mapSchemaCategoryToUi, parseQuantity } from './helpers.ts';

export function applyItemAcquiredOrCrafted(
  state: CrawlerState,
  event: Record<string, unknown>,
  sequence: number
): void {
  const itemData = ((event.item as Record<string, unknown>) || event) as Record<string, unknown>;
  const instanceId = String(itemData.instanceId || itemData.itemInstanceId);
  const existing = state.inventory.find((i) => i.instanceId === instanceId);

  const { numericQuantity, qtyObject } = parseQuantity(itemData.quantity);

  if (existing) {
    existing.quantity += numericQuantity;
  } else {
    const rawCategory = typeof itemData.category === 'string' ? itemData.category : undefined;
    const uiCategory: ItemCategory = rawCategory ? mapSchemaCategoryToUi(rawCategory) : 'miscellaneous';
    const slotVal = typeof itemData.slot === 'string' ? itemData.slot : undefined;
    const statsVal = itemData.stats as Record<string, number> | undefined;
    const reqsVal = itemData.requirements as Record<string, number | string> | undefined;
    const durVal = itemData.durability as { current: number; max: number } | undefined;

    state.inventory.push({
      instanceId,
      itemId: String(itemData.itemId || instanceId),
      name: String(itemData.name || 'Unknown Item'),
      icon: typeof itemData.icon === 'string' ? itemData.icon : getItemIcon(uiCategory, slotVal),
      rarity: (typeof itemData.rarity === 'string' ? itemData.rarity.toLowerCase() : 'unknown') as ItemRarity,
      category: uiCategory,
      slot: slotVal,
      quantity: numericQuantity,
      quantityObject: qtyObject,
      maxStack: typeof itemData.maxStack === 'number' ? itemData.maxStack : 'NOT SOURCED',
      value: typeof itemData.value === 'number' ? itemData.value : 0,
      stats: statsVal,
      requirements: reqsVal,
      description: String(itemData.description || ''),
      durability: durVal,
      acquiredAtSequence: sequence,
      source:
        typeof itemData.sourceDescription === 'string'
          ? itemData.sourceDescription
          : typeof itemData.source === 'string'
            ? itemData.source
            : 'Source not provided',
      isLocked: false,
      isEquipped: false,
    });
  }
}

export function applyItemQuantityChanged(state: CrawlerState, event: Record<string, unknown>): void {
  const instanceId = String(event.itemInstanceId);
  const item = state.inventory.find((i) => i.instanceId === instanceId);
  if (item) {
    item.quantity += Number(event.delta || 0);
    if (item.quantity <= 0) {
      state.inventory = state.inventory.filter((i) => i.instanceId !== instanceId);
    }
  }
}

export function applyItemEquipped(state: CrawlerState, event: Record<string, unknown>): void {
  const slot = String(event.slot || 'SPECIAL').toUpperCase();
  const instanceId = String(event.itemInstanceId);

  for (const s in state.equippedSlots) {
    if (state.equippedSlots[s] === instanceId) {
      state.equippedSlots[s] = null;
    }
  }

  const currentEquippedId = state.equippedSlots[slot];
  if (currentEquippedId) {
    const currentItem = state.inventory.find((i) => i.instanceId === currentEquippedId);
    if (currentItem) currentItem.isEquipped = false;
  }

  state.equippedSlots[slot] = instanceId;
  const targetItem = state.inventory.find((i) => i.instanceId === instanceId);
  if (targetItem) {
    targetItem.isEquipped = true;
  }
}

export function applyItemUnequipped(state: CrawlerState, event: Record<string, unknown>): void {
  const slot = String(event.slot || 'SPECIAL').toUpperCase();
  const instanceId = String(event.itemInstanceId);
  if (state.equippedSlots[slot] === instanceId) state.equippedSlots[slot] = null;
  const item = state.inventory.find((i) => i.instanceId === instanceId);
  if (item) item.isEquipped = false;
}

export function applyItemLocked(state: CrawlerState, event: Record<string, unknown>): void {
  const instanceId = String(event.itemInstanceId);
  const item = state.inventory.find((i) => i.instanceId === instanceId);
  if (item) item.isLocked = true;
}

export function applyItemUnlocked(state: CrawlerState, event: Record<string, unknown>): void {
  const instanceId = String(event.itemInstanceId);
  const item = state.inventory.find((i) => i.instanceId === instanceId);
  if (item) item.isLocked = false;
}

export function applyItemLockToggled(state: CrawlerState, event: Record<string, unknown>): void {
  const instanceId = String(event.itemInstanceId);
  const item = state.inventory.find((i) => i.instanceId === instanceId);
  if (item) item.isLocked = !item.isLocked;
}

export function applyItemRepaired(state: CrawlerState, event: Record<string, unknown>): void {
  const instanceId = String(event.itemInstanceId);
  const item = state.inventory.find((i) => i.instanceId === instanceId);
  if (item && item.durability) {
    const amount = Number(event.amount ?? (item.durability.max - item.durability.current));
    item.durability.current = Math.min(item.durability.max, item.durability.current + amount);
  }
}

export function applyItemConsumed(state: CrawlerState, event: Record<string, unknown>): void {
  const instanceId = String(event.itemInstanceId);
  const { numericQuantity } = parseQuantity(event.quantity);
  const item = state.inventory.find((i) => i.instanceId === instanceId);
  if (item) {
    item.quantity -= numericQuantity;
    if (item.quantity <= 0) state.inventory = state.inventory.filter((i) => i.instanceId !== instanceId);
  }
  if (event.healthRestored) {
    state.crawler.condition.currentHealth = Math.min(
      state.crawler.condition.maxHealth,
      state.crawler.condition.currentHealth + Number(event.healthRestored)
    );
  }
  if (event.manaRestored) {
    state.crawler.condition.currentMana = Math.min(
      state.crawler.condition.maxMana,
      state.crawler.condition.currentMana + Number(event.manaRestored)
    );
  }
}

export function applyItemDiscarded(state: CrawlerState, event: Record<string, unknown>): void {
  const instanceId = String(event.itemInstanceId);
  const item = state.inventory.find((i) => i.instanceId === instanceId);
  let isFullyRemoved = true;
  if (item) {
    if (event.quantity !== undefined) {
      const { numericQuantity } = parseQuantity(event.quantity);
      item.quantity -= numericQuantity;
      if (item.quantity <= 0) {
        state.inventory = state.inventory.filter((i) => i.instanceId !== instanceId);
        item.isEquipped = false;
      } else {
        isFullyRemoved = false;
      }
    } else {
      state.inventory = state.inventory.filter((i) => i.instanceId !== instanceId);
      item.isEquipped = false;
    }
  }
  if (isFullyRemoved) {
    for (const slot in state.equippedSlots) {
      if (state.equippedSlots[slot] === instanceId) state.equippedSlots[slot] = null;
    }
  }
}
