import type { ResearchClaimDocument } from './types/research.ts';

export interface ResearchClaimTraceMapping {
  claimId: string;
  domain: string;
  kind: string;
  decision: string;
  targetDomain?: string;
  targetRepresentation?: string;
  summary: string;
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

export function compileResearchClaims(doc: ResearchClaimDocument): CompiledResearchOutput {
  const claimMappings: ResearchClaimTraceMapping[] = [];

  let promotedClaimCount = 0;
  let reviewClaimCount = 0;
  let ledgerOnlyClaimCount = 0;

  for (const claim of doc.claims) {
    const decision = claim.modeling.decision;

    if (decision === 'promote') {
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
      decision: claim.modeling.decision,
      targetDomain: claim.modeling.targetDomain,
      targetRepresentation: claim.modeling.targetRepresentation,
      summary: claim.claim.summary,
      originatingClaimIds: [claim.id],
      evidence: JSON.parse(JSON.stringify(claim.evidence)),
      unknowns: claim.unknowns ? [...claim.unknowns] : undefined,
    });
  }

  return {
    storyId: doc.storyId,
    floor: doc.floor,
    promotedClaimCount,
    reviewClaimCount,
    ledgerOnlyClaimCount,
    claimMappings,
  };
}
