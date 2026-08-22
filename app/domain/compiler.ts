import { validateCrawlerFloor, validateCrawlerTimeline } from './validation.ts';
import type {
  CatalogAchievement,
  CatalogItem,
  CrawlerFloorDocument,
  CrawlerTimelineDocument,
  FloorSegment,
  TimelineEvent,
  TimelineItem,
  TimelineSource,
} from './types.ts';

function areItemsIdentical(a: CatalogItem, b: CatalogItem): boolean {
  if (
    a.name !== b.name ||
    a.category !== b.category ||
    a.slot !== b.slot ||
    a.rarity !== b.rarity ||
    a.persistent !== b.persistent ||
    a.description !== b.description
  ) {
    return false;
  }
  const statsA = JSON.stringify(a.stats || {});
  const statsB = JSON.stringify(b.stats || {});
  return statsA === statsB;
}

export function compileFloorFiles(floorDocs: CrawlerFloorDocument[]): CrawlerTimelineDocument {
  if (!Array.isArray(floorDocs) || floorDocs.length === 0) {
    throw new Error('Compiler error: No floor documents provided to compile.');
  }

  // 1. Sort floors deterministically by floor.ordinal ascending
  const sortedDocs = [...floorDocs].sort((a, b) => (a.floor?.ordinal ?? 0) - (b.floor?.ordinal ?? 0));

  // Validate storyId consistency
  const primaryStoryId = sortedDocs[0].storyId;
  for (const doc of sortedDocs) {
    if (doc.storyId !== primaryStoryId) {
      throw new Error(
        `Compiler error: Mismatched storyId across floor files ("${primaryStoryId}" vs "${doc.storyId}").`
      );
    }
  }

  // 2. Validate every floor file
  for (const doc of sortedDocs) {
    const validation = validateCrawlerFloor(doc);
    if (!validation.valid) {
      throw new Error(
        `Compiler error: Invalid floor document "${doc.floor?.id || 'unknown'}": ${validation.errors.join('; ')}`
      );
    }
  }

  // 3. De-duplicate & merge sources, catalogs
  const sourcesMap = new Map<string, TimelineSource>();
  const itemsCatalog = new Map<string, CatalogItem>();
  const achCatalog = new Map<string, CatalogAchievement>();
  const globalEventIds = new Set<string>();

  for (const doc of sortedDocs) {
    // Sources
    for (const src of doc.sources) {
      if (sourcesMap.has(src.id)) {
        const existing = sourcesMap.get(src.id)!;
        if (
          existing.title !== src.title ||
          existing.url !== src.url ||
          existing.citationStyle !== src.citationStyle
        ) {
          throw new Error(
            `Compiler error: Conflicting source definition for source ID "${src.id}" across floors.`
          );
        }
      } else {
        sourcesMap.set(src.id, { ...src });
      }
    }

    // Catalog Items
    for (const item of doc.catalog.items) {
      if (itemsCatalog.has(item.id)) {
        const existing = itemsCatalog.get(item.id)!;
        if (!areItemsIdentical(existing, item)) {
          throw new Error(
            `Compiler error: Conflicting catalog item definition for item ID "${item.id}" across floors.`
          );
        }
      } else {
        itemsCatalog.set(item.id, item);
      }
    }

    // Catalog Achievements
    for (const ach of doc.catalog.achievements) {
      if (achCatalog.has(ach.id)) {
        const existing = achCatalog.get(ach.id)!;
        if (existing.title !== ach.title) {
          throw new Error(
            `Compiler error: Conflicting catalog achievement definition for achievement ID "${ach.id}" across floors.`
          );
        }
      } else {
        achCatalog.set(ach.id, ach);
      }
    }
  }

  // 4. Convert floor-local order to globally increasing sequence & build floor index
  const floorSegments: FloorSegment[] = [];
  const compiledEvents: TimelineEvent[] = [];
  let globalSequence = 1;

  for (const doc of sortedDocs) {
    const startSequence = globalSequence;

    for (const rawEv of doc.events) {
      if (globalEventIds.has(rawEv.id)) {
        throw new Error(`Compiler error: Duplicate event ID "${rawEv.id}" across floor files.`);
      }
      globalEventIds.add(rawEv.id);

      const seq = globalSequence++;
      const pos = {
        floor: doc.floor.ordinal,
        book: rawEv.position.book ?? doc.floor.book,
        chapter: rawEv.position.chapter,
        scene: rawEv.position.scene,
        elapsedSeconds: rawEv.position.elapsedSeconds,
      };

      if (rawEv.type === 'AchievementUnlocked') {
        const achDef = achCatalog.get(rawEv.achievementId!);
        if (!achDef) {
          throw new Error(
            `Compiler error: Event "${rawEv.id}" references unmapped achievement ID "${rawEv.achievementId}".`
          );
        }
        compiledEvents.push({
          id: rawEv.id,
          sequence: seq,
          type: 'AchievementUnlocked',
          position: pos,
          summary: rawEv.summary,
          correlationId: rawEv.correlationId,
          causationId: rawEv.causationId,
          evidence: rawEv.evidence,
          achievement: {
            id: achDef.id,
            title: achDef.title,
            description: achDef.description,
            reward: achDef.reward,
          },
        });
      } else if (rawEv.type === 'ItemAcquired' || rawEv.type === 'ItemCrafted') {
        const itemDef = itemsCatalog.get(rawEv.item!.itemId);
        if (!itemDef) {
          throw new Error(
            `Compiler error: Event "${rawEv.id}" references unmapped item ID "${rawEv.item!.itemId}".`
          );
        }

        const itemObj: TimelineItem = {
          instanceId: rawEv.item!.instanceId,
          itemId: itemDef.id,
          name: itemDef.name,
          category: itemDef.category,
          slot: itemDef.slot,
          rarity: itemDef.rarity || 'common',
          description: itemDef.description,
          stats: itemDef.stats,
          quantity: rawEv.item!.quantity,
          sourceDescription: `${doc.floor.title}`,
        };

        compiledEvents.push({
          id: rawEv.id,
          sequence: seq,
          type: rawEv.type,
          position: pos,
          summary: rawEv.summary,
          correlationId: rawEv.correlationId,
          causationId: rawEv.causationId,
          evidence: rawEv.evidence,
          item: itemObj,
        });
      } else if (rawEv.type === 'PermanentEntitlementGranted') {
        compiledEvents.push({
          id: rawEv.id,
          sequence: seq,
          type: 'PermanentEntitlementGranted',
          position: pos,
          summary: rawEv.summary,
          correlationId: rawEv.correlationId,
          causationId: rawEv.causationId,
          evidence: rawEv.evidence,
          entitlement: rawEv.entitlement!,
        });
      } else {
        compiledEvents.push({
          id: rawEv.id,
          sequence: seq,
          type: 'NarrativeEvent',
          kind: (rawEv.kind as NarrativeEventKind) || 'other',
          position: pos,
          summary: rawEv.summary,
          correlationId: rawEv.correlationId,
          causationId: rawEv.causationId,
          evidence: rawEv.evidence,
        });
      }
    }

    const endSequence = globalSequence - 1;
    floorSegments.push({
      id: doc.floor.id,
      ordinal: doc.floor.ordinal,
      title: doc.floor.title,
      book: doc.floor.book,
      bookTitle: doc.floor.bookTitle,
      startSequence,
      endSequence,
    });
  }

  const firstFloor = sortedDocs[0].floor;
  const compiledDoc: CrawlerTimelineDocument = {
    schemaVersion: 'crawler-timeline/v2',
    timeline: {
      id: `tl-compiled-${sortedDocs[0].storyId}`,
      title: `Compiled Crawler Storyline (Floors ${sortedDocs.map((d) => d.floor.ordinal).join(', ')})`,
      story: {
        id: sortedDocs[0].storyId,
        title: 'World Dungeon Storyline',
        spoilerScope: {
          book: firstFloor.book,
          floor: sortedDocs[sortedDocs.length - 1].floor.ordinal,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    floors: floorSegments,
    sources: Array.from(sourcesMap.values()),
    initialState: {
      crawler: {
        name: 'CARL G.',
        level: 1,
        race: 'HUMAN',
        class: 'SCOUT',
        xp: 0,
        maxXp: 1000,
        attributes: {
          Strength: 10,
          Dexterity: 10,
          Constitution: 10,
          Intelligence: 10,
          Charisma: 10,
        },
        condition: {
          currentHealth: 100,
          maxHealth: 100,
          currentMana: 50,
          maxMana: 50,
          currentStamina: 50,
          maxStamina: 50,
        },
      },
      inventory: [],
      achievements: [],
      skills: [],
      quests: [],
      entitlements: [],
    },
    events: compiledEvents,
  };

  const runtimeValidation = validateCrawlerTimeline(compiledDoc);
  if (!runtimeValidation.valid) {
    throw new Error(
      `Compiler error: Generated runtime document failed validation: ${runtimeValidation.errors.join('; ')}`
    );
  }

  return compiledDoc;
}

type NarrativeEventKind =
  | 'floor-entered'
  | 'floor-exited'
  | 'encounter-started'
  | 'encounter-resolved'
  | 'location-discovered'
  | 'dialogue'
  | 'choice-made'
  | 'transformation'
  | 'party-changed'
  | 'other';
