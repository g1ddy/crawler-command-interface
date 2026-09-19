export type ResearchSourceKind =
  | 'official-text'
  | 'official-audio'
  | 'official-preview'
  | 'wiki'
  | 'fan-compendium'
  | 'discussion'
  | 'editorial';

export type ResearchSourceTrust = 'primary' | 'corroborating' | 'candidate';

export interface ResearchSource {
  id: string;
  kind: ResearchSourceKind;
  trust: ResearchSourceTrust;
  title: string;
  url: string;
  citationStyle?: string;
  accessedAt?: string;
  revision?: string;
}

export interface ResearchClaimLocator {
  book?: number;
  chapter?: number;
  section?: string;
  timestamp?: string;
}

export type ClaimConfidence = 'confirmed' | 'corroborated' | 'candidate' | 'disputed';

export interface ResearchClaimEvidence {
  sourceId: string;
  locator?: ResearchClaimLocator;
  confidence: ClaimConfidence;
  note?: string;
}

export type PromotionDecision = 'promote' | 'review' | 'ledger_only';

export interface ResearchClaimModeling {
  decision: PromotionDecision;
  targetDomain?: string;
  targetRepresentation?: string;
  note?: string;
}

export type ContradictionRelationship = 'contradicts' | 'supersedes' | 'unresolved';

export interface ResearchClaimContradiction {
  claimId: string;
  relationship: ContradictionRelationship;
  note?: string;
}

export type ResearchClaimDomain =
  | 'pet'
  | 'crawler'
  | 'inventory'
  | 'equipment'
  | 'quest'
  | 'party'
  | 'broadcast'
  | 'achievement'
  | 'skills'
  | 'magic'
  | 'floor-system'
  | 'other';

export type ResearchClaimKind = 'event' | 'observation' | 'state' | 'capability' | 'ledger-only';

export interface ResearchClaimContent {
  summary: string;
  detail?: string;
}

export interface ResearchClaim {
  id: string;
  domain: ResearchClaimDomain;
  kind: ResearchClaimKind;
  claim: ResearchClaimContent;
  evidence: ResearchClaimEvidence[];
  modeling: ResearchClaimModeling;
  unknowns?: string[];
  dependencies?: string[];
  contradictions?: ResearchClaimContradiction[];
}

export interface ResearchClaimDocument {
  $schema?: string;
  schemaVersion: 'crawler-research/v1';
  storyId: string;
  floor: number;
  sources: ResearchSource[];
  claims: ResearchClaim[];
}
