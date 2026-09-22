#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { loadResearchClaimDocument, loadModelingDecisionDocument } from '../app/domain/research-loader.ts';
import { compileResearchScaffold } from '../app/domain/research-scaffold.ts';

const args = process.argv.slice(2);
const researchPath = args[0] || 'data/raw/research/floor-3/pet-research.yaml';
const modelingPath = args[1] || 'data/raw/research/floor-3/pet-modeling-decisions.yaml';
const outputDirArg = args[2] || '.tmp/research-scaffold/floor-3';

const resolvedResearchPath = path.isAbsolute(researchPath)
  ? researchPath
  : path.resolve(process.cwd(), researchPath);

const resolvedModelingPath = path.isAbsolute(modelingPath)
  ? modelingPath
  : path.resolve(process.cwd(), modelingPath);

const resolvedOutputDir = path.isAbsolute(outputDirArg)
  ? outputDirArg
  : path.resolve(process.cwd(), outputDirArg);

console.log(`[Research Scaffold] Reading research claims: ${resolvedResearchPath}`);
console.log(`[Research Scaffold] Reading modeling decisions: ${resolvedModelingPath}`);
console.log(`[Research Scaffold] Output directory: ${resolvedOutputDir}`);

if (!fs.existsSync(resolvedResearchPath)) {
  console.error(`[Research Scaffold Error] Research file not found: ${resolvedResearchPath}`);
  process.exit(1);
}

if (!fs.existsSync(resolvedModelingPath)) {
  console.error(`[Research Scaffold Error] Modeling file not found: ${resolvedModelingPath}`);
  process.exit(1);
}

try {
  const researchDoc = loadResearchClaimDocument(resolvedResearchPath);
  const modelingDoc = loadModelingDecisionDocument(resolvedModelingPath);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  fs.mkdirSync(resolvedOutputDir, { recursive: true });

  const reviewPath = path.join(resolvedOutputDir, 'review.json');
  const eventsPath = path.join(resolvedOutputDir, 'events.json');
  const observationsPath = path.join(resolvedOutputDir, 'observations.json');
  const provenancePath = path.join(resolvedOutputDir, 'provenance.json');

  fs.writeFileSync(reviewPath, JSON.stringify(scaffold.review, null, 2), 'utf8');
  fs.writeFileSync(eventsPath, JSON.stringify(scaffold.events, null, 2), 'utf8');
  fs.writeFileSync(observationsPath, JSON.stringify(scaffold.observations, null, 2), 'utf8');
  fs.writeFileSync(provenancePath, JSON.stringify(scaffold.provenance, null, 2), 'utf8');

  console.log(`\n[Research Scaffold Success] Generated disposable scaffold artifacts under ${resolvedOutputDir}`);
  console.log(`  - review.json (${scaffold.review.summary.totalClaims} total claims)`);
  console.log(`  - events.json (${scaffold.events.candidateEvents.length} event candidates)`);
  console.log(`  - observations.json (${scaffold.observations.candidateObservations.length} observation candidates)`);
  console.log(`  - provenance.json (${scaffold.provenance.candidates.length} candidate provenance records)\n`);

} catch (err) {
  console.error(`\n[Research Scaffold Generation Failed]`);
  console.error((err && err.message) || String(err));
  process.exit(1);
}
