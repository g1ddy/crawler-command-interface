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
function generateStableDomainEventId(
  floor: number,
  claimId: string,
  targetConcept?: string
): string {
  if (targetConcept) {
    const slug = targetConcept
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    return `evt-f${floor}-${slug}-${claimId.toLowerCase()}`;
  }
  return `evt-f${floor}-${claimId.toLowerCase()}`;
}

/**
 * Compiles a validated research claim document directly into existing CCI raw JSON shapes
 * (events, catalog, and sources) preserving YAML claim order, evidence, locators, and explicit unknowns,
 * reconciling existing records in place without intermediate candidate/scaffold models.
 */
export function compileRawFloor(
  researchDoc: ResearchClaimDocument,
  modelingDoc?: ModelingDecisionDocument,
  existingRaw?: ExistingRawFloorData
): RawFloorCompilation {
  const researchVal = validateResearchClaimDocument(researchDoc);
  if (!researchVal.valid) {
    throw new Error(
      `Compiler error: Research document schema/semantic validation failed:\n  - ${researchVal.errors.join('\n  - ')}`
    );
  }

  if (modelingDoc) {
    const modelingVal = validateModelingDecisionDocument(modelingDoc);
    if (!modelingVal.valid) {
      throw new Error(
        `Compiler error: Modeling decision document validation failed:\n  - ${modelingVal.errors.join('\n  - ')}`
      );
    }
  }

  const decisionMap = new Map<string, string>();
  if (modelingDoc) {
    for (const d of modelingDoc.decisions) {
      decisionMap.set(d.claimId, d.disposition);
    }
  }

  // Copy existing events or initialize empty array
  const events: Array<Record<string, unknown>> = existingRaw?.events
    ? JSON.parse(JSON.stringify(existingRaw.events))
    : [];

  const existingSources: Array<Record<string, unknown>> = existingRaw?.sources
    ? JSON.parse(JSON.stringify(existingRaw.sources))
    : [];

  const existingCatalogItems: Array<Record<string, unknown> | string> = existingRaw?.catalog?.items
    ? JSON.parse(JSON.stringify(existingRaw.catalog.items))
    : [];

  const existingCatalogAchievements: Array<Record<string, unknown> | string> = existingRaw?.catalog?.achievements
    ? JSON.parse(JSON.stringify(existingRaw.catalog.achievements))
    : [];

  const usedEventIds = new Set<string>(events.map((e) => String(e.id)));

  // Preserve research YAML claim order strictly for newly created events
  for (const claim of researchDoc.claims) {
    // If modeling decisions are supplied, claims without an established raw destination ('ledger_only' or 'review') remain research-only
    if (modelingDoc && decisionMap.get(claim.id) !== 'promote') {
      continue;
    }

    const targetConcept = modelingDoc
      ? modelingDoc.decisions.find((d) => d.claimId === claim.id)?.target?.concept
      : undefined;

    const candidateEventId = generateStableDomainEventId(researchDoc.floor, claim.id, targetConcept);

    // Reconcile existing events strictly by ID or exact evidence locator match (no summary text matching)
    const existingIndex = events.findIndex((evt) => {
      const idMatch = String(evt.id) === candidateEventId || String(evt.id) === `evt-f${researchDoc.floor}-${claim.id.toLowerCase()}`;
      const evidenceLocatorMatch =
        Array.isArray(evt.evidence) &&
        evt.evidence.some(
          (ev: Record<string, unknown>) =>
            ev.locator &&
            typeof ev.locator === 'object' &&
            Object.keys(ev.locator as object).length > 0 &&
            claim.evidence.some(
              (rev) =>
                rev.sourceId === ev.sourceId &&
                rev.locator &&
                JSON.stringify(rev.locator) === JSON.stringify(ev.locator)
            )
        );
      return idMatch || evidenceLocatorMatch;
    });

    if (existingIndex >= 0) {
      // Reconcile and enrich existing record in place: preserve ID, type, position, and authored payload
      const existingEvt = events[existingIndex];
      const mergedEvidence = Array.from(
        new Map(
          [...(existingEvt.evidence as Array<Record<string, unknown>> || []), ...claim.evidence].map((ev) => [
            `${ev.sourceId}:${JSON.stringify(ev.locator)}`,
            ev,
          ])
        ).values()
      );
      existingEvt.evidence = mergedEvidence;
      if (claim.unknowns) {
        const existingUnknowns = new Set<string>((existingEvt.unknowns as string[]) || []);
        for (const unk of claim.unknowns) existingUnknowns.add(unk);
        existingEvt.unknowns = Array.from(existingUnknowns);
      }
      continue;
    }

    // New event creation: generate stable domain-oriented ID
    let eventId = candidateEventId;
    if (usedEventIds.has(eventId)) {
      eventId = `${eventId}-alt`;
    }
    usedEventIds.add(eventId);

    // Runtime position floor is set from document scope floor. Evidence locators remain on evidence items.
    const position = {
      floor: researchDoc.floor,
    };

    events.push({
      id: eventId,
      summary: claim.claim.summary,
      position,
      evidence: JSON.parse(JSON.stringify(claim.evidence)),
      ...(claim.unknowns ? { unknowns: [...claim.unknowns] } : {}),
    });
  }

  // Merge sources without duplication
  const sourceMap = new Map<string, Record<string, unknown>>();
  for (const s of existingSources) {
    sourceMap.set(String(s.id), s);
  }
  for (const s of researchDoc.sources) {
    if (!sourceMap.has(s.id)) {
      sourceMap.set(s.id, {
        id: s.id,
        kind: s.kind,
        trust: s.trust,
        title: s.title,
        ...(s.url ? { url: s.url } : {}),
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
