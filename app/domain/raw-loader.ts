import fs from 'node:fs';
import path from 'node:path';
import type { CatalogAchievement, CatalogItem, RawCrawlerFloorDocument } from './types.ts';

const DEFAULT_RAW_DIR = path.resolve(process.cwd(), 'data/raw');

export function loadCatalogItems(baseDir: string = DEFAULT_RAW_DIR): CatalogItem[] {
  const filePath = path.join(baseDir, 'catalogs', 'items.json');
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function loadCatalogAchievements(baseDir: string = DEFAULT_RAW_DIR): CatalogAchievement[] {
  const filePath = path.join(baseDir, 'catalogs', 'achievements.json');
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export interface RawFloorCatalogRefs {
  items: string[];
  achievements: string[];
}

function resolveFloorCatalogEntries<T extends { id: string }>(
  ids: string[],
  sharedEntries: T[],
  kind: 'item' | 'achievement',
  sharedCatalogPath: string,
  floorDirPath: string,
): T[] {
  const byId = new Map(sharedEntries.map((entry) => [entry.id, entry]));
  const seen = new Set<string>();

  return ids.map((id) => {
    if (seen.has(id)) {
      throw new Error(`Raw floor loader error: Floor "${floorDirPath}" catalog references duplicate ${kind} ID "${id}".`);
    }
    seen.add(id);

    const entry = byId.get(id);
    if (!entry) {
      throw new Error(`Raw floor loader error: Floor "${floorDirPath}" catalog references ${kind} ID "${id}" which was not found in ${sharedCatalogPath}.`);
    }
    return entry;
  });
}

export function loadRawFloorDocument(floorFolderOrPath: string, baseDir: string = DEFAULT_RAW_DIR): RawCrawlerFloorDocument {
  let floorDirPath: string;
  if (floorFolderOrPath.endsWith('floor.json')) {
    floorDirPath = path.dirname(floorFolderOrPath);
  } else if (path.isAbsolute(floorFolderOrPath) || floorFolderOrPath.includes('/') || floorFolderOrPath.includes('\\')) {
    floorDirPath = floorFolderOrPath;
  } else {
    floorDirPath = path.join(baseDir, 'floors', floorFolderOrPath);
  }

  const floorMetadataPath = path.join(floorDirPath, 'floor.json');
  const eventsPath = path.join(floorDirPath, 'events.json');
  const observationsPath = path.join(floorDirPath, 'observations.json');
  const countdownsPath = path.join(floorDirPath, 'countdowns.json');
  const sourcesPath = path.join(floorDirPath, 'sources.json');
  const catalogRefsPath = path.join(floorDirPath, 'catalog.json');

  if (!fs.existsSync(floorMetadataPath)) {
    throw new Error(`Raw floor loader error: Could not find "${floorMetadataPath}".`);
  }
  if (!fs.existsSync(catalogRefsPath)) {
    throw new Error(`Raw floor loader error: Could not find required floor catalog membership file "${catalogRefsPath}".`);
  }

  const floorMeta = JSON.parse(fs.readFileSync(floorMetadataPath, 'utf8'));
  const events = fs.existsSync(eventsPath) ? JSON.parse(fs.readFileSync(eventsPath, 'utf8')) : [];
  const observations = fs.existsSync(observationsPath) ? JSON.parse(fs.readFileSync(observationsPath, 'utf8')) : [];
  const countdowns = fs.existsSync(countdownsPath) ? JSON.parse(fs.readFileSync(countdownsPath, 'utf8')) : [];
  const sources = fs.existsSync(sourcesPath) ? JSON.parse(fs.readFileSync(sourcesPath, 'utf8')) : [];
  const catalogRefs: RawFloorCatalogRefs = JSON.parse(fs.readFileSync(catalogRefsPath, 'utf8'));

  if (!Array.isArray(catalogRefs.items) || !Array.isArray(catalogRefs.achievements)) {
    throw new Error(`Raw floor loader error: Floor catalog membership file "${catalogRefsPath}" must contain items and achievements arrays.`);
  }

  const rawBaseDir = path.resolve(floorDirPath, '../..');
  const sharedItems = loadCatalogItems(rawBaseDir);
  const sharedAchievements = loadCatalogAchievements(rawBaseDir);

  const floorItems = resolveFloorCatalogEntries(
    catalogRefs.items,
    sharedItems,
    'item',
    'shared catalogs/items.json',
    floorDirPath,
  );
  const floorAchievements = resolveFloorCatalogEntries(
    catalogRefs.achievements,
    sharedAchievements,
    'achievement',
    'shared catalogs/achievements.json',
    floorDirPath,
  );

  return {
    $schema: floorMeta.$schema || 'https://g1ddy.github.io/crawler-command-interface/schema/crawler-floor-raw.v1.schema.json',
    authoringVersion: floorMeta.authoringVersion || 'crawler-floor-raw/v1',
    storyId: floorMeta.storyId,
    floor: floorMeta.floor,
    sources,
    catalog: {
      items: floorItems,
      achievements: floorAchievements,
    },
    countdowns: countdowns.length > 0 ? countdowns : undefined,
    events,
    observations: observations.length > 0 ? observations : undefined,
  };
}

export function loadAllRawFloorDocuments(baseDir: string = DEFAULT_RAW_DIR): RawCrawlerFloorDocument[] {
  const floorsDir = path.join(baseDir, 'floors');
  if (!fs.existsSync(floorsDir)) {
    throw new Error(`Raw floor loader error: Floors directory "${floorsDir}" does not exist.`);
  }

  const entries = fs.readdirSync(floorsDir, { withFileTypes: true });
  const floorDirs = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('floor-'))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const numA = parseInt(a.replace('floor-', ''), 10) || 0;
      const numB = parseInt(b.replace('floor-', ''), 10) || 0;
      return numA - numB;
    });

  return floorDirs.map((dirName) => loadRawFloorDocument(dirName, baseDir));
}
