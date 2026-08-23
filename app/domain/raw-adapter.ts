import type {
  CrawlerFloorDocument,
  FloorCountdownReference,
  RawCrawlerFloorDocument,
} from './types.ts';

/**
 * Converts raw, source-backed observations into the existing Floor v2
 * compatibility contract. The adapter deliberately performs no estimation;
 * it only resolves stable event IDs to the legacy local order references.
 */
export function adaptRawFloorDocument(rawDoc: RawCrawlerFloorDocument): CrawlerFloorDocument {
  const eventById = new Map(rawDoc.events.map((event) => [event.id, event]));
  const countdownById = new Map((rawDoc.countdowns || []).map((countdown) => [countdown.id, countdown]));
  const referencesByCountdown = new Map<string, FloorCountdownReference[]>();

  for (const observation of rawDoc.observations || []) {
    const event = eventById.get(observation.eventId);
    if (!event) {
      throw new Error(
        `Raw adapter error: Observation "${observation.id}" references missing event ID "${observation.eventId}".`
      );
    }
    if (!countdownById.has(observation.countdownId)) {
      throw new Error(
        `Raw adapter error: Observation "${observation.id}" references missing countdown ID "${observation.countdownId}".`
      );
    }

    const references = referencesByCountdown.get(observation.countdownId) || [];
    references.push({
      anchorOrder: event.order,
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
