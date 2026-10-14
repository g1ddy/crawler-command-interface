#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { loadResearchClaimDocument, loadModelingDecisionDocument } from '../app/domain/research-loader.ts';
import { compileRawFloor } from '../app/domain/research-compiler.ts';

const args = process.argv.slice(2);

let researchPath = 'data/raw/research/floor-3/pet-research.yaml';
let outputDirArg = 'data/raw/floors/floor-3';
let modelingPath = 'data/raw/research/floor-3/pet-modeling-decisions.yaml';

// Parse CLI flags e.g. --research <path> --out <dir> or positional arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--research' && args[i + 1]) {
    researchPath = args[i + 1];
    i++;
  } else if (args[i] === '--out' && args[i + 1]) {
    outputDirArg = args[i + 1];
    i++;
  } else if (args[i] === '--modeling' && args[i + 1]) {
    modelingPath = args[i + 1];
    i++;
  } else if (!args[i].startsWith('--')) {
    if (i === 0) researchPath = args[i];
    else if (i === 1 && !args[1].startsWith('--')) outputDirArg = args[i];
  }
}

const resolvedModelingPath = path.isAbsolute(modelingPath)
  ? modelingPath
  : path.resolve(process.cwd(), modelingPath);

const resolvedResearchPath = path.isAbsolute(researchPath)
  ? researchPath
  : path.resolve(process.cwd(), researchPath);

const resolvedOutputDir = path.isAbsolute(outputDirArg)
  ? outputDirArg
  : path.resolve(process.cwd(), outputDirArg);

console.log(`[Research Raw Compiler] Reading research claims: ${resolvedResearchPath}`);
console.log(`[Research Raw Compiler] Target raw directory: ${resolvedOutputDir}`);

if (!fs.existsSync(resolvedResearchPath)) {
  console.error(`[Research Raw Compiler Error] Research file not found: ${resolvedResearchPath}`);
  process.exit(1);
}

if (!fs.existsSync(resolvedModelingPath)) {
  console.error(`[Research Raw Compiler Error] Modeling decisions file not found: ${resolvedModelingPath}`);
  process.exit(1);
}

try {
  const researchDoc = loadResearchClaimDocument(resolvedResearchPath);
  const modelingDoc = loadModelingDecisionDocument(resolvedModelingPath);


  const eventsPath = path.join(resolvedOutputDir, 'events.json');
  const catalogPath = path.join(resolvedOutputDir, 'catalog.json');
  const sourcesPath = path.join(resolvedOutputDir, 'sources.json');
  const observationsPath = path.join(resolvedOutputDir, 'observations.json');
  const reportPath = path.join(resolvedOutputDir, 'research-import-report.json');

  let existingRaw;
  if (fs.existsSync(eventsPath) || fs.existsSync(catalogPath) || fs.existsSync(sourcesPath)) {
    existingRaw = {
      events: fs.existsSync(eventsPath) ? JSON.parse(fs.readFileSync(eventsPath, 'utf8')) : undefined,
      catalog: fs.existsSync(catalogPath) ? JSON.parse(fs.readFileSync(catalogPath, 'utf8')) : undefined,
      sources: fs.existsSync(sourcesPath) ? JSON.parse(fs.readFileSync(sourcesPath, 'utf8')) : undefined,
      observations: fs.existsSync(observationsPath) ? JSON.parse(fs.readFileSync(observationsPath, 'utf8')) : undefined,
    };
  }

  const rawFloor = compileRawFloor(researchDoc, existingRaw, modelingDoc);

  fs.mkdirSync(resolvedOutputDir, { recursive: true });

  fs.writeFileSync(eventsPath, JSON.stringify(rawFloor.events, null, 2), 'utf8');
  fs.writeFileSync(catalogPath, JSON.stringify(rawFloor.catalog, null, 2), 'utf8');
  fs.writeFileSync(sourcesPath, JSON.stringify(rawFloor.sources, null, 2), 'utf8');
  fs.writeFileSync(observationsPath, JSON.stringify(rawFloor.observations, null, 2), 'utf8');
  if (rawFloor.report) {
    fs.writeFileSync(reportPath, JSON.stringify(rawFloor.report, null, 2), 'utf8');
  }

  console.log(`\n[Research Raw Compiler Success] Updated raw floor JSON files under ${resolvedOutputDir}`);
  console.log(`  - events.json (${rawFloor.events.length} raw floor events in YAML claim order)`);
  console.log(`  - observations.json (${rawFloor.observations.length} observations)`);
  console.log(`  - catalog.json (${rawFloor.catalog.items.length} catalog items)`);
  console.log(`  - sources.json (${rawFloor.sources.length} sources)`);

  if (rawFloor.report) {
    console.log(`\n[Coverage Report]`);
    console.log(`  - Claims: ${rawFloor.report.summary.inputClaims.total}`);
    console.log(`  - Unknown entries: ${rawFloor.report.summary.unknowns.total}`);
    console.log(`  - Event stubs generated: ${rawFloor.report.summary.generatedStubs.events}`);
    console.log(`  - Observation stubs generated: ${rawFloor.report.summary.generatedStubs.observations}`);
    console.log(`  - Manual event types mapped: ${rawFloor.report.summary.manualMappings.events}`);
    console.log(`  - Manual observation kinds mapped: ${rawFloor.report.summary.manualMappings.observations}`);
    console.log(`  - Unresolved/Diagnostic: ${rawFloor.report.summary.outcomes.unresolved + rawFloor.report.summary.diagnostics.total}\n`);
  }


} catch (err) {
  console.error(`\n[Research Raw Compiler Failed]`);
  console.error((err && err.message) || String(err));
  process.exit(1);
}
