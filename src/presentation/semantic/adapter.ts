import type {
  PresentationSemantics,
  PresentationStatus,
} from "./types.ts";

/**
 * Maps generic capability availability to semantic affordance presentation.
 */
export function mapCapabilityToSemantics(
  isAvailable: boolean,
  status: PresentationStatus = isAvailable ? "present" : "unavailable"
): PresentationSemantics {
  return {
    status,
    affordance: isAvailable ? "action" : "none",
  };
}
