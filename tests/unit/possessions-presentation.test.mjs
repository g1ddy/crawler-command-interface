import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveInventoryPresentation,
  deriveEquipmentPresentation,
  deriveAwardHistory,
} from "../../src/features/inventory/public.ts";

const mockCrawlerState = {
  level: 5,
  race: "Primal",
  class: "Scout",
  attributes: { Strength: 20, Dexterity: 15, Constitution: 10, Intelligence: 10, Charisma: 10 },
};

const mockSword = {
  instanceId: "inst-sword-1",
  itemId: "item-sword-1",
  name: "Iron Sword",
  icon: "⚔️",
  rarity: "common",
  category: "EQUIPMENT",
  slot: "RIGHT_HAND",
  quantity: 1,
  maxStack: 1,
  value: 50,
  description: "A simple sword.",
  acquiredAtSequence: 5,
  source: "Loot",
  isEquipped: false,
};

const mockShield = {
  instanceId: "inst-shield-1",
  itemId: "item-shield-1",
  name: "Wooden Shield",
  icon: "🛡️",
  rarity: "common",
  category: "EQUIPMENT",
  slot: "TORSO",
  quantity: 1,
  maxStack: 1,
  value: 30,
  requirements: { Strength: 10 },
  description: "A wooden shield.",
  acquiredAtSequence: 8,
  source: "Loot",
  isEquipped: true,
};

const mockPotion = {
  instanceId: "inst-potion-1",
  itemId: "item-potion-1",
  name: "Health Potion",
  icon: "🧪",
  rarity: "uncommon",
  category: "CONSUMABLES",
  quantity: 3,
  maxStack: 10,
  value: 10,
  description: "Restores HP.",
  acquiredAtSequence: 2,
  source: "Loot",
};

test("deriveInventoryPresentation handles replay before/at/after Inventory boundaries", () => {
  const presentationBefore = deriveInventoryPresentation({
    inventory: [],
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    filter: "ALL ITEMS",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: null,
    awardsCount: 0,
    isLive: false,
  });
  assert.equal(presentationBefore.itemCount, 0);
  assert.equal(presentationBefore.visibleItems.length, 0);

  const presentationAfter = deriveInventoryPresentation({
    inventory: [mockPotion],
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    filter: "ALL ITEMS",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: null,
    awardsCount: 0,
    isLive: false,
  });
  assert.equal(presentationAfter.itemCount, 1);
  assert.equal(presentationAfter.visibleItems[0].name, "Health Potion");
});

test("deriveEquipmentPresentation handles replay before/at/after Equipment boundaries", () => {
  const beforeEquip = deriveEquipmentPresentation({
    inventory: [mockShield],
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    selectedSlot: "TORSO",
    selectedCandidateId: null,
    isLive: false,
  });
  assert.equal(beforeEquip.equippedItem, undefined);
  const torsoSlotBefore = beforeEquip.slots.find((s) => s.slot === "TORSO");
  assert.equal(torsoSlotBefore?.occupant, undefined);

  const afterEquip = deriveEquipmentPresentation({
    inventory: [mockShield],
    equippedSlots: { TORSO: "inst-shield-1" },
    observations: {},
    crawler: mockCrawlerState,
    selectedSlot: "TORSO",
    selectedCandidateId: null,
    isLive: false,
  });
  assert.equal(afterEquip.equippedItem?.instanceId, "inst-shield-1");
  const torsoSlotAfter = afterEquip.slots.find((s) => s.slot === "TORSO");
  assert.equal(torsoSlotAfter?.occupant?.name, "Wooden Shield");
});

test("distinguishes known empty vs unknown/unavailable equipment slot state", () => {
  const unknownSlot = deriveEquipmentPresentation({
    inventory: [],
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    selectedSlot: "HEAD",
    selectedCandidateId: null,
    isLive: true,
  });

  assert.equal(unknownSlot.equippedItem, undefined);
  assert.equal(unknownSlot.slotObservation, undefined);

  const observedEmptySlot = deriveEquipmentPresentation({
    inventory: [],
    equippedSlots: {},
    observations: {
      HEAD: { sequence: 10, key: "HEAD", itemInstanceId: null },
    },
    crawler: mockCrawlerState,
    selectedSlot: "HEAD",
    selectedCandidateId: null,
    isLive: true,
  });

  assert.equal(observedEmptySlot.slotObservation?.itemInstanceId, null);
  assert.equal(observedEmptySlot.slots.find((s) => s.slot === "HEAD")?.observation?.itemInstanceId, null);
});

test("preserves evidence descriptor propagation for item and slot observations", () => {
  const itemObservation = {
    sequence: 15,
    key: "inst-potion-1",
    present: true,
    quantity: { known: true, value: 3 },
  };

  const presentation = deriveInventoryPresentation({
    inventory: [mockPotion],
    equippedSlots: {},
    observations: { "inst-potion-1": itemObservation },
    crawler: mockCrawlerState,
    filter: "ALL ITEMS",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: "inst-potion-1",
    awardsCount: 0,
    isLive: true,
  });

  assert.deepEqual(presentation.selectedItemObservation, itemObservation);
});

test("maintains stable Inventory selection when filtering or search changes", () => {
  const items = [mockPotion, mockSword];

  const step1 = deriveInventoryPresentation({
    inventory: items,
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    filter: "ALL ITEMS",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: "inst-potion-1",
    awardsCount: 0,
    isLive: true,
  });
  assert.equal(step1.selectedItem?.instanceId, "inst-potion-1");

  const step2 = deriveInventoryPresentation({
    inventory: items,
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    filter: "CONSUMABLES",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: "inst-potion-1",
    awardsCount: 0,
    isLive: true,
  });
  assert.equal(step2.selectedItem?.instanceId, "inst-potion-1");

  const step3 = deriveInventoryPresentation({
    inventory: items,
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    filter: "EQUIPMENT",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: "inst-potion-1",
    awardsCount: 0,
    isLive: true,
  });
  assert.equal(step3.selectedItem?.instanceId, "inst-sword-1");
});

test("equipment slots do not infer unmodeled items or fake gear", () => {
  const presentation = deriveEquipmentPresentation({
    inventory: [],
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    selectedSlot: "HEAD",
    selectedCandidateId: null,
    isLive: true,
  });

  assert.equal(presentation.slots.length, 10);
  for (const slot of presentation.slots) {
    assert.equal(slot.occupant, undefined);
    assert.equal(slot.observedOccupant, undefined);
  }
});

test("awards causation remains independent from current Inventory", () => {
  const achievementEvent = {
    id: "evt-ach-1",
    sequence: 10,
    type: "AchievementUnlocked",
    achievement: { title: "Dungeon Novice" },
  };

  const awardBoxEvent = {
    id: "evt-item-1",
    sequence: 12,
    type: "ItemAcquired",
    causationId: "evt-ach-1",
    item: {
      instanceId: "inst-box-1",
      name: "Novice Chest",
      category: "box",
      rarity: "gold",
    },
  };

  const openBoxEvent = {
    id: "evt-open-1",
    sequence: 20,
    type: "ItemDiscarded",
    itemInstanceId: "inst-box-1",
    reason: "opened",
  };

  const events = [achievementEvent, awardBoxEvent, openBoxEvent];

  const awardsAt15 = deriveAwardHistory(events, 15, [{ instanceId: "inst-box-1" }]);
  assert.equal(awardsAt15.length, 1);
  assert.equal(awardsAt15[0].name, "Novice Chest");
  assert.equal(awardsAt15[0].isInInventory, true);
  assert.equal(awardsAt15[0].openedAtSequence, undefined);

  const awardsAt22 = deriveAwardHistory(events, 22, []);
  assert.equal(awardsAt22.length, 1);
  assert.equal(awardsAt22[0].isInInventory, false);
  assert.equal(awardsAt22[0].openedAtSequence, 20);
});

test("action capabilities enforce isLive gating during replay", () => {
  const liveInventory = deriveInventoryPresentation({
    inventory: [mockPotion, mockSword],
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    filter: "ALL ITEMS",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: "inst-potion-1",
    awardsCount: 0,
    isLive: true,
  });
  assert.equal(liveInventory.selectedItemActions.canConsume, true);
  assert.equal(liveInventory.selectedItemActions.canDiscard, true);

  const replayInventory = deriveInventoryPresentation({
    inventory: [mockPotion, mockSword],
    equippedSlots: {},
    observations: {},
    crawler: mockCrawlerState,
    filter: "ALL ITEMS",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: "inst-potion-1",
    awardsCount: 0,
    isLive: false,
  });
  assert.equal(replayInventory.selectedItemActions.canConsume, false);
  assert.equal(replayInventory.selectedItemActions.canDiscard, false);
  assert.equal(replayInventory.selectedItemActions.canEquip, false);
  assert.equal(replayInventory.selectedItemActions.canUnequip, false);

  const replayEquipment = deriveEquipmentPresentation({
    inventory: [mockShield],
    equippedSlots: { TORSO: "inst-shield-1" },
    observations: {},
    crawler: mockCrawlerState,
    selectedSlot: "TORSO",
    selectedCandidateId: "inst-shield-1",
    isLive: false,
  });
  assert.equal(replayEquipment.candidateActions.canEquip, false);
  assert.equal(replayEquipment.candidateActions.canUnequip, false);
  assert.equal(replayEquipment.candidateActions.canDiscard, false);
  assert.equal(replayEquipment.canUnequipEquipped, false);
});
