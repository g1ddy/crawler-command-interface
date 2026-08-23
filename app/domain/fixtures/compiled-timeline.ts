import floor1Document from '../../../data/floors/floor-1.json' with { type: 'json' };
import floor2Document from '../../../data/floors/floor-2.json' with { type: 'json' };
import { compileFloorFiles } from '../compiler.ts';
import type { CrawlerFloorDocument, CrawlerTimelineDocument } from '../types.ts';

// Keep the app fixture compiled from the authored floor documents so the
// runtime always reflects every checked-in floor source.
export const compiledTimeline: CrawlerTimelineDocument = compileFloorFiles([
  floor1Document as CrawlerFloorDocument,
  floor2Document as CrawlerFloorDocument,
]);
