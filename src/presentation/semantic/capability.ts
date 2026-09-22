import type { PresentationSemantics } from "./types.ts";

/**
 * Adapts an already-evaluated application capability to the semantic
 * presentation boundary. Capability evaluation and action handling remain
 * application-owned; this adapter only describes the resulting affordance.
 */
export function mapCapabilityAvailabilityToSemantics(
  available: boolean,
): PresentationSemantics {
  return available
    ? { status: "present", affordance: "action" }
    : { status: "unavailable", affordance: "none" };
}
