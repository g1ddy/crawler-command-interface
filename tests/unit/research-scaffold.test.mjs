import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  loadResearchClaimDocument,
  loadModelingDecisionDocument,
} from '../../app/domain/research-loader.ts';
import {
  compileResearchScaffold,
  SCAFFOLD_STATUS_BANNER,
} from '../../app/domain/research-scaffold.ts';

const PET_RESEARCH_FIXTURE = 'data/raw/research/floor-3/pet-research.yaml';
const PET_MODELING_FIXTURE = 'data/raw/research/floor-3/pet-modeling-decisions.yaml';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

test('Research Scaffold: produces deterministic outputs for identical inputs', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold1 = compileResearchScaffold(researchDoc, modelingDoc);
  const scaffold2 = compileResearchScaffold(researchDoc, modelingDoc);

  assert.deepEqual(scaffold1, scaffold2);
  assert.equal(scaffold1.storyId, 'dcc');
  assert.equal(scaffold1.floor, 3);
});

test('Research Scaffold: all generated artifacts carry explicit non-authoritative status indicators', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  assert.equal(scaffold.review.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(scaffold.events.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(scaffold.observations.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(scaffold.provenance.statusBanner, SCAFFOLD_STATUS_BANNER);
});

test('Research Scaffold: generates stable candidate IDs and traceable provenance back to research claim IDs', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  assert.ok(scaffold.events.candidateEvents.length > 0);

  for (const candidate of scaffold.events.candidateEvents) {
    assert.equal(candidate.candidateId, `candidate-${candidate.researchClaimId}`);

    const prov = scaffold.provenance.candidates.find((p) => p.candidateId === candidate.candidateId);
    assert.ok(prov, `Missing provenance for candidate ${candidate.candidateId}`);
    assert.equal(prov.researchClaimId, candidate.researchClaimId);
    assert.ok(prov.sources.length >= 1);
  }
});

test('Research Scaffold: preserves explicit unknowns, sources, and evidence relationships', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  const p2Claim = researchDoc.claims.find((c) => c.id === 'P3-PET-002');
  assert.ok(p2Claim);
  assert.ok(p2Claim.unknowns);

  const p2Review = scaffold.review.claims.find((c) => c.claimId === 'P3-PET-002');
  assert.ok(p2Review);
  assert.deepEqual(p2Review.unknowns, p2Claim.unknowns);

  const p2Event = scaffold.events.candidateEvents.find((e) => e.researchClaimId === 'P3-PET-002');
  assert.ok(p2Event);
  assert.deepEqual(p2Event.unknowns, p2Claim.unknowns);
  assert.deepEqual(p2Event.evidence, p2Claim.evidence);
});

test('Research Scaffold: disposition filtering is explicit and fail-closed', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  // Assert promoted claims are present in candidates while ledger_only claims are NOT candidates
  const ledgerClaimIds = ['P3-PET-001', 'P3-PET-003', 'P3-PET-007', 'P3-PET-009', 'P3-PET-011', 'P3-PET-012', 'P3-PET-013', 'P3-PET-014', 'P3-PET-015'];
  const promotedClaimIds = ['P3-PET-002', 'P3-PET-004', 'P3-PET-005', 'P3-PET-006', 'P3-PET-008', 'P3-PET-010'];

  for (const id of ledgerClaimIds) {
    const candidate = scaffold.events.candidateEvents.find((e) => e.researchClaimId === id);
    assert.equal(candidate, undefined, `Claim ${id} with ledger_only disposition should NOT become candidate`);
  }

  for (const id of promotedClaimIds) {
    const candidate = scaffold.events.candidateEvents.find((e) => e.researchClaimId === id);
    assert.ok(candidate, `Promoted claim ${id} should exist in candidate proposals`);
  }
});

test('Research Scaffold: unsupported or disputed claims cannot silently become candidates', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const badDoc = deepClone(researchDoc);
  const p2Claim = badDoc.claims.find((c) => c.id === 'P3-PET-002');
  assert.ok(p2Claim);
  p2Claim.evidence[0].confidence = 'disputed';

  assert.throws(() => {
    compileResearchScaffold(badDoc, modelingDoc);
  }, /cannot enter candidate projection with confidence "disputed"/);
});

test('Research Scaffold: research and modeling inputs are never mutated', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const origResearchSnapshot = deepClone(researchDoc);
  const origModelingSnapshot = deepClone(modelingDoc);

  compileResearchScaffold(researchDoc, modelingDoc);

  assert.deepEqual(researchDoc, origResearchSnapshot);
  assert.deepEqual(modelingDoc, origModelingSnapshot);
});

test('Research Scaffold: CLI script generates valid disposable artifacts in target directory', () => {
  const tmpDir = path.resolve(process.cwd(), '.tmp/test-research-scaffold');
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const scriptPath = path.resolve(process.cwd(), 'scripts/generate-research-scaffold.mjs');
  const output = execFileSync('node', [
    '--experimental-strip-types',
    scriptPath,
    PET_RESEARCH_FIXTURE,
    PET_MODELING_FIXTURE,
    tmpDir
  ], { encoding: 'utf8' });

  assert.ok(output.includes('[Research Scaffold Success]'));

  const reviewContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'review.json'), 'utf8'));
  const eventsContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'events.json'), 'utf8'));
  const obsContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'observations.json'), 'utf8'));
  const provContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'provenance.json'), 'utf8'));

  assert.equal(reviewContent.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(eventsContent.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(obsContent.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(provContent.statusBanner, SCAFFOLD_STATUS_BANNER);

  assert.equal(reviewContent.claims.length, 15);
  assert.equal(eventsContent.candidateEvents.length, 6);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
