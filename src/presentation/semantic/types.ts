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

/**
 * Renderer-neutral motion intent describing the semantic cause/reason for a visual transition:
 * - "established": A concept has transitioned from unestablished/unavailable to established state.
 * - "changed": A meaningful state change occurred (e.g. system alert or urgency phase transition).
 * - "attention": System attention required or active alert triggered.
 * - "enter-context": Contextual region or detail focus reveal.
 * - "enter-replay": Temporal context transitioned from Live into Replay mode.
 * - "return-live": Temporal context transitioned from Replay back into Live mode.
 * - "disclose": Inspection or detail disclosure affordance activated.
 */
export type PresentationMotionIntent =
  | "established"
  | "changed"
  | "attention"
  | "enter-context"
  | "enter-replay"
  | "return-live"
  | "disclose";

export interface PresentationSemantics {
  status: PresentationStatus;
  temporal?: PresentationTemporal;
  authority?: PresentationAuthority;
  change?: PresentationChange;
  affordance?: PresentationAffordance;
  motionIntent?: PresentationMotionIntent;
  provenance?: {
    inspectable: boolean;
  };
}
