#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { loadResearchClaimDocument } from '../app/domain/research-loader.ts';
import { compileRawFloor } from '../app/domain/research-compiler.ts';

const args = process.argv.slice(2);

let researchPath = 'data/raw/research/floor-3/pet-research.yaml';
let outputDirArg = 'data/raw/floors/floor-3';

// Parse CLI flags e.g. --research <path> --out <dir> or positional arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--research' && args[i + 1]) {
    researchPath = args[i + 1];
    i++;
  } else if (args[i] === '--out' && args[i + 1]) {
    outputDirArg = args[i + 1];
    i++;
  } else if (!args[i].startsWith('--')) {
    if (i === 0) researchPath = args[i];
    else if (i === 1 && !args[1].startsWith('--')) outputDirArg = args[i];
  }
}

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

try {
  const researchDoc = loadResearchClaimDocument(resolvedResearchPath);


  const eventsPath = path.join(resolvedOutputDir, 'events.json');
  const catalogPath = path.join(resolvedOutputDir, 'catalog.json');
  const sourcesPath = path.join(resolvedOutputDir, 'sources.json');

  let existingRaw;
  if (fs.existsSync(eventsPath) || fs.existsSync(catalogPath) || fs.existsSync(sourcesPath)) {
    existingRaw = {
      events: fs.existsSync(eventsPath) ? JSON.parse(fs.readFileSync(eventsPath, 'utf8')) : undefined,
      catalog: fs.existsSync(catalogPath) ? JSON.parse(fs.readFileSync(catalogPath, 'utf8')) : undefined,
      sources: fs.existsSync(sourcesPath) ? JSON.parse(fs.readFileSync(sourcesPath, 'utf8')) : undefined,
    };
  }

  const rawFloor = compileRawFloor(researchDoc, existingRaw);

  fs.mkdirSync(resolvedOutputDir, { recursive: true });

  fs.writeFileSync(eventsPath, JSON.stringify(rawFloor.events, null, 2), 'utf8');
  fs.writeFileSync(catalogPath, JSON.stringify(rawFloor.catalog, null, 2), 'utf8');
  fs.writeFileSync(sourcesPath, JSON.stringify(rawFloor.sources, null, 2), 'utf8');

  console.log(`\n[Research Raw Compiler Success] Updated raw floor JSON files under ${resolvedOutputDir}`);
  console.log(`  - events.json (${rawFloor.events.length} raw floor events in YAML claim order)`);
  console.log(`  - catalog.json (${rawFloor.catalog.items.length} catalog items)`);
  console.log(`  - sources.json (${rawFloor.sources.length} sources)\n`);

} catch (err) {
  console.error(`\n[Research Raw Compiler Failed]`);
  console.error((err && err.message) || String(err));
  process.exit(1);
}
