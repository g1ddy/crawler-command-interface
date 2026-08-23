import floor1RawDocument from '../../../data/raw/floors/floor-1.json' with { type: 'json' };
import floor2RawDocument from '../../../data/raw/floors/floor-2.json' with { type: 'json' };
import { compileRawFloorFiles } from '../raw-compiler.ts';
import type { CrawlerTimelineDocument, RawCrawlerFloorDocument } from '../types.ts';

// Keep the app fixture compiled from raw floor documents through the
// compatibility adapter so the interface contract remains unchanged.
export const compiledTimeline: CrawlerTimelineDocument = compileRawFloorFiles([
  floor1RawDocument as RawCrawlerFloorDocument,
  floor2RawDocument as RawCrawlerFloorDocument,
]);
