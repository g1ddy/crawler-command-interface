import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);
const readJson = (file) => JSON.parse(read(file));
const writeJson = (file, value) => write(file, `${JSON.stringify(value, null, 2)}\n`);

function replaceOnce(file, from, to) {
  const content = read(file);
  if (!content.includes(from)) throw new Error(`Pattern not found in ${file}: ${from.slice(0, 100)}`);
  write(file, content.replace(from, to));
}

function addIdDefs(schema, { observations = false } = {}) {
  schema.$defs.eventId = {
    type: 'string',
    pattern: '^evt-f[1-9][0-9]*-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
  };
  if (observations) {
    schema.$defs.observationId = {
      type: 'string',
      pattern: '^obs-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
    };
  }

  // Reserve stable namespaces for other authored identities. These are reusable
  // defs; wiring them into every historical field can be done incrementally.
  const namespaces = {
    sourceId: 'src',
    countdownId: 'countdown',
    itemId: 'item',
    achievementId: 'achievement',
    instanceId: 'inst',
    skillId: 'skill',
    spellId: 'spell',
    partyId: 'party',
    crawlerId: 'crawler',
    effectId: 'effect',
    questId: 'quest',
    entitlementId: 'entitlement',
  };
  for (const [name, prefix] of Object.entries(namespaces)) {
    schema.$defs[name] = {
      type: 'string',
      pattern: `^${prefix}-[a-z0-9][a-z0-9-]*$`,
    };
  }
}

function wireEventIds(eventDef) {
  if (!eventDef?.oneOf) throw new Error('Expected event oneOf');
  for (const variant of eventDef.oneOf) {
    if (variant?.properties?.id) variant.properties.id = { $ref: '#/$defs/eventId' };
  }
}

function wireObservationIds(observationDef) {
  if (!observationDef?.oneOf) throw new Error('Expected observation oneOf');
  for (const variant of observationDef.oneOf) {
    if (variant?.properties?.id) variant.properties.id = { $ref: '#/$defs/observationId' };
    if (variant?.properties?.eventId) variant.properties.eventId = { $ref: '#/$defs/eventId' };
  }
}

const rawSchemaPath = 'app/domain/schema/crawler-floor-raw.schema.json';
const rawSchema = readJson(rawSchemaPath);
addIdDefs(rawSchema, { observations: true });
wireEventIds(rawSchema.$defs.event);
wireObservationIds(rawSchema.$defs.observation);
writeJson(rawSchemaPath, rawSchema);

const floorSchemaPath = 'app/domain/schema/crawler-floor.schema.json';
const floorSchema = readJson(floorSchemaPath);
addIdDefs(floorSchema);
wireEventIds(floorSchema.$defs.event);
if (!floorSchema.$defs.countdownReference?.properties?.anchorEventId) {
  throw new Error('Expected countdownReference.anchorEventId');
}
floorSchema.$defs.countdownReference.properties.anchorEventId = { $ref: '#/$defs/eventId' };
writeJson(floorSchemaPath, floorSchema);

function normalizeEventId(id) {
  if (!/^evt-f\d+-/.test(id)) return id;
  let next = id.replace(/^evt-f(\d+)-\d{3}-/, 'evt-f$1-');
  if (!/^evt-f\d+-countdown-start$/.test(next)) {
    next = next.replace(/^evt-f(\d+)-countdown-/, 'evt-f$1-');
  }
  return next;
}

const rawFloorPaths = ['data/raw/floors/floor-1.json', 'data/raw/floors/floor-2.json'];
const idMap = new Map();
for (const file of rawFloorPaths) {
  const doc = readJson(file);
  for (const event of doc.events) {
    const normalized = normalizeEventId(event.id);
    if (normalized !== event.id) idMap.set(event.id, normalized);
  }
}

const normalizedIds = [...idMap.values()];
if (new Set(normalizedIds).size !== normalizedIds.length) {
  throw new Error('Event ID normalization would create a collision');
}

function replaceIdsDeep(value) {
  if (typeof value === 'string') return idMap.get(value) ?? value;
  if (Array.isArray(value)) return value.map(replaceIdsDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceIdsDeep(child)]));
  }
  return value;
}

for (const file of rawFloorPaths) writeJson(file, replaceIdsDeep(readJson(file)));

// Replace stable event references in source/tests/docs. Generated JSON is rebuilt below.
const textExtensions = new Set(['.ts', '.tsx', '.mjs', '.md']);
const skipDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'dist-pages', '.wrangler']);
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (textExtensions.has(path.extname(entry.name))) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [oldId, newId] of idMap) {
        if (content.includes(oldId)) {
          content = content.split(oldId).join(newId);
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(full, content);
    }
  }
}
walk(root);

// Raw test helpers must follow authored array order and the new floor-scoped event namespace.
replaceOnce(
  'tests/raw-projection-regressions.test.mjs',
  `function appendRawEvent(doc, event) {\n  const maxOrder = Math.max(...doc.events.map((entry) => entry.order));\n  doc.events.push({\n    id: \`evt-regression-\${maxOrder + 1}\`,\n    order: maxOrder + 1,`,
  `function appendRawEvent(doc, event) {\n  doc.events.push({\n    id: \`evt-f\${doc.floor.ordinal}-regression-\${doc.events.length + 1}\`,`
);

// Avoid lint warnings from intentional payload key omission without changing global lint policy in this PR.
replaceOnce(
  'app/domain/compiler.ts',
  `        const { id, order, position, ...payload } = rawEv;\n        compiledEvents.push({`,
  `        const payload = { ...rawEv } as Record<string, unknown>;\n        delete payload.id;\n        delete payload.order;\n        delete payload.position;\n        compiledEvents.push({`
);
replaceOnce(
  'app/domain/raw-compiler.ts',
  `      const { eventId: _eventId, ...payload } = observation;\n      observations.push({ ...payload, sequence } as TimelineObservation);`,
  `      const payload = { ...observation } as Record<string, unknown>;\n      delete payload.eventId;\n      observations.push({ ...payload, sequence } as TimelineObservation);`
);

// Schema validates syntax. Domain validation only enforces relationships schema cannot express.
replaceOnce(
  'app/domain/validation.ts',
  `  const rawDoc = doc as RawCrawlerFloorDocument;\n  const rawEventIds = new Set(rawDoc.events.map((event) => event.id));`,
  `  const rawDoc = doc as RawCrawlerFloorDocument;\n  const expectedEventPrefix = \`evt-f\${rawDoc.floor.ordinal}-\`;\n  for (const event of rawDoc.events) {\n    if (!event.id.startsWith(expectedEventPrefix)) {\n      errors.push(\n        \`Raw domain error: Event "\${event.id}" belongs to floor \${rawDoc.floor.ordinal} and must use prefix "\${expectedEventPrefix}".\`\n      );\n    }\n  }\n  const rawEventIds = new Set(rawDoc.events.map((event) => event.id));`
);

replaceOnce(
  'app/domain/validation.ts',
  `  // c) Event IDs uniqueness, contiguous floor-local order, source & position checks\n  const eventIds = new Set<string>();`,
  `  // c) Event IDs uniqueness, contiguous floor-local order, source & position checks\n  const expectedEventPrefix = \`evt-f\${floorDoc.floor.ordinal}-\`;\n  const eventIds = new Set<string>();`
);
replaceOnce(
  'app/domain/validation.ts',
  `      if (event.id) {\n        if (eventIds.has(event.id)) {`,
  `      if (event.id) {\n        if (!event.id.startsWith(expectedEventPrefix)) {\n          errors.push(\n            \`Domain error: Event "\${event.id}" belongs to floor \${floorDoc.floor.ordinal} and must use prefix "\${expectedEventPrefix}".\`\n          );\n        }\n        if (eventIds.has(event.id)) {`
);

// A snapshot is an acceleration cache, not an alternate history. If Party has already
// formed, a snapshot after that boundary must carry Party or replay becomes nondeterministic.
replaceOnce(
  'app/domain/validation.ts',
  `    for (const snap of timelineDoc.snapshots) {\n      if (snapshotSeqs.has(snap.sequence)) {\n        errors.push(\`Domain error: Duplicate snapshot sequence #\${snap.sequence}.\`);\n      }\n      snapshotSeqs.add(snap.sequence);\n    }`,
  `    for (const snap of timelineDoc.snapshots) {\n      if (snapshotSeqs.has(snap.sequence)) {\n        errors.push(\`Domain error: Duplicate snapshot sequence #\${snap.sequence}.\`);\n      }\n      snapshotSeqs.add(snap.sequence);\n\n      const partyFormation = timelineDoc.events.find(\n        (event) => event.type === 'PartyFormed' && event.sequence <= snap.sequence\n      );\n      if (partyFormation && !snap.state.party) {\n        errors.push(\n          \`Domain error: Snapshot sequence #\${snap.sequence} omits Party state established by event "\${partyFormation.id}". Regenerate or reject the stale snapshot.\`\n        );\n      }\n    }`
);

// Add direct regressions for namespace syntax, floor relationship, and stale snapshots.
const rawAdapterTest = 'tests/raw-floor-adapter.test.mjs';
let rawAdapter = read(rawAdapterTest);
rawAdapter += `\n\ntest("raw event and observation IDs enforce their schema namespaces", () => {\n  const badEvent = structuredClone(rawFloor1);\n  badEvent.events[0].id = "event-f1-invalid";\n  assert.equal(validateRawCrawlerFloor(badEvent).valid, false);\n\n  const badObservation = structuredClone(rawFloor1);\n  if (!badObservation.observations?.length) throw new Error("fixture needs observations");\n  badObservation.observations[0].id = "reading-f1-invalid";\n  assert.equal(validateRawCrawlerFloor(badObservation).valid, false);\n});\n\ntest("raw event IDs must match their authored floor ordinal", () => {\n  const doc = structuredClone(rawFloor1);\n  const originalId = doc.events[0].id;\n  const wrongFloorId = originalId.replace(/^evt-f1-/, "evt-f2-");\n  doc.events[0].id = wrongFloorId;\n  for (const observation of doc.observations || []) {\n    if (observation.eventId === originalId) observation.eventId = wrongFloorId;\n  }\n  const validation = validateRawCrawlerFloor(doc);\n  assert.equal(validation.valid, false);\n  assert.ok(validation.errors.some((error) => error.includes("must use prefix \\\"evt-f1-\\\"")));\n});\n`;
write(rawAdapterTest, rawAdapter);

const projectionTest = 'tests/projection.test.mjs';
let projection = read(projectionTest);
projection += `\n\ntest("timeline validation rejects a snapshot that omits an already formed Party", () => {\n  const doc = JSON.parse(fs.readFileSync("data/compiled-timeline.json", "utf8"));\n  const partyEvent = doc.events.find((event) => event.type === "PartyFormed");\n  assert.ok(partyEvent);\n  const projected = projectState(doc, partyEvent.sequence);\n  assert.ok(projected.party);\n\n  doc.snapshots = [{\n    sequence: partyEvent.sequence,\n    state: { ...doc.initialState },\n  }];\n  delete doc.snapshots[0].state.party;\n\n  const validation = validateCrawlerTimeline(doc);\n  assert.equal(validation.valid, false);\n  assert.ok(validation.errors.some((error) => error.includes("omits Party state")));\n});\n`;
write(projectionTest, projection);

replaceOnce(
  'RAW_OBSERVATIONS.md',
  `- Keep event IDs stable once published; IDs are references, not display labels.\n- Insert new events at the intended chronological position in the raw array.`,
  `- Keep event IDs stable once published; IDs are references, not display labels.\n- Author floor event IDs as \`evt-f<floor>-<semantic-event>[-<qualifier>...]\`. Do not encode array position, generated order, or compiled sequence. Numbers are appropriate only when intrinsic to the fact (for example \`episode-8\`, \`floor-3-descent\`, or \`crawlers-990303\`).\n- Author observation IDs in the \`obs-...\` namespace. Event identity describes what happened; observation identity describes what was measured about it.\n- Schema owns ID syntax. Domain/build validation checks relationships schema cannot express, such as matching the \`evt-fN-\` prefix to \`floor.ordinal\` and resolving referenced event IDs.\n- Insert new events at the intended chronological position in the raw array.`
);

// Migration-only scripts should not ship with the product branch.
for (const file of [
  'scripts/fix-countdown-anchor-tests.mjs',
  'scripts/migrate-countdown-anchor-event-id.mjs',
  'scripts/remove-raw-event-order.mjs',
]) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

// This script and its one-shot workflow are self-cleaning after a successful run.
for (const file of [
  'scripts/finalize-pr134-contract.mjs',
  '.github/workflows/finalize-pr134-contract-once.yml',
]) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}
