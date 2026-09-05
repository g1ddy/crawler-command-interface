import type {
  CatalogAchievement,
  CatalogItem,
  ItemCategory,
  ItemRarity,
  RewardSpec,
  TimelineSource,
} from './catalogs.ts';
import type {
  FloorCountdown,
  RawFloorCountdown,
  TimelineCountdown,
} from './countdowns.ts';
import type {
  EventCategory,
  FloorEventBase,
  Party,
  RawFloorEvent,
  SpoilerScope,
  Spell,
  TimelineAchievement,
  TimelineEntitlement,
  TimelineEvent,
  TimelineItem,
} from './events.ts';
import type {
  QuantityObject,
  RawObservation,
  TimelineObservation,
} from './observations.ts';

export type AttributeName = 'Strength' | 'Dexterity' | 'Constitution' | 'Intelligence' | 'Charisma';

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
  spells?: Spell[];
  party?: Party;
  quests?: Record<string, unknown>[];
  entitlements?: TimelineEntitlement[];
  hotlist?: string[];
}

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
  countdowns?: TimelineCountdown[];
  observations?: TimelineObservation[];
  snapshots?: TimelineSnapshot[];
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
  countdowns?: FloorCountdown[];
  events: FloorEventBase[];
}

export interface RawCrawlerFloorDocument extends Omit<CrawlerFloorDocument, 'authoringVersion' | 'countdowns' | 'events'> {
  authoringVersion: 'crawler-floor-raw/v1';
  countdowns?: RawFloorCountdown[];
  events: RawFloorEvent[];
  observations?: RawObservation[];
}

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
  maxStack: number | 'NOT SOURCED';
  value: number;
  stats?: Record<string, number>;
  requirements?: Record<string, number | string>;
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
  type: 'good' | 'bad' | 'injury' | 'other';
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
  recipient?: 'carl' | 'donut' | 'party';
  description: string;
  rewards: RewardSpec[];
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
  spells: Spell[];
  party?: Party;
  hotlist: string[]; // skillIds
  quests: Quest[];
  achievements: Achievement[];
  entitlements: TimelineEntitlement[];
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
