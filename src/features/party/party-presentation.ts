import type { Party } from "../../../app/domain/types.ts";

export interface PartyMemberPresentation {
  crawlerId: string;
  name: string;
  role: "leader" | "member";
  isLeader: boolean;
  roleLabel: string;
}

export interface DerivedPartyPresentation {
  hasParty: boolean;
  partyId?: string;
  name?: string;
  memberCount: number;
  badgeLabel: string;
  members: PartyMemberPresentation[];
}

/** Derives the narrow Party surface from the selected temporal Party state. */
export function derivePartyPresentation({
  party,
}: {
  party?: Party;
}): DerivedPartyPresentation {
  if (!party || !party.members || party.members.length === 0) {
    return {
      hasParty: false,
      memberCount: 0,
      badgeLabel: "NO PARTY",
      members: [],
    };
  }

  const members: PartyMemberPresentation[] = party.members.map((member) => ({
    crawlerId: member.crawlerId,
    name: member.name,
    role: member.role,
    isLeader: member.role === "leader",
    roleLabel: member.role === "leader" ? "LEADER" : "MEMBER",
  }));

  const count = members.length;
  const badgeLabel = `${count} ${count === 1 ? "MEMBER" : "MEMBERS"}`;

  return {
    hasParty: true,
    partyId: party.partyId,
    name: party.name,
    memberCount: count,
    badgeLabel,
    members,
  };
}
