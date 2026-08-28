import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSequencePosition, getNarrativePresentation, narrativeEventsAtOrBefore } from '../app/domain/narrative-presentation.ts';

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

test('unanchored story positions disclose missing exact time', () => {
  assert.equal(formatSequencePosition({ floor: 2 }, []), 'Floor 2 · exact time not sourced');
  assert.equal(formatSequencePosition({ floor: 1, chapter: 7 }, []), 'Floor 1 · Chapter 7');
});
