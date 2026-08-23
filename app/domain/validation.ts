import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import timelineSchema from './schema/crawler-timeline.schema.json' with { type: 'json' };
import floorSchema from './schema/crawler-floor.schema.json' with { type: 'json' };
import rawFloorSchema from './schema/crawler-floor-raw.schema.json' with { type: 'json' };
import { isCountdownPhaseBreakEvent } from './countdowns.ts';
import { adaptRawFloorDocument } from './raw-adapter.ts';
import type { CrawlerFloorDocument, CrawlerTimelineDocument, RawCrawlerFloorDocument } from './types.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ajv = new Ajv2020({ allErrors: true, verbose: true });
addFormats(ajv);
const validateTimelineSchema = ajv.compile(timelineSchema);
const validateFloorSchema = ajv.compile(floorSchema);
const validateRawFloorSchema = ajv.compile(rawFloorSchema);

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
            errors.push(
              `Domain error: Achievement "${ach.id}" reward references itemId "${r.itemId}" not found in floor catalog.`
            );
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

  const countdownIds = new Set<string>();
  for (const countdown of floorDoc.countdowns || []) {
    if (countdownIds.has(countdown.id)) {
      errors.push(`Domain error: Duplicate countdown ID "${countdown.id}" in floor document.`);
    }
    countdownIds.add(countdown.id);

    const anchorOrders = new Set<number>();
    for (const reference of countdown.references) {
      if (!floorDoc.events.some((event) => event.order === reference.anchorOrder)) {
        errors.push(`Domain error: Countdown "${countdown.id}" references missing anchor order #${reference.anchorOrder}.`);
      }
      if (anchorOrders.has(reference.anchorOrder)) {
        errors.push(`Domain error: Countdown "${countdown.id}" has duplicate anchor order #${reference.anchorOrder}.`);
      }
      anchorOrders.add(reference.anchorOrder);
      for (const evidence of reference.evidence) {
        if (!sourceIds.has(evidence.sourceId)) {
          errors.push(`Domain error: Countdown "${countdown.id}" evidence sourceId "${evidence.sourceId}" does not exist in floor sources catalog.`);
        }
      }
    }

    const referencesByOrder = [...countdown.references].sort((a, b) => a.anchorOrder - b.anchorOrder);
    for (let i = 1; i < referencesByOrder.length; i++) {
      const previous = referencesByOrder[i - 1];
      const current = referencesByOrder[i];
      const hasPhaseBreak = floorDoc.events.some(
        (event) =>
          event.order > previous.anchorOrder &&
          event.order <= current.anchorOrder &&
          isCountdownPhaseBreakEvent(event)
      );
      if (!hasPhaseBreak && current.remainingSeconds > previous.remainingSeconds) {
        errors.push(
          `Domain error: Countdown "${countdown.id}" increases from ${previous.remainingSeconds}s at order #${previous.anchorOrder} to ${current.remainingSeconds}s at order #${current.anchorOrder}. Model an explicit reset before increasing remaining time.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates raw authoring and then validates its deterministic legacy adapter
 * output. This keeps Phase 1 source documents compatible with the current UI
 * contract without allowing two independently authored representations.
 */
export function validateRawCrawlerFloor(doc: unknown): ValidationResult {
  const errors: string[] = [];

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Input raw document must be a non-null JSON object.'] };
  }

  const isSchemaValid = validateRawFloorSchema(doc);
  if (!isSchemaValid && validateRawFloorSchema.errors) {
    for (const err of validateRawFloorSchema.errors) {
      const instancePath = err.instancePath || '/';
      errors.push(`Raw schema error at ${instancePath}: ${err.message || 'invalid'}`);
    }
    return { valid: false, errors };
  }

  const rawDoc = doc as RawCrawlerFloorDocument;
  const observationIds = new Set<string>();
  for (const observation of rawDoc.observations || []) {
    if (observationIds.has(observation.id)) {
      errors.push(`Raw domain error: Duplicate observation ID "${observation.id}".`);
    }
    observationIds.add(observation.id);
  }

  try {
    const compatibilityValidation = validateCrawlerFloor(adaptRawFloorDocument(rawDoc));
    for (const error of compatibilityValidation.errors) {
      errors.push(`Raw compatibility error: ${error}`);
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { valid: errors.length === 0, errors };
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
      if (
        (event.type === 'ItemAcquired' || event.type === 'ItemCrafted') &&
        'item' in event &&
        event.item?.instanceId
      ) {
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

  const countdownIds = new Set<string>();
  for (const countdown of timelineDoc.countdowns || []) {
    if (countdownIds.has(countdown.id)) {
      errors.push(`Domain error: Duplicate countdown ID "${countdown.id}" in timeline document.`);
    }
    countdownIds.add(countdown.id);

    const referenceSequences = new Set<number>();
    for (const reference of countdown.references) {
      if (!timelineDoc.events.some((event) => event.sequence === reference.sequence)) {
        errors.push(`Domain error: Countdown "${countdown.id}" references missing event sequence #${reference.sequence}.`);
      }
      if (referenceSequences.has(reference.sequence)) {
        errors.push(`Domain error: Countdown "${countdown.id}" has duplicate reference sequence #${reference.sequence}.`);
      }
      referenceSequences.add(reference.sequence);
      for (const evidence of reference.evidence) {
        if (!sourceIds.has(evidence.sourceId)) {
          errors.push(`Domain error: Countdown "${countdown.id}" evidence sourceId "${evidence.sourceId}" does not exist in sources catalog.`);
        }
      }
    }

    const referencesBySequence = [...countdown.references].sort((a, b) => a.sequence - b.sequence);
    for (let i = 1; i < referencesBySequence.length; i++) {
      const previous = referencesBySequence[i - 1];
      const current = referencesBySequence[i];
      const hasPhaseBreak = timelineDoc.events.some(
        (event) =>
          event.sequence > previous.sequence &&
          event.sequence <= current.sequence &&
          isCountdownPhaseBreakEvent(event)
      );
      if (!hasPhaseBreak && current.remainingSeconds > previous.remainingSeconds) {
        errors.push(
          `Domain error: Countdown "${countdown.id}" increases from ${previous.remainingSeconds}s at sequence #${previous.sequence} to ${current.remainingSeconds}s at sequence #${current.sequence}. Model an explicit reset before increasing remaining time.`
        );
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
