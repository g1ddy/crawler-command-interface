import type { TimelineEvent } from './types.ts';

/**
 * Floor segment ranges are compilation metadata. Live user actions can extend a
 * floor after compilation, so the event stream is authoritative for its end.
 */
export function getFloorEndSequence(
  events: Pick<TimelineEvent, 'sequence' | 'position'>[],
  floorOrdinal: number,
  fallbackSequence: number
): number {
  return events.reduce((latest, event) => {
    if (event.position?.floor !== floorOrdinal) return latest;
    return Math.max(latest, event.sequence);
  }, fallbackSequence);
}
