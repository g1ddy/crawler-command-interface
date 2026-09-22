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
import { validateResearchClaimDocument } from '../../app/domain/research-validator.ts';
import {
  compileResearchTrace,
  compileRawDraft,
} from '../../app/domain/research-compiler.ts';
import { validateRawCrawlerFloor } from '../../app/domain/validation.ts';

const PET_RESEARCH_FIXTURE = 'data/raw/research/floor-3/pet-research.yaml';
const GENERAL_RESEARCH_FIXTURE = 'data/raw/research/floor-3/research.yaml';
const GENERAL_MODELING_FIXTURE = 'data/raw/research/floor-3/modeling-decisions.yaml';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

test('Research Ingestion: valid Floor 3 research claim fixture parses and validates', () => {
  const content = fs.readFileSync(PET_RESEARCH_FIXTURE, 'utf8');
  const parsedDoc = parseResearchClaimDocument(content);
  assert.equal(parsedDoc.schemaVersion, 'crawler-research/v1');

  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  assert.equal(doc.schemaVersion, 'crawler-research/v1');
  assert.equal(doc.storyId, 'dcc');
  assert.equal(doc.floor, 3);
  assert.equal(doc.claims.length, 15);

  const validation = validateResearchClaimDocument(doc);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('Research Draft Compiler: produces deterministic output for identical inputs', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);

  const draft1 = compileRawDraft(doc);
  const draft2 = compileRawDraft(doc);

  assert.deepEqual(draft1, draft2);
  assert.equal(draft1.storyId, 'dcc');
  assert.equal(draft1.floor, 3);
});

test('Research Draft Compiler: strictly preserves YAML claim ordering in generated draft events', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const draft = compileRawDraft(doc);

  const expectedClaimIds = doc.claims
    .filter((c) => !(c.domain === 'inventory' && c.kind === 'state'))
    .map((c) => c.id);

  const actualDraftClaimIds = draft.events.map((e) => e.researchClaimId);

  assert.deepEqual(actualDraftClaimIds, expectedClaimIds);
});

test('Research Draft Compiler: preserves researchClaimId, evidence, locators, and explicit unknowns directly on draft items', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const draft = compileRawDraft(doc);

  const p2Claim = doc.claims.find((c) => c.id === 'P3-PET-002');
  assert.ok(p2Claim);

  const p2DraftEvent = draft.events.find((e) => e.researchClaimId === 'P3-PET-002');
  assert.ok(p2DraftEvent);

  assert.equal(p2DraftEvent.researchClaimId, 'P3-PET-002');
  assert.equal(p2DraftEvent.summary, p2Claim.claim.summary);
  assert.deepEqual(p2DraftEvent.evidence, p2Claim.evidence);
  assert.deepEqual(p2DraftEvent.unknowns, p2Claim.unknowns);
});

test('Research Draft Compiler: does not invent fake CCI event types or payloads', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const draft = compileRawDraft(doc);

  for (const draftEvent of draft.events) {
    // Assert event type discriminator is left unpopulated for human curation
    assert.equal(draftEvent.type, undefined);
  }
});

test('Research Draft Compiler: uncurated draft items remain invalid under existing raw floor schema validation', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const draft = compileRawDraft(doc);

  // Construct a mock raw floor document using uncurated draft events
  const mockRawDoc = {
    authoringVersion: 'crawler-floor-raw/v1',
    storyId: draft.storyId,
    floor: {
      id: 'floor-3',
      ordinal: 3,
      title: 'The Over City',
      book: 2,
      continuity: 'canonical',
      coverage: {
        kind: 'curated-critical',
        statement: 'Test draft',
        completeness: 'partial',
      },
    },
    sources: [],
    catalog: {
      items: [],
      achievements: [],
    },
    events: draft.events,
  };

  const validation = validateRawCrawlerFloor(mockRawDoc);
  // Uncurated draft lacks required CCI properties (such as 'type'), so existing raw validation fails as intended
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes("must have required property 'type'") || err.includes('must match pattern')));
});

test('Research Draft Compiler: research input and authoritative raw floor files are never mutated', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const docSnapshot = deepClone(doc);

  const rawEventsPath = path.resolve(process.cwd(), 'data/raw/floors/floor-3/events.json');
  const rawEventsBefore = fs.readFileSync(rawEventsPath, 'utf8');

  compileRawDraft(doc);

  assert.deepEqual(doc, docSnapshot);

  const rawEventsAfter = fs.readFileSync(rawEventsPath, 'utf8');
  assert.equal(rawEventsBefore, rawEventsAfter);
});

test('Research Draft Compiler: CLI script generates raw draft artifacts in target directory', () => {
  const tmpDir = path.resolve(process.cwd(), '.tmp/test-research-scaffold');
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const scriptPath = path.resolve(process.cwd(), 'scripts/generate-research-scaffold.mjs');
  const output = execFileSync('node', [
    '--experimental-strip-types',
    scriptPath,
    PET_RESEARCH_FIXTURE,
    tmpDir
  ], { encoding: 'utf8' });

  assert.ok(output.includes('[Research Draft Compiler Success]'));

  const eventsContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'events.json'), 'utf8'));
  const catalogContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'catalog.json'), 'utf8'));
  const readmeContent = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf8');

  assert.equal(eventsContent.length, 15);
  assert.ok(Array.isArray(catalogContent.items));
  assert.ok(readmeContent.includes('DISPOSABLE RESEARCH DRAFT — NOT AUTHORITATIVE CCI DATA'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('Research Ingestion Contract: rejects duplicate claim IDs', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const dupDoc = deepClone(doc);
  dupDoc.claims[1].id = dupDoc.claims[0].id;

  const validation = validateResearchClaimDocument(dupDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('Duplicate claim ID')));
});

test('Research Ingestion Contract: rejects missing source references', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const badDoc = deepClone(doc);
  badDoc.claims[0].evidence[0].sourceId = 'src-missing-999';

  const validation = validateResearchClaimDocument(badDoc);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((err) => err.includes('references missing source ID "src-missing-999"')));
});

test('Research Ingestion Contract: trace compilation executes cleanly when modeling decisions are provided', () => {
  const doc = loadResearchClaimDocument(GENERAL_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument(GENERAL_MODELING_FIXTURE);

  const compiled = compileResearchTrace(doc, modelingDoc);
  assert.equal(compiled.storyId, 'dcc');
  assert.equal(compiled.floor, 3);
  assert.equal(compiled.claimMappings.length, 5);
});
