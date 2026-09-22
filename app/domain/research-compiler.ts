import type { ResearchClaimDocument, ModelingDecisionDocument } from './types/research.ts';
import {
  validateResearchClaimDocument,
  validateModelingDecisionDocument,
  validateSemanticModelingDecisions,
  validateTraceCompleteness,
} from './research-validator.ts';

export const RAW_DRAFT_STATUS_HEADER = '# DISPOSABLE RESEARCH DRAFT — NOT AUTHORITATIVE CCI DATA';

export interface RawFloorDraftResult {
  authoringVersion: 'crawler-floor-raw/v1';
  storyId: string;
  floor: {
    id: string;
    ordinal: number;
    title: string;
    book: number;
    continuity: 'canonical' | 'adaptation' | 'alternate' | 'unknown';
    coverage: {
      kind: 'complete' | 'curated-critical' | 'curated' | 'partial';
      statement: string;
      completeness: 'complete' | 'partial' | 'seed';
    };
  };
  sources: Array<{
    id: string;
    kind: string;
    trust: string;
    title: string;
    url?: string;
  }>;
  catalog: {
    items: string[];
    achievements: string[];
  };
  events: Array<Record<string, unknown>>;
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
 * Compiles a validated research claim document directly into the existing CCI raw JSON shape
 * (events, catalog, sources, and README.md) preserving claim YAML order, evidence, locators, and explicit unknowns,
 * without intermediate candidate models, concept-suffix heuristics, or invented CCI semantics.
 */
export function compileRawDraft(researchDoc: ResearchClaimDocument): RawFloorDraftResult {
  const researchVal = validateResearchClaimDocument(researchDoc);
  if (!researchVal.valid) {
    throw new Error(
      `Compiler error: Research document schema/semantic validation failed:\n  - ${researchVal.errors.join('\n  - ')}`
    );
  }

  const events: Array<Record<string, unknown>> = [];

  // Preserve research YAML claim order strictly
  for (const claim of researchDoc.claims) {
    const encodedClaimId = encodeURIComponent(claim.id);
    const draftId = `evt-draft-${encodedClaimId}`;

    // Resolve book and chapter locators conservatively across evidence items.
    // If multiple evidence items specify differing book/chapter locators, leave the locator unpopulated rather than guessing.
    const specifiedBooks = new Set<number>();
    const specifiedChapters = new Set<number>();

    for (const ev of claim.evidence) {
      if (ev.locator) {
        if (typeof ev.locator.book === 'number') specifiedBooks.add(ev.locator.book);
        if (typeof ev.locator.chapter === 'number') specifiedChapters.add(ev.locator.chapter);
      }
    }

    const book = specifiedBooks.size === 1 ? Array.from(specifiedBooks)[0] : undefined;
    const chapter = specifiedChapters.size === 1 ? Array.from(specifiedChapters)[0] : undefined;

    const position = {
      floor: researchDoc.floor,
      ...(book !== undefined ? { book } : {}),
      ...(chapter !== undefined ? { chapter } : {}),
    };

    events.push({
      id: draftId,
      summary: claim.claim.summary,
      position,
      evidence: JSON.parse(JSON.stringify(claim.evidence)),
      ...(claim.unknowns ? { unknowns: [...claim.unknowns] } : {}),
    });
  }

  const readme = `${RAW_DRAFT_STATUS_HEADER}

This directory contains a mechanically compiled raw draft derived directly from story "${researchDoc.storyId}", floor ${researchDoc.floor} research claims.

- \`events.json\`: ${events.length} draft events preserving YAML claim order, evidence, locators, and unknowns.
- \`catalog.json\`: Floor-local catalog definitions.

IMPORTANT: Unresolved CCI fields (such as event \`type\`, item \`category\`, or specific payload discriminators) are intentionally left unpopulated so existing CCI raw floor validation flags missing curation work.
Do NOT treat this draft as authoritative runtime state.
`;

  return {
    authoringVersion: 'crawler-floor-raw/v1',
    storyId: researchDoc.storyId,
    floor: {
      id: `floor-${researchDoc.floor}`,
      ordinal: researchDoc.floor,
      title: `Floor ${researchDoc.floor} Research Draft`,
      book: 2,
      continuity: 'canonical',
      coverage: {
        kind: 'partial',
        statement: 'Mechanically compiled research draft requiring curation.',
        completeness: 'seed',
      },
    },
    sources: researchDoc.sources.map((s) => ({
      id: s.id,
      kind: s.kind,
      trust: s.trust,
      title: s.title,
      url: s.url,
    })),
    catalog: {
      items: [],
      achievements: [],
    },
    events,
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
