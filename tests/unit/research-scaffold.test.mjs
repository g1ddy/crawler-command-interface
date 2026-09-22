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

test('Research Scaffold: candidate projection contains exactly the claims eligible according to modeling decisions', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  const expectedPromotedClaimIds = modelingDoc.decisions
    .filter((d) => d.disposition === 'promote')
    .map((d) => d.claimId);

  const actualCandidateClaimIds = [
    ...scaffold.events.candidateEvents.map((e) => e.researchClaimId),
    ...scaffold.observations.candidateObservations.map((o) => o.researchClaimId),
  ];

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

test('Research Scaffold: observation claims with Changed-suffixed target concepts remain observations', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  // P3-PET-010 is an observation claim (kind: observation) targeting PetDeploymentChanged
  const p10Claim = researchDoc.claims.find((c) => c.id === 'P3-PET-010');
  assert.ok(p10Claim);
  assert.equal(p10Claim.kind, 'observation');

  const p10Decision = modelingDoc.decisions.find((d) => d.claimId === 'P3-PET-010');
  assert.ok(p10Decision);
  assert.equal(p10Decision.disposition, 'promote');
  assert.equal(p10Decision.target?.concept, 'PetDeploymentChanged');

  const eventCandidate = scaffold.events.candidateEvents.find((e) => e.researchClaimId === 'P3-PET-010');
  assert.equal(eventCandidate, undefined, 'Observation claim P3-PET-010 must NOT be categorized as a candidate event');

  const obsCandidate = scaffold.observations.candidateObservations.find((o) => o.researchClaimId === 'P3-PET-010');
  assert.ok(obsCandidate, 'Observation claim P3-PET-010 must be categorized under candidateObservations');
  assert.equal(obsCandidate.candidateId, 'candidate-P3-PET-010');
  assert.equal(obsCandidate.target.concept, 'PetDeploymentChanged');
});

test('Research Scaffold: review claim retains complete evidence array without single-scalar confidence collapse', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  for (const reviewClaim of scaffold.review.claims) {
    const origClaim = researchDoc.claims.find((c) => c.id === reviewClaim.claimId);
    assert.ok(origClaim);
    assert.deepEqual(reviewClaim.evidence, origClaim.evidence);
    // Ensure no misleading scalar confidence field exists on reviewClaim
    assert.equal('confidence' in reviewClaim, false);
  }
});

test('Research Scaffold: generates stable candidate IDs and traceable provenance back to research claim IDs', () => {
  const researchDoc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(PET_MODELING_FIXTURE);

  const scaffold = compileResearchScaffold(researchDoc, modelingDoc);

  const allCandidates = [
    ...scaffold.events.candidateEvents,
    ...scaffold.observations.candidateObservations,
  ];

  for (const candidate of allCandidates) {
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
  assert.equal(eventsContent.candidateEvents.length, 5);
  assert.equal(obsContent.candidateObservations.length, 1);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
