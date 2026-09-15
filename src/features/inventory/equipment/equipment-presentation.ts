import type {
  AttributeName,
  EquippedSlotMap,
  InventoryItem,
  ProjectedEquipmentObservation,
} from "../../../../app/domain/types.ts";
import {
  checkItemRequirements,
  compareGearStats,
  type RequirementResult,
  type StatDelta,
} from "../../../../app/domain/stats.ts";
import type { EquipmentSlot } from "../../../application/crawler-action-contracts.ts";

export const EQUIPMENT_SLOTS: readonly [EquipmentSlot, string, string][] = [
  ["HEAD", "◉", "Headgear"],
  ["FACE", "◌", "Visor/Mask"],
  ["NECK", "◇", "Amulet/Necklace"],
  ["TORSO", "◈", "Body Armor/Vest"],
  ["WRISTS", "▱", "Bracers"],
  ["RING", "💍", "Finger Ring"],
  ["WAIST", "▰", "Belt/Waistband"],
  ["LEGS", "╿", "Leg Armor"],
  ["FEET", "▰", "Footwear/Boots"],
  ["SPECIAL", "✦", "Relic/Special"],
];

export interface DerivedEquipmentSlotPresentation {
  slot: EquipmentSlot;
  icon: string;
  label: string;
  occupant?: InventoryItem;
  observation?: ProjectedEquipmentObservation;
  observedOccupant?: InventoryItem;
}

export interface EquipmentActionCapabilities {
  canEquip: boolean;
  canUnequip: boolean;
  canRepair: boolean;
  canToggleLock: boolean;
  canDiscard: boolean;
}

export interface DerivedEquipmentPresentation {
  slots: DerivedEquipmentSlotPresentation[];
  selectedSlot: EquipmentSlot;
  equippedItem?: InventoryItem;
  slotObservation?: ProjectedEquipmentObservation;
  slotCandidates: InventoryItem[];
  activeCandidate?: InventoryItem;
  requirements: RequirementResult;
  statDeltas: StatDelta[];
  candidateActions: EquipmentActionCapabilities;
  canUnequipEquipped: boolean;
}

export interface DeriveEquipmentPresentationInput {
  inventory: InventoryItem[];
  equippedSlots: EquippedSlotMap | Record<string, string | null | undefined>;
  observations: Record<EquipmentSlot, ProjectedEquipmentObservation | undefined>;
  crawler: { attributes?: Partial<Record<AttributeName, number>>; level?: number; class?: string; race?: string };
  selectedSlot: EquipmentSlot;
  selectedCandidateId: string | null;
  isLive?: boolean;
}

export function deriveEquipmentPresentation(
  input: DeriveEquipmentPresentationInput,
): DerivedEquipmentPresentation {
  const {
    inventory,
    equippedSlots,
    observations,
    crawler,
    selectedSlot,
    selectedCandidateId,
    isLive = true,
  } = input;

  const inventoryMap = new Map<string, InventoryItem>();
  for (const item of inventory) {
    if (item.instanceId && !inventoryMap.has(item.instanceId)) {
      inventoryMap.set(item.instanceId, item);
    }
  }

  const equippedInstanceId = equippedSlots[selectedSlot];
  const equippedItem = equippedInstanceId ? inventoryMap.get(equippedInstanceId) : undefined;

  const slotCandidates = inventory.filter((item) => {
    const isEquipment = item.category === "EQUIPMENT" || item.category === "equipment";
    if (!isEquipment) return false;
    if (selectedSlot === "SPECIAL") return true;
    return item.slot === selectedSlot || !item.slot;
  });

  const activeCandidate = selectedCandidateId
    ? slotCandidates.find((c) => c.instanceId === selectedCandidateId) ?? slotCandidates[0] ?? equippedItem
    : slotCandidates.find((c) => c.instanceId !== equippedInstanceId) ?? slotCandidates[0] ?? equippedItem;

  const requirements = activeCandidate
    ? checkItemRequirements(crawler as Parameters<typeof checkItemRequirements>[0], activeCandidate.requirements)
    : { met: true, details: [] };

  const statDeltas = compareGearStats(equippedItem, activeCandidate);

  const slotObservation = observations[selectedSlot];

  const slotsPresentation: DerivedEquipmentSlotPresentation[] = EQUIPMENT_SLOTS.map(([name, icon, label]) => {
    const occupantId = equippedSlots[name];
    const occupant = occupantId ? inventoryMap.get(occupantId) : undefined;
    const obs = observations[name];
    const observedOccupant = obs?.itemInstanceId ? inventoryMap.get(obs.itemInstanceId) : undefined;

    return {
      slot: name,
      icon,
      label,
      occupant,
      observation: obs,
      observedOccupant,
    };
  });

  const isCandidateEquipped = activeCandidate?.instanceId === equippedItem?.instanceId;

  const candidateActions: EquipmentActionCapabilities = {
    canEquip: isLive && Boolean(activeCandidate) && !isCandidateEquipped && requirements.met,
    canUnequip: isLive && Boolean(activeCandidate) && Boolean(isCandidateEquipped),
    canRepair:
      isLive &&
      Boolean(activeCandidate?.durability) &&
      (activeCandidate?.durability?.current ?? 0) < (activeCandidate?.durability?.max ?? 0),
    canToggleLock: isLive && Boolean(activeCandidate),
    canDiscard:
      isLive &&
      Boolean(activeCandidate) &&
      !activeCandidate?.isEquipped &&
      !activeCandidate?.isLocked,
  };

  const canUnequipEquipped = isLive && Boolean(equippedItem);

  return {
    slots: slotsPresentation,
    selectedSlot,
    equippedItem,
    slotObservation,
    slotCandidates,
    activeCandidate,
    requirements,
    statDeltas,
    candidateActions,
    canUnequipEquipped,
  };
}
