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
  validateTraceCompleteness,
  validateModelingDecisionDocument
} from '../../app/domain/research-validator.ts';
import { compileResearchTrace, compileCandidateProjection } from '../../app/domain/research-compiler.ts';

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

  const completenessValidation = validateTraceCompleteness(doc, modelingDoc);
  assert.equal(completenessValidation.valid, true);
  assert.deepEqual(completenessValidation.errors, []);

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
  assert.equal(mongoMapping.modeling.disposition, 'review');
  assert.equal(mongoMapping.modeling.target.concept, 'PetProgression');
});

test('Research Ingestion Contract: valid research claim without modeling decision → research artifact validation succeeds', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const docWithoutModeling = deepClone(doc);

  // Independent artifact schema validation passes for claims alone.
  const validation = validateResearchClaimDocument(docWithoutModeling);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('Research Ingestion Contract: compile complete trace with missing decision → fails clearly', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);
  const badModelingDoc = deepClone(modelingDoc);

  badModelingDoc.decisions.splice(0, 1); // Remove decision for P3-PET-001

  const completenessValidation = validateTraceCompleteness(doc, badModelingDoc);
  assert.equal(completenessValidation.valid, false);
  assert.ok(completenessValidation.errors.some((err) => err.includes('MODELING_DECISION_MISSING')));

  assert.throws(() => {
    compileResearchTrace(doc, badModelingDoc);
  }, /Compiler error: Trace completeness validation failed/);
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

test('Research Ingestion Contract: permits promotion with candidate confidence when modeling decision authorizes it', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);
  const candidateDoc = deepClone(doc);

  // Set confidence to candidate on promoted claim P3-PET-002
  candidateDoc.claims[1].evidence[0].confidence = 'candidate';

  const validation = validateSemanticModelingDecisions(candidateDoc, modelingDoc);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
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

test('Research Ingestion Contract: promoted modeling decision requires target', () => {
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
  assert.equal(ledgerMapping.modeling.disposition, 'ledger_only');
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
    '--experimental-strip-types',
    scriptPath,
    VALID_RESEARCH_FIXTURE,
    VALID_MODELING_FIXTURE
  ], { encoding: 'utf8' });
  assert.ok(output.includes('[Research Ingestion Success]'));
  assert.ok(output.includes('Trace mappings compiled: 5'));
});

test('Research Ingestion Contract: candidate projection generates generic proposals and sidecars without hardcoded domain mappings', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const res1 = compileCandidateProjection(doc, modelingDoc);
  const res2 = compileCandidateProjection(doc, modelingDoc);

  assert.deepEqual(res1, res2);
  assert.equal(res1.storyId, 'dcc');
  assert.equal(res1.floor, 3);
  assert.equal(res1.candidateProposals.length, 2);
  assert.equal(res1.provenanceSidecar.length, 2);

  const collarProposal = res1.candidateProposals.find((e) => e.researchClaimId === 'P3-PET-002');
  assert.ok(collarProposal);
  assert.equal(collarProposal.candidateId, 'candidate-P3-PET-002');
  assert.equal(collarProposal.target.domain, 'inventory');
  assert.equal(collarProposal.target.concept, 'ItemAcquired');
  assert.equal(collarProposal.position.floor, 3);
  assert.equal(collarProposal.position.book, undefined); // Chronology is grounded in scope floor, not evidence[0]
});

test('Research Ingestion Contract: case-distinct claim IDs generate non-colliding candidate IDs', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const testDoc = deepClone(doc);
  const testModeling = deepClone(modelingDoc);

  // Duplicate claim except with lowercase ID
  const upperClaim = testDoc.claims.find((c) => c.id === 'P3-PET-002');
  assert.ok(upperClaim);
  const lowerClaim = deepClone(upperClaim);
  lowerClaim.id = 'p3-pet-002';
  testDoc.claims.push(lowerClaim);

  const lowerDecision = deepClone(testModeling.decisions.find((d) => d.claimId === 'P3-PET-002'));
  lowerDecision.claimId = 'p3-pet-002';
  testModeling.decisions.push(lowerDecision);

  const result = compileCandidateProjection(testDoc, testModeling);
  const candidateIds = result.candidateProposals.map((c) => c.candidateId);

  assert.ok(candidateIds.includes('candidate-P3-PET-002'));
  assert.ok(candidateIds.includes('candidate-p3-pet-002'));
  assert.equal(new Set(candidateIds).size, candidateIds.length);
});

test('Research Ingestion Contract: evidence ordering alone does not dictate candidate event position', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const testDoc = deepClone(doc);
  const pet2Claim = testDoc.claims.find((c) => c.id === 'P3-PET-002');
  assert.ok(pet2Claim);

  // Add multiple evidence items with different locators
  pet2Claim.evidence = [
    { sourceId: 'src-book-2', locator: { book: 2, chapter: 10 }, confidence: 'confirmed' },
    { sourceId: 'src-book-2', locator: { book: 2, chapter: 5 }, confidence: 'corroborated' }
  ];

  const resultOriginal = compileCandidateProjection(testDoc, modelingDoc);

  // Reverse evidence array order
  pet2Claim.evidence.reverse();
  const resultReversed = compileCandidateProjection(testDoc, modelingDoc);

  const posOriginal = resultOriginal.candidateProposals.find((e) => e.researchClaimId === 'P3-PET-002').position;
  const posReversed = resultReversed.candidateProposals.find((e) => e.researchClaimId === 'P3-PET-002').position;

  // Position is derived strictly from scope floor, completely invariant to evidence ordering
  assert.deepEqual(posOriginal, { floor: 3 });
  assert.deepEqual(posReversed, { floor: 3 });
});

test('Research Ingestion Contract: generic unknown array is preserved untouched without domain field parsing', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const testDoc = deepClone(doc);
  const sysClaim = testDoc.claims.find((c) => c.id === 'P3-SYS-001');
  assert.ok(sysClaim);
  sysClaim.unknowns = ['custom_unknown_key_1', 'custom_unknown_key_2'];

  const testModeling = deepClone(modelingDoc);
  const sysDecision = testModeling.decisions.find((d) => d.claimId === 'P3-SYS-001');
  assert.ok(sysDecision);
  sysDecision.disposition = 'promote';
  sysDecision.target = { domain: 'floor-system', concept: 'CustomTargetConcept' };

  const result = compileCandidateProjection(testDoc, testModeling);
  const sysProposal = result.candidateProposals.find((e) => e.researchClaimId === 'P3-SYS-001');

  assert.ok(sysProposal);
  assert.deepEqual(sysProposal.unknowns, ['custom_unknown_key_1', 'custom_unknown_key_2']);
});

test('Research Ingestion Contract: explicit unknown on conceptual claim preserves statement and unknowns without inventing concrete values', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  // P3-SYS-001 (eight-day collapse timer) has unknowns: ['exact_timestamp']
  const testDoc = deepClone(doc);
  const testModeling = deepClone(modelingDoc);

  const sysDecision = testModeling.decisions.find((d) => d.claimId === 'P3-SYS-001');
  assert.ok(sysDecision);
  sysDecision.disposition = 'promote';
  sysDecision.target = { domain: 'floor-system', concept: 'CountdownDeclared' };

  const result = compileCandidateProjection(testDoc, testModeling);
  const sysProposal = result.candidateProposals.find((e) => e.researchClaimId === 'P3-SYS-001');

  assert.ok(sysProposal);
  assert.equal(sysProposal.summary, "Floor 3 has an eight-day collapse timer.");
  assert.deepEqual(sysProposal.unknowns, ['exact_timestamp']);
  // Assert no concrete timestamp or executable countdown seconds were fabricated on proposal
  assert.equal('timestamp' in sysProposal, false);
  assert.equal('remainingSeconds' in sysProposal, false);
});

test('Research Ingestion Contract: non-event claim promoted to candidate proposal does not require event payload', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const testDoc = deepClone(doc);
  const testModeling = deepClone(modelingDoc);

  // Promote state claim P3-PET-002 with non-event concept 'CatalogItemReference'
  const pet2Decision = testModeling.decisions.find((d) => d.claimId === 'P3-PET-002');
  assert.ok(pet2Decision);
  pet2Decision.disposition = 'promote';
  pet2Decision.target = { domain: 'inventory', concept: 'CatalogItemReference' };

  const result = compileCandidateProjection(testDoc, testModeling);
  const pet2Proposal = result.candidateProposals.find((e) => e.researchClaimId === 'P3-PET-002');

  assert.ok(pet2Proposal);
  assert.equal(pet2Proposal.target.domain, 'inventory');
  assert.equal(pet2Proposal.target.concept, 'CatalogItemReference');
  assert.equal('type' in pet2Proposal, false);
  assert.equal('item' in pet2Proposal, false);
});

test('Research Ingestion Contract: rejects promotion for evidence explicitly carrying relationship "contradicts"', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const badDoc = deepClone(doc);
  const pet2Claim = badDoc.claims.find((c) => c.id === 'P3-PET-002');
  assert.ok(pet2Claim);
  pet2Claim.evidence[0].relationship = 'contradicts';

  const validation = validateSemanticModelingDecisions(badDoc, modelingDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('cannot be promoted with evidence explicitly declared with relationship "contradicts"')));
});

test('Research Ingestion Contract: candidate compilation fails closed on unvalidated or incomplete modeling input', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  // Incomplete modeling decisions
  const incompleteModelingDoc = deepClone(modelingDoc);
  incompleteModelingDoc.decisions.pop();
  assert.throws(() => {
    compileCandidateProjection(doc, incompleteModelingDoc);
  }, /Compiler error: Trace completeness validation failed/);

  // Invalid research document
  const invalidResearchDoc = deepClone(doc);
  delete invalidResearchDoc.storyId;
  assert.throws(() => {
    compileCandidateProjection(invalidResearchDoc, modelingDoc);
  }, /Compiler error: Research document schema\/semantic validation failed/);

  // Missing target concept on promoted decision
  const missingTargetDoc = deepClone(modelingDoc);
  delete missingTargetDoc.decisions[1].target;
  assert.throws(() => {
    compileCandidateProjection(doc, missingTargetDoc);
  }, /Modeling decision document schema validation failed/);
});

test('Research Ingestion Contract: pure candidate projection produces candidate proposals without mutating memory artifacts', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const initialDocSnapshot = deepClone(doc);
  const initialModelingSnapshot = deepClone(modelingDoc);

  const result = compileCandidateProjection(doc, modelingDoc);
  assert.ok(result.candidateProposals);

  assert.deepEqual(doc, initialDocSnapshot);
  assert.deepEqual(modelingDoc, initialModelingSnapshot);
});


test('Research Ingestion Contract: promote authorizes disposable candidate review, not authoritative runtime state', () => {
  const doc = loadResearchClaimDocument(VALID_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(VALID_MODELING_FIXTURE);

  const result = compileCandidateProjection(doc, modelingDoc);
  const promoted = result.candidateProposals.find((candidate) => candidate.researchClaimId === 'P3-PET-002');

  assert.ok(promoted);
  assert.equal(promoted.target.concept, 'ItemAcquired');

  assert.equal('event' in promoted, false);
  assert.equal('payload' in promoted, false);
  assert.equal('authoritative' in promoted, false);
  assert.equal('runtimeState' in promoted, false);
  assert.equal('rawFloorPath' in promoted, false);

  assert.ok(Array.isArray(result.candidateProposals));
  assert.ok(Array.isArray(result.provenanceSidecar));
});
