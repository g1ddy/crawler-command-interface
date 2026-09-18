import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadResearchDocument, parseResearchDocumentContent } from '../../app/domain/research-loader.ts';
import { validateResearchDocument } from '../../app/domain/research-validator.ts';
import { compileResearchDocument } from '../../app/domain/research-compiler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/research');

test('Valid research ledger parses, validates, and compiles deterministically', () => {
  const validPath = path.join(FIXTURES_DIR, 'valid-research-ledger.yaml');
  const doc = loadResearchDocument(validPath);

  const validation = validateResearchDocument(doc);
  assert.equal(validation.valid, true, `Expected valid fixture but got errors: ${validation.errors.join(', ')}`);
  assert.deepEqual(validation.errors, []);

  const compilation1 = compileResearchDocument(doc);
  const compilation2 = compileResearchDocument(doc);

  assert.deepEqual(compilation1, compilation2, 'Compilation must be strictly deterministic');

  assert.equal(compilation1.schemaVersion, 'crawler-research-candidate/v1');
  assert.equal(compilation1.storyId, 'carl-doomsday-scenario');
  assert.equal(compilation1.floor, 3);

  // Promoted candidates count check
  assert.equal(compilation1.promotedCandidates.length, 4);
  assert.equal(compilation1.ledgerOnlyClaims.length, 1);
  assert.equal(compilation1.reviewClaims.length, 0);

  // Event candidate check
  const acqCandidate = compilation1.promotedCandidates.find(
    (c) => c.data.type === 'PetAcquired'
  );
  assert.ok(acqCandidate, 'PetAcquired candidate event must be compiled');
  assert.deepEqual(acqCandidate.originatingClaimIds, ['claim-f3-pet-acq-01']);
  assert.equal(acqCandidate.candidateType, 'event');
  assert.equal(acqCandidate.data.id, 'evt-f3-candidate-f3-pet-acq-01');

  const evidence = acqCandidate.data.evidence;
  assert.ok(Array.isArray(evidence) && evidence.length === 1);
  assert.equal(evidence[0].sourceId, 'src-book-2-carls-doomsday-scenario');
  assert.equal(evidence[0].note, 'Claim ID: claim-f3-pet-acq-01');
  assert.equal(evidence[0].confidence, 'confirmed');

  // Persistent-state candidate check
  const stateCandidate = compilation1.promotedCandidates.find(
    (c) => c.candidateType === 'observation' && c.data.kind === 'ItemEquipped'
  );
  assert.ok(stateCandidate, 'Persistent state candidate observation must be compiled');
  assert.deepEqual(stateCandidate.originatingClaimIds, ['claim-f3-pet-state-01']);
  assert.equal(stateCandidate.data.id, 'obs-candidate-f3-pet-state-01');
  assert.equal(stateCandidate.data.itemInstanceId, 'inst-mongo-harness');
  assert.equal(stateCandidate.data.slot, 'pet-saddle');

  // Dependent claim trace check
  const bondCandidate = compilation1.promotedCandidates.find(
    (c) => c.data.type === 'PetBonded'
  );
  assert.ok(bondCandidate, 'PetBonded candidate event must be compiled');
  assert.deepEqual(bondCandidate.originatingClaimIds, [
    'claim-f3-pet-acq-01',
    'claim-f3-pet-hostility-01',
    'claim-f3-pet-bond-01',
  ]);
  assert.equal(bondCandidate.data.name, 'Mongo');
  assert.equal(bondCandidate.data.title, 'Royal Steed');

  // Ledger-only claim check
  assert.equal(compilation1.ledgerOnlyClaims[0].id, 'claim-f3-pet-rule-01');
});

test('Invalid fixture: missing required field fails validation with actionable error', () => {
  const doc = loadResearchDocument(path.join(FIXTURES_DIR, 'invalid-missing-required-field.yaml'));
  const result = validateResearchDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((err) => err.includes('summary')),
    `Expected error mentioning summary, got: ${result.errors.join('; ')}`
  );
});

test('Invalid fixture: invalid enum fails validation with actionable error', () => {
  const doc = loadResearchDocument(path.join(FIXTURES_DIR, 'invalid-enum.yaml'));
  const result = validateResearchDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((err) => err.includes('promotion') || err.includes('must be equal to one of the allowed values')),
    `Expected enum error, got: ${result.errors.join('; ')}`
  );
});

test('Invalid fixture: duplicate claim ID is rejected', () => {
  const doc = loadResearchDocument(path.join(FIXTURES_DIR, 'invalid-duplicate-claim-id.yaml'));
  const result = validateResearchDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((err) => err.includes('Duplicate claim ID "claim-f3-pet-acq-01"')),
    `Expected duplicate claim ID error, got: ${result.errors.join('; ')}`
  );
});

test('Invalid fixture: missing dependency is rejected', () => {
  const doc = loadResearchDocument(path.join(FIXTURES_DIR, 'invalid-missing-dependency.yaml'));
  const result = validateResearchDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((err) => err.includes('missing dependency claim ID "claim-f3-nonexistent-id"')),
    `Expected missing dependency error, got: ${result.errors.join('; ')}`
  );
});

test('Invalid fixture: missing provenance on promoted claim is rejected', () => {
  const doc = loadResearchDocument(path.join(FIXTURES_DIR, 'invalid-missing-provenance.yaml'));
  const result = validateResearchDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((err) => err.includes('missing required provenance')),
    `Expected missing provenance error, got: ${result.errors.join('; ')}`
  );
});

test('Invalid fixture: explicitly unknown field populated in payload is rejected', () => {
  const doc = loadResearchDocument(path.join(FIXTURES_DIR, 'invalid-promoted-unknown.yaml'));
  const result = validateResearchDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((err) => err.includes('explicitly marks "quantity" as unknown, but payload populates it')),
    `Expected explicit unknown error, got: ${result.errors.join('; ')}`
  );
});

test('Safety: candidate confidence claims cannot be promoted', () => {
  const yamlText = `
schemaVersion: "crawler-research/v1"
storyId: "carl-doomsday-scenario"
floor: 3
sources:
  - id: "src-wiki"
    kind: "wiki"
    trust: "candidate"
    title: "Wiki Candidate Source"

claims:
  - id: "claim-f3-speculative-01"
    summary: "Speculative unverified claim"
    domain: "pet"
    claimType: "event"
    promotion: "promote"
    confidence: "candidate"
    provenance:
      sourceId: "src-wiki"
      trust: "candidate"
      locator: "Section: Speculation"
    stateTransition:
      kind: "PetHostilityChanged"
      payload:
        petId: "pet-mongo"
        hostility: "non-hostile"
`;
  const doc = parseResearchDocumentContent(yamlText);
  const result = validateResearchDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes('cannot be promoted with candidate confidence level')));
  assert.ok(result.errors.some((err) => err.includes('cannot be promoted with candidate trust in provenance')));
});

test('Safety: prohibited fabricated string values in payload are rejected', () => {
  const yamlText = `
schemaVersion: "crawler-research/v1"
storyId: "carl-doomsday-scenario"
floor: 3
sources:
  - id: "src-book-2"
    kind: "official-text"
    trust: "primary"
    title: "Book 2"

claims:
  - id: "claim-f3-fabricated-01"
    summary: "Claim with fabricated placeholder string"
    domain: "pet"
    claimType: "event"
    promotion: "promote"
    confidence: "confirmed"
    provenance:
      sourceId: "src-book-2"
      trust: "primary"
      locator: "Chapter 1"
    stateTransition:
      kind: "PetBonded"
      payload:
        petId: "pet-mongo"
        bondHolderCrawlerId: "crawler-donut"
        name: "unknown"
`;
  const doc = parseResearchDocumentContent(yamlText);
  const result = validateResearchDocument(doc);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes('contains prohibited fabricated value "unknown"')));
});
