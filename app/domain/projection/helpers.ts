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

  const attributes: Partial<Record<AttributeName, number>> = {};
  if (crawler?.attributes) {
    for (const [key, val] of Object.entries(crawler.attributes)) {
      if (typeof val === 'number') {
        attributes[key as AttributeName] = val;
      }
    }
  }

  const condition = {
    currentHealth: crawler?.condition?.currentHealth ?? null,
    maxHealth: crawler?.condition?.maxHealth ?? null,
    currentMana: crawler?.condition?.currentMana ?? null,
    maxMana: crawler?.condition?.maxMana ?? null,
    currentStamina: crawler?.condition?.currentStamina ?? null,
    maxStamina: crawler?.condition?.maxStamina ?? null,
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

  const skills = (((timelineState?.skills as unknown) as Skill[]) || []).map((s) => ({ ...s }));
  const spells = (timelineState?.spells || []).map((spell) => ({
    ...spell,
    acquisitionSource: { ...spell.acquisitionSource },
  }));
  const party = timelineState?.party
    ? { ...timelineState.party, members: timelineState.party.members.map((member) => ({ ...member })) }
    : undefined;
  const pets: import('../types.ts').Pet[] = (timelineState?.pets || []).map((pet) => ({
    petId: pet.petId,
    name: pet.name,
    species: pet.species,
    title: pet.title,
    origin: pet.origin,
    classification: pet.classification,
    hostility: pet.hostility,
    bondState: pet.bondState,
    bondHolderCrawlerId: pet.bondHolderCrawlerId,
    acquiredAtSequence: pet.acquiredAtSequence ?? 0,
    level: pet.level,
    deployment: pet.deployment,
    condition: pet.condition ? { ...pet.condition } : undefined,
  }));
  const quests = ((timelineState?.quests as unknown as import('../types.ts').Quest[]) || []).map((q) => ({
    ...q,
  }));

  const broadcast = timelineState?.broadcast
    ? {
        viewers: timelineState.broadcast.viewers,
        viewerDelta: timelineState.broadcast.viewerDelta,
        followers: timelineState.broadcast.followers,
        fameRank: timelineState.broadcast.fameRank,
        sponsorInterest: timelineState.broadcast.sponsorInterest ?? false,
      }
    : {
        viewers: undefined,
        viewerDelta: undefined,
        followers: undefined,
        fameRank: undefined,
        sponsorInterest: false,
      };

  return {
    sequence: 0,
    occurredAt: '04:00:00',
    causalProvenance: {
      attributes: {},
      condition: {},
    },
    crawler: {
      name: crawler?.name,
      crawlerNumber: crawler?.crawlerNumber,
      level: crawler?.level ?? null,
      race: crawler?.race,
      class: crawler?.class,
      xp: crawler?.xp,
      maxXp: crawler?.maxXp,
      availableAttributePoints: crawler?.availableAttributePoints,
      attributes,
      permanentAttributeModifiers: {},
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
    pets,
    hotlist: Array.isArray(timelineState?.hotlist) ? timelineState.hotlist.slice(0, 10) : [],
    quests,
    achievements,
    entitlements,
    broadcast,
    recentLogs: [],
  };
}
