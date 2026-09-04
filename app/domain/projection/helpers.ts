import type {
  AttributeName,
  CrawlerState,
  EventCategory,
  InventoryItem,
  ItemCategory,
  ItemRarity,
  QuantityObject,
  RewardSpec,
  Skill,
  TimelineItem,
  TimelineState,
} from '../types.ts';

export function structuredRewards(value: unknown, legacyText?: unknown): RewardSpec[] {
  if (Array.isArray(value)) return value.map((reward) => ({ ...(reward as RewardSpec) }));
  const description = typeof legacyText === 'string' ? legacyText.trim() : '';
  return description ? [{ kind: 'other', description }] : [];
}

export function parseQuantity(rawQty: unknown): { numericQuantity: number; qtyObject?: QuantityObject } {
  if (typeof rawQty === 'number') {
    return { numericQuantity: rawQty };
  }
  if (rawQty && typeof rawQty === 'object') {
    const qObj = rawQty as QuantityObject;
    if (qObj.known) {
      return { numericQuantity: qObj.value ?? 1, qtyObject: qObj };
    } else {
      return { numericQuantity: qObj.minimum ?? 0, qtyObject: qObj };
    }
  }
  return { numericQuantity: 1 };
}

export function getAchievementRecipient(value: unknown): 'carl' | 'donut' | 'party' | undefined {
  return value === 'carl' || value === 'donut' || value === 'party' ? value : undefined;
}

export function mapSchemaCategoryToUi(cat: string): ItemCategory {
  const lower = cat.toLowerCase();
  if (lower === 'equipment') return 'EQUIPMENT';
  if (lower === 'consumable' || lower === 'consumables') return 'CONSUMABLES';
  if (lower === 'quest-item' || lower === 'quest items') return 'QUEST ITEMS';
  if (lower === 'crafting') return 'CRAFTING';
  if (lower === 'box') return 'BOXES';
  return 'JUNK';
}

export function getItemIcon(category: ItemCategory, slot?: string): string {
  if (slot === 'HEAD') return '◉';
  if (slot === 'TORSO') return '◈';
  if (slot === 'FEET') return '▰';
  if (slot === 'RING') return '💍';
  if (category === 'CONSUMABLES') return '🧪';
  if (category === 'QUEST ITEMS') return '▣';
  if (category === 'CRAFTING') return '◆';
  if (category === 'BOXES') return '▣';
  return '📦';
}

export function formatElapsedSeconds(seconds?: number): string {
  if (seconds === undefined) return '04:00:00';
  const total = 4 * 3600 + seconds;
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function deriveCategory(event: Record<string, unknown>): EventCategory {
  if (typeof event.category === 'string') {
    return event.category as EventCategory;
  }
  const type = String(event.type);
  if (type === 'ItemAcquired' || type === 'ItemCrafted') return 'loot';
  if (type === 'ItemConsumed' || type === 'ItemDiscarded' || type === 'ItemQuantityChanged') return 'combat';
  if (type === 'ItemEquipped' || type === 'ItemUnequipped') return 'system';
  if (type === 'AchievementUnlocked' || type === 'LevelChanged' || type === 'XPChanged') return 'levelup';
  if (type === 'QuestUpdated') return 'quest';
  if (type === 'SkillGranted' || type === 'SpellGranted' || type === 'HotlistUpdated') return 'skills';
  return 'system';
}

export function createInitialState(timelineState?: TimelineState): CrawlerState {
  const crawler = timelineState?.crawler;

  const attributes: Record<AttributeName, number> = {
    Strength: crawler?.attributes?.Strength ?? 24,
    Dexterity: crawler?.attributes?.Dexterity ?? 34,
    Constitution: crawler?.attributes?.Constitution ?? 30,
    Intelligence: crawler?.attributes?.Intelligence ?? 18,
    Charisma: crawler?.attributes?.Charisma ?? 20,
  };

  const condition = {
    currentHealth: crawler?.condition?.currentHealth ?? 3100,
    maxHealth: crawler?.condition?.maxHealth ?? 4200,
    currentMana: crawler?.condition?.currentMana ?? 800,
    maxMana: crawler?.condition?.maxMana ?? 1360,
    currentStamina: crawler?.condition?.currentStamina ?? 200,
    maxStamina: crawler?.condition?.maxStamina ?? 280,
  };

  const inventory: InventoryItem[] = (timelineState?.inventory || []).map((i: TimelineItem) => {
    const normCategory = mapSchemaCategoryToUi(i.category);
    const { numericQuantity, qtyObject } = parseQuantity(i.quantity);
    return {
      instanceId: i.instanceId,
      itemId: i.itemId || i.instanceId,
      name: i.name,
      icon: getItemIcon(normCategory, i.slot),
      rarity: (i.rarity || 'unknown') as ItemRarity,
      category: normCategory,
      slot: i.slot,
      quantity: numericQuantity,
      quantityObject: qtyObject,
      maxStack: i.maxStack ?? 'NOT SOURCED',
      value: 0,
      stats: i.stats,
      description: i.description || '',
      acquiredAtSequence: 0,
      source: i.sourceDescription || 'Source not provided',
      isLocked: false,
      isEquipped: false,
    };
  });

  const achievements = (timelineState?.achievements || []).map((a) => ({
    achievementId: a.id,
    title: a.title,
    recipient: getAchievementRecipient(a.recipient),
    description: a.description || '',
    rewards: structuredRewards(a.reward, a.sourceTitle),
    icon: '',
    unlockedAtSequence: 0,
  }));
  const entitlements = (timelineState?.entitlements || []).map((entitlement) => ({ ...entitlement }));

  const skills = ((timelineState?.skills as Skill[]) || []).map((s) => ({ ...s }));
  const spells = (timelineState?.spells || []).map((spell) => ({
    ...spell,
    acquisitionSource: { ...spell.acquisitionSource },
  }));
  const party = timelineState?.party
    ? { ...timelineState.party, members: timelineState.party.members.map((member) => ({ ...member })) }
    : undefined;
  const quests = ((timelineState?.quests as unknown as import('../types.ts').Quest[]) || []).map((q) => ({
    ...q,
  }));

  const broadcast = timelineState
    ? { viewers: 0, viewerDelta: '+0%', followers: 0, fameRank: '#-', sponsorInterest: false }
    : { viewers: 42100, viewerDelta: '+0%', followers: 3520, fameRank: '#21', sponsorInterest: false };

  return {
    sequence: 0,
    occurredAt: '04:00:00',
    crawler: {
      name: crawler?.name || 'CARL G.',
      level: crawler?.level || 42,
      race: crawler?.race || 'PRIMAL',
      class: crawler?.class || 'SCOUT',
      xp: crawler?.xp ?? 21500,
      maxXp: crawler?.maxXp ?? 74000,
      availableAttributePoints: (crawler as { availableAttributePoints?: number } | undefined)?.availableAttributePoints ?? 5,
      attributes,
      permanentAttributeModifiers: {
        Strength: 0,
        Dexterity: 0,
        Constitution: 0,
        Intelligence: 0,
        Charisma: 0,
      },
      condition,
    },
    inventory,
    equippedSlots: {
      HEAD: null,
      FACE: null,
      NECK: null,
      TORSO: null,
      WRISTS: null,
      RING: null,
      WAIST: null,
      LEGS: null,
      FEET: null,
      SPECIAL: null,
    },
    effects: [],
    skills,
    spells,
    party,
    hotlist: Array.isArray(timelineState?.hotlist) ? timelineState.hotlist.slice(0, 10) : [],
    quests,
    achievements,
    entitlements,
    broadcast,
    recentLogs: [],
  };
}
