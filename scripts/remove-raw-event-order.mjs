import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);

function readText(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

function writeText(path, content) {
  writeFileSync(new URL(path, root), content);
}

function replaceOnce(path, from, to) {
  const content = readText(path);
  if (content.includes(to)) return;
  if (!content.includes(from)) {
    throw new Error(`Migration pattern not found in ${path}`);
  }
  writeText(path, content.replace(from, to));
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

// Raw chronology is represented by array position. Strip the duplicated authored
// number from every raw event while leaving generated compatibility order and
// runtime sequence to the adapter/compiler.
const rawFloorDir = new URL('../data/raw/floors/', import.meta.url);
for (const filename of readdirSync(rawFloorDir).filter((name) => /^floor-\d+\.json$/.test(name))) {
  const path = new URL(filename, rawFloorDir);
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  for (const event of doc.events ?? []) delete event.order;
  writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
}

// Remove only event-level `order` from the raw schema. `anchorOrder` and other
// generated compatibility fields remain unchanged.
const rawSchemaPath = 'app/domain/schema/crawler-floor-raw.schema.json';
const rawSchema = JSON.parse(readText(rawSchemaPath));
function removeOrderContract(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) removeOrderContract(item);
    return;
  }
  if (Array.isArray(node.required)) {
    node.required = node.required.filter((field) => field !== 'order');
  }
  if (node.properties && Object.prototype.hasOwnProperty.call(node.properties, 'order')) {
    delete node.properties.order;
  }
  for (const value of Object.values(node)) removeOrderContract(value);
}
removeOrderContract(rawSchema.$defs?.eventBase);
removeOrderContract(rawSchema.$defs?.event);
writeJson(rawSchemaPath, rawSchema);

replaceOnce(
  'app/domain/types.ts',
  `export interface RawCrawlerFloorDocument extends Omit<CrawlerFloorDocument, 'authoringVersion' | 'countdowns'> {\n  authoringVersion: 'crawler-floor-raw/v1';\n  countdowns?: RawFloorCountdown[];\n  observations?: RawObservation[];\n}`,
  `export type RawFloorEvent = Omit<FloorEventBase, 'order'>;\n\nexport interface RawCrawlerFloorDocument extends Omit<CrawlerFloorDocument, 'authoringVersion' | 'countdowns' | 'events'> {\n  authoringVersion: 'crawler-floor-raw/v1';\n  countdowns?: RawFloorCountdown[];\n  events: RawFloorEvent[];\n  observations?: RawObservation[];\n}`,
);

replaceOnce(
  'app/domain/raw-adapter.ts',
  `  const eventById = new Map(rawDoc.events.map((event) => [event.id, event]));\n  const countdownById = new Map((rawDoc.countdowns || []).map((countdown) => [countdown.id, countdown]));\n\n  return (rawDoc.observations || []).map((observation) => {\n    const event = eventById.get(observation.eventId);\n    if (!event) {\n      throw new Error(\n        \`Raw adapter error: Observation "\${observation.id}" references missing event ID "\${observation.eventId}".\`\n      );\n    }\n    if (observation.kind === 'countdown-remaining' && !countdownById.has(observation.countdownId)) {\n      throw new Error(\n        \`Raw adapter error: Observation "\${observation.id}" references missing countdown ID "\${observation.countdownId}".\`\n      );\n    }\n    return { observation, anchorOrder: event.order };\n  });`,
  `  const orderByEventId = new Map(rawDoc.events.map((event, index) => [event.id, index + 1]));\n  const countdownById = new Map((rawDoc.countdowns || []).map((countdown) => [countdown.id, countdown]));\n\n  return (rawDoc.observations || []).map((observation) => {\n    const anchorOrder = orderByEventId.get(observation.eventId);\n    if (anchorOrder === undefined) {\n      throw new Error(\n        \`Raw adapter error: Observation "\${observation.id}" references missing event ID "\${observation.eventId}".\`\n      );\n    }\n    if (observation.kind === 'countdown-remaining' && !countdownById.has(observation.countdownId)) {\n      throw new Error(\n        \`Raw adapter error: Observation "\${observation.id}" references missing countdown ID "\${observation.countdownId}".\`\n      );\n    }\n    return { observation, anchorOrder };\n  });`,
);

replaceOnce(
  'app/domain/raw-adapter.ts',
  `    events: rawDoc.events,`,
  `    events: rawDoc.events.map((event, index) => ({ ...event, order: index + 1 })),`,
);

replaceOnce(
  'RAW_OBSERVATIONS.md',
  `## Position and ordering\n\n\`order\` establishes event ordering within a raw floor file. \`position\` establishes where the observation belongs in the story.\n\n- Keep event IDs stable once published; IDs are references, not display labels.\n- Give new observations unique, monotonically sensible \`order\` values.\n- Use the correct floor/book position and add more precise position data only when supported.\n- Place lifecycle events between the observations they are intended to separate. Validation reasons about ordering, especially for countdown phases.\n- Do not reorder existing observations casually. A reorder can change projected point-in-time state even when no payload changes.`,
  `## Position and ordering\n\nThe order of entries in the raw \`events\` array is the authoritative floor-local chronology. Raw events do not carry a duplicated numeric \`order\` field. The adapter derives floor-local \`order\` for compatibility output, and the compiler derives globally increasing \`sequence\` values for the runtime timeline. \`position\` separately records where the event belongs in the story.\n\n- Keep event IDs stable once published; IDs are references, not display labels.\n- Insert new events at the intended chronological position in the raw array.\n- Use the correct floor/book position and add more precise position data only when supported.\n- Place lifecycle events between the observations they are intended to separate. Validation reasons about ordering, especially for countdown phases.\n- Treat generated \`order\` and \`sequence\` as sanity checks on compilation, not facts authors maintain by hand.\n- Do not reorder existing observations casually. A reorder can change projected point-in-time state even when no payload changes.`,
);

replaceOnce(
  'tests/raw-floor-adapter.test.mjs',
  `test("raw Floor 1 and Floor 2 documents validate and adapt losslessly to the legacy floor contract", () => {\n  for (const [raw, legacy] of [[rawFloor1, legacyFloor1], [rawFloor2, legacyFloor2]]) {\n    const validation = validateRawCrawlerFloor(raw);\n    assert.equal(validation.valid, true, validation.errors.join("; "));\n    assert.deepEqual(adaptRawFloorDocument(raw), legacy);\n  }\n});`,
  `test("raw Floor 1 and Floor 2 documents validate and adapt losslessly to the legacy floor contract", () => {\n  for (const [raw, legacy] of [[rawFloor1, legacyFloor1], [rawFloor2, legacyFloor2]]) {\n    const validation = validateRawCrawlerFloor(raw);\n    assert.equal(validation.valid, true, validation.errors.join("; "));\n    assert.ok(raw.events.every((event) => !("order" in event)));\n\n    const adapted = adaptRawFloorDocument(raw);\n    assert.deepEqual(adapted.events.map((event) => event.order), raw.events.map((_, index) => index + 1));\n    assert.deepEqual(adapted, legacy);\n  }\n});\n\ntest("raw array order deterministically becomes compiled global sequence", () => {\n  const compiled = compileRawFloorFiles([rawFloor1, rawFloor2]);\n\n  for (const raw of [rawFloor1, rawFloor2]) {\n    const floor = compiled.floors.find((candidate) => candidate.ordinal === raw.floor.ordinal);\n    assert.ok(floor);\n    raw.events.forEach((event, index) => {\n      const compiledEvent = compiled.events.find((candidate) => candidate.id === event.id);\n      assert.ok(compiledEvent);\n      assert.equal(compiledEvent.sequence, floor.startSequence + index);\n    });\n  }\n});\n\ntest("raw authoring rejects duplicated numeric order", () => {\n  const raw = JSON.parse(JSON.stringify(rawFloor1));\n  raw.events[0].order = 1;\n  const validation = validateRawCrawlerFloor(raw);\n  assert.equal(validation.valid, false);\n  assert.ok(validation.errors.some((error) => error.includes("additional properties")));\n});`,
);

console.log('Removed authored raw event order; generated order/sequence remain compiler-derived.');
