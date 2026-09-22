/**
 * Renderer-neutral status indicating value presence and availability:
 * - "present": Value or entity is established and present for display.
 * - "known-empty": Concept is explicitly known to be empty or zero (e.g. empty Pet collection).
 * - "not-established": Concept has not yet become established at the selected temporal state (e.g. Party before formation).
 * - "unknown": Available evidence/observation does not establish the value.
 * - "unavailable": Supported semantic vocabulary for when the application cannot provide the value.
 *   Note: "unavailable" is a supported semantic state reserved for application-level inability to supply
 *   a value; currently no feature presentation producer emits it in production.
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

export type PresentationMotionIntent =
  | "established"
  | "changed"
  | "attention"
  | "enter-context"
  | "enter-replay"
  | "return-live"
  | "disclose";
