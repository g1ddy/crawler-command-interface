import type {
  CrawlerFloorDocument,
  FloorCountdownReference,
  RawCrawlerFloorDocument,
  RawObservation,
} from './types.ts';

/**
 * A raw observation whose stable event anchor has been validated. This retains
 * the source reading rather than converting evidence into a state-changing event.
 */
export interface AdaptedRawObservation {
  observation: RawObservation;
}

/**
 * Validates every source-backed observation's stable event anchor. Raw event
 * array position establishes chronology, but relationships are expressed by ID.
 */
export function adaptRawFloorObservations(rawDoc: RawCrawlerFloorDocument): AdaptedRawObservation[] {
  const eventIds = new Set(rawDoc.events.map((event) => event.id));
  const countdownById = new Map((rawDoc.countdowns || []).map((countdown) => [countdown.id, countdown]));

  return (rawDoc.observations || []).map((observation) => {
    if (!eventIds.has(observation.eventId)) {
      throw new Error(
        `Raw adapter error: Observation "${observation.id}" references missing event ID "${observation.eventId}".`
      );
    }
    if (observation.kind === 'countdown-remaining' && !countdownById.has(observation.countdownId)) {
      throw new Error(
        `Raw adapter error: Observation "${observation.id}" references missing countdown ID "${observation.countdownId}".`
      );
    }
    return { observation };
  });
}

/**
 * Converts raw, source-backed observations into the existing Floor v2
 * compatibility contract. Event order remains generated for compatibility,
 * while countdown relationships retain their stable event IDs.
 */
export function adaptRawFloorDocument(rawDoc: RawCrawlerFloorDocument): CrawlerFloorDocument {
  const referencesByCountdown = new Map<string, FloorCountdownReference[]>();
  const eventIndexById = new Map(rawDoc.events.map((event, index) => [event.id, index]));

  for (const { observation } of adaptRawFloorObservations(rawDoc)) {
    // Countdown readings participate in the floor compatibility projection.
    // Every observation kind remains available to the runtime compiler.
    if (observation.kind !== 'countdown-remaining') continue;

    const references = referencesByCountdown.get(observation.countdownId) || [];
    references.push({
      anchorEventId: observation.eventId,
      remainingSeconds: observation.remainingSeconds,
      ...(observation.activationOffset !== undefined ? { activationOffset: observation.activationOffset } : {}),
      evidence: observation.evidence,
      note: observation.note,
    });
    referencesByCountdown.set(observation.countdownId, references);
  }

  return {
    $schema: 'https://g1ddy.github.io/crawler-command-interface/schema/crawler-floor.v2.schema.json',
    authoringVersion: 'crawler-floor/v2',
    storyId: rawDoc.storyId,
    floor: rawDoc.floor,
    sources: rawDoc.sources,
    catalog: rawDoc.catalog,
    countdowns: (rawDoc.countdowns || []).map((countdown) => ({
      ...countdown,
      references: (referencesByCountdown.get(countdown.id) || []).sort(
        (left, right) =>
          (eventIndexById.get(left.anchorEventId) ?? Number.MAX_SAFE_INTEGER) -
          (eventIndexById.get(right.anchorEventId) ?? Number.MAX_SAFE_INTEGER),
      ),
    })),
    events: rawDoc.events.map((event, index) => ({ ...event, order: index + 1 })),
  };
}
