import fs from 'node:fs';
import path from 'node:path';
import { loadResearchDocument } from '../app/domain/research-loader.ts';
import { validateResearchDocument } from '../app/domain/research-validator.ts';
import { compileResearchDocument } from '../app/domain/research-compiler.ts';

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/ingest-research.mjs <path-to-research-yaml-or-json> [--out <output-json-path>]');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  let outPath = null;
  const outIdx = args.indexOf('--out');
  if (outIdx !== -1 && args[outIdx + 1]) {
    outPath = path.resolve(args[outIdx + 1]);
  }

  console.log(`Loading research document from: ${inputPath}`);
  const doc = loadResearchDocument(inputPath);

  const validation = validateResearchDocument(doc);
  if (!validation.valid) {
    console.error('\n❌ Research Document Validation Failed:');
    for (const err of validation.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('✅ Validation passed.');
  const compilation = compileResearchDocument(doc);

  console.log(`\nCompilation summary for ${doc.storyId} (Floor ${doc.floor}):`);
  console.log(`  - Promoted candidates: ${compilation.promotedCandidates.length}`);
  console.log(`  - Review claims: ${compilation.reviewClaims.length}`);
  console.log(`  - Ledger-only claims: ${compilation.ledgerOnlyClaims.length}`);

  const outputJson = JSON.stringify(compilation, null, 2);

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, outputJson, 'utf8');
    console.log(`\nWritten candidate output to: ${outPath}`);
  } else {
    console.log('\nCandidate compilation output:');
    console.log(outputJson);
  }
}

main();
