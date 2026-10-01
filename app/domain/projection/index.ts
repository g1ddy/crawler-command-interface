import type {
  CrawlerEvent,
  CrawlerState,
  CrawlerTimelineDocument,
  ProjectedEventType,
  ProjectionNeutralEventType,
  Snapshot,
  TimelineEvent,
} from '../types.ts';
import {
  createInitialState,
  deriveCategory,
  formatElapsedSeconds,
} from './helpers.ts';
import {
  applyAttributeModified,
  applyConditionChanged,
  applyEffectApplied,
  applyEffectExpired,
  applyLevelChanged,
  applyXPChanged,
} from './crawler.ts';
import {
  applyItemAcquiredOrCrafted,
  applyItemConsumed,
  applyItemDiscarded,
  applyItemEquipped,
  applyItemLocked,
  applyItemLockToggled,
  applyItemQuantityChanged,
  applyItemRepaired,
  applyItemUnequipped,
  applyItemUnlocked,
} from './inventory.ts';
import {
  applyAchievementUnlocked,
  applyPermanentEntitlementGranted,
} from './achievements.ts';
import {
  applyHotlistUpdated,
  applySkillGranted,
  applySpellGranted,
} from './magic.ts';
import { applyPartyFormed } from './party.ts';
import {
  applyPetAcquired,
  applyPetBonded,
  applyPetClassificationChanged,
  applyPetHostilityChanged,
} from './pets.ts';
import { applyQuestUpdated } from './quests.ts';
import { applyBroadcastUpdated } from './broadcast.ts';

export { createInitialState } from './helpers.ts';

export type EventReducer = (
  state: CrawlerState,
  event: Record<string, unknown>,
  sequence: number
) => void;

/** Events explicitly recognized as projection-neutral for CrawlerState mutation. */
export const PROJECTION_NEUTRAL_EVENTS: Record<ProjectionNeutralEventType, true> = {
  NarrativeEvent: true,
  CountdownReset: true,
  CountdownPaused: true,
  CountdownResumed: true,
  CountdownPhaseChanged: true,
};

const eventReducers: Record<ProjectedEventType, EventReducer> = {
  ItemAcquired: (state, event, sequence) => applyItemAcquiredOrCrafted(state, event, sequence),
  ItemCrafted: (state, event, sequence) => applyItemAcquiredOrCrafted(state, event, sequence),
  ItemQuantityChanged: (state, event) => applyItemQuantityChanged(state, event),
  ItemEquipped: (state, event) => applyItemEquipped(state, event),
  ItemUnequipped: (state, event) => applyItemUnequipped(state, event),
  ItemLocked: (state, event) => applyItemLocked(state, event),
  ItemUnlocked: (state, event) => applyItemUnlocked(state, event),
  ItemLockToggled: (state, event) => applyItemLockToggled(state, event),
  ItemRepaired: (state, event) => applyItemRepaired(state, event),
  ItemConsumed: (state, event) => applyItemConsumed(state, event),
  ItemDiscarded: (state, event) => applyItemDiscarded(state, event),
  AchievementUnlocked: (state, event, sequence) => applyAchievementUnlocked(state, event, sequence),
  PermanentEntitlementGranted: (state, event) => applyPermanentEntitlementGranted(state, event),
  AttributeModified: (state, event, sequence) => applyAttributeModified(state, event, sequence),
  LevelChanged: (state, event, sequence) => applyLevelChanged(state, event, sequence),
  XPChanged: (state, event, sequence) => applyXPChanged(state, event, sequence),
  HotlistUpdated: (state, event) => applyHotlistUpdated(state, event),
  EffectApplied: (state, event, sequence) => applyEffectApplied(state, event, sequence),
  EffectExpired: (state, event) => applyEffectExpired(state, event),
  SkillGranted: (state, event) => applySkillGranted(state, event),
  SpellGranted: (state, event) => applySpellGranted(state, event),
  PartyFormed: (state, event) => applyPartyFormed(state, event),
  PetAcquired: (state, event) => applyPetAcquired(state, event),
  PetHostilityChanged: (state, event) => applyPetHostilityChanged(state, event),
  PetBonded: (state, event) => applyPetBonded(state, event),
  PetClassificationChanged: (state, event) => applyPetClassificationChanged(state, event),
  QuestUpdated: (state, event) => applyQuestUpdated(state, event),
  BroadcastUpdated: (state, event) => applyBroadcastUpdated(state, event),
  ConditionChanged: (state, event, sequence) => applyConditionChanged(state, event, sequence),
};

const causalProvenanceReducers: Partial<Record<ProjectedEventType, EventReducer>> = {
  AttributeModified: eventReducers.AttributeModified,
  LevelChanged: eventReducers.LevelChanged,
  XPChanged: eventReducers.XPChanged,
  ConditionChanged: eventReducers.ConditionChanged,
};

function projectCausalProvenance(
  initialState: CrawlerState,
  events: (TimelineEvent | CrawlerEvent)[],
  targetSequence: number
): CrawlerState['causalProvenance'] {
  const state = JSON.parse(JSON.stringify(initialState)) as CrawlerState;

  for (const event of events) {
    const sequence = Number(event.sequence ?? 1);
    if (sequence > targetSequence) break;

    const reducer = causalProvenanceReducers[String(event.type) as ProjectedEventType];
    if (reducer) reducer(state, event as unknown as Record<string, unknown>, sequence);
  }

  return state.causalProvenance;
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
      : 'exact time not sourced';
  state.occurredAt = occurredAt;

  const category = deriveCategory(event);
  const summary = typeof event.summary === 'string' ? event.summary : 'Event recorded';

  if (event.type !== 'NarrativeEvent') {
    state.recentLogs = [
      {
        sequence,
        timestamp: occurredAt,
        message: summary,
        category,
      },
      ...state.recentLogs,
    ].slice(0, 30);
  }

  const eventType = String(event.type);
  if (eventType in eventReducers) {
    const reducer = eventReducers[eventType as ProjectedEventType];
    reducer(state, event, sequence);
  }

  return state;
}

export { projectCountdownState, formatCountdownDuration, isCountdownPhaseBreakEvent } from '../countdowns.ts';
export { projectObservationValue, projectObservationValues, projectObservations } from '../observations.ts';

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

  const validSnapshots = activeSnapshots
    .filter((s) => s.sequence <= clampedTarget)
    .sort((a, b) => b.sequence - a.sequence);

  if (validSnapshots.length > 0) {
    baseState = JSON.parse(JSON.stringify(validSnapshots[0].state));
    baseState.causalProvenance = projectCausalProvenance(baseInitialState, events, validSnapshots[0].sequence);
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
