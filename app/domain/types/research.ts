export type ResearchDomain =
  | 'pet'
  | 'crawler'
  | 'inventory'
  | 'equipment'
  | 'party'
  | 'quest'
  | 'rating'
  | 'floor'
  | 'broadcast'
  | 'general';

export type ResearchClaimType = 'event' | 'state' | 'ledger_only';

export type ResearchPromotion = 'promote' | 'review' | 'ledger_only';

export type ResearchConfidence = 'confirmed' | 'corroborated' | 'candidate';

export type ResearchSourceTrust = 'primary' | 'corroborating' | 'candidate';

export type ResearchSourceKind =
  | 'official-text'
  | 'official-audio'
  | 'official-preview'
  | 'wiki'
  | 'fan-compendium'
  | 'discussion'
  | 'editorial';

export interface ResearchSourceLocatorObject {
  book?: number;
  chapter?: number;
  section?: string;
  timestamp?: string;
}

export type ResearchSourceLocator = string | ResearchSourceLocatorObject;

export interface ResearchSource {
  id: string;
  kind: ResearchSourceKind;
  trust: ResearchSourceTrust;
  title: string;
  url?: string;
  citationStyle?: string;
}

export interface ResearchProvenance {
  sourceId: string;
  trust: ResearchSourceTrust;
  locator: ResearchSourceLocator;
  note?: string;
  quote?: string;
}

export interface ResearchStateTransition {
  kind: string;
  subjectId?: string;
  targetId?: string;
  fromState?: string;
  toState?: string;
  payload?: Record<string, unknown>;
}

export interface ResearchClaim {
  id: string;
  summary: string;
  domain: ResearchDomain;
  claimType: ResearchClaimType;
  promotion: ResearchPromotion;
  confidence: ResearchConfidence;
  provenance?: ResearchProvenance;
  dependencies?: string[];
  stateTransition?: ResearchStateTransition;
  unknowns?: string[];
  notes?: string;
}

export interface ResearchClaimDocument {
  $schema?: string;
  schemaVersion: 'crawler-research/v1';
  storyId: string;
  floor: number;
  sources: ResearchSource[];
  claims: ResearchClaim[];
}

export interface PromotedCandidateItem {
  originatingClaimIds: string[];
  candidateType: 'event' | 'observation' | 'catalogItem';
  data: Record<string, unknown>;
}

export interface CandidateResearchCompilation {
  schemaVersion: 'crawler-research-candidate/v1';
  storyId: string;
  floor: number;
  promotedCandidates: PromotedCandidateItem[];
  reviewClaims: ResearchClaim[];
  ledgerOnlyClaims: ResearchClaim[];
}
