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
  compileRawFloor,
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

test('Research Compiler: produces direct CCI raw floor shapes matching existing raw floor files', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const compiled = compileRawFloor(doc);

  assert.ok(Array.isArray(compiled.sources));
  assert.ok(Array.isArray(compiled.catalog.items));
  assert.ok(Array.isArray(compiled.events));
  assert.equal(compiled.events.length, 15);
});

test('Research Compiler: produces deterministic byte-equivalent outputs for identical inputs', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);

  const compiled1 = compileRawFloor(doc);
  const compiled2 = compileRawFloor(doc);

  assert.deepEqual(compiled1, compiled2);
});

test('Research Compiler: strictly preserves research YAML claim ordering in generated raw events', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const compiled = compileRawFloor(doc);

  assert.equal(compiled.events.length, doc.claims.length);
  for (let i = 0; i < doc.claims.length; i++) {
    assert.equal(compiled.events[i].summary, doc.claims[i].claim.summary);
  }
});

test('Research Compiler: preserves evidence, locators, and explicit unknowns directly without data loss', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const compiled = compileRawFloor(doc);

  const p2Claim = doc.claims.find((c) => c.id === 'P3-PET-002');
  assert.ok(p2Claim);

  const p2Event = compiled.events.find((e) => String(e.summary) === p2Claim.claim.summary);
  assert.ok(p2Event);

  assert.equal(p2Event.summary, p2Claim.claim.summary);
  assert.deepEqual(p2Event.evidence, p2Claim.evidence);
  assert.deepEqual(p2Event.unknowns, p2Claim.unknowns);
});

test('Research Compiler: leaves event type unpopulated for curation when no established CCI contract exists', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const compiled = compileRawFloor(doc);

  for (const event of compiled.events) {
    assert.equal(event.type, undefined);
  }
});

test('Research Compiler: uncurated raw records fail existing CCI raw floor schema validation with expected curation gap error', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const compiled = compileRawFloor(doc);

  const mockRawDoc = {
    authoringVersion: 'crawler-floor-raw/v1',
    storyId: doc.storyId,
    floor: {
      id: 'floor-3',
      ordinal: 3,
      title: 'The Over City',
      book: 2,
      continuity: 'canonical',
      coverage: {
        kind: 'curated-critical',
        statement: 'Test compilation',
        completeness: 'partial',
      },
    },
    sources: compiled.sources,
    catalog: compiled.catalog,
    events: compiled.events,
  };

  const validation = validateRawCrawlerFloor(mockRawDoc);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.errors.some((err) => err.includes("must have required property 'type'"))
  );
});

test('Research Compiler: research input and authoritative raw floor files are never mutated', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const docSnapshot = deepClone(doc);

  const rawEventsPath = path.resolve(process.cwd(), 'data/raw/floors/floor-3/events.json');
  const rawEventsBefore = fs.readFileSync(rawEventsPath, 'utf8');

  compileRawFloor(doc);

  assert.deepEqual(doc, docSnapshot);

  const rawEventsAfter = fs.readFileSync(rawEventsPath, 'utf8');
  assert.equal(rawEventsBefore, rawEventsAfter);
});

test('Research Compiler: CLI script generates raw artifacts in target directory', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const tmpDir = path.resolve(process.cwd(), '.tmp/test-research-scaffold');
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const scriptPath = path.resolve(process.cwd(), 'scripts/generate-research-scaffold.mjs');
  const output = execFileSync('node', [
    '--experimental-strip-types',
    scriptPath,
    PET_RESEARCH_FIXTURE,
    tmpDir
  ], { encoding: 'utf8' });

  assert.ok(output.includes('[Research Raw Compiler Success]'));

  const eventsContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'events.json'), 'utf8'));
  const catalogContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'catalog.json'), 'utf8'));
  const sourcesContent = JSON.parse(fs.readFileSync(path.join(tmpDir, 'sources.json'), 'utf8'));

  assert.equal(eventsContent.length, 15);
  assert.ok(Array.isArray(catalogContent.items));
  assert.equal(sourcesContent.length, doc.sources.length);

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

test('Research Compiler: filters out ledger_only and review claims when modeling decisions are supplied', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument('data/raw/research/floor-3/pet-modeling-decisions.yaml');

  const fullCompiled = compileRawFloor(doc);
  assert.equal(fullCompiled.events.length, 15);

  const filteredCompiled = compileRawFloor(doc, modelingDoc);
  // Pet modeling decisions promote 5 claims (P3-PET-002, 004, 005, 006, 008)
  assert.equal(filteredCompiled.events.length, 5);

  const ledgerOnlyClaimSummaries = [
    'Mongo is a dungeon-generated, pet-class Mongoliensis.',
    'Mongo undergoes substantial physical growth during his progression.',
    'The Enchanted Fang Caps produce an electrical spark effect associated with Mongo\'s bite attacks.'
  ];
  for (const summary of ledgerOnlyClaimSummaries) {
    assert.equal(
      filteredCompiled.events.some((e) => String(e.summary) === summary),
      false,
      `Ledger-only claim "${summary}" must be excluded from raw floor compilation`
    );
  }
});

test('Research Compiler: reconciles existing raw floor records without creating duplicates', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument('data/raw/research/floor-3/pet-modeling-decisions.yaml');

  const existingRaw = {
    events: [
      {
        id: 'evt-f3-magical-pet-carrier-acquired',
        type: 'ItemAcquired',
        position: { floor: 3, book: 2, chapter: 14 },
        summary: 'The party acquires a Magical Pet Carrier on Floor 3.',
        evidence: [
          {
            sourceId: 'src-bookworm-carrier',
            locator: { book: 2, chapter: 14 },
            confidence: 'corroborated'
          }
        ],
        item: {
          instanceId: 'inst-magical-pet-carrier-1',
          itemId: 'item-magical-pet-carrier',
          quantity: { known: true, value: 1 }
        }
      }
    ]
  };

  const compiled = compileRawFloor(doc, modelingDoc, existingRaw);

  const matchingEvents = compiled.events.filter(
    (e) => String(e.id) === 'evt-f3-magical-pet-carrier-acquired'
  );

  assert.equal(matchingEvents.length, 1, 'Reconciliation must not create duplicate events');
  assert.equal(matchingEvents[0].id, 'evt-f3-magical-pet-carrier-acquired');
  assert.equal(matchingEvents[0].type, 'ItemAcquired', 'Authored event type must be preserved');
});

test('Research Compiler: changing research wording does not alter an established event ID during reconciliation', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument('data/raw/research/floor-3/pet-modeling-decisions.yaml');

  const existingRaw = {
    events: [
      {
        id: 'evt-f3-magical-pet-carrier-acquired',
        type: 'ItemAcquired',
        position: { floor: 3, book: 2, chapter: 14 },
        summary: 'Original authored summary: Carrier acquired.',
        evidence: [
          {
            sourceId: 'src-bookworm-carrier',
            locator: { book: 2, chapter: 14 },
            confidence: 'corroborated'
          }
        ]
      }
    ]
  };

  const compiled = compileRawFloor(doc, modelingDoc, existingRaw);
  const matchedEvent = compiled.events.find((e) => String(e.id) === 'evt-f3-magical-pet-carrier-acquired');

  assert.ok(matchedEvent);
  assert.equal(matchedEvent.id, 'evt-f3-magical-pet-carrier-acquired', 'Established event ID must be preserved regardless of prose changes');
});

test('Research Compiler: claims with identical summaries represent separate occurrences and are not merged', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const testDoc = deepClone(doc);

  testDoc.claims[0].claim.summary = 'The party acquires an item.';
  testDoc.claims[1].claim.summary = 'The party acquires an item.';

  const compiled = compileRawFloor(testDoc);
  assert.equal(compiled.events.length, 15);
  const matchingSummaries = compiled.events.filter((e) => String(e.summary) === 'The party acquires an item.');
  assert.equal(matchingSummaries.length, 2, 'Claims with identical summaries must be compiled as distinct occurrences');
});

test('Research Compiler: existing authored fields absent from research survive compilation unchanged', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const modelingDoc = loadModelingDecisionDocument('data/raw/research/floor-3/pet-modeling-decisions.yaml');

  const existingRaw = {
    events: [
      {
        id: 'evt-f3-magical-pet-carrier-acquired',
        type: 'ItemAcquired',
        position: { floor: 3, book: 2, chapter: 14 },
        summary: 'The party acquires a Magical Pet Carrier on Floor 3.',
        correlationId: 'corr-custom-123',
        evidence: [
          {
            sourceId: 'src-bookworm-carrier',
            locator: { book: 2, chapter: 14 },
            confidence: 'corroborated'
          }
        ],
        item: {
          instanceId: 'inst-magical-pet-carrier-1',
          itemId: 'item-magical-pet-carrier',
          quantity: { known: true, value: 1 }
        }
      }
    ]
  };

  const compiled = compileRawFloor(doc, modelingDoc, existingRaw);
  const matchedEvent = compiled.events.find((e) => String(e.id) === 'evt-f3-magical-pet-carrier-acquired');

  assert.ok(matchedEvent);
  assert.equal(matchedEvent.correlationId, 'corr-custom-123', 'Custom authored fields must survive compilation');
});

test('Research Compiler: P3-PET-010 carrier behavior leaves event mapping unresolved', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const compiled = compileRawFloor(doc);

  const p10Claim = doc.claims.find((c) => c.id === 'P3-PET-010');
  assert.ok(p10Claim);

  const p10Event = compiled.events.find((e) => String(e.summary) === p10Claim.claim.summary);
  assert.ok(p10Event);
  assert.equal(p10Event.type, undefined, 'P3-PET-010 event type must remain unresolved in uncurated raw output');
});

test('Research Compiler: generates collision-safe deterministic domain event IDs', () => {
  const doc = loadResearchClaimDocument(PET_RESEARCH_FIXTURE);
  const compiled1 = compileRawFloor(doc);
  const compiled2 = compileRawFloor(doc);

  assert.deepEqual(compiled1.events.map((e) => e.id), compiled2.events.map((e) => e.id));

  for (const e of compiled1.events) {
    assert.ok(
      String(e.id).match(/^evt-f3-[a-z0-9-]+$/),
      `Event ID "${e.id}" must match raw floor domain event ID convention`
    );
  }
});
