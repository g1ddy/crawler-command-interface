import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadResearchClaimDocument, parseResearchClaimDocument } from '../../app/domain/research-loader.ts';
import { validateResearchClaimDocument } from '../../app/domain/research-validator.ts';
import { compileResearchClaims } from '../../app/domain/research-compiler.ts';

const VALID_FIXTURE_PATH = 'data/raw/research/floor-3-research.json';

test('Research Ingestion: valid Floor 3 research claim fixture passes validation and compilation', () => {
  const content = fs.readFileSync(VALID_FIXTURE_PATH, 'utf8');
  const parsedDoc = parseResearchClaimDocument(content);
  assert.equal(parsedDoc.schemaVersion, 'crawler-research/v1');

  const doc = loadResearchClaimDocument(VALID_FIXTURE_PATH);
  assert.equal(doc.schemaVersion, 'crawler-research/v1');
  assert.equal(doc.storyId, 'dcc');
  assert.equal(doc.floor, 3);
  assert.equal(doc.claims.length, 5);

  const validation = validateResearchClaimDocument(doc);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);

  const compiled = compileResearchClaims(doc);
  assert.equal(compiled.promotedClaimCount, 3);
  assert.equal(compiled.reviewClaimCount, 1);
  assert.equal(compiled.ledgerOnlyClaimCount, 1);
  assert.equal(compiled.compiledEvents.length, 3);

  // Check provenance mappings
  for (const evt of compiled.compiledEvents) {
    assert.ok(Array.isArray(evt.originatingClaimIds));
    assert.equal(evt.originatingClaimIds.length, 1);
    assert.ok(Array.isArray(evt.evidence));
    assert.ok(evt.evidence.length >= 1);
  }
});

test('Research Ingestion: rejects duplicate claim IDs', () => {
  const doc = loadResearchClaimDocument(VALID_FIXTURE_PATH);
  const dupDoc = JSON.parse(JSON.stringify(doc));
  dupDoc.claims[1].id = dupDoc.claims[0].id; // Duplicate P3-PET-001

  const validation = validateResearchClaimDocument(dupDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('Duplicate claim ID')));
});

test('Research Ingestion: rejects missing source references', () => {
  const doc = loadResearchClaimDocument(VALID_FIXTURE_PATH);
  const badDoc = JSON.parse(JSON.stringify(doc));
  badDoc.claims[0].evidence[0].sourceId = 'src-missing-999';

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('references missing source ID "src-missing-999"')));
});

test('Research Ingestion: rejects self-referencing claim dependencies', () => {
  const doc = loadResearchClaimDocument(VALID_FIXTURE_PATH);
  const badDoc = JSON.parse(JSON.stringify(doc));
  badDoc.claims[0].dependencies = [badDoc.claims[0].id];

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('cannot depend on itself')));
});

test('Research Ingestion: rejects claim dependency cycles', () => {
  const doc = loadResearchClaimDocument(VALID_FIXTURE_PATH);
  const badDoc = JSON.parse(JSON.stringify(doc));
  // P3-PET-001 -> P3-PET-002 -> P3-PET-001
  badDoc.claims[0].dependencies = ['P3-PET-002'];
  badDoc.claims[1].dependencies = ['P3-PET-001'];

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('Claim dependency cycle detected')));
});

test('Research Ingestion: rejects unsafe promotion with disputed confidence', () => {
  const doc = loadResearchClaimDocument(VALID_FIXTURE_PATH);
  const badDoc = JSON.parse(JSON.stringify(doc));
  badDoc.claims[0].evidence[0].confidence = 'disputed'; // Promoted claim P3-PET-001 has disputed confidence

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('cannot be promoted with confidence "disputed"')));
});

test('Research Ingestion: rejects unsafe promotion with unresolved contradiction', () => {
  const doc = loadResearchClaimDocument(VALID_FIXTURE_PATH);
  const badDoc = JSON.parse(JSON.stringify(doc));
  badDoc.claims[0].contradictions = [
    { claimId: 'P3-PET-002', relationship: 'unresolved', note: 'Unresolved evidence' },
  ];

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('cannot be promoted with unresolved contradiction')));
});

test('Research Ingestion: rejects concrete values for explicit unknown dimensions in promoted claims', () => {
  const doc = loadResearchClaimDocument(VALID_FIXTURE_PATH);
  const badDoc = JSON.parse(JSON.stringify(doc));
  badDoc.claims[0].unknowns = ['exact_timestamp'];
  badDoc.claims[0].candidateRepresentation.elapsedSeconds = 1200;

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('explicitly declares unknown timestamp, but candidateRepresentation provides concrete value')));
});

test('Research Ingestion: CLI ingest script executes cleanly for valid fixture', () => {
  const scriptPath = path.resolve(process.cwd(), 'scripts/ingest-research.mjs');
  const output = execFileSync('node', [scriptPath, VALID_FIXTURE_PATH], { encoding: 'utf8' });
  assert.ok(output.includes('[Research Ingestion Success]'));
  assert.ok(output.includes('Candidate events compiled: 3'));
});
