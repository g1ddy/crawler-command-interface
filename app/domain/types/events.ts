import type {
  PatronInfo,
  RewardSpec,
  TimelineEvidence,
} from './catalogs.ts';
import type { QuantityValue, TimelinePosition } from './observations.ts';

export type EventCategory = 'loot' | 'combat' | 'skills' | 'quest' | 'levelup' | 'system';

export interface SpoilerScope {
  book?: number;
  chapter?: number;
  floor?: number;
}

export interface TimelineItem {
  instanceId: string;
  itemId?: string;
  name: string;
  category: 'equipment' | 'consumable' | 'quest-item' | 'crafting' | 'box' | 'weapon' | 'tool' | 'document' | 'vehicle' | 'miscellaneous';
  rarity?: import('./catalogs.ts').ItemRarity;
  quantity: QuantityValue;
  maxStack?: number;
  slot?: string;
  description?: string;
  stats?: Record<string, number>;
  requirements?: Record<string, number | string>;
  sourceDescription?: string;
  durability?: { current: number; max: number };
}

export interface TimelineAchievement {
  id: string;
  title: string;
  recipient?: 'carl' | 'donut' | 'party';
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

export interface SpellAcquisitionSource {
  kind: 'crawler-menu' | 'loot-box' | 'equipment' | 'dungeon-book';
  name: string;
  /** Present only when a spell is granted by a particular equipped item. */
  itemInstanceId?: string;
}

/** Magic is deliberately modeled separately from ordinary crawler skills. */
export interface Spell {
  spellId: string;
  name: string;
  owner: 'carl' | 'donut';
  abilityKind: 'spell';
  acquisitionSource: SpellAcquisitionSource;
}

/** A sourced crawler roster. It deliberately excludes pets and social groups. */
export interface PartyMember {
  crawlerId: string;
  name: string;
  role: 'leader' | 'member';
}

export interface Party {
  partyId: string;
  name: string;
  members: PartyMember[];
}

export type NotificationKind = 'achievement' | 'progression' | 'skill' | 'quest' | 'reward' | 'system' | 'floor';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';
export interface NotificationDelivery {
  delivered: true;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title?: string;
  message?: string;
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
  notificationDelivery?: NotificationDelivery;
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

export interface ItemDiscardedEvent extends TimelineEventBase {
  type: 'ItemDiscarded';
  itemInstanceId: string;
  quantity?: QuantityValue;
  reason?: string;
}

export interface ItemQuantityChangedEvent extends TimelineEventBase {
  type: 'ItemQuantityChanged';
  itemInstanceId: string;
  delta: number;
  quantity?: QuantityValue;
  reason?: string;
}

export interface ItemEquippedEvent extends TimelineEventBase {
  type: 'ItemEquipped';
  itemInstanceId: string;
  slot?: string;
}

export interface ItemUnequippedEvent extends TimelineEventBase {
  type: 'ItemUnequipped';
  itemInstanceId: string;
  slot?: string;
}

export interface PermanentEntitlementGrantedEvent extends TimelineEventBase {
  type: 'PermanentEntitlementGranted';
  entitlement: TimelineEntitlement;
}

export interface SpellGrantedEvent extends TimelineEventBase {
  type: 'SpellGranted';
  spell: Spell;
}

export interface PartyFormedEvent extends TimelineEventBase {
  type: 'PartyFormed';
  party: Party;
}

export interface NarrativeEvent extends TimelineEventBase {
  type: 'NarrativeEvent';
  kind: 'floor-entered' | 'floor-exited' | 'floor-collapsed' | 'encounter-started' | 'encounter-resolved' | 'episode-released' | 'rule-changed' | 'location-discovered' | 'dialogue' | 'choice-made' | 'transformation' | 'party-changed' | 'other';
  entities?: string[];
}

export type NarrativeEventKind = NarrativeEvent['kind'];

export interface LevelChangedEvent extends TimelineEventBase {
  type: 'LevelChanged';
  level: number;
  previousLevel?: number;
  reason?: string;
}

export interface AttributeModifiedEvent extends TimelineEventBase {
  type: 'AttributeModified';
  attribute: string;
  delta: number;
  source?: string;
  reason?: string;
  isAllocation?: boolean;
}

export interface ConditionChangedEvent extends TimelineEventBase {
  type: 'ConditionChanged';
  currentHealth?: number;
  maxHealth?: number;
  healthDelta?: number;
  currentMana?: number;
  maxMana?: number;
  manaDelta?: number;
  currentStamina?: number;
  maxStamina?: number;
  staminaDelta?: number;
  reason?: string;
}

export interface XPChangedEvent extends TimelineEventBase {
  type: 'XPChanged';
  xp?: number;
  xpDelta?: number;
  maxXp?: number;
  reason?: string;
}

export interface QuestUpdatedEvent extends TimelineEventBase {
  type: 'QuestUpdated';
  questId: string;
  title?: string;
  urgency?: 'URGENT' | 'STANDARD' | 'COMPLETED';
  goals?: string[];
  rewards?: string;
  status: 'active' | 'completed' | 'failed';
}

export interface HotlistUpdatedEvent extends TimelineEventBase {
  type: 'HotlistUpdated';
  hotlist?: string[];
  skillId?: string;
  index?: number;
}

export interface EffectExpiredEvent extends TimelineEventBase {
  type: 'EffectExpired';
  effectId: string;
  reason?: string;
}

export interface CountdownResetEvent extends TimelineEventBase {
  type: 'CountdownReset';
  countdownId: string;
  newRemainingSeconds?: number;
  phase?: string;
  reason?: string;
}

export interface CountdownPausedEvent extends TimelineEventBase {
  type: 'CountdownPaused';
  countdownId: string;
  phase?: string;
  reason?: string;
}

export interface CountdownResumedEvent extends TimelineEventBase {
  type: 'CountdownResumed';
  countdownId: string;
  phase?: string;
  reason?: string;
}

export interface CountdownPhaseChangedEvent extends TimelineEventBase {
  type: 'CountdownPhaseChanged';
  countdownId: string;
  fromPhase?: string;
  toPhase?: string;
  newRemainingSeconds?: number;
  reason?: string;
}

export interface BroadcastUpdatedEvent extends TimelineEventBase {
  type: 'BroadcastUpdated';
  viewers?: number;
  viewerDelta?: string;
  followers?: number;
  fameRank?: string;
  sponsorInterest?: boolean;
  patrons?: PatronInfo[];
  favorites?: (string | PatronInfo)[];
  metrics?: Record<string, unknown>;
}

export type TimelineEvent =
  | AchievementUnlockedEvent
  | ItemAcquiredEvent
  | ItemCraftedEvent
  | ItemConsumedEvent
  | ItemDiscardedEvent
  | ItemQuantityChangedEvent
  | ItemEquippedEvent
  | ItemUnequippedEvent
  | PermanentEntitlementGrantedEvent
  | SpellGrantedEvent
  | PartyFormedEvent
  | NarrativeEvent
  | LevelChangedEvent
  | AttributeModifiedEvent
  | ConditionChangedEvent
  | XPChangedEvent
  | QuestUpdatedEvent
  | HotlistUpdatedEvent
  | EffectExpiredEvent
  | CountdownResetEvent
  | CountdownPausedEvent
  | CountdownResumedEvent
  | CountdownPhaseChangedEvent
  | BroadcastUpdatedEvent
  | TimelineEventBase;

export interface FloorEventItemRef {
  instanceId: string;
  itemId: string;
  quantity: import('./observations.ts').QuantityObject;
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
  spell?: Spell;
  itemInstanceId?: string;
  slot?: string;
  level?: number;
  previousLevel?: number;
  skillId?: string;
  name?: string;
  icon?: string;
  rank?: string;
  description?: string;
  cooldown?: string;
  category?: 'combat' | 'utility' | 'passive';
  effectId?: string;
  effectType?: 'good' | 'bad' | 'injury' | 'other';
  notificationDelivery?: NotificationDelivery;
  durationSeconds?: number;
  statModifiers?: Record<string, number>;
  viewers?: number;
  viewerDelta?: string;
  followers?: number;
  fameRank?: string;
  sponsorInterest?: boolean;
  attribute?: string;
  delta?: number;
  source?: string;
  reason?: string;
  isAllocation?: boolean;
  currentHealth?: number;
  maxHealth?: number;
  healthDelta?: number;
  currentMana?: number;
  maxMana?: number;
  manaDelta?: number;
  currentStamina?: number;
  maxStamina?: number;
  staminaDelta?: number;
  xp?: number;
  xpDelta?: number;
  maxXp?: number;
  quantity?: QuantityValue;
  outcome?: string;
  healthRestored?: number;
  manaRestored?: number;
  questId?: string;
  title?: string;
  urgency?: 'URGENT' | 'STANDARD' | 'COMPLETED';
  goals?: string[];
  rewards?: string;
  status?: 'active' | 'completed' | 'failed';
  hotlist?: string[];
  index?: number;
  countdownId?: string;
  newRemainingSeconds?: number;
  phase?: string;
  fromPhase?: string;
  toPhase?: string;
  patrons?: PatronInfo[];
  favorites?: (string | PatronInfo)[];
  metrics?: Record<string, unknown>;
}

export type RawFloorEvent = Omit<FloorEventBase, 'order'>;

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
