export type EventCategory = 'loot' | 'combat' | 'skills' | 'quest' | 'levelup' | 'system';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'celestial' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'unknown';
export type ItemCategory =
  | 'EQUIPMENT'
  | 'CONSUMABLES'
  | 'QUEST ITEMS'
  | 'CRAFTING'
  | 'BOXES'
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
  requirements?: Record<string, number | string>;
  sourceDescription?: string;
  durability?: { current: number; max: number };
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

export type NotificationKind = 'achievement' | 'progression' | 'skill' | 'quest' | 'reward' | 'system' | 'floor';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';
export interface NotificationDelivery {
  delivered: true;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title?: string;
  message?: string;
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
  attribute: AttributeName | string;
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

export interface PatronInfo {
  id: string;
  name: string;
  tier?: string;
  contribution?: string;
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

export interface TimelineSnapshot {
  sequence: number;
  state: TimelineState;
  generatedFromEventHash?: string;
}

export interface CountdownReference {
  sequence: number;
  remainingSeconds: number;
  activationOffset?: number;
  evidence: TimelineEvidence[];
  note?: string;
}

export interface TimelineCountdown {
  id: string;
  title: string;
  floor: number;
  target: 'floor-collapse' | 'safe-room-closure';
  references: CountdownReference[];
}

/** A sourced HUD reading anchored to an event in the compiled timeline. */
export interface TimelineObservationBase {
  id: string;
  kind: RawObservation['kind'];
  sequence: number;
  evidence: TimelineEvidence[];
  note?: string;
  /** Linear estimates are allowed only when both bounding readings opt in. */
  interpolation?: 'linear';
}

export type TimelineObservation = Omit<RawObservation, 'eventId'> & TimelineObservationBase;

export interface ProjectedObservationValue {
  key: string;
  value: number;
  /** Authored quantity semantics. Estimates are always exact numeric values. */
  quantity?: MetricQuantity;
  status: 'stated' | 'estimated';
  basis: 'exact-observation' | 'elapsed-duration' | 'sequence-position';
  evidence: TimelineEvidence[];
  referenceObservationIds: string[];
}

export type MetricQuantity =
  | { kind: 'exact'; value: number }
  | { kind: 'lower-bound'; value: number }
  | { kind: 'upper-bound'; value: number }
  | { kind: 'unknown' };

export interface ProjectedItemObservation {
  itemInstanceId: string;
  present?: boolean;
  quantity?: QuantityObject;
  isEquipped?: boolean;
  status: 'stated';
  basis: 'exact-observation';
  evidence: TimelineEvidence[];
  referenceObservationIds: string[];
  sequence: number;
}

export interface ProjectedEquipmentObservation {
  slot: string;
  itemInstanceId: string | null;
  status: 'stated';
  basis: 'exact-observation';
  evidence: TimelineEvidence[];
  referenceObservationIds: string[];
  sequence: number;
}

export interface ProjectedObservationsState {
  condition: Record<string, ProjectedObservationValue>;
  attributes: Record<string, ProjectedObservationValue>;
  xpProgress: Record<string, ProjectedObservationValue>;
  broadcast: Record<string, ProjectedObservationValue>;
  /** Floor-scoped telemetry, distinct from a crawler's broadcast audience. */
  floor: Record<string, ProjectedObservationValue>;
  inventory: Record<string, ProjectedItemObservation>;
  equipment: Record<string, ProjectedEquipmentObservation>;
}

export interface ActiveCountdownState {
  id: string;
  title: string;
  floor: number;
  target: 'floor-collapse' | 'safe-room-closure';
  lifecycleStatus: 'scheduled' | 'active' | 'completed';
  remainingSeconds: number;
  activationOffset?: number;
  status: 'stated' | 'estimated';
  /** True when this is the latest source reading, not a time at the selected sequence. */
  isStale: boolean;
  basis:
    | 'exact-reference'
    | 'last-known-reference'
    | 'elapsed-duration'
    | 'sequence-position'
    | 'elapsed-duration-extrapolation'
    | 'sequence-position-extrapolation'
    | 'activation-reference'
    | 'activation-extrapolation';
  confidence: 'confirmed' | 'corroborated' | 'candidate' | 'disputed' | 'low-confidence';
  formattedTime: string;
  formattedLabel: string;
  referencePoints: CountdownReference[];
  note?: string;
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
  recipient?: 'carl' | 'donut' | 'party';
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

export interface FloorCountdownReference {
  anchorEventId: string;
  remainingSeconds: number;
  activationOffset?: number;
  evidence: TimelineEvidence[];
  note?: string;
}

export interface FloorCountdown {
  id: string;
  title: string;
  target: 'floor-collapse' | 'safe-room-closure';
  references: FloorCountdownReference[];
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

// Raw authoring v1 keeps sourced observations separate from the compatibility
// shape consumed by the current timeline compiler and interface.
export interface RawCountdownObservation {
  id: string;
  kind: 'countdown-remaining';
  eventId: string;
  countdownId: string;
  remainingSeconds: number;
  activationOffset?: number;
  evidence: TimelineEvidence[];
  note?: string;
}

export interface RawCrawlerConditionObservation extends Omit<RawCountdownObservation, 'kind' | 'countdownId' | 'remainingSeconds'> { kind: 'crawler-condition'; interpolation?: 'linear'; currentHealth?: number; maxHealth?: number; currentMana?: number; maxMana?: number; currentStamina?: number; maxStamina?: number; }
export interface RawCrawlerAttributesObservation extends Omit<RawCountdownObservation, 'kind' | 'countdownId' | 'remainingSeconds'> { kind: 'crawler-attributes'; interpolation?: 'linear'; attributes: Record<string, number>; availableAttributePoints?: number; }
export interface RawXpProgressObservation extends Omit<RawCountdownObservation, 'kind' | 'countdownId' | 'remainingSeconds'> { kind: 'xp-progress'; interpolation?: 'linear'; xp?: number; maxXp?: number; level?: number; }
export interface RawBroadcastMetricsObservation extends Omit<RawCountdownObservation, 'kind' | 'countdownId' | 'remainingSeconds'> { kind: 'broadcast-metrics'; interpolation?: 'linear'; viewers?: number; followers?: number; favorites?: number; patrons?: number; leaderboardRank?: number; bounty?: number; }
/** Discrete, floor-wide readings; these are never interpolated. */
export interface RawFloorMetricsObservation extends Omit<RawCountdownObservation, 'kind' | 'countdownId' | 'remainingSeconds'> {
  kind: 'floor-metrics';
  remainingCrawlers?: number | MetricQuantity;
  boroughBossesKilled?: number | MetricQuantity;
  neighborhoodBossesKilled?: number | MetricQuantity;
  collapseDeaths?: number | MetricQuantity;
}
export interface RawInventoryStateObservation extends Omit<RawCountdownObservation, 'kind' | 'countdownId' | 'remainingSeconds'> { kind: 'inventory-state'; itemInstanceId: string; present?: boolean; quantity?: QuantityObject; isEquipped?: boolean; }
export interface RawEquipmentStateObservation extends Omit<RawCountdownObservation, 'kind' | 'countdownId' | 'remainingSeconds'> { kind: 'equipment-state'; slot: string; itemInstanceId: string | null; }
export type RawObservation = RawCountdownObservation | RawCrawlerConditionObservation | RawCrawlerAttributesObservation | RawXpProgressObservation | RawBroadcastMetricsObservation | RawFloorMetricsObservation | RawInventoryStateObservation | RawEquipmentStateObservation;

export interface RawFloorCountdown {
  id: string;
  title: string;
  target: 'floor-collapse' | 'safe-room-closure';
}

export type RawFloorEvent = Omit<FloorEventBase, 'order'>;

export interface RawCrawlerFloorDocument extends Omit<CrawlerFloorDocument, 'authoringVersion' | 'countdowns' | 'events'> {
  authoringVersion: 'crawler-floor-raw/v1';
  countdowns?: RawFloorCountdown[];
  events: RawFloorEvent[];
  observations?: RawObservation[];
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
