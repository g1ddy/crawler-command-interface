import type { ResearchClaimDocument } from './types/research.ts';

export interface CompiledResearchOutput {
  storyId: string;
  floor: number;
  promotedClaimCount: number;
  ledgerOnlyClaimCount: number;
  reviewClaimCount: number;
  compiledEvents: Array<Record<string, unknown>>;
  compiledObservations: Array<Record<string, unknown>>;
  compiledCatalogItems: Array<Record<string, unknown>>;
  compiledCatalogAchievements: Array<Record<string, unknown>>;
  claimMappings: Array<{
    claimId: string;
    domain: string;
    decision: string;
    targetRepresentation?: string;
    originatingClaimIds: string[];
  }>;
}

export function compileResearchClaims(doc: ResearchClaimDocument): CompiledResearchOutput {
  const compiledEvents: Array<Record<string, unknown>> = [];
  const compiledObservations: Array<Record<string, unknown>> = [];
  const compiledCatalogItems: Array<Record<string, unknown>> = [];
  const compiledCatalogAchievements: Array<Record<string, unknown>> = [];
  const claimMappings: CompiledResearchOutput['claimMappings'] = [];

  let promotedClaimCount = 0;
  let ledgerOnlyClaimCount = 0;
  let reviewClaimCount = 0;

  for (const claim of doc.claims) {
    const decision = claim.modeling.decision;

    if (decision === 'ledger_only') {
      ledgerOnlyClaimCount++;
    } else if (decision === 'review') {
      reviewClaimCount++;
    } else if (decision === 'promote') {
      promotedClaimCount++;

      const cand = claim.candidateRepresentation
        ? JSON.parse(JSON.stringify(claim.candidateRepresentation))
        : {};

      // Enrich candidate representation with provenance tracing
      cand.originatingClaimIds = [claim.id];
      if (!cand.evidence || !Array.isArray(cand.evidence) || cand.evidence.length === 0) {
        cand.evidence = claim.evidence;
      }

      const target = claim.modeling.targetRepresentation || cand.type || cand.kind || 'unknown';

      if (
        cand.type ||
        claim.kind === 'event' ||
        target.toLowerCase().includes('event')
      ) {
        compiledEvents.push(cand);
      } else if (
        cand.kind === 'inventory-state' ||
        cand.kind === 'crawler-condition' ||
        cand.kind === 'crawler-attributes' ||
        cand.kind === 'xp-progress' ||
        cand.kind === 'broadcast-metrics' ||
        cand.kind === 'floor-metrics' ||
        cand.kind === 'equipment-state' ||
        cand.kind === 'countdown-remaining' ||
        claim.kind === 'observation'
      ) {
        compiledObservations.push(cand);
      } else if (cand.category || target.toLowerCase().includes('item')) {
        compiledCatalogItems.push(cand);
      } else if (cand.reward || target.toLowerCase().includes('achievement')) {
        compiledCatalogAchievements.push(cand);
      } else {
        compiledEvents.push(cand);
      }
    }

    claimMappings.push({
      claimId: claim.id,
      domain: claim.domain,
      decision: claim.modeling.decision,
      targetRepresentation: claim.modeling.targetRepresentation,
      originatingClaimIds: [claim.id],
    });
  }

  return {
    storyId: doc.storyId,
    floor: doc.floor,
    promotedClaimCount,
    ledgerOnlyClaimCount,
    reviewClaimCount,
    compiledEvents,
    compiledObservations,
    compiledCatalogItems,
    compiledCatalogAchievements,
    claimMappings,
  };
}
