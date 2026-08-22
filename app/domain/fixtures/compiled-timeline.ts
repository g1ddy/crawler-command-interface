import floor1Json from '../../../data/floors/floor-1.json' with { type: 'json' };
import floor6Json from '../../../data/floors/floor-6.json' with { type: 'json' };
import { compileFloorFiles } from '../compiler.ts';
import type { CrawlerFloorDocument, CrawlerTimelineDocument } from '../types.ts';

export const floor1AuthoredDoc = floor1Json as unknown as CrawlerFloorDocument;
export const floor6AuthoredDoc = floor6Json as unknown as CrawlerFloorDocument;

export const compiledTimeline: CrawlerTimelineDocument = compileFloorFiles([
  floor1AuthoredDoc,
  floor6AuthoredDoc,
]);
