import type { AttributeName, CrawlerTimelineDocument, TimelineEvent } from "../../app/domain/types.ts";

export type ActionResult =
  | { ok: true; document: CrawlerTimelineDocument; event: TimelineEvent; message: string }
  | { ok: false; error: string };

export interface CrawlerActions { allocateAttribute(attribute: AttributeName): ActionResult; }
export interface InventoryActions {
  equipItem(instanceId: string, requestedSlot?: EquipmentSlot): ActionResult;
  unequipItem(instanceId: string): ActionResult;
  consumeItem(instanceId: string, quantity?: number): ActionResult;
  repairItem(instanceId: string): ActionResult;
  toggleItemLock(instanceId: string): ActionResult;
  discardItem(instanceId: string): ActionResult;
}
export interface SkillActions { assignHotlistSlot(slot: number, skillId: string): ActionResult; }
export interface ApplicationActions { crawler: CrawlerActions; inventory: InventoryActions; skills: SkillActions; }

export const EQUIPMENT_SLOTS = ["HEAD", "FACE", "NECK", "TORSO", "WRISTS", "RING", "WAIST", "LEGS", "FEET", "SPECIAL"] as const;
export type EquipmentSlot = typeof EQUIPMENT_SLOTS[number];
