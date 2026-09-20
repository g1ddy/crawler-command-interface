import type { ResearchClaimDocument, ModelingDecisionDocument } from './types/research.ts';
import {
  validateResearchClaimDocument,
  validateModelingDecisionDocument,
  validateSemanticModelingDecisions,
  validateTraceCompleteness,
} from './research-validator.ts';

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

export interface CandidateEventArtifact {
  id: string;
  type: string;
  position: {
    floor: number;
    book?: number;
    chapter?: number;
  };
  summary: string;
  evidence: Array<{
    sourceId: string;
    locator?: Record<string, unknown>;
    confidence: string;
    relationship?: string;
  }>;
  item?: {
    instanceId?: string;
    itemId?: string;
    quantity?: {
      known: boolean;
      value?: number;
    };
  };
}

export interface CandidateProvenanceSidecar {
  candidateId: string;
  researchClaimId: string;
  sources: Array<{
    sourceId: string;
    locator?: Record<string, unknown>;
    confidence: string;
    relationship?: string;
  }>;
}

export interface CompiledCandidateProjectionResult {
  storyId: string;
  floor: number;
  candidateEvents: CandidateEventArtifact[];
  provenanceSidecar: CandidateProvenanceSidecar[];
  traceOutput: CompiledResearchOutput;
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

  // Fail-closed gate: Run full document validation, semantic validation, and trace completeness validation
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

export function compileCandidateProjection(
  researchDoc: ResearchClaimDocument,
  modelingDoc: ModelingDecisionDocument
): CompiledCandidateProjectionResult {
  const traceOutput = compileResearchTrace(researchDoc, modelingDoc);
  const candidateEvents: CandidateEventArtifact[] = [];
  const provenanceSidecar: CandidateProvenanceSidecar[] = [];

  const decisionMap = new Map<string, typeof modelingDoc.decisions[0]>();
  for (const decision of modelingDoc.decisions) {
    decisionMap.set(decision.claimId, decision);
  }

  for (const claim of researchDoc.claims) {
    const modelingDecision = decisionMap.get(claim.id);
    if (!modelingDecision) {
      continue;
    }

    if (modelingDecision.disposition !== 'promote') {
      continue;
    }

    const target = modelingDecision.target;
    if (!target) {
      throw new Error(`Candidate projection error: Promoted claim "${claim.id}" lacks target concept.`);
    }

    const candidateId = `candidate-evt-${claim.id.toLowerCase()}`;
    const primaryLocator = claim.evidence[0]?.locator;

    const position = {
      floor: researchDoc.floor,
      book: primaryLocator?.book,
      chapter: primaryLocator?.chapter,
    };

    let candidateEvent: CandidateEventArtifact;

    if (target.concept === 'ItemAcquired' || target.concept === 'ItemCrafted') {
      // Do NOT manufacture a quantity of 1 if research evidence does not establish quantity
      const unknowns = claim.unknowns || [];
      const quantityObject = unknowns.includes('exact_quantity') || unknowns.includes('quantity')
        ? { known: false }
        : undefined;

      candidateEvent = {
        id: candidateId,
        type: target.concept,
        position,
        summary: claim.claim.summary,
        evidence: JSON.parse(JSON.stringify(claim.evidence)),
        item: {
          instanceId: `candidate-inst-${claim.id.toLowerCase()}`,
          itemId: `candidate-item-${claim.id.toLowerCase()}`,
          quantity: quantityObject,
        },
      };
    } else if (target.concept === 'NarrativeEvent') {
      candidateEvent = {
        id: candidateId,
        type: 'NarrativeEvent',
        position,
        summary: claim.claim.summary,
        evidence: JSON.parse(JSON.stringify(claim.evidence)),
      };
    } else {
      throw new Error(
        `Candidate projection error: Concept "${target.concept}" for claim "${claim.id}" is not supported for automatic candidate projection.`
      );
    }

    candidateEvents.push(candidateEvent);
    provenanceSidecar.push({
      candidateId,
      researchClaimId: claim.id,
      sources: claim.evidence.map((ev) => ({
        sourceId: ev.sourceId,
        locator: ev.locator ? JSON.parse(JSON.stringify(ev.locator)) : undefined,
        confidence: ev.confidence,
        relationship: ev.relationship,
      })),
    });
  }

  return {
    storyId: researchDoc.storyId,
    floor: researchDoc.floor,
    candidateEvents,
    provenanceSidecar,
    traceOutput,
  };
}
