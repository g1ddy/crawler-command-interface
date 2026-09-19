import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  loadResearchClaimDocument,
  loadModelingDecisionDocument,
  parseResearchClaimDocument,
} from '../../app/domain/research-loader.ts';
import {
  validateResearchClaimDocument,
  validateSemanticModelingDecisions,
} from '../../app/domain/research-validator.ts';
import { compileResearchTrace } from '../../app/domain/research-compiler.ts';

const VALID_RESEARCH_FIXTURE = 'data/raw/research/floor-3/research.yaml';
const VALID_MODELING_FIXTURE = 'data/raw/research/floor-3/modeling-decisions.yaml';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

test('Research Ingestion Contract: valid Floor 3 research claim fixture passes validation and compilation', () => {
  const content = fs.readFileSync(VALID_RESEARCH_FIXTURE, 'utf8');
  const parsedDoc = parseResearchClaimDocument(content);
  assert.equal(parsedDoc.schemaVersion, 'crawler-research/v1');

  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  assert.equal(doc.schemaVersion, 'crawler-research/v1');
  assert.equal(doc.storyId, 'dcc');
  assert.equal(doc.floor, 3);
  assert.equal(doc.claims.length, 5);

  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const validation = validateResearchClaimDocument(doc);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);

  const semanticValidation = validateSemanticModelingDecisions(doc, modelingDoc);
  assert.equal(semanticValidation.valid, true);
  assert.deepEqual(semanticValidation.errors, []);

  const compiled = compileResearchTrace(doc, modelingDoc);
  assert.equal(compiled.promotedClaimCount, 2);
  assert.equal(compiled.reviewClaimCount, 2);
  assert.equal(compiled.ledgerOnlyClaimCount, 1);
  assert.equal(compiled.claimMappings.length, 5);

  for (const mapping of compiled.claimMappings) {
    assert.ok(Array.isArray(mapping.originatingClaimIds));
    assert.equal(mapping.originatingClaimIds.length, 1);
    assert.ok(Array.isArray(mapping.evidence));
    assert.ok(mapping.evidence.length >= 1);
  }
});

test('Research Ingestion Contract: review decision accommodates well-supported claims without runtime events', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const mongoClaim = doc.claims.find((c) => c.id === 'P3-PET-001');
  assert.ok(mongoClaim);
  assert.equal(mongoClaim.evidence[0].confidence, 'confirmed');

  const mongoDecision = modelingDoc.decisions.find((d) => d.claimId === 'P3-PET-001');
  assert.ok(mongoDecision);
  assert.equal(mongoDecision.disposition, 'review');

  const compiled = compileResearchTrace(doc, modelingDoc);
  const mongoMapping = compiled.claimMappings.find((m) => m.claimId === 'P3-PET-001');

  assert.ok(mongoMapping);
  assert.equal(mongoMapping.decision, 'review');
  assert.equal(mongoMapping.targetRepresentation, 'PetProgression');
});

test('Research Ingestion Contract: rejects duplicate claim IDs', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const dupDoc = deepClone(doc);
  dupDoc.claims[1].id = dupDoc.claims[0].id; // Duplicate P3-PET-001

  const validation = validateResearchClaimDocument(dupDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('Duplicate claim ID')));
});

test('Research Ingestion Contract: rejects missing source references', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const badDoc = deepClone(doc);
  badDoc.claims[0].evidence[0].sourceId = 'src-missing-999';

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('references missing source ID "src-missing-999"')));
});

test('Research Ingestion Contract: rejects self-referencing claim dependencies', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const badDoc = deepClone(doc);
  badDoc.claims[0].dependencies = [badDoc.claims[0].id];

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('cannot depend on itself')));
});

test('Research Ingestion Contract: rejects claim dependency cycles', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const badDoc = deepClone(doc);
  badDoc.claims[0].dependencies = ['P3-PET-002'];
  badDoc.claims[1].dependencies = ['P3-PET-001'];

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('Claim dependency cycle detected')));
});

test('Research Ingestion Contract: rejects unsafe promotion with disputed confidence', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);
  const badDoc = deepClone(doc);
  // P3-PET-002 is promoted; set its confidence to disputed
  badDoc.claims[1].evidence[0].confidence = 'disputed';

  const validation = validateSemanticModelingDecisions(badDoc, modelingDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('cannot be promoted with confidence "disputed"')));
});

test('Research Ingestion Contract: rejects unsafe promotion with unresolved contradiction', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);
  const badDoc = deepClone(doc);
  // P3-PET-002 is promoted; add unresolved contradiction
  badDoc.claims[1].contradictions = [
    { claimId: 'P3-PET-001', relationship: 'unresolved', note: 'Unresolved evidence' },
  ];

  // P3-PET-001 needs to exist in claims map for contradiction logic check though it's already there

  const validation = validateSemanticModelingDecisions(badDoc, modelingDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('cannot be promoted with unresolved contradiction')));
});

import { validateModelingDecisionDocument } from '../../app/domain/research-validator.ts';

test('Research Ingestion Contract: rejects duplicate modeling decisions', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);
  const badModelingDoc = deepClone(modelingDoc);

  badModelingDoc.decisions.push(badModelingDoc.decisions[0]);

  const validation = validateSemanticModelingDecisions(doc, badModelingDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('Duplicate modeling decision for claim ID "P3-PET-001"')));
});

test('Research Ingestion Contract: rejects modeling decisions referencing missing claims', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);
  const badModelingDoc = deepClone(modelingDoc);

  badModelingDoc.decisions[0].claimId = 'P3-UNKNOWN-999';

  const validation = validateSemanticModelingDecisions(doc, badModelingDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('Modeling decision references missing claim ID "P3-UNKNOWN-999"')));
});

test('Research Ingestion Contract: rejects research claims with missing modeling decisions', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);
  const badModelingDoc = deepClone(modelingDoc);

  badModelingDoc.decisions.splice(0, 1); // Remove decision for P3-PET-001

  const validation = validateSemanticModelingDecisions(doc, badModelingDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('Research claim "P3-PET-001" has no corresponding modeling decision.')));
});

test('Research Ingestion Contract: requires targetRepresentation for promoted claims in schema', () => {
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);
  const badModelingDoc = deepClone(modelingDoc);
  delete badModelingDoc.decisions[1].target;

  // Schema validation should catch missing 'target' for 'promote' disposition
  // Load validates schema during load process so let's mock the payload
  const validation = validateModelingDecisionDocument(badModelingDoc);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes("must have required property 'target'")));
});

test('Research Ingestion Contract: ledger-only claims remain valid research context without promotion', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const ledgerDecision = modelingDoc.decisions.find((d) => d.claimId === 'P3-PET-003');
  assert.ok(ledgerDecision);
  assert.equal(ledgerDecision.disposition, 'ledger_only');

  const compiled = compileResearchTrace(doc, modelingDoc);
  const ledgerMapping = compiled.claimMappings.find((m) => m.claimId === 'P3-PET-003');

  assert.ok(ledgerMapping);
  assert.equal(ledgerMapping.decision, 'ledger_only');
});

test('Research Ingestion Contract: preserves explicit unknowns in trace output', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const compiled = compileResearchTrace(doc, modelingDoc);
  const sysMapping = compiled.claimMappings.find((m) => m.claimId === 'P3-SYS-001');

  assert.ok(sysMapping);
  assert.ok(sysMapping.unknowns);
  assert.ok(sysMapping.unknowns.includes('exact_timestamp'));
});

test('Research Ingestion Contract: CLI ingest script executes cleanly for valid fixture', () => {
  const scriptPath = path.resolve(process.cwd(), 'scripts/ingest-research.mjs');
  const output = execFileSync('node', [
    scriptPath,
    VALID_RESEARCH_FIXTURE,
    VALID_MODELING_FIXTURE
  ], { encoding: 'utf8' });
  assert.ok(output.includes('[Research Ingestion Success]'));
  assert.ok(output.includes('Trace mappings compiled: 5'));
});
