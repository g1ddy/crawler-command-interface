export type PresentationStatus =
  | "present"
  | "known-empty"
  | "not-established"
  | "unknown"
  | "unavailable";

export type PresentationTemporal =
  | "current"
  | "last-known";

export type PresentationAuthority =
  | "observed"
  | "estimated"
  | "causal";

export type PresentationChange =
  | "changed"
  | "newly-established";

export type PresentationAffordance =
  | "none"
  | "inspect"
  | "action";

export interface PresentationSemantics {
  status: PresentationStatus;
  temporal?: PresentationTemporal;
  authority?: PresentationAuthority;
  change?: PresentationChange;
  affordance?: PresentationAffordance;
  provenance?: {
    inspectable: boolean;
  };
}

export type PresentationMotionIntent =
  | "established"
  | "changed"
  | "attention"
  | "enter-context"
  | "enter-replay"
  | "return-live"
  | "disclose";
