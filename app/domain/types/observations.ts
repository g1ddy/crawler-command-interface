import type { TimelineEvidence } from './catalogs.ts';

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

export type MetricQuantity =
  | { kind: 'exact'; value: number }
  | { kind: 'lower-bound'; value: number }
  | { kind: 'upper-bound'; value: number }
  | { kind: 'unknown' };

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

// Raw authoring v1 observations
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
