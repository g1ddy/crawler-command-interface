import type { EvidencePresentation } from "../../features/timeline/public.ts";
import type { PartyPresentationStatus } from "../../features/party/public.ts";
import type { PetPresentationStatus } from "../../features/pet/public.ts";
import type {
  PresentationChange,
  PresentationSemantics,
  PresentationStatus,
} from "./types.ts";

/**
 * Maps an EvidencePresentation snapshot into renderer-neutral HUD presentation semantics.
 */
export function mapEvidenceToSemantics(
  evidence: EvidencePresentation
): PresentationSemantics {
  const inspectable = evidence.inspectable;
  const provenance = { inspectable };
  const affordance = inspectable ? "inspect" : "none";

  switch (evidence.state) {
    case "current":
      return {
        status: "present",
        temporal: "current",
        authority: "observed",
        affordance,
        provenance,
      };
    case "last-known":
      return {
        status: "present",
        temporal: "last-known",
        authority: "observed",
        affordance,
        provenance,
      };
    case "estimated":
      return {
        status: "present",
        temporal: "current",
        authority: "estimated",
        affordance,
        provenance,
      };
    case "causal-only":
      return {
        status: "present",
        temporal: "current",
        authority: "causal",
        affordance,
        provenance,
      };
    case "unknown":
      return {
        status: "unknown",
        affordance: "none",
        provenance: { inspectable: false },
      };
  }
}

/**
 * Maps Party status and optional change intent into presentation semantics.
 */
export function mapPartyStatusToSemantics(
  partyStatus: PartyPresentationStatus,
  change?: PresentationChange
): PresentationSemantics {
  switch (partyStatus) {
    case "not-established":
      return { status: "not-established", affordance: "none" };
    case "established":
      return {
        status: "present",
        ...(change ? { change } : {}),
        affordance: "none",
      };
    case "known-empty":
      return { status: "known-empty", affordance: "none" };
    case "unavailable":
      return { status: "unavailable", affordance: "none" };
    case "unknown":
    default:
      return { status: "unknown", affordance: "none" };
  }
}

/**
 * Maps Pet status and optional change intent into presentation semantics.
 */
export function mapPetStatusToSemantics(
  petStatus: PetPresentationStatus,
  change?: PresentationChange
): PresentationSemantics {
  switch (petStatus) {
    case "known-empty":
      return { status: "known-empty", affordance: "none" };
    case "established":
      return {
        status: "present",
        ...(change ? { change } : {}),
        affordance: "none",
      };
    case "not-established":
      return { status: "not-established", affordance: "none" };
    case "unavailable":
      return { status: "unavailable", affordance: "none" };
    case "unknown":
    default:
      return { status: "unknown", affordance: "none" };
  }
}

/**
 * Maps capability availability to semantic affordance presentation.
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
