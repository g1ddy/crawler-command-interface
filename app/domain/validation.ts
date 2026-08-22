import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import timelineSchema from './schema/crawler-timeline.schema.json' with { type: 'json' };
import floorSchema from './schema/crawler-floor.schema.json' with { type: 'json' };
import type { CrawlerFloorDocument, CrawlerTimelineDocument } from './types.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ajv = new Ajv2020({ allErrors: true, verbose: true });
addFormats(ajv);
const validateTimelineSchema = ajv.compile(timelineSchema);
const validateFloorSchema = ajv.compile(floorSchema);

export function validateCrawlerFloor(doc: unknown): ValidationResult {
  const errors: string[] = [];

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Input document must be a non-null JSON object.'] };
  }

  // 1. JSON Schema Validation
  const isSchemaValid = validateFloorSchema(doc);
  if (!isSchemaValid && validateFloorSchema.errors) {
    for (const err of validateFloorSchema.errors) {
      const instancePath = err.instancePath || '/';
      errors.push(`Schema error at ${instancePath}: ${err.message || 'invalid'}`);
    }
    return { valid: false, errors };
  }

  const floorDoc = doc as CrawlerFloorDocument;

  // 2. Domain Validation

  // a) Source catalog IDs uniqueness
  const sourceIds = new Set<string>();
  if (Array.isArray(floorDoc.sources)) {
    for (const src of floorDoc.sources) {
      if (sourceIds.has(src.id)) {
        errors.push(`Domain error: Duplicate source ID "${src.id}" in floor sources catalog.`);
      }
      sourceIds.add(src.id);
    }
  }

  // b) Catalog item & achievement IDs uniqueness
  const catalogItemIds = new Set<string>();
  if (Array.isArray(floorDoc.catalog?.items)) {
    for (const item of floorDoc.catalog.items) {
      if (catalogItemIds.has(item.id)) {
        errors.push(`Domain error: Duplicate item ID "${item.id}" in floor catalog.`);
      }
      catalogItemIds.add(item.id);
    }
  }

  const catalogAchIds = new Set<string>();
  if (Array.isArray(floorDoc.catalog?.achievements)) {
    for (const ach of floorDoc.catalog.achievements) {
      if (catalogAchIds.has(ach.id)) {
        errors.push(`Domain error: Duplicate achievement ID "${ach.id}" in floor catalog.`);
      }
      catalogAchIds.add(ach.id);
      if (Array.isArray(ach.reward)) {
        for (const r of ach.reward) {
          if (r.kind === 'item' && r.itemId && !catalogItemIds.has(r.itemId)) {
            // Note: will also check item exists if added before or after
          }
        }
      }
    }
  }

  // c) Event IDs uniqueness, contiguous floor-local order, source & position checks
  const eventIds = new Set<string>();
  let expectedOrder = 1;
  const floorOrdinal = floorDoc.floor?.ordinal;

  if (Array.isArray(floorDoc.events)) {
    for (let i = 0; i < floorDoc.events.length; i++) {
      const event = floorDoc.events[i];
      const eventRef = `Event order #${event.order} (${event.id || 'unknown'})`;

      if (event.id) {
        if (eventIds.has(event.id)) {
          errors.push(`Domain error: Duplicate event ID "${event.id}" found at ${eventRef}.`);
        }
        eventIds.add(event.id);
      }

      if (event.order !== expectedOrder) {
        errors.push(
          `Domain error: Non-contiguous floor order #${event.order} at index ${i} (expected #${expectedOrder}).`
        );
      }
      expectedOrder++;

      if (event.position?.floor !== floorOrdinal) {
        errors.push(
          `Domain error: ${eventRef} position.floor (${event.position?.floor}) does not match floor.ordinal (${floorOrdinal}).`
        );
      }

      if (Array.isArray(event.evidence)) {
        for (const ev of event.evidence) {
          if (!sourceIds.has(ev.sourceId)) {
            errors.push(
              `Domain error: Evidence sourceId "${ev.sourceId}" in ${eventRef} does not exist in floor sources catalog.`
            );
          }
        }
      }

      if (event.achievementId && !catalogAchIds.has(event.achievementId)) {
        errors.push(
          `Domain error: ${eventRef} references achievementId "${event.achievementId}" not found in floor catalog.`
        );
      }

      if (event.item?.itemId && !catalogItemIds.has(event.item.itemId)) {
        errors.push(
          `Domain error: ${eventRef} references itemId "${event.item.itemId}" not found in floor catalog.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateCrawlerTimeline(doc: unknown): ValidationResult {
  const errors: string[] = [];

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Input document must be a non-null JSON object.'] };
  }

  // 1. JSON Schema Validation
  const isSchemaValid = validateTimelineSchema(doc);
  if (!isSchemaValid && validateTimelineSchema.errors) {
    for (const err of validateTimelineSchema.errors) {
      const instancePath = err.instancePath || '/';
      errors.push(`Schema error at ${instancePath}: ${err.message || 'invalid'}`);
    }
    return { valid: false, errors };
  }

  const timelineDoc = doc as CrawlerTimelineDocument;

  // 2. Domain Validation

  // a) Source catalog IDs uniqueness
  const sourceIds = new Set<string>();
  if (Array.isArray(timelineDoc.sources)) {
    for (const src of timelineDoc.sources) {
      if (sourceIds.has(src.id)) {
        errors.push(`Domain error: Duplicate source ID "${src.id}" in sources catalog.`);
      }
      sourceIds.add(src.id);
    }
  }

  // b) Event IDs uniqueness, sequence order, evidence source checks, item lifecycle
  const eventIds = new Set<string>();
  let lastSequence = 0;

  // Track items in inventory across timeline
  const knownItemInstanceIds = new Set<string>();
  if (timelineDoc.initialState?.inventory) {
    for (const item of timelineDoc.initialState.inventory) {
      if (item.instanceId) {
        knownItemInstanceIds.add(item.instanceId);
      }
    }
  }

  if (Array.isArray(timelineDoc.events)) {
    for (let i = 0; i < timelineDoc.events.length; i++) {
      const event = timelineDoc.events[i];
      const eventRef = `Event #${event.sequence ?? i + 1} (${event.id || 'unknown'})`;

      // Unique event ID
      if (event.id) {
        if (eventIds.has(event.id)) {
          errors.push(`Domain error: Duplicate event ID "${event.id}" found at ${eventRef}.`);
        }
        eventIds.add(event.id);
      }

      // Strictly increasing sequence
      if (typeof event.sequence !== 'number' || event.sequence <= lastSequence) {
        errors.push(
          `Domain error: Event sequence #${event.sequence} at index ${i} is not strictly increasing (must be > ${lastSequence}).`
        );
      }
      if (typeof event.sequence === 'number') {
        lastSequence = event.sequence;
      }

      // Evidence sourceId check
      if (Array.isArray(event.evidence)) {
        for (const ev of event.evidence) {
          if (!sourceIds.has(ev.sourceId)) {
            errors.push(
              `Domain error: Evidence sourceId "${ev.sourceId}" in ${eventRef} does not exist in sources catalog.`
            );
          }
        }
      }

      // Item history & reference checks
      if (event.type === 'ItemAcquired' && 'item' in event && event.item?.instanceId) {
        knownItemInstanceIds.add(event.item.instanceId);
      } else if (
        (event.type === 'ItemConsumed' || event.type === 'ItemEquipped' || event.type === 'ItemUnequipped' || event.type === 'ItemDiscarded' || event.type === 'ItemQuantityChanged') &&
        'itemInstanceId' in event &&
        event.itemInstanceId
      ) {
        if (!knownItemInstanceIds.has(event.itemInstanceId)) {
          errors.push(
            `Domain error: ${eventRef} references itemInstanceId "${event.itemInstanceId}" which was not acquired prior to or at this sequence.`
          );
        }
      }
    }
  }

  // c) Snapshots sequence validation
  if (Array.isArray(timelineDoc.snapshots)) {
    const snapshotSeqs = new Set<number>();
    for (const snap of timelineDoc.snapshots) {
      if (snapshotSeqs.has(snap.sequence)) {
        errors.push(`Domain error: Duplicate snapshot sequence #${snap.sequence}.`);
      }
      snapshotSeqs.add(snap.sequence);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
