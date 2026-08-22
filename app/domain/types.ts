export type EventCategory = 'loot' | 'combat' | 'skills' | 'quest' | 'levelup' | 'system';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'celestial' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'unknown';
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
  | 'vehicle'
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
  citationStyle?: string;
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

export interface QuantityObject {
  known: boolean;
  value?: number;
  minimum?: number;
  unit?: string;
  note?: string;
}

export type QuantityValue = number | QuantityObject;

export interface TimelineItem {
  instanceId: string;
  itemId?: string;
  name: string;
  category: 'equipment' | 'consumable' | 'quest-item' | 'crafting' | 'box' | 'weapon' | 'tool' | 'document' | 'vehicle' | 'miscellaneous';
  rarity?: ItemRarity;
  quantity: QuantityValue;
  maxStack?: number;
  slot?: string;
  description?: string;
  stats?: Record<string, number>;
  sourceDescription?: string;
}

export interface RewardSpec {
  kind: 'box' | 'item' | 'xp' | 'entitlement' | 'feature' | 'other';
  boxType?: string;
  rarity?: ItemRarity;
  itemId?: string;
  amount?: number;
  description?: string;
}

export interface TimelineAchievement {
  id: string;
  title: string;
  sourceTitle?: string;
  description?: string;
  repeatCount?: number;
  reward?: RewardSpec[];
}

export interface TimelineEntitlement {
  id: string;
  name: string;
  location?: string;
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
  achievementId?: string;
  achievement?: TimelineAchievement;
}

export interface ItemAcquiredEvent extends TimelineEventBase {
  type: 'ItemAcquired';
  item: TimelineItem;
}

export interface ItemCraftedEvent extends TimelineEventBase {
  type: 'ItemCrafted';
  item: TimelineItem;
}

export interface ItemConsumedEvent extends TimelineEventBase {
  type: 'ItemConsumed';
  itemInstanceId: string;
  quantity?: QuantityValue;
  outcome?: string;
  healthRestored?: number;
  manaRestored?: number;
}

export interface ItemEquippedEvent extends TimelineEventBase {
  type: 'ItemEquipped';
  itemInstanceId: string;
  slot?: string;
}

export interface PermanentEntitlementGrantedEvent extends TimelineEventBase {
  type: 'PermanentEntitlementGranted';
  entitlement: TimelineEntitlement;
}

export interface NarrativeEvent extends TimelineEventBase {
  type: 'NarrativeEvent';
  kind: 'floor-entered' | 'floor-exited' | 'encounter-started' | 'encounter-resolved' | 'location-discovered' | 'dialogue' | 'choice-made' | 'transformation' | 'party-changed' | 'other';
  entities?: string[];
}

export type TimelineEvent =
  | AchievementUnlockedEvent
  | ItemAcquiredEvent
  | ItemCraftedEvent
  | ItemConsumedEvent
  | ItemEquippedEvent
  | PermanentEntitlementGrantedEvent
  | NarrativeEvent
  | TimelineEventBase;

export interface TimelineSnapshot {
  sequence: number;
  state: TimelineState;
  generatedFromEventHash?: string;
}

export interface FloorSegment {
  id: string;
  ordinal: number;
  title: string;
  book?: number;
  bookTitle?: string;
  startSequence: number;
  endSequence: number;
}

export interface CrawlerTimelineDocument {
  schemaVersion: 'crawler-timeline/v1' | 'crawler-timeline/v2';
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
  floors?: FloorSegment[];
  sources: TimelineSource[];
  initialState: TimelineState;
  events: TimelineEvent[];
  snapshots?: TimelineSnapshot[];
}

// Authoring Schema v2 Types
export interface CatalogItem {
  id: string;
  name: string;
  category: 'equipment' | 'consumable' | 'quest-item' | 'crafting' | 'box' | 'weapon' | 'tool' | 'document' | 'vehicle' | 'miscellaneous';
  slot?: string;
  rarity?: ItemRarity;
  persistent: boolean;
  description?: string;
  stats?: Record<string, number>;
}

export interface CatalogAchievement {
  id: string;
  title: string;
  description?: string;
  reward: RewardSpec[];
}

export interface FloorHeader {
  id: string;
  ordinal: number;
  title: string;
  book: number;
  bookTitle?: string;
  continuity: 'canonical' | 'adaptation' | 'alternate' | 'unknown';
  coverage: {
    kind: 'complete' | 'curated-critical' | 'curated' | 'partial';
    statement: string;
    completeness: 'complete' | 'partial' | 'seed';
  };
}

export interface FloorEventItemRef {
  instanceId: string;
  itemId: string;
  quantity: QuantityObject;
}

export interface FloorEventBase {
  id: string;
  order: number;
  type: string;
  position: TimelinePosition;
  summary: string;
  correlationId?: string;
  causationId?: string;
  evidence: TimelineEvidence[];
  kind?: string;
  achievementId?: string;
  item?: FloorEventItemRef;
  entitlement?: TimelineEntitlement;
}

export interface CrawlerFloorDocument {
  $schema?: string;
  authoringVersion: 'crawler-floor/v2';
  storyId: string;
  floor: FloorHeader;
  sources: TimelineSource[];
  catalog: {
    items: CatalogItem[];
    achievements: CatalogAchievement[];
  };
  events: FloorEventBase[];
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
  position?: TimelinePosition;
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
  quantityObject?: QuantityObject;
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
