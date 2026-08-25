import type {
  CrawlerFloorDocument,
  FloorCountdownReference,
  RawCrawlerFloorDocument,
  RawObservation,
} from './types.ts';

/**
 * A raw observation with its resolved legacy floor anchor. This deliberately
 * retains the original observation rather than converting a sourced reading
 * into a state-changing event.
 */
export interface AdaptedRawObservation {
  observation: RawObservation;
  anchorOrder: number;
}

/**
 * Resolves every source-backed observation to its event order. The legacy
 * floor document only consumes countdown readings, but callers compiling the
 * runtime timeline use this complete mapping so non-countdown HUD evidence is
 * never silently discarded.
 */
export function adaptRawFloorObservations(rawDoc: RawCrawlerFloorDocument): AdaptedRawObservation[] {
  const eventById = new Map(rawDoc.events.map((event) => [event.id, event]));
  const countdownById = new Map((rawDoc.countdowns || []).map((countdown) => [countdown.id, countdown]));

  return (rawDoc.observations || []).map((observation) => {
    const event = eventById.get(observation.eventId);
    if (!event) {
      throw new Error(
        `Raw adapter error: Observation "${observation.id}" references missing event ID "${observation.eventId}".`
      );
    }
    if (observation.kind === 'countdown-remaining' && !countdownById.has(observation.countdownId)) {
      throw new Error(
        `Raw adapter error: Observation "${observation.id}" references missing countdown ID "${observation.countdownId}".`
      );
    }
    return { observation, anchorOrder: event.order };
  });
}

/**
 * Converts raw, source-backed observations into the existing Floor v2
 * compatibility contract. The adapter deliberately performs no estimation;
 * it only resolves stable event IDs to the legacy local order references.
 */
export function adaptRawFloorDocument(rawDoc: RawCrawlerFloorDocument): CrawlerFloorDocument {
  const referencesByCountdown = new Map<string, FloorCountdownReference[]>();

  for (const { observation, anchorOrder } of adaptRawFloorObservations(rawDoc)) {
    // Countdown readings participate in the legacy countdown compatibility
    // projection. Every observation kind is still resolved above and remains
    // available to the runtime compiler through adaptRawFloorObservations.
    if (observation.kind !== 'countdown-remaining') continue;

    const references = referencesByCountdown.get(observation.countdownId) || [];
    references.push({
      anchorOrder,
      remainingSeconds: observation.remainingSeconds,
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
      references: referencesByCountdown.get(countdown.id) || [],
    })),
    events: rawDoc.events,
  };
}
