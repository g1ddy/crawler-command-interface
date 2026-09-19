import type { Party } from "../../../app/domain/types.ts";

export type PartyMemberRole = "leader" | "member" | "unknown";
export interface DerivedPartyMember { crawlerId:string; name:string; role:PartyMemberRole; roleLabel:string; }
export interface DerivedPartyPresentation { hasParty:boolean; status:"established"|"unavailable"; partyId?:string; partyName?:string; memberCount:number; memberBadgeLabel:string; members:DerivedPartyMember[]; }

export function derivePartyPresentation({party}:{party?:Party}):DerivedPartyPresentation {
  if (!party) return {hasParty:false,status:"unavailable",memberCount:0,memberBadgeLabel:"NO PARTY",members:[]};
  const members=party.members.map(member=>{const raw=member.role as string|undefined; const role:PartyMemberRole=raw==="leader"?"leader":raw==="member"?"member":"unknown"; const roleLabel=role==="leader"?"LEADER":role==="member"?"MEMBER":raw?.trim()?raw.toUpperCase():"UNKNOWN"; return {crawlerId:member.crawlerId,name:member.name,role,roleLabel};});
  return {hasParty:true,status:"established",partyId:party.partyId,partyName:party.name,memberCount:members.length,memberBadgeLabel:members.length+" "+(members.length===1?"MEMBER":"MEMBERS"),members};
}
