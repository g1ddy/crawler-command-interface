import type {
  CandidateResearchCompilation,
  PromotedCandidateItem,
  ResearchClaimDocument,
} from './types/research.ts';
import { validateResearchDocument } from './research-validator.ts';

export function compileResearchDocument(doc: ResearchClaimDocument): CandidateResearchCompilation {
  const validation = validateResearchDocument(doc);
  if (!validation.valid) {
    throw new Error(
      `Research document compilation failed validation:\n${validation.errors.join('\n')}`
    );
  }

  const promotedCandidates: PromotedCandidateItem[] = [];
  const reviewClaims = doc.claims.filter((c) => c.promotion === 'review');
  const ledgerOnlyClaims = doc.claims.filter((c) => c.promotion === 'ledger_only');

  const promotedClaims = doc.claims.filter((c) => c.promotion === 'promote');

  for (const claim of promotedClaims) {
    if (!claim.provenance) continue;

    const originatingClaimIds = [
      ...(claim.dependencies || []),
      claim.id,
    ].filter((id, index, self) => self.indexOf(id) === index);

    const evidenceEntry = {
      sourceId: claim.provenance.sourceId,
      locator: claim.provenance.locator,
      note: `Claim ID: ${claim.id}`,
      confidence: claim.confidence === 'confirmed' ? 'confirmed' : 'corroborated',
    };

    let locatorBook: number | undefined;
    let locatorChapter: number | undefined;
    if (typeof claim.provenance.locator === 'object' && claim.provenance.locator !== null) {
      locatorBook = claim.provenance.locator.book;
      locatorChapter = claim.provenance.locator.chapter;
    }

    const position = {
      floor: doc.floor,
      ...(locatorBook !== undefined ? { book: locatorBook } : {}),
      ...(locatorChapter !== undefined ? { chapter: locatorChapter } : {}),
    };

    if (claim.claimType === 'event' && claim.stateTransition) {
      const candidateEventId = `evt-f${doc.floor}-candidate-${claim.id.replace(/^claim-/, '')}`;
      const payload = claim.stateTransition.payload || {};

      const candidateEventData: Record<string, unknown> = {
        id: candidateEventId,
        type: claim.stateTransition.kind,
        position,
        summary: claim.summary,
        evidence: [evidenceEntry],
        ...payload,
      };

      promotedCandidates.push({
        originatingClaimIds,
        candidateType: 'event',
        data: candidateEventData,
      });
    } else if (claim.claimType === 'state' && claim.stateTransition) {
      const candidateObsId = `obs-candidate-${claim.id.replace(/^claim-/, '')}`;
      const payload = claim.stateTransition.payload || {};

      const candidateObsData: Record<string, unknown> = {
        id: candidateObsId,
        kind: claim.stateTransition.kind,
        evidence: [evidenceEntry],
        ...payload,
      };

      promotedCandidates.push({
        originatingClaimIds,
        candidateType: 'observation',
        data: candidateObsData,
      });
    }
  }

  return {
    schemaVersion: 'crawler-research-candidate/v1',
    storyId: doc.storyId,
    floor: doc.floor,
    promotedCandidates,
    reviewClaims,
    ledgerOnlyClaims,
  };
}
