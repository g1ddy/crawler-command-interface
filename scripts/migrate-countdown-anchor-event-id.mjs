import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

function readText(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

function writeText(path, content) {
  writeFileSync(new URL(path, root), content);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function replaceOnce(path, from, to) {
  const content = readText(path);
  if (!content.includes(from)) {
    throw new Error(`Migration pattern not found in ${path}`);
  }
  writeText(path, content.replace(from, to));
}

for (const schemaPath of [
  'app/domain/schema/crawler-floor.schema.json',
  'app/domain/schema/crawler-floor-raw.schema.json',
]) {
  const schema = JSON.parse(readText(schemaPath));
  const reference = schema.$defs?.countdownReference;
  if (!reference) throw new Error(`countdownReference missing from ${schemaPath}`);

  reference.required = reference.required.map((field) =>
    field === 'anchorOrder' ? 'anchorEventId' : field,
  );

  const properties = {};
  for (const [key, value] of Object.entries(reference.properties)) {
    if (key === 'anchorOrder') {
      properties.anchorEventId = { $ref: '#/$defs/id' };
    } else {
      properties[key] = value;
    }
  }
  reference.properties = properties;
  writeJson(schemaPath, schema);
}

replaceOnce(
  'app/domain/types.ts',
  `export interface FloorCountdownReference {\n  anchorOrder: number;\n  remainingSeconds: number;`,
  `export interface FloorCountdownReference {\n  anchorEventId: string;\n  remainingSeconds: number;`,
);

writeText(
  'app/domain/raw-adapter.ts',
  `import type {\n  CrawlerFloorDocument,\n  FloorCountdownReference,\n  RawCrawlerFloorDocument,\n  RawObservation,\n} from './types.ts';\n\n/**\n * A raw observation whose stable event anchor has been validated. This retains\n * the source reading rather than converting evidence into a state-changing event.\n */\nexport interface AdaptedRawObservation {\n  observation: RawObservation;\n}\n\n/**\n * Validates every source-backed observation's stable event anchor. Raw event\n * array position establishes chronology, but relationships are expressed by ID.\n */\nexport function adaptRawFloorObservations(rawDoc: RawCrawlerFloorDocument): AdaptedRawObservation[] {\n  const eventIds = new Set(rawDoc.events.map((event) => event.id));\n  const countdownById = new Map((rawDoc.countdowns || []).map((countdown) => [countdown.id, countdown]));\n\n  return (rawDoc.observations || []).map((observation) => {\n    if (!eventIds.has(observation.eventId)) {\n      throw new Error(\n        \`Raw adapter error: Observation "\${observation.id}" references missing event ID "\${observation.eventId}".\`\n      );\n    }\n    if (observation.kind === 'countdown-remaining' && !countdownById.has(observation.countdownId)) {\n      throw new Error(\n        \`Raw adapter error: Observation "\${observation.id}" references missing countdown ID "\${observation.countdownId}".\`\n      );\n    }\n    return { observation };\n  });\n}\n\n/**\n * Converts raw, source-backed observations into the existing Floor v2\n * compatibility contract. Event order remains generated for compatibility,\n * while countdown relationships retain their stable event IDs.\n */\nexport function adaptRawFloorDocument(rawDoc: RawCrawlerFloorDocument): CrawlerFloorDocument {\n  const referencesByCountdown = new Map<string, FloorCountdownReference[]>();\n  const eventIndexById = new Map(rawDoc.events.map((event, index) => [event.id, index]));\n\n  for (const { observation } of adaptRawFloorObservations(rawDoc)) {\n    // Countdown readings participate in the floor compatibility projection.\n    // Every observation kind remains available to the runtime compiler.\n    if (observation.kind !== 'countdown-remaining') continue;\n\n    const references = referencesByCountdown.get(observation.countdownId) || [];\n    references.push({\n      anchorEventId: observation.eventId,\n      remainingSeconds: observation.remainingSeconds,\n      ...(observation.activationOffset !== undefined ? { activationOffset: observation.activationOffset } : {}),\n      evidence: observation.evidence,\n      note: observation.note,\n    });\n    referencesByCountdown.set(observation.countdownId, references);\n  }\n\n  return {\n    $schema: 'https://g1ddy.github.io/crawler-command-interface/schema/crawler-floor.v2.schema.json',\n    authoringVersion: 'crawler-floor/v2',\n    storyId: rawDoc.storyId,\n    floor: rawDoc.floor,\n    sources: rawDoc.sources,\n    catalog: rawDoc.catalog,\n    countdowns: (rawDoc.countdowns || []).map((countdown) => ({\n      ...countdown,\n      references: (referencesByCountdown.get(countdown.id) || []).sort(\n        (left, right) =>\n          (eventIndexById.get(left.anchorEventId) ?? Number.MAX_SAFE_INTEGER) -\n          (eventIndexById.get(right.anchorEventId) ?? Number.MAX_SAFE_INTEGER),\n      ),\n    })),\n    events: rawDoc.events.map((event, index) => ({ ...event, order: index + 1 })),\n  };\n}\n`,
);

replaceOnce(
  'app/domain/compiler.ts',
  `  const globalEventIds = new Set<string>();\n  const countdowns: TimelineCountdown[] = [];`,
  `  const globalEventIds = new Set<string>();\n  const sequenceByEventId = new Map<string, number>();\n  const countdowns: TimelineCountdown[] = [];`,
);

replaceOnce(
  'app/domain/compiler.ts',
  `      const seq = globalSequence++;\n      const pos = {`,
  `      const seq = globalSequence++;\n      sequenceByEventId.set(rawEv.id, seq);\n      const pos = {`,
);

replaceOnce(
  'app/domain/compiler.ts',
  `        references: countdown.references.map((reference) => ({\n          sequence: startSequence + reference.anchorOrder - 1,\n          remainingSeconds: reference.remainingSeconds,\n          ...(reference.activationOffset !== undefined ? { activationOffset: reference.activationOffset } : {}),\n          evidence: reference.evidence,\n          note: reference.note,\n        })),`,
  `        references: countdown.references.map((reference) => {\n          const sequence = sequenceByEventId.get(reference.anchorEventId);\n          if (sequence === undefined) {\n            throw new Error(\n              \`Compiler error: Countdown "\${countdown.id}" references missing anchor event ID "\${reference.anchorEventId}".\`\n            );\n          }\n          return {\n            sequence,\n            remainingSeconds: reference.remainingSeconds,\n            ...(reference.activationOffset !== undefined ? { activationOffset: reference.activationOffset } : {}),\n            evidence: reference.evidence,\n            note: reference.note,\n          };\n        }),`,
);

replaceOnce(
  'app/domain/validation.ts',
  `    const anchorOrders = new Set<number>();\n    for (const reference of countdown.references) {\n      if (!floorDoc.events.some((event) => event.order === reference.anchorOrder)) {\n        errors.push(\`Domain error: Countdown "\${countdown.id}" references missing anchor order #\${reference.anchorOrder}.\`);\n      }\n      if (anchorOrders.has(reference.anchorOrder)) {\n        errors.push(\`Domain error: Countdown "\${countdown.id}" has duplicate anchor order #\${reference.anchorOrder}.\`);\n      }\n      anchorOrders.add(reference.anchorOrder);\n      for (const evidence of reference.evidence) {\n        if (!sourceIds.has(evidence.sourceId)) {\n          errors.push(\`Domain error: Countdown "\${countdown.id}" evidence sourceId "\${evidence.sourceId}" does not exist in floor sources catalog.\`);\n        }\n      }\n    }\n\n    const referencesByOrder = [...countdown.references].sort((a, b) => a.anchorOrder - b.anchorOrder);\n    for (let i = 1; i < referencesByOrder.length; i++) {\n      const previous = referencesByOrder[i - 1];\n      const current = referencesByOrder[i];\n      const hasPhaseBreak = floorDoc.events.some(\n        (event) =>\n          event.order > previous.anchorOrder &&\n          event.order <= current.anchorOrder &&\n          isCountdownPhaseBreakEvent(event, countdown.id)\n      );\n      if (!hasPhaseBreak && current.remainingSeconds > previous.remainingSeconds) {\n        errors.push(\n          \`Domain error: Countdown "\${countdown.id}" increases from \${previous.remainingSeconds}s at order #\${previous.anchorOrder} to \${current.remainingSeconds}s at order #\${current.anchorOrder}. Model an explicit reset before increasing remaining time.\`\n        );\n      }\n    }`,
  `    const eventById = new Map(floorDoc.events.map((event) => [event.id, event]));\n    const anchorEventIds = new Set<string>();\n    for (const reference of countdown.references) {\n      if (!eventById.has(reference.anchorEventId)) {\n        errors.push(\`Domain error: Countdown "\${countdown.id}" references missing anchor event ID "\${reference.anchorEventId}".\`);\n      }\n      if (anchorEventIds.has(reference.anchorEventId)) {\n        errors.push(\`Domain error: Countdown "\${countdown.id}" has duplicate anchor event ID "\${reference.anchorEventId}".\`);\n      }\n      anchorEventIds.add(reference.anchorEventId);\n      for (const evidence of reference.evidence) {\n        if (!sourceIds.has(evidence.sourceId)) {\n          errors.push(\`Domain error: Countdown "\${countdown.id}" evidence sourceId "\${evidence.sourceId}" does not exist in floor sources catalog.\`);\n        }\n      }\n    }\n\n    const referencesByOrder = [...countdown.references].sort(\n      (a, b) =>\n        (eventById.get(a.anchorEventId)?.order ?? Number.MAX_SAFE_INTEGER) -\n        (eventById.get(b.anchorEventId)?.order ?? Number.MAX_SAFE_INTEGER),\n    );\n    for (let i = 1; i < referencesByOrder.length; i++) {\n      const previous = referencesByOrder[i - 1];\n      const current = referencesByOrder[i];\n      const previousOrder = eventById.get(previous.anchorEventId)?.order;\n      const currentOrder = eventById.get(current.anchorEventId)?.order;\n      if (previousOrder === undefined || currentOrder === undefined) continue;\n      const hasPhaseBreak = floorDoc.events.some(\n        (event) =>\n          event.order > previousOrder &&\n          event.order <= currentOrder &&\n          isCountdownPhaseBreakEvent(event, countdown.id)\n      );\n      if (!hasPhaseBreak && current.remainingSeconds > previous.remainingSeconds) {\n        errors.push(\n          \`Domain error: Countdown "\${countdown.id}" increases from \${previous.remainingSeconds}s at event "\${previous.anchorEventId}" to \${current.remainingSeconds}s at event "\${current.anchorEventId}". Model an explicit reset before increasing remaining time.\`\n        );\n      }\n    }`,
);

replaceOnce(
  'tests/countdowns.test.mjs',
  `references: [{ anchorOrder: 1, remainingSeconds: -500, evidence:`,
  `references: [{ anchorEventId: "e1", remainingSeconds: -500, evidence:`,
);

replaceOnce(
  'tests/raw-floor-adapter.test.mjs',
  `  assert.ok(adapted.every(({ observation, anchorOrder }) => observation.eventId === eventId && anchorOrder === 1));`,
  `  assert.ok(adapted.every(({ observation }) => observation.eventId === eventId));`,
);

replaceOnce(
  'tests/raw-floor-adapter.test.mjs',
  `    const adapted = adaptRawFloorDocument(raw);\n    assert.deepEqual(adapted.events.map((event) => event.order), raw.events.map((_, index) => index + 1));\n    assert.deepEqual(adapted, legacy);`,
  `    const adapted = adaptRawFloorDocument(raw);\n    assert.deepEqual(adapted.events.map((event) => event.order), raw.events.map((_, index) => index + 1));\n    assert.ok((adapted.countdowns || []).every((countdown) => countdown.references.every(\n      (reference) => typeof reference.anchorEventId === "string" && !("anchorOrder" in reference),\n    )));\n    assert.deepEqual(adapted, legacy);`,
);

console.log('Migrated countdown references from positional anchorOrder to stable anchorEventId.');
