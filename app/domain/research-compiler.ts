import { validateResearchClaimDocument, validateModelingDecisionDocument, validateSemanticModelingDecisions, validateTraceCompleteness } from './research-validator.ts';
import type { ResearchClaimDocument, ModelingDecisionDocument, ModelingDecision } from './types/research.ts';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import crawlerFloorRawSchema from './schema/crawler-floor-raw.schema.json' with { type: 'json' };

export interface ExistingRawFloorData {
  sources?: Array<Record<string, unknown>>;
  catalog?: {
    items?: Array<Record<string, unknown> | string>;
    achievements?: Array<Record<string, unknown> | string>;
  };
  events?: Array<Record<string, unknown>>;
  observations?: Array<Record<string, unknown>>;
}

export interface RawFloorCompilation {
  sources: Array<Record<string, unknown>>;
  catalog: {
    items: Array<Record<string, unknown> | string>;
    achievements: Array<Record<string, unknown> | string>;
  };
  events: Array<Record<string, unknown>>;
  observations: Array<Record<string, unknown>>;
  report?: Record<string, unknown>;
}

export interface ResearchClaimTraceMapping {
  claimId: string;
  domain: string;
  kind: string;
  summary: string;
  modeling: {
    disposition: string;
    target?: {
      domain: string;
      concept: string;
    };
    rationale: string;
  };
  originatingClaimIds: string[];
  evidence: Array<{
    sourceId: string;
    locator?: Record<string, unknown>;
    confidence: string;
    note?: string;
  }>;
  unknowns?: string[];
}

export interface CompiledResearchOutput {
  storyId: string;
  floor: number;
  promotedClaimCount: number;
  reviewClaimCount: number;
  ledgerOnlyClaimCount: number;
  claimMappings: ResearchClaimTraceMapping[];
}

function generateResearchEventId(floor: number, claimId: string): string {
  const normalized = claimId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `evt-f${floor}-research-${normalized}`;
}

function generateResearchObservationId(floor: number, claimId: string): string {
  const normalized = claimId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `obs-f${floor}-research-${normalized}`;
}

function evidenceKey(evidence: unknown): string {
  return JSON.stringify(evidence ?? []);
}

function hasSameResearchEvidence(
  event: Record<string, unknown>,
  claim: ResearchClaimDocument['claims'][number]
): boolean {
  return (
    event.summary === claim.claim.summary &&
    evidenceKey(event.evidence) === evidenceKey(claim.evidence)
  );
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

let rawObservationValidator: import('ajv').ValidateFunction;
function getRawObservationValidator(): import('ajv').ValidateFunction {
  if (!rawObservationValidator) {
    const ajv = new Ajv2020({ allErrors: true, verbose: true });
    addFormats(ajv);
    ajv.addSchema(crawlerFloorRawSchema);
    rawObservationValidator = ajv.compile({
      ...(crawlerFloorRawSchema as any).$defs.rawObservation, // eslint-disable-line @typescript-eslint/no-explicit-any
      $defs: (crawlerFloorRawSchema as any).$defs // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  }
  return rawObservationValidator;
}

export function compileRawFloor(
  researchDoc: ResearchClaimDocument,
  existingRaw?: ExistingRawFloorData,
  modelingDoc?: ModelingDecisionDocument
): RawFloorCompilation {
  const researchVal = validateResearchClaimDocument(researchDoc);
  if (!researchVal.valid) {
    throw new Error(
      `Compiler error: Research document schema/semantic validation failed:\n  - ${researchVal.errors.join('\n  - ')}`
    );
  }

  const decisionMap = new Map<string, ModelingDecision>();
  if (modelingDoc) {
    const modelingVal = validateModelingDecisionDocument(modelingDoc);
    if (!modelingVal.valid) {
      throw new Error(`Compiler error: Modeling decision document schema validation failed:\n  - ${modelingVal.errors.join('\n  - ')}`);
    }

    const semanticVal = validateSemanticModelingDecisions(researchDoc, modelingDoc);
    if (!semanticVal.valid) {
      throw new Error(`Compiler error: Semantic modeling decision validation failed:\n  - ${semanticVal.errors.join('\n  - ')}`);
    }

    for (const decision of modelingDoc.decisions) {
      decisionMap.set(decision.claimId, decision);
    }
  }

  const events: Array<Record<string, unknown>> = existingRaw?.events ? deepClone(existingRaw.events) : [];
  const observations: Array<Record<string, unknown>> = existingRaw?.observations ? deepClone(existingRaw.observations) : [];
  const existingSources: Array<Record<string, unknown>> = existingRaw?.sources ? deepClone(existingRaw.sources) : [];
  const existingCatalogItems: Array<Record<string, unknown> | string> = existingRaw?.catalog?.items ? deepClone(existingRaw.catalog.items) : [];
  const existingCatalogAchievements: Array<Record<string, unknown> | string> = existingRaw?.catalog?.achievements ? deepClone(existingRaw.catalog.achievements) : [];

  const usedEventIds = new Set<string>(events.map((e) => String(e.id)));
  const generatedIdToClaimId = new Map<string, string>();

  const usedObservationIds = new Set<string>(observations.map((o) => String(o.id)));
  const generatedObsIdToClaimId = new Map<string, string>();

  // For report
  const report = {
    schemaVersion: "crawler-import-report/v1",
    summary: {
      inputClaims: { total: 0, event: 0, observation: 0, state: 0 },
      unknowns: { total: 0, event: 0, observation: 0, state: 0, unresolved: 0 },
      generatedStubs: { events: 0, observations: 0 },
      reusedRecords: { events: 0, observations: 0 },
      manualMappings: { events: 0, observations: 0 },
      dispositions: { promote: 0, review: 0, ledger_only: 0, missing: 0 },
      outcomes: { compiled: 0, reused: 0, unresolved: 0, rejected: 0, not_applicable: 0 },
      diagnostics: { total: 0 }
    },
    unknowns: [] as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
    eventStubs: [] as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
    observationStubs: [] as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
    manualMappings: {
      events: [] as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
      observations: [] as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    dispositions: {
      promote: [] as string[],
      review: [] as string[],
      ledger_only: [] as string[],
      missing: [] as string[]
    },
    outcomes: {
      compiled: [] as string[],
      reused: [] as string[],
      unresolved: [] as string[],
      rejected: [] as string[],
      not_applicable: [] as string[]
    },
    diagnostics: [] as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
    claims: [] as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const addDiagnostic = (code: string, message: string, claimId: string, recordId?: string) => {
    report.diagnostics.push({ code, message, claimId, recordId });
    report.summary.diagnostics.total++;
  };

  const claimMap = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  const outputEventIdForClaim = new Map<string, string>();

  for (const claim of researchDoc.claims) {
    claimMap.set(claim.id, claim);
    report.summary.inputClaims.total++;
    (report.summary.inputClaims as any)[claim.kind]++; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (claim.unknowns) {
      for (const uk of claim.unknowns) {
        report.summary.unknowns.total++;
        (report.summary.unknowns as any)[claim.kind]++; // eslint-disable-line @typescript-eslint/no-explicit-any
        report.unknowns.push({ claimId: claim.id, text: uk, status: 'unresolved' });
        report.summary.unknowns.unresolved++;
      }
    }
  }

  for (const claim of researchDoc.claims) {
    const decision = decisionMap.get(claim.id);
    let disposition = 'missing';
    if (decision) {
      disposition = decision.disposition;
      (report.summary.dispositions as any)[disposition]++; // eslint-disable-line @typescript-eslint/no-explicit-any
      (report.dispositions as any)[disposition].push(claim.id); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      report.summary.dispositions.missing++;
      report.dispositions.missing.push(claim.id);
    }

    if (claim.kind === 'state') {
      report.summary.outcomes.not_applicable++;
      report.outcomes.not_applicable.push(claim.id);
      report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'not_applicable' });
      continue;
    }

    if (claim.kind === 'event') {
      const eventId = generateResearchEventId(researchDoc.floor, claim.id);

      if (generatedIdToClaimId.has(eventId)) {
        const existingClaimId = generatedIdToClaimId.get(eventId);
        if (existingClaimId !== claim.id) {
          throw new Error(`Compiler error: Normalization collision detected. Claims "${existingClaimId}" and "${claim.id}" both normalize to "${eventId}".`);
        }
      }
      generatedIdToClaimId.set(eventId, claim.id);

      const matchingIdIndex = events.findIndex((event) => String(event.id) === eventId);
      if (matchingIdIndex >= 0 && !hasSameResearchEvidence(events[matchingIdIndex], claim)) {
        throw new Error(`Compiler error: deterministic research event ID "${eventId}" collides with an unrelated authored event.`);
      }

      const existingIndex = matchingIdIndex >= 0
        ? matchingIdIndex
        : events.findIndex((event) => hasSameResearchEvidence(event, claim));

      if (existingIndex >= 0) {
        const existingEvent = events[existingIndex];
        const existingEvidence = Array.isArray(existingEvent.evidence) ? existingEvent.evidence : [];
        const mergedEvidence = new Map<string, Record<string, unknown>>();
        for (const evidence of [...existingEvidence, ...claim.evidence]) {
          mergedEvidence.set(evidenceKey(evidence), evidence);
        }
        existingEvent.evidence = Array.from(mergedEvidence.values());

        if (claim.unknowns?.length) {
          const existingUnknowns = Array.isArray(existingEvent.unknowns) ? existingEvent.unknowns.map(String) : [];
          existingEvent.unknowns = Array.from(new Set([...existingUnknowns, ...claim.unknowns]));
        }

        outputEventIdForClaim.set(claim.id, String(existingEvent.id));
        report.summary.reusedRecords.events++;
        report.summary.outcomes.reused++;
        report.outcomes.reused.push(claim.id);

        if (existingEvent.type) {
           report.summary.manualMappings.events++;
           report.manualMappings.events.push({ claimId: claim.id, recordId: existingEvent.id, mappedType: existingEvent.type });
        }
        report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'reused', recordId: existingEvent.id });
        continue;
      }

      if (usedEventIds.has(eventId)) {
        throw new Error(`Compiler error: deterministic research event ID "${eventId}" is already used by an unrelated event.`);
      }
      usedEventIds.add(eventId);

      events.push({
        id: eventId,
        summary: claim.claim.summary,
        position: { floor: researchDoc.floor },
        evidence: deepClone(claim.evidence) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        ...(claim.unknowns?.length ? { unknowns: [...claim.unknowns] } : {}),
      });

      outputEventIdForClaim.set(claim.id, eventId);
      report.summary.generatedStubs.events++;
      report.eventStubs.push({ claimId: claim.id, recordId: eventId, typePopulated: false });
      report.summary.outcomes.compiled++;
      report.outcomes.compiled.push(claim.id);

      if (decision && decision.target) {
         report.summary.outcomes.unresolved++;
         report.outcomes.unresolved.push(claim.id);
         addDiagnostic('EVENT_MAPPING_UNRESOLVED', `Event mapping unresolved for claim ${claim.id}. Compiler generated a stub instead of a curated type.`, claim.id, eventId);
      }

      report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'compiled', recordId: eventId });
    }
  }

  // 2. Process Observation claims
  for (const claim of researchDoc.claims) {
    if (claim.kind !== 'observation') continue;

    const decision = decisionMap.get(claim.id);
    let disposition = 'missing';
    if (decision) disposition = decision.disposition;

    if (disposition === 'review' || disposition === 'ledger_only') {
      report.summary.outcomes.not_applicable++;
      report.outcomes.not_applicable.push(claim.id);
      report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'not_applicable' });
      continue;
    }

    if (disposition !== 'promote') {
      report.summary.outcomes.rejected++;
      report.outcomes.rejected.push(claim.id);
      addDiagnostic('OBSERVATION_NOT_PROMOTED', `Observation claim ${claim.id} is missing a promote disposition.`, claim.id);
      report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'rejected' });
      continue;
    }

    if (!decision || !decision.observationMapping) {
      report.summary.outcomes.rejected++;
      report.outcomes.rejected.push(claim.id);
      addDiagnostic('OBSERVATION_MISSING_MAPPING', `Promoted observation claim ${claim.id} missing observationMapping.`, claim.id);
      report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'rejected' });
      continue;
    }

    const mapping = decision.observationMapping;
    let anchorEventId: string | undefined;

    if (mapping.anchor.kind === 'event-id') {
      if (!usedEventIds.has(mapping.anchor.eventId)) {
        report.summary.outcomes.rejected++;
        report.outcomes.rejected.push(claim.id);
        addDiagnostic('INVALID_ANCHOR', `Anchor event ID "${mapping.anchor.eventId}" does not exist.`, claim.id);
        report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'rejected' });
        continue;
      }
      anchorEventId = mapping.anchor.eventId;
    } else if (mapping.anchor.kind === 'claim-id') {
      const anchorClaim = claimMap.get(mapping.anchor.claimId);
      if (!anchorClaim) {
        report.summary.outcomes.rejected++;
        report.outcomes.rejected.push(claim.id);
        addDiagnostic('INVALID_ANCHOR', `Anchor claim ID "${mapping.anchor.claimId}" does not exist.`, claim.id);
        report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'rejected' });
        continue;
      }
      if (anchorClaim.kind !== 'event') {
        report.summary.outcomes.rejected++;
        report.outcomes.rejected.push(claim.id);
        addDiagnostic('INVALID_ANCHOR', `Anchor claim ID "${mapping.anchor.claimId}" is not an event claim.`, claim.id);
        report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'rejected' });
        continue;
      }
      anchorEventId = outputEventIdForClaim.get(mapping.anchor.claimId);
      if (!anchorEventId) {
        report.summary.outcomes.rejected++;
        report.outcomes.rejected.push(claim.id);
        addDiagnostic('INVALID_ANCHOR', `Anchor claim ID "${mapping.anchor.claimId}" did not produce an event.`, claim.id);
        report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'rejected' });
        continue;
      }
    }

    if (!anchorEventId) {
      report.summary.outcomes.rejected++;
      report.outcomes.rejected.push(claim.id);
      addDiagnostic('INVALID_ANCHOR', `Could not resolve anchor for claim ${claim.id}.`, claim.id);
      report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'rejected' });
      continue;
    }

    const obsId = generateResearchObservationId(researchDoc.floor, claim.id);

    if (generatedObsIdToClaimId.has(obsId)) {
        const existingClaimId = generatedObsIdToClaimId.get(obsId);
        if (existingClaimId !== claim.id) {
          throw new Error(`Compiler error: Normalization collision detected. Claims "${existingClaimId}" and "${claim.id}" both normalize to "${obsId}".`);
        }
    }
    generatedObsIdToClaimId.set(obsId, claim.id);

    const matchingIdIndex = observations.findIndex((o) => String(o.id) === obsId);

    let existingObs = null;
    if (matchingIdIndex >= 0) {
      existingObs = observations[matchingIdIndex];
      if (existingObs.kind !== mapping.kind || existingObs.eventId !== anchorEventId) {
         throw new Error(`Compiler error: generated observation ID "${obsId}" collides with curated data or conflicting payload.`);
      }

      const existingEvidence = Array.isArray(existingObs.evidence) ? existingObs.evidence : [];
      const mergedEvidence = new Map<string, Record<string, unknown>>();
      for (const evidence of [...existingEvidence, ...claim.evidence]) {
        mergedEvidence.set(evidenceKey(evidence), evidence);
      }
      existingObs.evidence = Array.from(mergedEvidence.values());

      if (claim.unknowns?.length) {
        const existingUnknowns = Array.isArray(existingObs.unknowns) ? existingObs.unknowns.map(String) : [];
        existingObs.unknowns = Array.from(new Set([...existingUnknowns, ...claim.unknowns]));
      }

      report.summary.reusedRecords.observations++;
      report.summary.outcomes.reused++;
      report.outcomes.reused.push(claim.id);
      report.summary.manualMappings.observations++;
      report.manualMappings.observations.push({ claimId: claim.id, recordId: obsId, mappedKind: mapping.kind, outcome: 'success' });
      report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'reused', recordId: obsId });
      continue;
    }

    if (usedObservationIds.has(obsId)) {
        throw new Error(`Compiler error: generated observation ID "${obsId}" collides with curated data.`);
    }

    const newObs = {
      id: obsId,
      kind: mapping.kind,
      eventId: anchorEventId,
      ...deepClone(mapping.payload),
      evidence: deepClone(claim.evidence),
      ...(claim.unknowns?.length ? { unknowns: [...claim.unknowns] } : {})
    };

    const validator = getRawObservationValidator();
    if (!validator(newObs)) {
        report.summary.outcomes.rejected++;
        report.outcomes.rejected.push(claim.id);
        const errStr = validator.errors?.map((e: any) => e.message).join(", ") || "Unknown error"; // eslint-disable-line @typescript-eslint/no-explicit-any
        addDiagnostic('INVALID_PAYLOAD', `Payload for ${obsId} failed schema validation: ${errStr}`, claim.id);
        report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'rejected' });
        report.manualMappings.observations.push({ claimId: claim.id, recordId: obsId, mappedKind: mapping.kind, outcome: 'unresolved' });
        continue;
    }

    usedObservationIds.add(obsId);
    observations.push(newObs);

    report.summary.generatedStubs.observations++;
    report.observationStubs.push({ claimId: claim.id, recordId: obsId, kind: mapping.kind, eventId: anchorEventId, outcome: 'compiled' });
    report.summary.manualMappings.observations++;
    report.manualMappings.observations.push({ claimId: claim.id, recordId: obsId, mappedKind: mapping.kind, outcome: 'success' });

    report.summary.outcomes.compiled++;
    report.outcomes.compiled.push(claim.id);
    report.claims.push({ claimId: claim.id, kind: claim.kind, disposition, outcome: 'compiled', recordId: obsId });
  }

  const sourceMap = new Map<string, Record<string, unknown>>();
  for (const source of existingSources) {
    sourceMap.set(String(source.id), source);
  }
  for (const source of researchDoc.sources) {
    if (!sourceMap.has(source.id)) {
      sourceMap.set(source.id, {
        id: source.id,
        kind: source.kind,
        trust: source.trust,
        title: source.title,
        url: source.url,
        ...(source.citationStyle ? { citationStyle: source.citationStyle } : {}),
        ...(source.accessedAt ? { accessedAt: source.accessedAt } : {}),
        ...(source.revision ? { revision: source.revision } : {}),
      });
    }
  }

  return {
    sources: Array.from(sourceMap.values()),
    catalog: {
      items: existingCatalogItems,
      achievements: existingCatalogAchievements,
    },
    events,
    observations,
    report
  };
}

export function compileResearchTrace(
  researchDoc: ResearchClaimDocument,
  modelingDoc: ModelingDecisionDocument
): CompiledResearchOutput {
  const claimMappings: ResearchClaimTraceMapping[] = [];

  let promotedClaimCount = 0;
  let reviewClaimCount = 0;
  let ledgerOnlyClaimCount = 0;

  const decisionMap = new Map<string, typeof modelingDoc.decisions[0]>();
  for (const decision of modelingDoc.decisions) {
    decisionMap.set(decision.claimId, decision);
  }

  const researchVal = validateResearchClaimDocument(researchDoc);
  if (!researchVal.valid) {
    throw new Error(`Compiler error: Research document schema/semantic validation failed:\n  - ${researchVal.errors.join('\n  - ')}`);
  }

  const modelingVal = validateModelingDecisionDocument(modelingDoc);
  if (!modelingVal.valid) {
    throw new Error(`Compiler error: Modeling decision document schema validation failed:\n  - ${modelingVal.errors.join('\n  - ')}`);
  }

  const semanticVal = validateSemanticModelingDecisions(researchDoc, modelingDoc);
  if (!semanticVal.valid) {
    throw new Error(`Compiler error: Semantic modeling decision validation failed:\n  - ${semanticVal.errors.join('\n  - ')}`);
  }

  const completenessVal = validateTraceCompleteness(researchDoc, modelingDoc);
  if (!completenessVal.valid) {
    throw new Error(`Compiler error: Trace completeness validation failed:\n  - ${completenessVal.errors.join('\n  - ')}`);
  }

  for (const claim of researchDoc.claims) {
    const modelingDecision = decisionMap.get(claim.id);
    if (!modelingDecision) {
      throw new Error(`Compiler error: Research claim "${claim.id}" has no corresponding modeling decision.`);
    }

    const decision = modelingDecision.disposition;

    if (decision === 'promote') {
      if (!modelingDecision.target?.domain || !modelingDecision.target?.concept) {
        if (!modelingDecision.observationMapping) {
           throw new Error(`Compiler error: Promoted claim "${claim.id}" lacks target domain or concept.`);
        }
      }
      promotedClaimCount++;
    } else if (decision === 'review') {
      reviewClaimCount++;
    } else if (decision === 'ledger_only') {
      ledgerOnlyClaimCount++;
    }

    claimMappings.push({
      claimId: claim.id,
      domain: claim.domain,
      kind: claim.kind,
      summary: claim.claim.summary,
      modeling: {
        disposition: modelingDecision.disposition,
        target: modelingDecision.target,
        rationale: modelingDecision.rationale
      },
      originatingClaimIds: [claim.id],
      evidence: deepClone(claim.evidence) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      unknowns: claim.unknowns ? [...claim.unknowns] : undefined,
    });
  }

  return {
    storyId: researchDoc.storyId,
    floor: researchDoc.floor,
    promotedClaimCount,
    reviewClaimCount,
    ledgerOnlyClaimCount,
    claimMappings,
  };
}
