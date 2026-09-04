import { writeFileSync } from 'node:fs';

import { loadAllRawFloorDocuments } from '../app/domain/raw-loader.ts';
import { adaptRawFloorDocument } from '../app/domain/raw-adapter.ts';
import { compileRawFloorFiles } from '../app/domain/raw-compiler.ts';

const rawFloors = loadAllRawFloorDocuments();

for (const rawFloor of rawFloors) {
  const derivedFloor = adaptRawFloorDocument(rawFloor);
  const destination = new URL(`../data/floors/floor-${rawFloor.floor.ordinal}.json`, import.meta.url);
  writeFileSync(destination, `${JSON.stringify(derivedFloor, null, 2)}\n`);
}

const compiledTimeline = compileRawFloorFiles(rawFloors);
const compiledDestination = new URL('../data/compiled-timeline.json', import.meta.url);
writeFileSync(compiledDestination, `${JSON.stringify(compiledTimeline, null, 2)}\n`);
