import { writeFileSync } from 'node:fs';

import { loadAllRawFloorDocuments } from '../app/domain/raw-loader.ts';
import { compileRawFloorFiles } from '../app/domain/raw-compiler.ts';

const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());
const destination = new URL('../data/compiled-timeline.json', import.meta.url);

writeFileSync(destination, `${JSON.stringify(compiledTimeline, null, 2)}\n`);
