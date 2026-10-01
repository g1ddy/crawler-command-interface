import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatSequencePosition,
  genericEventsAtOrBefore,
  getNarrativePresentation,
  narrativeEventsAtOrBefore,
} from '../../app/domain/narrative-presentation.ts';
import { projectCountdownState } from '../../app/domain/countdowns.ts';
import { projectState } from '../../app/domain/projection.ts';

test('maps all narrative kinds and safely falls back', () => {
  for (const kind of ['rule-changed', 'episode-released', 'floor-collapsed', 'encounter-resolved', 'floor-entered', 'floor-exited', 'encounter-started', 'location-discovered', 'dialogue', 'choice-made', 'transformation', 'party-changed', 'other']) {
    const value = getNarrativePresentation(kind);
    assert.ok(value.label && value.icon && value.accessibleLabel);
  }
  assert.equal(getNarrativePresentation('future-kind').label, 'Story event');
  assert.equal(getNarrativePresentation('floor-collapsed').terminal, true);
});

test('rule history respects scrub position and floor without mutation', () => {
  const events = [
    { type: 'NarrativeEvent', kind: 'rule-changed', sequence: 2, position: { floor: 1 } },
    { type: 'NarrativeEvent', kind: 'rule-changed', sequence: 4, position: { floor: 1 } },
    { type: 'NarrativeEvent', kind: 'rule-changed', sequence: 3, position: { floor: 2 } },
  ];
  assert.deepEqual(narrativeEventsAtOrBefore(events, 3, 1, 'rule-changed').map(({ sequence }) => sequence), [2]);
  assert.deepEqual(narrativeEventsAtOrBefore(events, 5, 1, 'rule-changed').map(({ sequence }) => sequence), [2, 4]);
  assert.deepEqual(events.map(({ sequence }) => sequence), [2, 4, 3]);
});

test('generic history comes from immutable non-narrative events in the selected floor', () => {
  const events = [
    { type: 'NarrativeEvent', kind: 'rule-changed', sequence: 1, position: { floor: 1 } },
    { type: 'AchievementUnlocked', sequence: 2, position: { floor: 1 } },
    { type: 'NarrativeEvent', kind: 'episode-released', sequence: 3, position: { floor: 2 } },
    { type: 'AchievementUnlocked', sequence: 4, position: { floor: 2 } },
  ];

  assert.deepEqual(genericEventsAtOrBefore(events, 4, 2).map(({ sequence }) => sequence), [4]);
  assert.deepEqual(genericEventsAtOrBefore(events, 4, 'all').map(({ sequence }) => sequence), [2, 4]);
});

test('unanchored story positions disclose missing exact time', () => {
  assert.equal(formatSequencePosition({ floor: 2 }, []), 'Floor 2 · exact time not sourced');
  assert.equal(formatSequencePosition({ floor: 1, chapter: 7 }, []), 'Floor 1 · Chapter 7');
});

test('unanchored narrative projection never inherits a prior exact-looking timestamp', () => {
  const events = [
    {
      sequence: 1,
      type: 'NarrativeEvent',
      kind: 'other',
      summary: 'Anchored story beat',
      position: { floor: 1, elapsedSeconds: 60 },
    },
    {
      sequence: 2,
      type: 'NarrativeEvent',
      kind: 'other',
      summary: 'Unanchored story beat',
      position: { floor: 1 },
    },
  ];

  const anchored = projectState(events, 1);
  const unanchored = projectState(events, 2);
  assert.equal(anchored.occurredAt, '04:01:00');
  assert.equal(unanchored.occurredAt, 'exact time not sourced');
});

test('typed narrative events are not flattened into generic recent logs', () => {
  const events = [
    {
      sequence: 1,
      type: 'NarrativeEvent',
      kind: 'rule-changed',
      summary: 'Typed rule history',
      position: { floor: 1 },
    },
    {
      sequence: 2,
      type: 'LevelChanged',
      level: 2,
      summary: 'Generic level event',
      position: { floor: 1 },
    },
  ];

  const state = projectState(events, 2);
  assert.deepEqual(state.recentLogs.map(({ sequence, message }) => ({ sequence, message })), [
    { sequence: 2, message: 'Generic level event' },
  ]);
});

test('secondary countdown projection disappears when replay moves to another floor', () => {
  const events = [
    { sequence: 1, type: 'NarrativeEvent', position: { floor: 1 } },
    { sequence: 2, type: 'NarrativeEvent', position: { floor: 1 } },
    { sequence: 3, type: 'NarrativeEvent', position: { floor: 2 } },
  ];
  const countdowns = [
    {
      id: 'countdown-floor-1-safe-room',
      title: 'Time to Safe Room Closure',
      floor: 1,
      target: 'safe-room-closure',
      references: [
        { sequence: 1, remainingSeconds: 120, evidence: [{ sourceId: 'src-test' }] },
        { sequence: 2, remainingSeconds: 60, evidence: [{ sourceId: 'src-test' }] },
      ],
    },
  ];

  assert.equal(projectCountdownState({ events, countdowns }, 2, 1)?.id, 'countdown-floor-1-safe-room');
  assert.equal(projectCountdownState({ events, countdowns }, 3, 1), null);
});
