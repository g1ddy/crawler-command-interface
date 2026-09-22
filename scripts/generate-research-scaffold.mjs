#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { loadResearchClaimDocument } from '../app/domain/research-loader.ts';
import { compileRawDraft } from '../app/domain/research-compiler.ts';

const args = process.argv.slice(2);

let researchPath = 'data/raw/research/floor-3/pet-research.yaml';
let outputDirArg = '.tmp/research-scaffold/floor-3';

// Parse optional CLI flags e.g. --research <path> --out <dir> or positional arguments
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

console.log(`[Research Draft Compiler] Reading research claims: ${resolvedResearchPath}`);
console.log(`[Research Draft Compiler] Output directory: ${resolvedOutputDir}`);

if (!fs.existsSync(resolvedResearchPath)) {
  console.error(`[Research Draft Compiler Error] Research file not found: ${resolvedResearchPath}`);
  process.exit(1);
}

try {
  const researchDoc = loadResearchClaimDocument(resolvedResearchPath);
  const draft = compileRawDraft(researchDoc);

  fs.mkdirSync(resolvedOutputDir, { recursive: true });

  const eventsPath = path.join(resolvedOutputDir, 'events.json');
  const catalogPath = path.join(resolvedOutputDir, 'catalog.json');
  const readmePath = path.join(resolvedOutputDir, 'README.md');

  fs.writeFileSync(eventsPath, JSON.stringify(draft.events, null, 2), 'utf8');
  fs.writeFileSync(catalogPath, JSON.stringify(draft.catalog, null, 2), 'utf8');
  fs.writeFileSync(readmePath, draft.readme, 'utf8');

  console.log(`\n[Research Draft Compiler Success] Generated disposable raw draft under ${resolvedOutputDir}`);
  console.log(`  - events.json (${draft.events.length} draft events preserving YAML claim order)`);
  console.log(`  - catalog.json (${draft.catalog.items.length} draft catalog items)`);
  console.log(`  - README.md (non-authoritative draft status & curation instructions)\n`);

} catch (err) {
  console.error(`\n[Research Draft Compiler Failed]`);
  console.error((err && err.message) || String(err));
  process.exit(1);
}
