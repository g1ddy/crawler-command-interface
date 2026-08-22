export type EventCategory = 'loot' | 'combat' | 'skills' | 'quest' | 'levelup' | 'system';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'celestial' | 'unknown';
export type ItemCategory =
  | 'EQUIPMENT'
  | 'CONSUMABLES'
  | 'QUEST ITEMS'
  | 'CRAFTING'
  | 'JUNK'
  | 'equipment'
  | 'consumable'
  | 'quest-item'
  | 'crafting'
  | 'box'
  | 'weapon'
  | 'tool'
  | 'document'
  | 'miscellaneous';

export type AttributeName = 'Strength' | 'Dexterity' | 'Constitution' | 'Intelligence' | 'Charisma';

export interface SpoilerScope {
  book?: number;
  chapter?: number;
  floor?: number;
}

export interface TimelineSource {
  id: string;
  kind: 'official-text' | 'official-audio' | 'official-preview' | 'wiki' | 'fan-compendium' | 'discussion' | 'editorial';
  trust: 'primary' | 'corroborating' | 'candidate';
  title: string;
  url: string;
  accessedAt?: string;
  revision?: string;
}

export interface TimelineEvidence {
  sourceId: string;
  locator?: {
    book?: number;
    chapter?: number;
    floor?: number;
    section?: string;
    timestamp?: string;
  };
  note?: string;
  confidence?: 'confirmed' | 'corroborated' | 'candidate' | 'disputed';
}

export interface TimelinePosition {
  floor: number;
  book?: number;
  chapter?: number;
  scene?: number;
  elapsedSeconds?: number;
}

export interface TimelineItem {
  instanceId: string;
  itemId?: string;
  name: string;
  category: 'equipment' | 'consumable' | 'quest-item' | 'crafting' | 'box' | 'weapon' | 'tool' | 'document' | 'miscellaneous';
  rarity?: ItemRarity;
  quantity: number;
  maxStack?: number;
  slot?: string;
  description?: string;
  stats?: Record<string, number>;
  sourceDescription?: string;
}

export interface TimelineAchievement {
  id: string;
  title: string;
  sourceTitle?: string;
  description?: string;
  repeatCount?: number;
}

export interface TimelineEntitlement {
  id: string;
  name: string;
  description?: string;
}

export interface TimelineState {
  crawler: {
    name: string;
    level: number;
    race?: string;
    class?: string;
    xp?: number;
    maxXp?: number;
    attributes: Record<string, number>;
    condition: Record<string, number>;
  };
  inventory?: TimelineItem[];
  achievements?: TimelineAchievement[];
  skills?: Record<string, unknown>[];
  quests?: Record<string, unknown>[];
  entitlements?: TimelineEntitlement[];
}

export interface TimelineEventBase {
  id: string;
  sequence: number;
  type: string;
  position: TimelinePosition;
  summary: string;
  spoilerScope?: SpoilerScope;
  causationId?: string;
  correlationId?: string;
  evidence: TimelineEvidence[];
}

export interface AchievementUnlockedEvent extends TimelineEventBase {
  type: 'AchievementUnlocked';
  achievement: TimelineAchievement;
}

export interface ItemAcquiredEvent extends TimelineEventBase {
  type: 'ItemAcquired';
  item: TimelineItem;
}

export interface ItemConsumedEvent extends TimelineEventBase {
  type: 'ItemConsumed';
  itemInstanceId: string;
  quantity: number;
  outcome?: string;
}

export interface ItemEquippedEvent extends TimelineEventBase {
  type: 'ItemEquipped';
  itemInstanceId: string;
  slot: string;
}

export interface PermanentEntitlementGrantedEvent extends TimelineEventBase {
  type: 'PermanentEntitlementGranted';
  entitlement: TimelineEntitlement;
}

export interface NarrativeEvent extends TimelineEventBase {
  type: 'NarrativeEvent';
  kind: 'floor-entered' | 'encounter-started' | 'encounter-resolved' | 'location-discovered' | 'dialogue' | 'choice-made' | 'transformation' | 'party-changed' | 'other';
  entities?: string[];
}

export type TimelineEvent =
  | AchievementUnlockedEvent
  | ItemAcquiredEvent
  | ItemConsumedEvent
  | ItemEquippedEvent
  | PermanentEntitlementGrantedEvent
  | NarrativeEvent;

export interface TimelineSnapshot {
  sequence: number;
  state: TimelineState;
  generatedFromEventHash?: string;
}

export interface CrawlerTimelineDocument {
  schemaVersion: 'crawler-timeline/v1';
  timeline: {
    id: string;
    title: string;
    story: {
      id: string;
      title: string;
      spoilerScope?: SpoilerScope;
    };
    createdAt?: string;
    updatedAt?: string;
  };
  sources: TimelineSource[];
  initialState: TimelineState;
  events: TimelineEvent[];
  snapshots?: TimelineSnapshot[];
}

// UI State Types
export interface BaseEvent {
  sequence: number;
  occurred_at: string; // Floor time string e.g., "04:17:32"
  recorded_at?: string; // ISO string
  causation_id?: string;
  correlation_id?: string;
  summary: string;
  category: EventCategory;
}

export interface CrawlerEventAdapter extends BaseEvent {
  id?: string;
  type: string;
  [key: string]: unknown;
}

export type CrawlerEvent = CrawlerEventAdapter;

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
  eventType: string;
  description: string;
}
