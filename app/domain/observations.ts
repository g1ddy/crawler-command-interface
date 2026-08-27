import type {
  CrawlerTimelineDocument,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
  ProjectedObservationsState,
  RawEquipmentStateObservation,
  RawInventoryStateObservation,
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
  'floor-metrics': ['remainingCrawlers', 'boroughBossesKilled', 'neighborhoodBossesKilled', 'collapseDeaths'],
};

const discreteKeys = new Set([
  'xp-progress.level',
  'floor-metrics.remainingCrawlers',
  'floor-metrics.boroughBossesKilled',
  'floor-metrics.neighborhoodBossesKilled',
  'floor-metrics.collapseDeaths',
]);

function numericSamples(observations: TimelineObservation[]): NumericObservationSample[] {
  const samples: NumericObservationSample[] = [];
  for (const observation of observations) {
    const values = observation as unknown as Record<string, unknown>;
    for (const field of scalarFieldsByKind[observation.kind] || []) {
      if (typeof values[field] === 'number') {
        samples.push({ key: `${observation.kind}.${field}`, value: values[field] as number, observation });
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

  if (discreteKeys.has(key)) {
    return null;
  }

  const nextIndex = samples.findIndex((sample) => sample.observation.sequence > targetSequence);
  if (nextIndex <= 0) return null;
  const before = samples[nextIndex - 1];
  const after = samples[nextIndex];
  if (before.observation.interpolation !== 'linear' || after.observation.interpolation !== 'linear') {
    return null;
  }

  const eventBySequence = new Map<number, TimelineEvent>(doc.events.map((event) => [event.sequence, event]));
  const beforeEvent = eventBySequence.get(before.observation.sequence);
  const afterEvent = eventBySequence.get(after.observation.sequence);

  // Linear interpolation never crosses a floor boundary
  if (
    beforeEvent?.position?.floor !== undefined &&
    afterEvent?.position?.floor !== undefined &&
    beforeEvent.position.floor !== afterEvent.position.floor
  ) {
    return null;
  }

  // Linear interpolation never crosses a countdown phase boundary
  const intermediateEvents = doc.events.filter(
    (e) => e.sequence > before.observation.sequence && e.sequence <= after.observation.sequence
  );
  const hasPhaseBreak = intermediateEvents.some(
    (e) =>
      e.type === 'CountdownPaused' ||
      e.type === 'CountdownResumed' ||
      e.type === 'CountdownReset' ||
      e.type === 'CountdownPhaseChanged'
  );
  if (hasPhaseBreak) {
    return null;
  }

  const beforeElapsed = beforeEvent?.position?.elapsedSeconds;
  const afterElapsed = afterEvent?.position?.elapsedSeconds;
  const targetElapsed = eventBySequence.get(targetSequence)?.position?.elapsedSeconds;
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

/**
 * Projects all latest source-backed HUD observations available at or before
 * the target sequence across all 6 supported non-countdown observation kinds.
 */
export function projectObservations(
  doc: Pick<CrawlerTimelineDocument, 'events' | 'observations'>,
  targetSequence: number
): ProjectedObservationsState {
  const observations = doc.observations || [];
  const eventBySequence = new Map(doc.events.map((event) => [event.sequence, event]));
  const targetFloor = eventBySequence.get(targetSequence)?.position?.floor;
  const samplesByKey = new Map<string, NumericObservationSample[]>();
  for (const sample of numericSamples(observations)) {
    let list = samplesByKey.get(sample.key);
    if (!list) {
      list = [];
      samplesByKey.set(sample.key, list);
    }
    list.push(sample);
  }

  const projectedValues: Record<string, ProjectedObservationValue> = {};

  for (const [key, samples] of samplesByKey.entries()) {
    const projected = projectObservationValue(doc, targetSequence, key);
    if (projected) {
      projectedValues[key] = projected;
    } else {
      // Stepwise fallback: find latest sample at or before targetSequence
      // Floor-wide metrics do not carry across floor boundaries.
      if (key.startsWith('floor-metrics.') && targetFloor === undefined) continue;
      const priorSamples = samples
        .filter((s) => {
          if (s.observation.sequence > targetSequence) return false;
          if (!key.startsWith('floor-metrics.')) return true;
          return eventBySequence.get(s.observation.sequence)?.position?.floor === targetFloor;
        })
        .sort((a, b) => b.observation.sequence - a.observation.sequence);

      if (priorSamples.length > 0) {
        const latest = priorSamples[0];
        projectedValues[key] = {
          key,
          value: latest.value,
          status: 'stated',
          basis: 'exact-observation',
          evidence: latest.observation.evidence,
          referenceObservationIds: [latest.observation.id],
        };
      }
    }
  }

  const condition: Record<string, ProjectedObservationValue> = {};
  const attributes: Record<string, ProjectedObservationValue> = {};
  const xpProgress: Record<string, ProjectedObservationValue> = {};
  const broadcast: Record<string, ProjectedObservationValue> = {};
  const floor: Record<string, ProjectedObservationValue> = {};

  for (const [key, val] of Object.entries(projectedValues)) {
    if (key.startsWith('crawler-condition.')) {
      condition[key.slice('crawler-condition.'.length)] = val;
    } else if (key.startsWith('crawler-attributes.')) {
      attributes[key.slice('crawler-attributes.'.length)] = val;
    } else if (key.startsWith('xp-progress.')) {
      xpProgress[key.slice('xp-progress.'.length)] = val;
    } else if (key.startsWith('broadcast-metrics.')) {
      broadcast[key.slice('broadcast-metrics.'.length)] = val;
    } else if (key.startsWith('floor-metrics.')) {
      floor[key.slice('floor-metrics.'.length)] = val;
    }
  }

  // Inventory state observations
  const inventory: Record<string, ProjectedItemObservation> = {};
  const inventoryObs = observations
    .filter((o) => o.kind === 'inventory-state' && o.sequence <= targetSequence)
    .sort((a, b) => b.sequence - a.sequence);

  for (const obs of inventoryObs) {
    const itemObs = obs as unknown as RawInventoryStateObservation & { sequence: number };
    if (!inventory[itemObs.itemInstanceId]) {
      inventory[itemObs.itemInstanceId] = {
        itemInstanceId: itemObs.itemInstanceId,
        present: itemObs.present,
        quantity: itemObs.quantity,
        isEquipped: itemObs.isEquipped,
        status: 'stated',
        basis: 'exact-observation',
        evidence: itemObs.evidence,
        referenceObservationIds: [itemObs.id],
        sequence: itemObs.sequence,
      };
    }
  }

  // Equipment state observations
  const equipment: Record<string, ProjectedEquipmentObservation> = {};
  const equipmentObs = observations
    .filter((o) => o.kind === 'equipment-state' && o.sequence <= targetSequence)
    .sort((a, b) => b.sequence - a.sequence);

  for (const obs of equipmentObs) {
    const eqObs = obs as unknown as RawEquipmentStateObservation & { sequence: number };
    if (!equipment[eqObs.slot]) {
      equipment[eqObs.slot] = {
        slot: eqObs.slot,
        itemInstanceId: eqObs.itemInstanceId,
        status: 'stated',
        basis: 'exact-observation',
        evidence: eqObs.evidence,
        referenceObservationIds: [eqObs.id],
        sequence: eqObs.sequence,
      };
    }
  }

  return {
    condition,
    attributes,
    xpProgress,
    broadcast,
    floor,
    inventory,
    equipment,
  };
}
