import { writeFileSync } from 'node:fs';

import floor1RawDocument from '../data/raw/floors/floor-1.json' with { type: 'json' };
import floor2RawDocument from '../data/raw/floors/floor-2.json' with { type: 'json' };
import { compileRawFloorFiles } from '../app/domain/raw-compiler.ts';

const compiledTimeline = compileRawFloorFiles([floor1RawDocument, floor2RawDocument]);
const destination = new URL('../data/compiled-timeline.json', import.meta.url);

writeFileSync(destination, `${JSON.stringify(compiledTimeline, null, 2)}\n`);
