#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { loadResearchClaimDocument, loadModelingDecisionDocument } from '../app/domain/research-loader.ts';
import { compileResearchTrace } from '../app/domain/research-compiler.ts';
import {
  validateResearchClaimDocument,
  validateModelingDecisionDocument,
  validateSemanticModelingDecisions,
  validateTraceCompleteness
} from '../app/domain/research-validator.ts';

const args = process.argv.slice(2);
const researchPath = args[0] || 'data/raw/research/floor-3/research.yaml';
const modelingPath = args[1] || 'data/raw/research/floor-3/modeling-decisions.yaml';

const resolvedResearchPath = path.isAbsolute(researchPath)
  ? researchPath
  : path.resolve(process.cwd(), researchPath);

const resolvedModelingPath = path.isAbsolute(modelingPath)
  ? modelingPath
  : path.resolve(process.cwd(), modelingPath);

console.log(`[Research Ingestion] Ingesting research document: ${resolvedResearchPath}`);
console.log(`[Research Ingestion] Ingesting modeling decisions: ${resolvedModelingPath}`);

if (!fs.existsSync(resolvedResearchPath)) {
  console.error(`[Research Ingestion Error] File not found: ${resolvedResearchPath}`);
  process.exit(1);
}

if (!fs.existsSync(resolvedModelingPath)) {
  console.error(`[Research Ingestion Error] File not found: ${resolvedModelingPath}`);
  process.exit(1);
}

try {
  const researchDoc = loadResearchClaimDocument(resolvedResearchPath);
  const modelingDoc = loadModelingDecisionDocument(resolvedModelingPath);

  const researchValidation = validateResearchClaimDocument(researchDoc);
  if (!researchValidation.valid) {
    throw new Error(
      `Research claim document validation failed:\n  - ${researchValidation.errors.join('\n  - ')}`
    );
  }

  const modelingValidation = validateModelingDecisionDocument(modelingDoc);
  if (!modelingValidation.valid) {
    throw new Error(
      `Modeling decision document validation failed:\n  - ${modelingValidation.errors.join('\n  - ')}`
    );
  }

  const semanticValidation = validateSemanticModelingDecisions(researchDoc, modelingDoc);
  if (!semanticValidation.valid) {
    throw new Error(
      `Semantic modeling decision validation failed:\n  - ${semanticValidation.errors.join('\n  - ')}`
    );
  }

  const completenessValidation = validateTraceCompleteness(researchDoc, modelingDoc);
  if (!completenessValidation.valid) {
    throw new Error(
      `Trace completeness validation failed:\n  - ${completenessValidation.errors.join('\n  - ')}`
    );
  }

  const result = compileResearchTrace(researchDoc, modelingDoc);

  console.log(`\n[Research Ingestion Success] Document valid for story "${researchDoc.storyId}", floor ${researchDoc.floor}.`);
  console.log(`  - Total claims: ${researchDoc.claims.length}`);
  console.log(`  - Promoted claims: ${result.promotedClaimCount}`);
  console.log(`  - Review claims: ${result.reviewClaimCount}`);
  console.log(`  - Ledger-only claims: ${result.ledgerOnlyClaimCount}`);
  console.log(`  - Trace mappings compiled: ${result.claimMappings.length}\n`);

} catch (err) {
  console.error(`\n[Research Ingestion Validation Failed]`);
  console.error((err && err.message) || String(err));
  process.exit(1);
}
