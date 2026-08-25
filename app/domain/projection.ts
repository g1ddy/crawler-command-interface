import type {
  AttributeName,
  CrawlerEvent,
  CrawlerState,
  CrawlerTimelineDocument,
  EventCategory,
  InventoryItem,
  ItemCategory,
  ItemRarity,
  QuantityObject,
  Quest,
  Skill,
  Snapshot,
  TimelineEvent,
  TimelineItem,
  TimelineState,
} from './types.ts';

const defaultFloor6Quests: Quest[] = [
  {
    questId: 'q-stairwell',
    title: 'Tutorial: Reach the Stairs',
    urgency: 'URGENT',
    goals: ['Find the emergency stairwell', 'Bypass the security lockdown'],
    rewards: '150 XP · Bronze Box',
    status: 'active',
  },
];

function parseQuantity(rawQty: unknown): { numericQuantity: number; qtyObject?: QuantityObject } {
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
      rarity: (i.rarity || 'common') as ItemRarity,
      category: normCategory,
      slot: i.slot,
      quantity: numericQuantity,
      quantityObject: qtyObject,
      maxStack: i.maxStack || 1,
      value: 100,
      stats: i.stats,
      description: i.description || '',
      acquiredAtSequence: 0,
      source: i.sourceDescription || 'Initial State',
      isLocked: false,
      isEquipped: false,
    };
  });

  const achievements = (timelineState?.achievements || []).map((a) => ({
    achievementId: a.id,
    title: a.title,
    description: a.description || '',
    rewards: a.sourceTitle || '',
    icon: '☠',
    unlockedAtSequence: 0,
  }));
  const entitlements = (timelineState?.entitlements || []).map((entitlement) => ({ ...entitlement }));

  const skills = ((timelineState?.skills as Skill[]) || []).map((s) => ({ ...s }));
  const quests = timelineState
    ? ((timelineState.quests as Quest[]) || []).map((q) => ({
        ...q,
        status: q.status || 'active',
      }))
    : defaultFloor6Quests;

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
    hotlist: skills.map((s) => s.skillId).slice(0, 10),
    quests,
    achievements,
    entitlements,
    broadcast,
    recentLogs: [],
  };
}

function mapSchemaCategoryToUi(cat: string): ItemCategory {
  const lower = cat.toLowerCase();
  if (lower === 'equipment') return 'EQUIPMENT';
  if (lower === 'consumable' || lower === 'consumables') return 'CONSUMABLES';
  if (lower === 'quest-item' || lower === 'quest items') return 'QUEST ITEMS';
  if (lower === 'crafting') return 'CRAFTING';
  return 'JUNK';
}

function getItemIcon(category: ItemCategory, slot?: string): string {
  if (slot === 'HEAD') return '◉';
  if (slot === 'TORSO') return '◈';
  if (slot === 'FEET') return '▰';
  if (slot === 'RING') return '💍';
  if (category === 'CONSUMABLES') return '🧪';
  if (category === 'QUEST ITEMS') return '▣';
  if (category === 'CRAFTING') return '◆';
  return '📦';
}

function formatElapsedSeconds(seconds?: number): string {
  if (seconds === undefined) return '04:00:00';
  const total = 4 * 3600 + seconds;
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function applyEvent(currentState: CrawlerState, rawEvent: unknown): CrawlerState {
  const state: CrawlerState = JSON.parse(JSON.stringify(currentState));
  const event = rawEvent as Record<string, unknown>;

  const pos = event.position as { elapsedSeconds?: number } | undefined;
  const sequence = Number(event.sequence ?? state.sequence + 1);
  state.sequence = sequence;

  const occurredAt =
    typeof event.occurred_at === 'string'
      ? event.occurred_at
      : pos && typeof pos.elapsedSeconds === 'number'
      ? formatElapsedSeconds(pos.elapsedSeconds)
      : state.occurredAt;
  state.occurredAt = occurredAt;

  const category: EventCategory =
    (event.category as EventCategory) ||
    (event.type === 'ItemAcquired' || event.type === 'ItemCrafted'
      ? 'loot'
      : event.type === 'ItemConsumed' || event.type === 'ItemDiscarded' || event.type === 'ItemQuantityChanged'
      ? 'combat'
      : event.type === 'ItemEquipped' || event.type === 'ItemUnequipped'
      ? 'system'
      : event.type === 'AchievementUnlocked' || event.type === 'LevelChanged' || event.type === 'XPChanged'
      ? 'levelup'
      : event.type === 'QuestUpdated'
      ? 'quest'
      : event.type === 'SkillGranted' || event.type === 'HotlistUpdated'
      ? 'skills'
      : 'system');

  const summary = typeof event.summary === 'string' ? event.summary : 'Event recorded';

  // Add log entry
  state.recentLogs = [
    {
      sequence,
      timestamp: occurredAt,
      message: summary,
      category,
    },
    ...state.recentLogs,
  ].slice(0, 30);

  switch (event.type) {
    case 'ItemAcquired':
    case 'ItemCrafted': {
      // Schema event has event.item, legacy event has item fields directly
      const itemData = ((event.item as Record<string, unknown>) || event) as Record<string, unknown>;
      const instanceId = String(itemData.instanceId || itemData.itemInstanceId);
      const existing = state.inventory.find((i) => i.instanceId === instanceId);

      const { numericQuantity, qtyObject } = parseQuantity(itemData.quantity);

      if (existing) {
        existing.quantity += numericQuantity;
      } else {
        const rawCategory = String(itemData.category || 'equipment');
        const uiCategory = mapSchemaCategoryToUi(rawCategory);
        const slotVal = typeof itemData.slot === 'string' ? itemData.slot : undefined;
        const statsVal = itemData.stats as Record<string, number> | undefined;
        const reqsVal = itemData.requirements as Record<string, number | string> | undefined;
        const durVal = itemData.durability as { current: number; max: number } | undefined;

        state.inventory.push({
          instanceId,
          itemId: String(itemData.itemId || instanceId),
          name: String(itemData.name || 'Unknown Item'),
          icon: typeof itemData.icon === 'string' ? itemData.icon : getItemIcon(uiCategory, slotVal),
          rarity: (String(itemData.rarity || 'common')).toLowerCase() as ItemRarity,
          category: uiCategory,
          slot: slotVal,
          quantity: numericQuantity,
          quantityObject: qtyObject,
          maxStack: Number(itemData.maxStack ?? 1),
          value: Number(itemData.value ?? 100),
          stats: statsVal,
          requirements: reqsVal,
          description: String(itemData.description || ''),
          durability: durVal,
          acquiredAtSequence: sequence,
          source: String(itemData.sourceDescription || itemData.source || 'Discovered'),
          isLocked: false,
          isEquipped: false,
        });
      }
      break;
    }

    case 'ItemQuantityChanged': {
      const instanceId = String(event.itemInstanceId);
      const item = state.inventory.find((i) => i.instanceId === instanceId);
      if (item) {
        item.quantity += Number(event.delta || 0);
        if (item.quantity <= 0) {
          state.inventory = state.inventory.filter((i) => i.instanceId !== instanceId);
        }
      }
      break;
    }

    case 'ItemEquipped': {
      const slot = String(event.slot || 'SPECIAL').toUpperCase();
      const instanceId = String(event.itemInstanceId);

      // Clear instanceId if it was equipped in another slot
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
      break;
    }

    case 'ItemLocked': {
      const instanceId = String(event.itemInstanceId);
      const item = state.inventory.find((i) => i.instanceId === instanceId);
      if (item) {
        item.isLocked = true;
      }
      break;
    }

    case 'ItemUnlocked': {
      const instanceId = String(event.itemInstanceId);
      const item = state.inventory.find((i) => i.instanceId === instanceId);
      if (item) {
        item.isLocked = false;
      }
      break;
    }

    case 'ItemLockToggled': {
      const instanceId = String(event.itemInstanceId);
      const item = state.inventory.find((i) => i.instanceId === instanceId);
      if (item) {
        item.isLocked = !item.isLocked;
      }
      break;
    }

    case 'ItemRepaired': {
      const instanceId = String(event.itemInstanceId);
      const item = state.inventory.find((i) => i.instanceId === instanceId);
      if (item && item.durability) {
        const amount = Number(event.amount ?? (item.durability.max - item.durability.current));
        item.durability.current = Math.min(item.durability.max, item.durability.current + amount);
      }
      break;
    }

    case 'ItemUnequipped': {
      const slot = String(event.slot || 'SPECIAL').toUpperCase();
      const instanceId = String(event.itemInstanceId);
      if (state.equippedSlots[slot] === instanceId) {
        state.equippedSlots[slot] = null;
      }
      const item = state.inventory.find((i) => i.instanceId === instanceId);
      if (item) {
        item.isEquipped = false;
      }
      break;
    }

    case 'ItemConsumed': {
      const instanceId = String(event.itemInstanceId);
      const { numericQuantity } = parseQuantity(event.quantity);
      const item = state.inventory.find((i) => i.instanceId === instanceId);
      if (item) {
        item.quantity -= numericQuantity;
        if (item.quantity <= 0) {
          state.inventory = state.inventory.filter((i) => i.instanceId !== instanceId);
        }
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
      break;
    }

    case 'ItemDiscarded': {
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
          if (state.equippedSlots[slot] === instanceId) {
            state.equippedSlots[slot] = null;
          }
        }
      }
      break;
    }

    case 'AchievementUnlocked': {
      const ach = ((event.achievement as Record<string, unknown>) || event) as Record<string, unknown>;
      const achId = String(ach.id || ach.achievementId);
      if (!state.achievements.some((a) => a.achievementId === achId)) {
        let rewardsStr = String(ach.rewards || ach.sourceTitle || '');
        if (!rewardsStr && Array.isArray(ach.reward)) {
          rewardsStr = ach.reward
            .map((r: Record<string, unknown>) => r.description || `${r.kind} reward`)
            .join(' · ');
        }
        state.achievements.push({
          achievementId: achId,
          title: String(ach.title || 'Achievement Unlocked'),
          description: String(ach.description || ''),
          rewards: rewardsStr,
          icon: String(ach.icon || '☠'),
          unlockedAtSequence: sequence,
        });
      }
      break;
    }

    case 'PermanentEntitlementGranted': {
      const entitlement = event.entitlement as { id?: unknown; name?: unknown; location?: unknown; description?: unknown } | undefined;
      if (entitlement?.id && !state.entitlements.some((existing) => existing.id === entitlement.id)) {
        state.entitlements.push({
          id: String(entitlement.id),
          name: String(entitlement.name || 'Permanent entitlement'),
          ...(typeof entitlement.location === 'string' ? { location: entitlement.location } : {}),
          ...(typeof entitlement.description === 'string' ? { description: entitlement.description } : {}),
        });
      }
      break;
    }

    case 'NarrativeEvent': {
      // Log entry already recorded above
      break;
    }

    case 'AttributeModified': {
      const attr = event.attribute as AttributeName;
      if (attr in state.crawler.attributes) {
        const delta = Number(event.delta || 0);
        if (event.source === 'allocation' || event.isAllocation) {
          state.crawler.attributes[attr] += delta;
          state.crawler.availableAttributePoints = Math.max(0, state.crawler.availableAttributePoints - delta);
        } else if (event.source === 'permanent_modifier') {
          state.crawler.permanentAttributeModifiers[attr] += delta;
        } else {
          state.crawler.attributes[attr] += delta;
        }
      }
      break;
    }

    case 'LevelChanged': {
      const level = Number(event.level);
      if (Number.isInteger(level) && level > 0) {
        state.crawler.level = level;
      }
      break;
    }

    case 'XPChanged': {
      if (event.maxXp !== undefined) state.crawler.maxXp = Number(event.maxXp);
      if (event.xp !== undefined) {
        state.crawler.xp = Number(event.xp);
      } else if (event.xpDelta !== undefined) {
        state.crawler.xp = Math.max(0, state.crawler.xp + Number(event.xpDelta));
      }
      break;
    }

    case 'HotlistUpdated': {
      if (Array.isArray(event.hotlist)) {
        state.hotlist = (event.hotlist as string[]).slice(0, 10);
      } else if (typeof event.index === 'number' && typeof event.skillId === 'string') {
        const newHotlist = [...state.hotlist];
        newHotlist[event.index] = event.skillId;
        state.hotlist = newHotlist;
      }
      break;
    }

    case 'EffectApplied': {
      const effectId = String(event.effectId);
      state.effects = state.effects.filter((e) => e.effectId !== effectId);
      state.effects.push({
        effectId,
        name: String(event.name || ''),
        type: (event.effectType as 'good' | 'bad') || 'good',
        icon: String(event.icon || '✦'),
        durationSeconds: Number(event.durationSeconds || 0),
        appliedAtSequence: sequence,
        description: String(event.description || ''),
        statModifiers: event.statModifiers as Record<string, number> | undefined,
      });
      break;
    }

    case 'EffectExpired': {
      const effectId = String(event.effectId);
      state.effects = state.effects.filter((e) => e.effectId !== effectId);
      break;
    }

    case 'SkillGranted': {
      const skillId = String(event.skillId);
      if (!state.skills.some((s) => s.skillId === skillId)) {
        state.skills.push({
          skillId,
          name: String(event.name || ''),
          icon: String(event.icon || '✦'),
          rank: String(event.rank || 'RANK 1'),
          description: String(event.description || ''),
          cooldown: String(event.cooldown || 'READY'),
          category: (event.category as 'combat' | 'utility' | 'passive') || 'combat',
          cost: typeof event.cost === 'string' ? event.cost : undefined,
          synergies: Array.isArray(event.synergies) ? (event.synergies as string[]) : undefined,
        });
        if (state.hotlist.length < 10) {
          state.hotlist.push(skillId);
        }
      }
      break;
    }

    case 'QuestUpdated': {
      const questId = String(event.questId);
      const questIndex = state.quests.findIndex((q) => q.questId === questId);
      const updatedQuest: Quest = {
        questId,
        title: String(event.title || ''),
        urgency: (event.urgency as 'URGENT' | 'STANDARD' | 'COMPLETED') || 'STANDARD',
        goals: Array.isArray(event.goals) ? (event.goals as string[]) : [],
        rewards: String(event.rewards || ''),
        status: (event.status as 'active' | 'completed' | 'failed') || 'active',
      };
      if (questIndex >= 0) {
        state.quests[questIndex] = updatedQuest;
      } else {
        state.quests.push(updatedQuest);
      }
      break;
    }

    case 'BroadcastUpdated': {
      state.broadcast = {
        viewers: Number(event.viewers ?? state.broadcast.viewers),
        viewerDelta: String(event.viewerDelta ?? state.broadcast.viewerDelta),
        followers: Number(event.followers ?? state.broadcast.followers),
        fameRank: String(event.fameRank ?? state.broadcast.fameRank),
        sponsorInterest: Boolean(event.sponsorInterest ?? state.broadcast.sponsorInterest),
      };
      break;
    }

    case 'ConditionChanged': {
      if (event.maxHealth !== undefined) state.crawler.condition.maxHealth = Number(event.maxHealth);
      if (event.currentHealth !== undefined) {
        state.crawler.condition.currentHealth = Number(event.currentHealth);
        if (state.crawler.condition.currentHealth > state.crawler.condition.maxHealth) {
          state.crawler.condition.maxHealth = state.crawler.condition.currentHealth;
        }
      } else if (event.healthDelta !== undefined) {
        state.crawler.condition.currentHealth = Math.min(
          state.crawler.condition.maxHealth,
          Math.max(0, state.crawler.condition.currentHealth + Number(event.healthDelta))
        );
      }

      if (event.maxMana !== undefined) state.crawler.condition.maxMana = Number(event.maxMana);
      if (event.currentMana !== undefined) {
        state.crawler.condition.currentMana = Number(event.currentMana);
        if (state.crawler.condition.currentMana > state.crawler.condition.maxMana) {
          state.crawler.condition.maxMana = state.crawler.condition.currentMana;
        }
      } else if (event.manaDelta !== undefined) {
        state.crawler.condition.currentMana = Math.min(
          state.crawler.condition.maxMana,
          Math.max(0, state.crawler.condition.currentMana + Number(event.manaDelta))
        );
      }

      if (event.maxStamina !== undefined) state.crawler.condition.maxStamina = Number(event.maxStamina);
      if (event.currentStamina !== undefined) {
        state.crawler.condition.currentStamina = Number(event.currentStamina);
        if (state.crawler.condition.currentStamina > state.crawler.condition.maxStamina) {
          state.crawler.condition.maxStamina = state.crawler.condition.currentStamina;
        }
      } else if (event.staminaDelta !== undefined) {
        state.crawler.condition.currentStamina = Math.min(
          state.crawler.condition.maxStamina,
          Math.max(0, state.crawler.condition.currentStamina + Number(event.staminaDelta))
        );
      }
      break;
    }
  }

  return state;
}

export { projectCountdownState, formatCountdownDuration, isCountdownPhaseBreakEvent } from './countdowns.ts';
export { projectObservationValue, projectObservationValues } from './observations.ts';

export function projectState(
  docOrEvents: CrawlerTimelineDocument | CrawlerEvent[] | unknown,
  targetSequence: number,
  snapshots: Snapshot[] = [],
  customInitialState?: CrawlerState
): CrawlerState {
  let events: (TimelineEvent | CrawlerEvent)[] = [];
  let baseInitialState: CrawlerState;
  let activeSnapshots: Snapshot[] = snapshots;

  if (docOrEvents && typeof docOrEvents === 'object' && 'schemaVersion' in (docOrEvents as object)) {
    const doc = docOrEvents as CrawlerTimelineDocument;
    events = doc.events || [];
    baseInitialState = createInitialState(doc.initialState);

    // Map doc.snapshots if available
    if (Array.isArray(doc.snapshots)) {
      activeSnapshots = doc.snapshots.map((snap) => ({
        sequence: snap.sequence,
        state: createInitialState(snap.state),
      }));
    } else {
      activeSnapshots = [];
    }
  } else if (Array.isArray(docOrEvents)) {
    events = docOrEvents;
    baseInitialState = customInitialState || createInitialState();
  } else {
    baseInitialState = customInitialState || createInitialState();
  }

  if (events.length === 0) return baseInitialState;

  const minSeq = events[0].sequence ?? 1;
  const maxSeq = events[events.length - 1].sequence ?? 1;
  const clampedTarget = Math.max(minSeq, Math.min(targetSequence, maxSeq));

  let baseState: CrawlerState = baseInitialState;
  let startSequence = minSeq;

  // Filter valid snapshots <= targetSequence
  const validSnapshots = activeSnapshots
    .filter((s) => s.sequence <= clampedTarget)
    .sort((a, b) => b.sequence - a.sequence);

  if (validSnapshots.length > 0) {
    baseState = JSON.parse(JSON.stringify(validSnapshots[0].state));
    startSequence = validSnapshots[0].sequence + 1;
  }

  let currentState = baseState;
  const eventsToApply = events.filter(
    (e) => (e.sequence ?? 1) >= startSequence && (e.sequence ?? 1) <= clampedTarget
  );

  for (const event of eventsToApply) {
    currentState = applyEvent(currentState, event);
  }

  return currentState;
}
