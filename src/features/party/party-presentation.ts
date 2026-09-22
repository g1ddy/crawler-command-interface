import type { Party } from "../../../app/domain/types.ts";
import type {
  PresentationChange,
  PresentationSemantics,
} from "../../presentation/semantic/public.ts";

export type PartyMemberRole = "leader" | "member" | "unknown";
export type PartyPresentationStatus = "not-established" | "established" | "known-empty" | "unknown" | "unavailable";

export interface DerivedPartyMember {
  crawlerId: string;
  name: string;
  role: PartyMemberRole;
  roleLabel: string;
}

export interface DerivedPartyPresentation {
  hasParty: boolean;
  status: PartyPresentationStatus;
  partyId?: string;
  partyName?: string;
  memberCount: number;
  memberBadgeLabel: string;
  members: DerivedPartyMember[];
}

export function derivePartyPresentation({ party }: { party?: Party }): DerivedPartyPresentation {
  if (!party) {
    return {
      hasParty: false,
      status: "not-established",
      memberCount: 0,
      memberBadgeLabel: "NOT ESTABLISHED",
      members: [],
    };
  }

  const members = party.members.map((member) => {
    const raw = member.role as string | undefined;
    const role: PartyMemberRole =
      raw === "leader" ? "leader" : raw === "member" ? "member" : "unknown";
    const roleLabel =
      role === "leader"
        ? "LEADER"
        : role === "member"
          ? "MEMBER"
          : raw?.trim()
            ? raw.toUpperCase()
            : "UNKNOWN";
    return { crawlerId: member.crawlerId, name: member.name, role, roleLabel };
  });

  const hasMembers = members.length > 0;
  return {
    hasParty: true,
    status: hasMembers ? "established" : "known-empty",
    partyId: party.partyId,
    partyName: party.name,
    memberCount: members.length,
    memberBadgeLabel: hasMembers
      ? `${members.length} ${members.length === 1 ? "MEMBER" : "MEMBERS"}`
      : "NO MEMBERS",
    members,
  };
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
