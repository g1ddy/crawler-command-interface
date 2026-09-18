import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';
import researchClaimSchema from './schema/research-claim.schema.json' with { type: 'json' };
import type { ResearchClaim, ResearchClaimDocument } from './types/research.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

let validateResearchSchema: ValidateFunction | undefined;

function getResearchValidator(): ValidateFunction {
  if (validateResearchSchema) return validateResearchSchema;
  const ajv = new Ajv2020({ allErrors: true, verbose: true });
  addFormats(ajv);
  validateResearchSchema = ajv.compile(researchClaimSchema);
  return validateResearchSchema;
}

const SUPPORTED_TRANSITION_KINDS = new Set([
  'PetAcquired',
  'PetHostilityChanged',
  'PetBonded',
  'PetClassificationChanged',
  'ItemAcquired',
  'ItemEquipped',
  'ItemUnequipped',
  'ItemDiscarded',
  'LevelChanged',
  'SkillGranted',
  'SpellGranted',
  'PartyFormed',
  'NarrativeEvent',
]);

const PROHIBITED_VALUE_STRINGS = new Set(['unknown', 'fabricated', 'placeholder', 'n/a', 'tbd']);

export function validateResearchDocument(doc: unknown): ValidationResult {
  const errors: string[] = [];
  const validator = getResearchValidator();

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Research document must be a non-null object.'] };
  }

  // 1. JSON Schema Validation
  const isSchemaValid = validator(doc);
  if (!isSchemaValid && validator.errors) {
    for (const err of validator.errors) {
      const instancePath = err.instancePath || '/';
      errors.push(`Schema error at ${instancePath}: ${err.message || 'invalid'}`);
    }
    return { valid: false, errors };
  }

  const researchDoc = doc as ResearchClaimDocument;

  // 2. Sources Uniqueness and Indexing
  const sourceIds = new Set<string>();
  for (const source of researchDoc.sources || []) {
    if (sourceIds.has(source.id)) {
      errors.push(`Domain error: Duplicate source ID "${source.id}" in research document sources.`);
    }
    sourceIds.add(source.id);
  }

  // 3. Claims Uniqueness and Indexing
  const claimIds = new Set<string>();
  const claimsById = new Map<string, ResearchClaim>();

  for (const claim of researchDoc.claims || []) {
    if (claimIds.has(claim.id)) {
      errors.push(`Domain error: Duplicate claim ID "${claim.id}" in research document claims.`);
    }
    claimIds.add(claim.id);
    claimsById.set(claim.id, claim);
  }

  // 4. Domain Validation per Claim
  for (const claim of researchDoc.claims || []) {
    const claimRef = `Claim "${claim.id}"`;

    // a) Provenance and source existence check
    if (claim.provenance) {
      if (!sourceIds.has(claim.provenance.sourceId)) {
        errors.push(
          `Domain error: ${claimRef} references missing source ID "${claim.provenance.sourceId}" in document sources.`
        );
      }
    }

    // b) Dependencies check
    if (Array.isArray(claim.dependencies)) {
      for (const depId of claim.dependencies) {
        if (!claimIds.has(depId)) {
          errors.push(`Domain error: ${claimRef} references missing dependency claim ID "${depId}".`);
        }
        if (depId === claim.id) {
          errors.push(`Domain error: ${claimRef} cannot depend on itself.`);
        }
      }
    }

    // c) Promotion and Provenance semantics
    if (claim.promotion === 'promote') {
      if (!claim.provenance) {
        errors.push(`Domain error: ${claimRef} is marked for promotion but missing required provenance.`);
      } else {
        if (!claim.provenance.sourceId) {
          errors.push(`Domain error: ${claimRef} provenance missing required sourceId.`);
        }
        if (!claim.provenance.locator) {
          errors.push(`Domain error: ${claimRef} provenance missing required locator.`);
        }
        if (claim.provenance.trust === 'candidate') {
          errors.push(
            `Domain error: ${claimRef} cannot be promoted with candidate trust in provenance.`
          );
        }
      }

      if (claim.confidence === 'candidate') {
        errors.push(
          `Domain error: ${claimRef} cannot be promoted with candidate confidence level.`
        );
      }

      // State transition check for promoted events/states
      if (claim.claimType === 'event' || claim.claimType === 'state') {
        if (!claim.stateTransition) {
          errors.push(
            `Domain error: ${claimRef} is a promoted ${claim.claimType} claim but missing stateTransition.`
          );
        } else if (!SUPPORTED_TRANSITION_KINDS.has(claim.stateTransition.kind)) {
          errors.push(
            `Domain error: ${claimRef} stateTransition kind "${claim.stateTransition.kind}" is not a supported transition kind.`
          );
        }
      }
    }

    // d) Unknowns safety checks
    if (Array.isArray(claim.unknowns) && claim.unknowns.length > 0) {
      const transitionPayload = claim.stateTransition?.payload || {};
      const transitionObj = (claim.stateTransition || {}) as Record<string, unknown>;

      for (const unknownField of claim.unknowns) {
        if (
          Object.prototype.hasOwnProperty.call(transitionPayload, unknownField) &&
          transitionPayload[unknownField] !== undefined
        ) {
          errors.push(
            `Domain error: ${claimRef} explicitly marks "${unknownField}" as unknown, but payload populates it with a value.`
          );
        }
        if (
          Object.prototype.hasOwnProperty.call(transitionObj, unknownField) &&
          transitionObj[unknownField] !== undefined
        ) {
          errors.push(
            `Domain error: ${claimRef} explicitly marks "${unknownField}" as unknown, but stateTransition populates it with a value.`
          );
        }
      }
    }

    // e) Prohibited fabrication string check in payload for promoted claims
    if (claim.promotion === 'promote' && claim.stateTransition?.payload) {
      const inspectPayload = (obj: Record<string, unknown>) => {
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === 'string' && PROHIBITED_VALUE_STRINGS.has(val.trim().toLowerCase())) {
            errors.push(
              `Domain error: ${claimRef} payload field "${key}" contains prohibited fabricated value "${val}".`
            );
          } else if (val && typeof val === 'object' && !Array.isArray(val)) {
            inspectPayload(val as Record<string, unknown>);
          }
        }
      };
      inspectPayload(claim.stateTransition.payload);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
