import { projectState } from "../../app/domain/projection.ts";
import { checkItemRequirements } from "../../app/domain/stats.ts";
import type {
  AttributeName,
  CrawlerEvent,
  CrawlerTimelineDocument,
  InventoryItem,
  TimelineEvent,
} from "../../app/domain/types.ts";

export type ActionResult =
  | { ok: true; document: CrawlerTimelineDocument; event: TimelineEvent; message: string }
  | { ok: false; error: string };

export interface CrawlerActions {
  allocateAttribute(attribute: AttributeName): ActionResult;
}

export interface InventoryActions {
  equipItem(instanceId: string, requestedSlot?: EquipmentSlot): ActionResult;
  unequipItem(instanceId: string): ActionResult;
  consumeItem(instanceId: string, quantity?: number): ActionResult;
  repairItem(instanceId: string): ActionResult;
  toggleItemLock(instanceId: string): ActionResult;
  discardItem(instanceId: string): ActionResult;
}

export interface SkillActions {
  assignHotlistSlot(slot: number, skillId: string): ActionResult;
}

export interface ApplicationActions {
  crawler: CrawlerActions;
  inventory: InventoryActions;
  skills: SkillActions;
}

export const EQUIPMENT_SLOTS = ["HEAD", "FACE", "NECK", "TORSO", "WRISTS", "RING", "WAIST", "LEGS", "FEET", "SPECIAL"] as const;
export type EquipmentSlot = typeof EQUIPMENT_SLOTS[number];

export type CrawlerCommand =
  | { type: "allocate-attribute"; attribute: AttributeName }
  | { type: "equip-item"; instanceId: string; requestedSlot?: EquipmentSlot }
  | { type: "unequip-item"; instanceId: string }
  | { type: "consume-item"; instanceId: string; quantity?: number }
  | { type: "repair-item"; instanceId: string }
  | { type: "toggle-item-lock"; instanceId: string }
  | { type: "discard-item"; instanceId: string }
  | { type: "assign-hotlist-slot"; slot: number; skillId: string };

type EventFields = Omit<CrawlerEvent, "id" | "sequence" | "occurred_at" | "position" | "category">;

function failure(error: string): ActionResult {
  return { ok: false, error };
}

/** Executes one crawler intent against the live endpoint, never the selected replay sequence. */
export function executeCrawlerCommand(
  document: CrawlerTimelineDocument,
  command: CrawlerCommand,
  createId: () => string = () => `evt-user-${Date.now()}`,
): ActionResult {
  const events = document.events as unknown as CrawlerEvent[];
  const lastEvent = events[events.length - 1];
  const liveSequence = lastEvent?.sequence ?? 0;
  const liveState = projectState(document, liveSequence);
  const item = "instanceId" in command
    ? liveState.inventory.find((candidate) => candidate.instanceId === command.instanceId)
    : undefined;
  let fields: EventFields;

  switch (command.type) {
    case "allocate-attribute":
      if (!(command.attribute in liveState.crawler.attributes)) return failure("Unknown attribute.");
      if (liveState.crawler.availableAttributePoints < 1) return failure("No attribute points are available.");
      fields = { type: "AttributeModified", attribute: command.attribute, source: "allocation", delta: 1, summary: `Allocated +1 point to ${command.attribute}` };
      break;
    case "equip-item": {
      if (!item) return failure("Item is not present in the live inventory.");
      if (!isEquipment(item)) return failure("Only equipment can be equipped.");
      if (!checkItemRequirements(liveState.crawler, item.requirements).met) return failure("Cannot equip: requirements not met.");
      if (command.requestedSlot && !EQUIPMENT_SLOTS.includes(command.requestedSlot)) return failure("Requested equipment slot is not supported.");
      const slot = command.requestedSlot ?? item.slot ?? "SPECIAL";
      fields = { type: "ItemEquipped", itemInstanceId: item.instanceId, slot, summary: `Equipped ${item.name} to ${slot} slot` };
      break;
    }
    case "unequip-item":
      if (!item?.isEquipped) return failure("Item is not equipped at the live endpoint.");
      fields = { type: "ItemUnequipped", itemInstanceId: item.instanceId, slot: findEquippedSlot(liveState.equippedSlots, item.instanceId), summary: `Unequipped ${item.name}` };
      break;
    case "consume-item": {
      if (!item) return failure("Item is not present in the live inventory.");
      if (!isConsumable(item)) return failure("Item is not consumable.");
      const quantity = command.quantity ?? 1;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.quantity) return failure("Consumption quantity is invalid or unavailable.");
      fields = { type: "ItemConsumed", itemInstanceId: item.instanceId, quantity, ...(item.name.toLowerCase().includes("health") ? { healthRestored: 500 } : {}), summary: `Consumed ${item.name}` };
      break;
    }
    case "repair-item":
      if (!item?.durability) return failure("Item cannot be repaired.");
      if (item.durability.current >= item.durability.max) return failure("Item is already fully repaired.");
      fields = { type: "ItemRepaired", itemInstanceId: item.instanceId, summary: `Repaired ${item.name} to full durability` };
      break;
    case "toggle-item-lock":
      if (!item) return failure("Item is not present in the live inventory.");
      fields = { type: "ItemLockToggled", itemInstanceId: item.instanceId, summary: `${item.isLocked ? "Unlocked" : "Locked"} ${item.name}` };
      break;
    case "discard-item":
      if (!item) return failure("Item is not present in the live inventory.");
      if (item.isLocked) return failure("Locked items cannot be discarded.");
      if (item.isEquipped) return failure("Equipped items cannot be discarded.");
      fields = { type: "ItemDiscarded", itemInstanceId: item.instanceId, summary: `Discarded ${item.name}` };
      break;
    case "assign-hotlist-slot": {
      if (!Number.isInteger(command.slot) || command.slot < 0 || command.slot >= 10) return failure("Hotlist slot must be between 0 and 9.");
      const skill = liveState.skills.find((candidate) => candidate.skillId === command.skillId);
      if (!skill) return failure("Skill is not available at the live endpoint.");
      fields = { type: "HotlistUpdated", index: command.slot, skillId: skill.skillId, summary: `Assigned ${skill.name} to hotlist slot #${command.slot + 1}` };
      break;
    }
  }

  const sequence = liveSequence + 1;
  const event = {
    id: createId(), sequence,
    position: lastEvent?.position ? { ...lastEvent.position } : { floor: document.floors?.at(-1)?.ordinal ?? 1 },
    evidence: [], origin: "user-runtime", ...fields,
  } as TimelineEvent;
  const floor = event.position.floor;
  const nextDocument = {
    ...document,
    events: [...document.events, event],
    floors: document.floors?.map((segment) => segment.ordinal === floor ? { ...segment, endSequence: Math.max(segment.endSequence, sequence) } : segment),
  } as CrawlerTimelineDocument;
  return { ok: true, document: nextDocument, event, message: event.summary };
}

export function createApplicationActions(document: CrawlerTimelineDocument, apply: (result: ActionResult) => void): ApplicationActions {
  const run = (command: CrawlerCommand) => { const result = executeCrawlerCommand(document, command); apply(result); return result; };
  return {
    crawler: { allocateAttribute: (attribute) => run({ type: "allocate-attribute", attribute }) },
    inventory: {
      equipItem: (instanceId, requestedSlot) => run({ type: "equip-item", instanceId, requestedSlot }),
      unequipItem: (instanceId) => run({ type: "unequip-item", instanceId }),
      consumeItem: (instanceId, quantity) => run({ type: "consume-item", instanceId, quantity }),
      repairItem: (instanceId) => run({ type: "repair-item", instanceId }),
      toggleItemLock: (instanceId) => run({ type: "toggle-item-lock", instanceId }),
      discardItem: (instanceId) => run({ type: "discard-item", instanceId }),
    },
    skills: { assignHotlistSlot: (slot, skillId) => run({ type: "assign-hotlist-slot", slot, skillId }) },
  };
}

function isEquipment(item: InventoryItem): boolean { return item.category.toLowerCase() === "equipment"; }
function isConsumable(item: InventoryItem): boolean { return item.category.toLowerCase() === "consumables" || item.category.toLowerCase() === "consumable"; }
function findEquippedSlot(slots: Record<string, string | null>, instanceId: string): string { return Object.entries(slots).find(([, value]) => value === instanceId)?.[0] ?? "SPECIAL"; }
