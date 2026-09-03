import fs from 'node:fs';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  fs.writeFileSync(file, content);
}

function replaceOnce(file, from, to) {
  const content = read(file);
  if (!content.includes(from)) throw new Error(`Pattern not found in ${file}`);
  write(file, content.replace(from, to));
}

// Observation variants inherit from observationBase but repeat id/eventId in their
// closed-object property lists. Wire both layers to the dedicated namespace defs.
const rawSchemaPath = 'app/domain/schema/crawler-floor-raw.schema.json';
const rawSchema = JSON.parse(read(rawSchemaPath));
const observationDefs = [
  'observationBase',
  'countdownObservation',
  'conditionObservation',
  'attributesObservation',
  'xpObservation',
  'broadcastObservation',
  'floorMetricsObservation',
  'inventoryObservation',
  'equipmentObservation',
];
for (const name of observationDefs) {
  const def = rawSchema.$defs[name];
  const propertySets = [];
  if (def?.properties) propertySets.push(def.properties);
  for (const part of def?.allOf ?? []) {
    if (part?.properties) propertySets.push(part.properties);
  }
  for (const properties of propertySets) {
    if (properties.id) properties.id = { $ref: '#/$defs/observationId' };
    if (properties.eventId) properties.eventId = { $ref: '#/$defs/eventId' };
  }
}
write(rawSchemaPath, `${JSON.stringify(rawSchema, null, 2)}\n`);

// Generated-floor schema fixtures now use the same floor-scoped semantic IDs as
// authored/generated production floor data.
replaceOnce(
  'tests/countdowns.test.mjs',
  `{ id: "e1", order: 1, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Initial observation", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },\n      { id: "e2", order: 2, type: "CountdownReset", countdownId: "cd-reset", position: { floor: 1 }, summary: "System countdown reset for phase 2", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },\n      { id: "e3", order: 3, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Phase 2 observation", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },`,
  `{ id: "evt-f1-reset-initial", order: 1, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Initial observation", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },\n      { id: "evt-f1-reset-boundary", order: 2, type: "CountdownReset", countdownId: "cd-reset", position: { floor: 1 }, summary: "System countdown reset for phase 2", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },\n      { id: "evt-f1-reset-phase-2", order: 3, type: "NarrativeEvent", kind: "other", position: { floor: 1 }, summary: "Phase 2 observation", evidence: [{ sourceId: "src-1", confidence: "confirmed" }] },`
);
let countdownTest = read('tests/countdowns.test.mjs');
countdownTest = countdownTest
  .replaceAll('anchorEventId: "e1"', 'anchorEventId: "evt-f1-reset-initial"')
  .replaceAll('anchorEventId: "e2"', 'anchorEventId: "evt-f1-reset-boundary"')
  .replaceAll('anchorEventId: "e3"', 'anchorEventId: "evt-f1-reset-phase-2"')
  .replaceAll('increases from 100s at event "e1" to 500000s at event "e2"', 'increases from 100s at event "evt-f1-reset-initial" to 500000s at event "evt-f1-reset-boundary"')
  .replaceAll('increases from 500000s at event "e2" to 600000s at event "e3"', 'increases from 500000s at event "evt-f1-reset-boundary" to 600000s at event "evt-f1-reset-phase-2"');
write('tests/countdowns.test.mjs', countdownTest);

// Keep the conflict test valid for every invariant except the catalog conflict it
// is intentionally exercising. Moving the cloned fixture to Floor 2 requires its
// floor-scoped IDs and references to move with it.
replaceOnce(
  'tests/projection.test.mjs',
  `  docB.floor.id = "floor-2";\n  docB.floor.ordinal = 2;\n  docB.events.forEach((e) => {\n    e.position.floor = 2;\n  });`,
  `  docB.floor.id = "floor-2";\n  docB.floor.ordinal = 2;\n  const remapFloorScopedIds = (value) => {\n    if (typeof value === "string") {\n      return value.replace(/^evt-f1-/, "evt-f2-").replace(/^countdown-floor-1-/, "countdown-floor-2-");\n    }\n    if (Array.isArray(value)) return value.map(remapFloorScopedIds);\n    if (value && typeof value === "object") {\n      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, remapFloorScopedIds(child)]));\n    }\n    return value;\n  };\n  Object.assign(docB, remapFloorScopedIds(docB));\n  docB.events.forEach((e) => {\n    e.position.floor = 2;\n  });`
);

// Remove this patch script from the final branch after successful execution.
fs.unlinkSync('scripts/finalize-pr134-contract-fixes.mjs');
