import compiledTimelineDocument from '../../../data/compiled-timeline.json' with { type: 'json' };
import type { CrawlerTimelineDocument } from '../types.ts';

// This is a checked-in runtime artifact generated from the raw floor files.
// Keeping compilation in authoring tooling prevents Ajv schema compilation
// from entering the Cloudflare Worker SSR import path.
export const compiledTimeline = compiledTimelineDocument as CrawlerTimelineDocument;
