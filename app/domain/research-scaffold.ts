import type { ResearchClaimDocument, ModelingDecisionDocument } from './types/research.ts';
import {
  compileCandidateProjection,
  type CandidateProposal,
  type CandidateProvenanceSidecar,
} from './research-compiler.ts';

export const SCAFFOLD_STATUS_BANNER = 'DISPOSABLE RESEARCH SCAFFOLD — NOT AUTHORITATIVE CCI DATA';

export interface ScaffoldReviewClaim {
  claimId: string;
  domain: string;
  kind: string;
  summary: string;
  disposition: string;
  target?: {
    domain: string;
    concept: string;
  };
  rationale: string;
  confidence: string;
  candidateId?: string;
  unknowns?: string[];
}

export interface ScaffoldReviewArtifact {
  statusBanner: typeof SCAFFOLD_STATUS_BANNER;
  storyId: string;
  floor: number;
  summary: {
    totalClaims: number;
    promotedClaims: number;
    reviewClaims: number;
    ledgerOnlyClaims: number;
  };
  claims: ScaffoldReviewClaim[];
}

export interface ScaffoldCandidateEventsArtifact {
  statusBanner: typeof SCAFFOLD_STATUS_BANNER;
  storyId: string;
  floor: number;
  candidateEvents: CandidateProposal[];
}

export interface ScaffoldCandidateObservationsArtifact {
  statusBanner: typeof SCAFFOLD_STATUS_BANNER;
  storyId: string;
  floor: number;
  candidateObservations: CandidateProposal[];
}

export interface ScaffoldProvenanceArtifact {
  statusBanner: typeof SCAFFOLD_STATUS_BANNER;
  storyId: string;
  floor: number;
  candidates: CandidateProvenanceSidecar[];
}

export interface CompiledResearchScaffold {
  storyId: string;
  floor: number;
  review: ScaffoldReviewArtifact;
  events: ScaffoldCandidateEventsArtifact;
  observations: ScaffoldCandidateObservationsArtifact;
  provenance: ScaffoldProvenanceArtifact;
}

/**
 * Transforms validated research claims and modeling decisions into a disposable,
 * reviewable raw-shaped research scaffold without inventing CCI semantics or mutating inputs.
 */
export function compileResearchScaffold(
  researchDoc: ResearchClaimDocument,
  modelingDoc: ModelingDecisionDocument
): CompiledResearchScaffold {
  // Candidate compilation executes full schema/semantic validation and fail-closed completeness checks internally
  const projection = compileCandidateProjection(researchDoc, modelingDoc);

  const decisionMap = new Map<string, typeof modelingDoc.decisions[0]>();
  for (const decision of modelingDoc.decisions) {
    decisionMap.set(decision.claimId, decision);
  }

  const reviewClaims: ScaffoldReviewClaim[] = [];

  for (const claim of researchDoc.claims) {
    const decision = decisionMap.get(claim.id);
    if (!decision) {
      throw new Error(`Scaffold error: Claim "${claim.id}" missing modeling decision.`);
    }

    const candidateProposal = projection.candidateProposals.find((p) => p.researchClaimId === claim.id);
    const confidence = claim.evidence[0]?.confidence ?? 'unknown';

    reviewClaims.push({
      claimId: claim.id,
      domain: claim.domain,
      kind: claim.kind,
      summary: claim.claim.summary,
      disposition: decision.disposition,
      target: decision.target,
      rationale: decision.rationale,
      confidence,
      candidateId: candidateProposal?.candidateId,
      unknowns: claim.unknowns ? [...claim.unknowns] : undefined,
    });
  }

  // Deterministically categorize candidate proposals into events vs observations based on claim kind / target concept
  const candidateEvents: CandidateProposal[] = [];
  const candidateObservations: CandidateProposal[] = [];

  for (const proposal of projection.candidateProposals) {
    const origClaim = researchDoc.claims.find((c) => c.id === proposal.researchClaimId);
    if (origClaim?.kind === 'event' || proposal.target.concept.endsWith('Event') || proposal.target.concept.endsWith('Changed') || proposal.target.concept.endsWith('Equipped') || proposal.target.concept.endsWith('Acquired')) {
      candidateEvents.push(proposal);
    } else {
      candidateObservations.push(proposal);
    }
  }

  return {
    storyId: researchDoc.storyId,
    floor: researchDoc.floor,
    review: {
      statusBanner: SCAFFOLD_STATUS_BANNER,
      storyId: researchDoc.storyId,
      floor: researchDoc.floor,
      summary: {
        totalClaims: researchDoc.claims.length,
        promotedClaims: projection.traceOutput.promotedClaimCount,
        reviewClaims: projection.traceOutput.reviewClaimCount,
        ledgerOnlyClaims: projection.traceOutput.ledgerOnlyClaimCount,
      },
      claims: reviewClaims,
    },
    events: {
      statusBanner: SCAFFOLD_STATUS_BANNER,
      storyId: researchDoc.storyId,
      floor: researchDoc.floor,
      candidateEvents,
    },
    observations: {
      statusBanner: SCAFFOLD_STATUS_BANNER,
      storyId: researchDoc.storyId,
      floor: researchDoc.floor,
      candidateObservations,
    },
    provenance: {
      statusBanner: SCAFFOLD_STATUS_BANNER,
      storyId: researchDoc.storyId,
      floor: researchDoc.floor,
      candidates: projection.provenanceSidecar.map((sidecar) => ({
        ...sidecar,
        statusBanner: SCAFFOLD_STATUS_BANNER,
      })),
    },
  };
}
