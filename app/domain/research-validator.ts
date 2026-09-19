import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';
import researchSchema from './schema/research-claim.schema.json' with { type: 'json' };
import type { ResearchClaimDocument } from './types/research.ts';
import type { ValidationResult } from './validation.ts';

let validateResearchSchemaFn: ValidateFunction | undefined;

function getResearchValidator(): ValidateFunction {
  if (validateResearchSchemaFn) {
    return validateResearchSchemaFn;
  }
  const ajv = new Ajv2020({ allErrors: true, verbose: true });
  addFormats(ajv);
  validateResearchSchemaFn = ajv.compile(researchSchema);
  return validateResearchSchemaFn;
}

export function validateResearchClaimDocument(doc: unknown): ValidationResult {
  const errors: string[] = [];

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['Input research document must be a non-null JSON object.'] };
  }

  // 1. Structural JSON Schema Validation
  const validator = getResearchValidator();
  const isSchemaValid = validator(doc);
  if (!isSchemaValid && validator.errors) {
    for (const err of validator.errors) {
      const instancePath = err.instancePath || '/';
      errors.push(`Schema error at ${instancePath}: ${err.message || 'invalid'}`);
    }
    return { valid: false, errors };
  }

  const researchDoc = doc as ResearchClaimDocument;

  // 2. Semantic Domain Validation

  // a) Source IDs uniqueness
  const sourceIds = new Set<string>();
  for (const src of researchDoc.sources) {
    if (sourceIds.has(src.id)) {
      errors.push(`Domain error: Duplicate source ID "${src.id}" in research source catalog.`);
    }
    sourceIds.add(src.id);
  }

  // b) Claim IDs uniqueness
  const claimIds = new Set<string>();
  const claimMap = new Map<string, typeof researchDoc.claims[0]>();
  for (const claim of researchDoc.claims) {
    if (claimIds.has(claim.id)) {
      errors.push(`Domain error: Duplicate claim ID "${claim.id}".`);
    }
    claimIds.add(claim.id);
    claimMap.set(claim.id, claim);
  }

  // c) Evidence source ID checks, dependency checks, contradiction checks, promotion safety
  for (const claim of researchDoc.claims) {
    // Evidence source references
    for (const ev of claim.evidence) {
      if (!sourceIds.has(ev.sourceId)) {
        errors.push(
          `Domain error: Claim "${claim.id}" evidence references missing source ID "${ev.sourceId}".`
        );
      }
    }

    // Dependencies checks
    if (claim.dependencies && claim.dependencies.length > 0) {
      for (const depId of claim.dependencies) {
        if (depId === claim.id) {
          errors.push(`Domain error: Claim "${claim.id}" cannot depend on itself.`);
        } else if (!claimIds.has(depId)) {
          errors.push(
            `Domain error: Claim "${claim.id}" references missing dependency claim ID "${depId}".`
          );
        }
      }
    }

    // Contradictions checks
    if (claim.contradictions && claim.contradictions.length > 0) {
      for (const c of claim.contradictions) {
        if (c.claimId === claim.id) {
          errors.push(`Domain error: Claim "${claim.id}" cannot declare contradiction against itself.`);
        } else if (!claimIds.has(c.claimId)) {
          errors.push(
            `Domain error: Claim "${claim.id}" references missing contradiction claim ID "${c.claimId}".`
          );
        }
      }
    }

    // Promotion safety checks
    if (claim.modeling.decision === 'promote') {
      // Check confidence
      for (const ev of claim.evidence) {
        if (ev.confidence === 'disputed' || ev.confidence === 'candidate') {
          errors.push(
            `Domain error: Claim "${claim.id}" cannot be promoted with confidence "${ev.confidence}". Promoted claims require confirmed or corroborated confidence.`
          );
        }
      }

      // Check target representation presence
      if (!claim.modeling.targetRepresentation && !claim.candidateRepresentation) {
        errors.push(
          `Domain error: Promoted claim "${claim.id}" must specify targetRepresentation or candidateRepresentation.`
        );
      }

      // Unresolved contradiction check
      if (claim.contradictions) {
        for (const c of claim.contradictions) {
          if (c.relationship === 'unresolved' || c.relationship === 'contradicts') {
            errors.push(
              `Domain error: Claim "${claim.id}" cannot be promoted with unresolved contradiction against claim "${c.claimId}".`
            );
          }
        }
      }

      // Explicit unknown protection
      if (claim.unknowns && claim.unknowns.length > 0 && claim.candidateRepresentation) {
        const cand = claim.candidateRepresentation as Record<string, unknown>;
        for (const unknownDim of claim.unknowns) {
          if (
            (unknownDim === 'exact_timestamp' || unknownDim === 'timestamp') &&
            (cand.elapsedSeconds !== undefined || (cand.position && typeof cand.position === 'object' && (cand.position as Record<string, unknown>).elapsedSeconds !== undefined))
          ) {
            errors.push(
              `Domain error: Promoted claim "${claim.id}" explicitly declares unknown timestamp, but candidateRepresentation provides concrete value.`
            );
          }
          if (
            (unknownDim === 'exact_quantity' || unknownDim === 'quantity') &&
            cand.quantity !== undefined
          ) {
            const q = cand.quantity;
            if (typeof q === 'number' || (typeof q === 'object' && q !== null && (q as Record<string, unknown>).known === true)) {
              errors.push(
                `Domain error: Promoted claim "${claim.id}" explicitly declares unknown quantity, but candidateRepresentation provides concrete value.`
              );
            }
          }
          if (cand[unknownDim] !== undefined && cand[unknownDim] !== null) {
            errors.push(
              `Domain error: Promoted claim "${claim.id}" explicitly declares unknown "${unknownDim}", but candidateRepresentation provides concrete value.`
            );
          }
        }
      }
    }
  }

  // d) Dependency cycle detection
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string, path: string[]): boolean {
    visited.add(id);
    inStack.add(id);

    const claim = claimMap.get(id);
    if (claim && claim.dependencies) {
      for (const depId of claim.dependencies) {
        if (!visited.has(depId)) {
          if (claimMap.has(depId) && dfs(depId, [...path, depId])) {
            return true;
          }
        } else if (inStack.has(depId)) {
          errors.push(
            `Domain error: Claim dependency cycle detected involving claim ID "${id}" and "${depId}". Path: ${[...path, depId].join(' -> ')}.`
          );
          return true;
        }
      }
    }

    inStack.delete(id);
    return false;
  }

  for (const id of claimIds) {
    if (!visited.has(id)) {
      dfs(id, [id]);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
