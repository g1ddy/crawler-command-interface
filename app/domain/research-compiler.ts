import type { ResearchClaimDocument, ModelingDecisionDocument } from './types/research.ts';
import {
  validateResearchClaimDocument,
  validateModelingDecisionDocument,
  validateSemanticModelingDecisions,
  validateTraceCompleteness,
} from './research-validator.ts';

export interface ExistingRawFloorData {
  sources?: Array<Record<string, unknown>>;
  catalog?: {
    items?: Array<Record<string, unknown> | string>;
    achievements?: Array<Record<string, unknown> | string>;
  };
  events?: Array<Record<string, unknown>>;
}

export interface RawFloorCompilation {
  sources: Array<Record<string, unknown>>;
  catalog: {
    items: Array<Record<string, unknown> | string>;
    achievements: Array<Record<string, unknown> | string>;
  };
  events: Array<Record<string, unknown>>;
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

/**
 * Compiles a validated research claim document directly into existing CCI raw JSON shapes
 * (events, catalog, and sources) preserving YAML claim order, evidence, locators, and explicit unknowns,
 * without intermediate candidate/scaffold models or manufactured floor metadata.
 */
function generateResearchEventId(floor: number, claimId: string): string {
  // Preserve claim-ID distinctions in the temporary curation key. The key is
  // deliberately not a semantic/domain identity; Jules replaces it when the
  // occurrence is curated into an authored event.
  const normalized = claimId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `evt-f${floor}-research-${normalized}`;
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

/**
 * Compiles research into the existing CCI raw representation.
 *
 * This function deliberately performs only mechanical work:
 * - preserve existing authored data;
 * - preserve research ordering for newly emitted records;
 * - carry evidence/unknowns forward;
 * - use deterministic temporary research IDs;
 * - never choose CCI event types or payload semantics.
 *
 * Existing records are reconciled only by deterministic compiler identity or
 * an exact summary + complete evidence match. A shared locator alone is never
 * treated as record identity.
 */
export function compileRawFloor(
  researchDoc: ResearchClaimDocument,
  existingRaw?: ExistingRawFloorData
): RawFloorCompilation {
  const researchVal = validateResearchClaimDocument(researchDoc);
  if (!researchVal.valid) {
    throw new Error(
      `Compiler error: Research document schema/semantic validation failed:\n  - ${researchVal.errors.join('\n  - ')}`
    );
  }



  const events: Array<Record<string, unknown>> = existingRaw?.events
    ? JSON.parse(JSON.stringify(existingRaw.events))
    : [];

  const existingSources: Array<Record<string, unknown>> = existingRaw?.sources
    ? JSON.parse(JSON.stringify(existingRaw.sources))
    : [];

  const existingCatalogItems: Array<Record<string, unknown> | string> =
    existingRaw?.catalog?.items
      ? JSON.parse(JSON.stringify(existingRaw.catalog.items))
      : [];

  const existingCatalogAchievements: Array<Record<string, unknown> | string> =
    existingRaw?.catalog?.achievements
      ? JSON.parse(JSON.stringify(existingRaw.catalog.achievements))
      : [];

  const usedEventIds = new Set<string>(
    events.map((event) => String(event.id))
  );

  const generatedIdToClaimId = new Map<string, string>();

  for (const claim of researchDoc.claims) {
    const eventId = generateResearchEventId(researchDoc.floor, claim.id);

    if (generatedIdToClaimId.has(eventId)) {
      const existingClaimId = generatedIdToClaimId.get(eventId);
      if (existingClaimId !== claim.id) {
        throw new Error(
          `Compiler error: Normalization collision detected. Claims "${existingClaimId}" and "${claim.id}" both normalize to "${eventId}".`
        );
      }
    }
    generatedIdToClaimId.set(eventId, claim.id);

    const matchingIdIndex = events.findIndex((event) => String(event.id) === eventId);
    if (matchingIdIndex >= 0 && !hasSameResearchEvidence(events[matchingIdIndex], claim)) {
      throw new Error(
        `Compiler error: deterministic research event ID "${eventId}" collides with an unrelated authored event.`
      );
    }

    const existingIndex = matchingIdIndex >= 0
      ? matchingIdIndex
      : events.findIndex((event) => hasSameResearchEvidence(event, claim));

    if (existingIndex >= 0) {
      const existingEvent = events[existingIndex];

      // Existing CCI semantics are authoritative. Only merge research evidence
      // and explicit unknowns; never overwrite type, payload, position, or ID.
      const existingEvidence = Array.isArray(existingEvent.evidence)
        ? existingEvent.evidence
        : [];
      const mergedEvidence = new Map<string, Record<string, unknown>>();
      for (const evidence of [...existingEvidence, ...claim.evidence]) {
        mergedEvidence.set(evidenceKey(evidence), evidence);
      }
      existingEvent.evidence = Array.from(mergedEvidence.values());

      if (claim.unknowns?.length) {
        const existingUnknowns = Array.isArray(existingEvent.unknowns)
          ? existingEvent.unknowns.map(String)
          : [];
        existingEvent.unknowns = Array.from(
          new Set([...existingUnknowns, ...claim.unknowns])
        );
      }
      continue;
    }

    const newEventId = eventId;
    if (usedEventIds.has(newEventId)) {
      // This should only be reachable for an ID collision with an unrelated
      // authored record. Do not silently invent an alternate semantic ID.
      throw new Error(
        `Compiler error: deterministic research event ID "${newEventId}" is already used by an unrelated event.`
      );
    }
    usedEventIds.add(newEventId);

    events.push({
      id: newEventId,
      summary: claim.claim.summary,
      position: { floor: researchDoc.floor },
      evidence: JSON.parse(JSON.stringify(claim.evidence)),
      ...(claim.unknowns?.length
        ? { unknowns: [...claim.unknowns] }
        : {}),
    });
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
        throw new Error(`Compiler error: Promoted claim "${claim.id}" lacks target domain or concept.`);
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
      evidence: JSON.parse(JSON.stringify(claim.evidence)),
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
