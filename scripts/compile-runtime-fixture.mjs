import { loadAllRawFloorDocuments } from '../app/domain/raw-loader.ts';
import { compileRawFloorFiles } from '../app/domain/raw-compiler.ts';
import { writeJsonFixtureIfChanged } from './sync-derived-fixtures.mjs';

const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());
const destination = new URL('../data/compiled-timeline.json', import.meta.url);

writeJsonFixtureIfChanged(destination, compiledTimeline);
