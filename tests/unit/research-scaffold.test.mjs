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
  assert.equal(scaffold.candidates.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(scaffold.provenance.statusBanner, SCAFFOLD_STATUS_BANNER);
});

test('Research Scaffold: candidate projection contains exactly the claims eligible according to modeling decisions', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  const expectedPromotedClaimIds = modelingDoc.decisions
    .filter((d) => d.disposition === 'promote')
    .map((d) => d.claimId);

  const actualCandidateClaimIds = scaffold.candidates.candidates.map((c) => c.researchClaimId);

  assert.deepEqual(actualCandidateClaimIds.sort(), expectedPromotedClaimIds.sort());

  const expectedLedgerOnlyClaimIds = modelingDoc.decisions
    .filter((d) => d.disposition === 'ledger_only')
    .map((d) => d.claimId);

  for (const ledgerId of expectedLedgerOnlyClaimIds) {
    assert.equal(
      actualCandidateClaimIds.includes(ledgerId),
      false,
      `Ledger-only claim "${ledgerId}" should NOT enter candidate proposals.`
    );
  }
});

test('Research Scaffold: promote signifies candidate eligibility without automatic runtime authoring or reclassification', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  // Observation claim P3-PET-010 targets concept PetDeploymentChanged
  const p10Claim = researchDoc.claims.find((c) => c.id === 'P3-PET-010');
  assert.ok(p10Claim);
  assert.equal(p10Claim.kind, 'observation');

  const p10Candidate = scaffold.candidates.candidates.find((c) => c.researchClaimId === 'P3-PET-010');
  assert.ok(p10Candidate);
  assert.equal(p10Candidate.candidateId, 'candidate-P3-PET-010');
  assert.equal(p10Candidate.target.concept, 'PetDeploymentChanged');

  // Candidate proposal remains a disposable review artifact, NOT an authoritative runtime event
  assert.equal('event' in p10Candidate, false);
  assert.equal('payload' in p10Candidate, false);
  assert.equal('authoritative' in p10Candidate, false);
  assert.equal('runtimeState' in p10Candidate, false);
});

test('Research Scaffold: review claim retains complete evidence array without single-scalar confidence collapse', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  for (const reviewClaim of scaffold.review.claims) {
    const origClaim = researchDoc.claims.find((c) => c.id === reviewClaim.claimId);
    assert.ok(origClaim);
    assert.deepEqual(reviewClaim.evidence, origClaim.evidence);
    assert.equal('confidence' in reviewClaim, false);
  }
});

test('Research Scaffold: generates stable candidate IDs and traceable provenance back to research claim IDs', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  for (const candidate of scaffold.candidates.candidates) {
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

  const p2Candidate = scaffold.candidates.candidates.find((c) => c.researchClaimId === 'P3-PET-002');
  assert.ok(p2Candidate);
  assert.deepEqual(p2Candidate.unknowns, p2Claim.unknowns);
  assert.deepEqual(p2Candidate.evidence, p2Claim.evidence);
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

test('Research Scaffold: research inputs and raw floor files are never mutated', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const origResearchSnapshot = deepClone(researchDoc);
  const origModelingSnapshot = deepClone(modelingDoc);

  const rawEventsPath = path.resolve(process.cwd(), 'data/raw/floors/floor-3/events.json');
  const rawEventsBefore = fs.readFileSync(rawEventsPath, 'utf8');

  compileResearchScaffold(researchDoc, modelingDoc);

  assert.deepEqual(researchDoc, origResearchSnapshot);
  assert.deepEqual(modelingDoc, origModelingSnapshot);

  const rawEventsAfter = fs.readFileSync(rawEventsPath, 'utf8');
  assert.equal(rawEventsBefore, rawEventsAfter);
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
  const candidatesContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'candidates.json'), 'utf8'));
  const provContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'provenance.json'), 'utf8'));

  assert.equal(reviewContent.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(candidatesContent.statusBanner, SCAFFOLD_STATUS_BANNER);
  assert.equal(provContent.statusBanner, SCAFFOLD_STATUS_BANNER);

  assert.equal(reviewContent.claims.length, 15);
  assert.equal(candidatesContent.candidates.length, 6);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
