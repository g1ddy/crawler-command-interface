import { compileFloorFiles } from './compiler.ts';
import { adaptRawFloorDocument } from './raw-adapter.ts';
import { validateRawCrawlerFloor } from './validation.ts';
import type { CrawlerTimelineDocument, RawCrawlerFloorDocument } from './types.ts';

/** Compiles raw floor documents through the unchanged legacy runtime contract. */
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

  return compileFloorFiles(adaptedDocs);
}
