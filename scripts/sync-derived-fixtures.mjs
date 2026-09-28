import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadAllRawFloorDocuments } from '../app/domain/raw-loader.ts';
import { adaptRawFloorDocument } from '../app/domain/raw-adapter.ts';
import { compileRawFloorFiles } from '../app/domain/raw-compiler.ts';

/**
 * Performs a deep equality comparison of two JavaScript values.
 */
function isDeepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }
  return true;
}

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

  // Read existing file; let filesystem read errors propagate directly.
  const existingText = readFileSync(destinationPath, 'utf8');

  // Parse existing JSON; let SyntaxError or JSON parse errors propagate directly.
  const existingObj = JSON.parse(existingText);

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
    // Normalize newObj's timestamps to match existingObj for comparison
    const normalizedGenerated = {
      ...newObj,
      timeline: {
        ...newObj.timeline,
        createdAt: existingObj.timeline.createdAt,
        updatedAt: existingObj.timeline.updatedAt,
      },
    };

    // Parsed object comparison
    if (isDeepEqual(normalizedGenerated, existingObj)) {
      // Non-timestamp content is identical to what is on disk.
      // Do not write to disk, preserving exact existing content, formatting, and timestamps.
      return { written: false, reason: 'timestamp_only_churn' };
    }

    // Meaningful changes exist. Preserve existing timeline.createdAt when present, use generated timeline.updatedAt.
    const finalObj = {
      ...newObj,
      timeline: {
        ...newObj.timeline,
        ...(existingObj.timeline.createdAt !== undefined ? { createdAt: existingObj.timeline.createdAt } : {}),
      },
    };
    const finalText = `${JSON.stringify(finalObj, null, 2)}\n`;
    writeFileSync(destinationPath, finalText, 'utf8');
    return { written: true, reason: 'data_changed' };
  }

  // Ordinary JSON objects (e.g. derived floor files) - compare parsed structures or formatted text
  if (isDeepEqual(newObj, existingObj) || newFormattedText === existingText) {
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
