import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadAllRawFloorDocuments } from '../app/domain/raw-loader.ts';
import { adaptRawFloorDocument } from '../app/domain/raw-adapter.ts';
import { compileRawFloorFiles } from '../app/domain/raw-compiler.ts';

/**
 * Writes a JSON object to disk if it differs from the existing file.
 * Suppresses timestamp-only churn for timeline documents when non-timestamp content is unchanged.
 */
export function writeJsonFixtureIfChanged(destination, newObj) {
  const destinationPath = destination instanceof URL ? fileURLToPath(destination) : destination;
  const newFormattedText = `${JSON.stringify(newObj, null, 2)}\n`;

  if (!existsSync(destinationPath)) {
    writeFileSync(destinationPath, newFormattedText, 'utf8');
    return { written: true, reason: 'created' };
  }

  let existingText;
  try {
    existingText = readFileSync(destinationPath, 'utf8');
  } catch {
    writeFileSync(destinationPath, newFormattedText, 'utf8');
    return { written: true, reason: 'read_error' };
  }

  let existingObj;
  try {
    existingObj = JSON.parse(existingText);
  } catch {
    writeFileSync(destinationPath, newFormattedText, 'utf8');
    return { written: true, reason: 'invalid_json' };
  }

  // Handle timeline objects with createdAt / updatedAt timestamps
  if (
    newObj &&
    typeof newObj === 'object' &&
    newObj.timeline &&
    typeof newObj.timeline === 'object' &&
    existingObj &&
    typeof existingObj === 'object' &&
    existingObj.timeline &&
    typeof existingObj.timeline === 'object'
  ) {
    const candidateWithDiskTimestamps = {
      ...newObj,
      timeline: {
        ...newObj.timeline,
        createdAt: existingObj.timeline.createdAt ?? newObj.timeline.createdAt,
        updatedAt: existingObj.timeline.updatedAt ?? newObj.timeline.updatedAt,
      },
    };

    const candidateText = `${JSON.stringify(candidateWithDiskTimestamps, null, 2)}\n`;
    if (candidateText === existingText) {
      // Non-timestamp content is identical to what is on disk.
      // Do not write to disk to prevent timestamp churn.
      return { written: false, reason: 'timestamp_only_churn' };
    }

    // Meaningful changes exist. Preserve createdAt from disk if present, update updatedAt.
    const finalObj = {
      ...newObj,
      timeline: {
        ...newObj.timeline,
        createdAt: existingObj.timeline.createdAt ?? newObj.timeline.createdAt,
        updatedAt: newObj.timeline.updatedAt,
      },
    };
    const finalText = `${JSON.stringify(finalObj, null, 2)}\n`;
    if (finalText === existingText) {
      return { written: false, reason: 'identical' };
    }
    writeFileSync(destinationPath, finalText, 'utf8');
    return { written: true, reason: 'data_changed' };
  }

  // Ordinary JSON objects (e.g. derived floor files)
  if (newFormattedText === existingText) {
    return { written: false, reason: 'identical' };
  }

  writeFileSync(destinationPath, newFormattedText, 'utf8');
  return { written: true, reason: 'data_changed' };
}

export function syncDerivedFixtures() {
  const rawFloors = loadAllRawFloorDocuments();

  for (const rawFloor of rawFloors) {
    const derivedFloor = adaptRawFloorDocument(rawFloor);
    const destination = new URL(`../data/floors/floor-${rawFloor.floor.ordinal}.json`, import.meta.url);
    writeJsonFixtureIfChanged(destination, derivedFloor);
  }

  const compiledTimeline = compileRawFloorFiles(rawFloors);
  const compiledDestination = new URL('../data/compiled-timeline.json', import.meta.url);
  writeJsonFixtureIfChanged(compiledDestination, compiledTimeline);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncDerivedFixtures();
}
