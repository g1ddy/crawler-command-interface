export type EventCategory = 'loot' | 'combat' | 'skills' | 'quest' | 'levelup' | 'system';

export interface BaseEvent {
  sequence: number;
  occurred_at: string; // Floor time string e.g., "04:17:32"
  recorded_at: string; // ISO string
  causation_id?: string;
  correlation_id?: string;
  summary: string;
  category: EventCategory;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemCategory = 'EQUIPMENT' | 'CONSUMABLES' | 'QUEST ITEMS' | 'CRAFTING' | 'JUNK';

export type AttributeName = 'Strength' | 'Dexterity' | 'Constitution' | 'Intelligence' | 'Charisma';

export type CrawlerEvent = BaseEvent & (
  | {
      type: 'ItemAcquired';
      itemInstanceId: string;
      itemId: string;
      name: string;
      icon: string;
      rarity: ItemRarity;
      category: ItemCategory;
      slot?: string;
      quantity: number;
      maxStack: number;
      value: number;
      stats?: Record<string, number>;
      description: string;
      source: string;
      durability?: { current: number; max: number };
    }
  | {
      type: 'ItemQuantityChanged';
      itemInstanceId: string;
      delta: number;
      reason: string;
    }
  | {
      type: 'ItemEquipped';
      itemInstanceId: string;
      slot: string;
      unequippedInstanceId?: string;
    }
  | {
      type: 'ItemUnequipped';
      itemInstanceId: string;
      slot: string;
    }
  | {
      type: 'ItemConsumed';
      itemInstanceId: string;
      targetEffect?: string;
      healthRestored?: number;
      manaRestored?: number;
    }
  | {
      type: 'ItemDiscarded';
      itemInstanceId: string;
      reason: string;
    }
  | {
      type: 'AttributeModified';
      attribute: AttributeName;
      delta: number;
      source: 'allocation' | 'permanent_modifier' | 'gear' | 'blessing';
    }
  | {
      type: 'EffectApplied';
      effectId: string;
      name: string;
      effectType: 'good' | 'bad';
      icon: string;
      durationSeconds: number;
      description: string;
      statModifiers?: Record<string, number>;
    }
  | {
      type: 'EffectExpired';
      effectId: string;
    }
  | {
      type: 'SkillGranted';
      skillId: string;
      name: string;
      icon: string;
      rank: string;
      description: string;
      cooldown: string;
      category: 'combat' | 'utility' | 'passive';
      cost?: string;
      synergies?: string[];
    }
  | {
      type: 'XpAwarded';
      amount: number;
      source: string;
      newTotalXp: number;
      levelUp?: number;
    }
  | {
      type: 'QuestUpdated';
      questId: string;
      title: string;
      urgency: 'URGENT' | 'STANDARD' | 'COMPLETED';
      goals: string[];
      rewards: string;
      status: 'active' | 'completed' | 'failed';
      progressSummary: string;
    }
  | {
      type: 'AchievementUnlocked';
      achievementId: string;
      title: string;
      description: string;
      rewards: string;
      icon: string;
    }
  | {
      type: 'BroadcastUpdated';
      viewers: number;
      viewerDelta: string;
      followers: number;
      fameRank: string;
      sponsorInterest: boolean;
    }
  | {
      type: 'ConditionChanged';
      currentHealth?: number;
      maxHealth?: number;
      currentMana?: number;
      maxMana?: number;
      currentStamina?: number;
      maxStamina?: number;
    }
);

export interface InventoryItem {
  instanceId: string;
  itemId: string;
  name: string;
  icon: string;
  rarity: ItemRarity;
  category: ItemCategory;
  slot?: string;
  quantity: number;
  maxStack: number;
  value: number;
  stats?: Record<string, number>;
  description: string;
  durability?: { current: number; max: number };
  acquiredAtSequence: number;
  source: string;
  isLocked?: boolean;
  isEquipped?: boolean;
}

export type EquippedSlotMap = Record<string, string | null>;

export interface ActiveEffect {
  effectId: string;
  name: string;
  type: 'good' | 'bad';
  icon: string;
  durationSeconds: number;
  appliedAtSequence: number;
  description: string;
  statModifiers?: Record<string, number>;
}

export interface Skill {
  skillId: string;
  name: string;
  icon: string;
  rank: string;
  description: string;
  cooldown: string;
  category: 'combat' | 'utility' | 'passive';
  cost?: string;
  synergies?: string[];
}

export interface Quest {
  questId: string;
  title: string;
  urgency: 'URGENT' | 'STANDARD' | 'COMPLETED';
  goals: string[];
  rewards: string;
  status: 'active' | 'completed' | 'failed';
}

export interface Achievement {
  achievementId: string;
  title: string;
  description: string;
  rewards: string;
  icon: string;
  unlockedAtSequence: number;
}

export interface CrawlerState {
  sequence: number;
  occurredAt: string;
  crawler: {
    name: string;
    level: number;
    race: string;
    class: string;
    xp: number;
    maxXp: number;
    availableAttributePoints: number;
    attributes: Record<AttributeName, number>;
    permanentAttributeModifiers: Record<AttributeName, number>;
    condition: {
      currentHealth: number;
      maxHealth: number;
      currentMana: number;
      maxMana: number;
      currentStamina: number;
      maxStamina: number;
    };
  };
  inventory: InventoryItem[];
  equippedSlots: EquippedSlotMap;
  effects: ActiveEffect[];
  skills: Skill[];
  hotlist: string[]; // skillIds
  quests: Quest[];
  achievements: Achievement[];
  broadcast: {
    viewers: number;
    viewerDelta: string;
    followers: number;
    fameRank: string;
    sponsorInterest: boolean;
  };
  recentLogs: { sequence: number; timestamp: string; message: string; category: EventCategory }[];
}

export interface Snapshot {
  sequence: number;
  state: CrawlerState;
}

export interface ItemHistoryEntry {
  sequence: number;
  occurredAt: string;
  eventType: CrawlerEvent['type'];
  description: string;
}
