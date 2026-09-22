import type { ResearchClaimDocument, ModelingDecisionDocument } from './types/research.ts';
import {
  validateResearchClaimDocument,
  validateModelingDecisionDocument,
  validateSemanticModelingDecisions,
  validateTraceCompleteness,
} from './research-validator.ts';

export const RAW_DRAFT_STATUS_HEADER = '# DISPOSABLE RESEARCH DRAFT — NOT AUTHORITATIVE CCI DATA';

export interface RawDraftEvent {
  id: string;
  researchClaimId: string;
  summary: string;
  position: {
    floor: number;
    book?: number;
    chapter?: number;
  };
  evidence: Array<{
    sourceId: string;
    locator?: Record<string, unknown>;
    confidence: string;
    relationship?: string;
  }>;
  unknowns?: string[];
  /** Unresolved CCI type; left unpopulated unless explicitly supplied in research/authoring. */
  type?: string;
}

export interface RawDraftCatalogItem {
  id: string;
  researchClaimId: string;
  summary: string;
  evidence: Array<{
    sourceId: string;
    locator?: Record<string, unknown>;
    confidence: string;
    relationship?: string;
  }>;
}

export interface RawDraftOutput {
  storyId: string;
  floor: number;
  events: RawDraftEvent[];
  catalog: {
    items: RawDraftCatalogItem[];
  };
  readme: string;
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
 * Compiles a validated research claim document directly into a raw-JSON draft
 * (events, catalog, and README.md) without introducing intermediate candidate models,
 * concept-suffix heuristics, or invented CCI semantics.
 */
export function compileRawDraft(researchDoc: ResearchClaimDocument): RawDraftOutput {
  const researchVal = validateResearchClaimDocument(researchDoc);
  if (!researchVal.valid) {
    throw new Error(
      `Compiler error: Research document schema/semantic validation failed:\n  - ${researchVal.errors.join('\n  - ')}`
    );
  }

  const events: RawDraftEvent[] = [];
  const catalogItems: RawDraftCatalogItem[] = [];

  // Preserve research YAML claim order strictly
  for (const claim of researchDoc.claims) {
    const encodedClaimId = encodeURIComponent(claim.id);
    const draftId = `draft-${encodedClaimId}`;

    // Extract locator position details if explicitly present in evidence
    let bookLocator: number | undefined;
    let chapterLocator: number | undefined;

    for (const ev of claim.evidence) {
      if (ev.locator) {
        if (typeof ev.locator.book === 'number') bookLocator = ev.locator.book;
        if (typeof ev.locator.chapter === 'number') chapterLocator = ev.locator.chapter;
      }
    }

    const position = {
      floor: researchDoc.floor,
      ...(bookLocator !== undefined ? { book: bookLocator } : {}),
      ...(chapterLocator !== undefined ? { chapter: chapterLocator } : {}),
    };

    if (claim.domain === 'inventory' && claim.kind === 'state') {
      catalogItems.push({
        id: draftId,
        researchClaimId: claim.id,
        summary: claim.claim.summary,
        evidence: JSON.parse(JSON.stringify(claim.evidence)),
      });
    } else {
      events.push({
        id: draftId,
        researchClaimId: claim.id,
        summary: claim.claim.summary,
        position,
        evidence: JSON.parse(JSON.stringify(claim.evidence)),
        unknowns: claim.unknowns ? [...claim.unknowns] : undefined,
      });
    }
  }

  const readme = `${RAW_DRAFT_STATUS_HEADER}

This directory contains a mechanically compiled draft derived from story "${researchDoc.storyId}", floor ${researchDoc.floor} research claims.

- \`events.json\`: ${events.length} draft events preserving YAML claim order, claim IDs (\`researchClaimId\`), evidence, and locators.
- \`catalog.json\`: ${catalogItems.length} draft catalog items.

IMPORTANT: Unresolved CCI fields (such as event \`type\`, item \`category\`, or specific payload discriminators) are intentionally left unpopulated so existing CCI raw validation flags missing curation work.
Do NOT treat this draft as authoritative runtime state.
`;

  return {
    storyId: researchDoc.storyId,
    floor: researchDoc.floor,
    events,
    catalog: {
      items: catalogItems,
    },
    readme,
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
