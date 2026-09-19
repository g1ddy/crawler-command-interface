#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { loadResearchClaimDocument } from '../app/domain/research-loader.ts';
import { compileResearchClaims } from '../app/domain/research-compiler.ts';

const args = process.argv.slice(2);
const filePath = args[0] || 'data/raw/research/floor-3-research.json';

const resolvedPath = path.isAbsolute(filePath)
  ? filePath
  : path.resolve(process.cwd(), filePath);

console.log(`[Research Ingestion] Ingesting research document: ${resolvedPath}`);

if (!fs.existsSync(resolvedPath)) {
  console.error(`[Research Ingestion Error] File not found: ${resolvedPath}`);
  process.exit(1);
}

try {
  const doc = loadResearchClaimDocument(resolvedPath);
  const result = compileResearchClaims(doc);

  console.log(`\n[Research Ingestion Success] Document valid for story "${doc.storyId}", floor ${doc.floor}.`);
  console.log(`  - Total claims: ${doc.claims.length}`);
  console.log(`  - Promoted claims: ${result.promotedClaimCount}`);
  console.log(`  - Review claims: ${result.reviewClaimCount}`);
  console.log(`  - Ledger-only claims: ${result.ledgerOnlyClaimCount}`);
  console.log(`  - Candidate events compiled: ${result.compiledEvents.length}`);
  console.log(`  - Candidate observations compiled: ${result.compiledObservations.length}`);
  console.log(`  - Candidate catalog items compiled: ${result.compiledCatalogItems.length}`);
  console.log(`  - Candidate catalog achievements compiled: ${result.compiledCatalogAchievements.length}\n`);

} catch (err) {
  console.error(`\n[Research Ingestion Validation Failed]`);
  console.error((err && err.message) || String(err));
  process.exit(1);
}
