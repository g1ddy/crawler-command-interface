import { compileFloorFiles } from './compiler.ts';
import { adaptRawFloorDocument, adaptRawFloorObservations } from './raw-adapter.ts';
import { validateRawCrawlerFloor, validateCrawlerTimeline } from './validation.ts';
import type { CrawlerTimelineDocument, RawCrawlerFloorDocument, TimelineObservation } from './types.ts';

/** Compiles raw floor documents and preserves their source-backed HUD readings. */
export function compileRawFloorFiles(rawDocs: RawCrawlerFloorDocument[]): CrawlerTimelineDocument {
  if (!Array.isArray(rawDocs) || rawDocs.length === 0) {
    throw new Error('Raw compiler error: No raw floor documents provided to compile.');
  }

  const adaptedDocs = rawDocs.map((rawDoc) => {
    const validation = validateRawCrawlerFloor(rawDoc);
    if (!validation.valid) {
      throw new Error(
        `Raw compiler error: Invalid raw floor document "${rawDoc.floor?.id || 'unknown'}": ${validation.errors.join('; ')}`
      );
    }
    return adaptRawFloorDocument(rawDoc);
  });

  const compiled = compileFloorFiles(adaptedDocs);
  const sequenceByEventId = new Map(compiled.events.map((event) => [event.id, event.sequence]));
  const observations: TimelineObservation[] = [];

  for (const rawDoc of rawDocs) {
    for (const { observation } of adaptRawFloorObservations(rawDoc)) {
      const sequence = sequenceByEventId.get(observation.eventId);
      if (sequence === undefined) {
        throw new Error(
          `Raw compiler error: Observation "${observation.id}" references missing event ID "${observation.eventId}".`
        );
      }
      const payload = { ...observation } as Record<string, unknown>;
      delete payload.eventId;
      observations.push({ ...payload, sequence } as TimelineObservation);
    }
  }

  const result = { ...compiled, observations: observations.length > 0 ? observations : undefined };
  const runtimeValidation = validateCrawlerTimeline(result);
  if (!runtimeValidation.valid) {
    throw new Error(`Raw compiler error: Generated runtime document failed validation: ${runtimeValidation.errors.join('; ')}`);
  }
  return result;
}
