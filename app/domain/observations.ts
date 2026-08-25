import type {
  CrawlerTimelineDocument,
  ProjectedObservationValue,
  TimelineEvent,
  TimelineObservation,
} from './types.ts';

interface NumericObservationSample {
  key: string;
  value: number;
  observation: TimelineObservation;
}

const scalarFieldsByKind: Partial<Record<TimelineObservation['kind'], string[]>> = {
  'crawler-condition': ['currentHealth', 'maxHealth', 'currentMana', 'maxMana', 'currentStamina', 'maxStamina'],
  'xp-progress': ['xp', 'maxXp', 'level'],
  'broadcast-metrics': ['viewers', 'followers', 'favorites', 'patrons', 'leaderboardRank', 'bounty'],
};

function numericSamples(observations: TimelineObservation[]): NumericObservationSample[] {
  const samples: NumericObservationSample[] = [];
  for (const observation of observations) {
    const values = observation as unknown as Record<string, unknown>;
    for (const field of scalarFieldsByKind[observation.kind] || []) {
      if (typeof values[field] === 'number') {
        samples.push({ key: `${observation.kind}.${field}`, value: values[field], observation });
      }
    }
    if (observation.kind === 'crawler-attributes') {
      const attributes = values.attributes;
      if (attributes && typeof attributes === 'object') {
        for (const [attribute, value] of Object.entries(attributes as Record<string, unknown>)) {
          if (typeof value === 'number') {
            samples.push({ key: `crawler-attributes.${attribute}`, value, observation });
          }
        }
      }
      if (typeof values.availableAttributePoints === 'number') {
        samples.push({
          key: 'crawler-attributes.availableAttributePoints',
          value: values.availableAttributePoints,
          observation,
        });
      }
    }
  }
  return samples;
}

/**
 * Projects one numeric HUD reading at a timeline position. An estimate is
 * produced only between two source readings that both explicitly declare
 * `interpolation: "linear"`; all other readings remain exact, discrete facts.
 */
export function projectObservationValue(
  doc: Pick<CrawlerTimelineDocument, 'events' | 'observations'>,
  targetSequence: number,
  key: string
): ProjectedObservationValue | null {
  const samples = numericSamples(doc.observations || [])
    .filter((sample) => sample.key === key)
    .sort((a, b) => a.observation.sequence - b.observation.sequence);
  const exact = samples.find((sample) => sample.observation.sequence === targetSequence);
  if (exact) {
    return {
      key,
      value: exact.value,
      status: 'stated',
      basis: 'exact-observation',
      evidence: exact.observation.evidence,
      referenceObservationIds: [exact.observation.id],
    };
  }

  const nextIndex = samples.findIndex((sample) => sample.observation.sequence > targetSequence);
  if (nextIndex <= 0) return null;
  const before = samples[nextIndex - 1];
  const after = samples[nextIndex];
  if (before.observation.interpolation !== 'linear' || after.observation.interpolation !== 'linear') {
    return null;
  }

  const eventBySequence = new Map<number, TimelineEvent>(doc.events.map((event) => [event.sequence, event]));
  const beforeElapsed = eventBySequence.get(before.observation.sequence)?.position.elapsedSeconds;
  const afterElapsed = eventBySequence.get(after.observation.sequence)?.position.elapsedSeconds;
  const targetElapsed = eventBySequence.get(targetSequence)?.position.elapsedSeconds;
  const hasElapsedBasis =
    typeof beforeElapsed === 'number' &&
    typeof afterElapsed === 'number' &&
    typeof targetElapsed === 'number' &&
    afterElapsed > beforeElapsed &&
    targetElapsed >= beforeElapsed &&
    targetElapsed <= afterElapsed;
  const fraction = hasElapsedBasis
    ? (targetElapsed - beforeElapsed) / (afterElapsed - beforeElapsed)
    : (targetSequence - before.observation.sequence) / (after.observation.sequence - before.observation.sequence);

  return {
    key,
    value: before.value + fraction * (after.value - before.value),
    status: 'estimated',
    basis: hasElapsedBasis ? 'elapsed-duration' : 'sequence-position',
    evidence: [...before.observation.evidence, ...after.observation.evidence],
    referenceObservationIds: [before.observation.id, after.observation.id],
  };
}

/** Returns all numeric readings that can be stated or estimated at a sequence. */
export function projectObservationValues(
  doc: Pick<CrawlerTimelineDocument, 'events' | 'observations'>,
  targetSequence: number
): Record<string, ProjectedObservationValue> {
  const results: Record<string, ProjectedObservationValue> = {};
  for (const key of new Set(numericSamples(doc.observations || []).map((sample) => sample.key))) {
    const projected = projectObservationValue(doc, targetSequence, key);
    if (projected) results[key] = projected;
  }
  return results;
}
