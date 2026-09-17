import assert from "node:assert/strict";
import test from "node:test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectState } from "../../app/domain/projection.ts";
import { derivePartyPresentation } from "../../src/features/party/public.ts";

test("derivePartyPresentation handles undefined/empty party without fabricating state", () => {
  const empty = derivePartyPresentation({ party: undefined });
  assert.equal(empty.hasParty, false);
  assert.equal(empty.memberCount, 0);
  assert.equal(empty.badgeLabel, "NO PARTY");
  assert.deepEqual(empty.members, []);
});

test("derivePartyPresentation correctly formats a valid Party roster", () => {
  const party = {
    partyId: "party-royal-court",
    name: "The Royal Court of Princess Donut",
    members: [
      { crawlerId: "crawler-donut", name: "Princess Donut", role: "leader" },
      { crawlerId: "crawler-carl", name: "Carl", role: "member" },
    ],
  };

  const pres = derivePartyPresentation({ party });
  assert.equal(pres.hasParty, true);
  assert.equal(pres.partyId, "party-royal-court");
  assert.equal(pres.name, "The Royal Court of Princess Donut");
  assert.equal(pres.memberCount, 2);
  assert.equal(pres.badgeLabel, "2 MEMBERS");
  assert.equal(pres.members.length, 2);

  const [leader, member] = pres.members;
  assert.equal(leader.crawlerId, "crawler-donut");
  assert.equal(leader.name, "Princess Donut");
  assert.equal(leader.isLeader, true);
  assert.equal(leader.roleLabel, "LEADER");

  assert.equal(member.crawlerId, "crawler-carl");
  assert.equal(member.name, "Carl");
  assert.equal(member.isLeader, false);
  assert.equal(member.roleLabel, "MEMBER");
});

test("derivePartyPresentation preserves replay boundaries across compiled timeline sequence", () => {
  const formation = compiledTimeline.events.find((event) => event.id === "evt-f1-party-royal-court-formed");
  assert.ok(formation);

  const beforeState = projectState(compiledTimeline, formation.sequence - 1);
  const beforePres = derivePartyPresentation({ party: beforeState.party });
  assert.equal(beforePres.hasParty, false);

  const afterState = projectState(compiledTimeline, formation.sequence);
  const afterPres = derivePartyPresentation({ party: afterState.party });
  assert.equal(afterPres.hasParty, true);
  assert.equal(afterPres.memberCount, 2);
});

test("Party roster representation never conflates with pets", () => {
  const mongoEvent = compiledTimeline.events.find((event) => event.id === "evt-f2-mongo-bonded");
  assert.ok(mongoEvent);

  const state = projectState(compiledTimeline, mongoEvent.sequence);
  const pres = derivePartyPresentation({ party: state.party });

  assert.equal(pres.hasParty, true);
  const memberIds = pres.members.map((m) => m.crawlerId);
  assert.equal(memberIds.includes("pet-mongo"), false, "Mongo must not be present in Party presentation");
});
