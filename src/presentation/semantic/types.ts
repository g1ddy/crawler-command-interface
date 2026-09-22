/**
 * Renderer-neutral status indicating value presence and availability:
 * - "present": Value or entity is established and present for display.
 * - "known-empty": Concept is explicitly known to be empty or zero.
 * - "not-established": Concept has not yet become established at the selected temporal state.
 * - "unknown": Available evidence/observation does not establish the value.
 * - "unavailable": The application cannot currently provide the value.
 */
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
