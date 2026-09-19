import assert from "node:assert/strict";
import test from "node:test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectState } from "../../app/domain/projection.ts";
import { derivePartyPresentation } from "../../src/features/party/public.ts";

test("derivePartyPresentation represents absent party state", () => {
  const p = derivePartyPresentation({ party: undefined });
  assert.equal(p.hasParty, false);
  assert.equal(p.status, "not-established");
  assert.deepEqual(p.members, []);
});

test("derivePartyPresentation preserves sourced identity and roles", () => {
  const p = derivePartyPresentation({ party: { partyId: "party-1", name: "Royal Court of Princess Donut", members: [
    { crawlerId: "donut", name: "Princess Donut", role: "leader" },
    { crawlerId: "carl", name: "Carl", role: "member" },
  ] } });
  assert.equal(p.partyName, "Royal Court of Princess Donut");
  assert.equal(p.memberCount, 2);
  assert.deepEqual(p.members.map((m) => m.roleLabel), ["LEADER", "MEMBER"]);
});

test("derivePartyPresentation handles unknown and unrecognized roles gracefully", () => {
  const p = derivePartyPresentation({ party: { partyId: "party-1", name: "Party", members: [
    { crawlerId: "carl", name: "Carl", role: "unknown" },
    { crawlerId: "custom", name: "Custom", role: "guest" },
    { crawlerId: "missing", name: "Missing" },
  ] } });

  assert.equal(p.members[0].role, "unknown");
  assert.equal(p.members[0].roleLabel, "UNKNOWN");

  assert.equal(p.members[1].role, "unknown");
  assert.equal(p.members[1].roleLabel, "GUEST");

  assert.equal(p.members[2].role, "unknown");
  assert.equal(p.members[2].roleLabel, "UNKNOWN");
});

test("derivePartyPresentation does not infer unsupported member mechanics", () => {
  const p = derivePartyPresentation({ party: { partyId: "party-1", name: "Party", members: [{ crawlerId: "carl", name: "Carl", role: "member" }] } });
  assert.equal(p.members[0].role, "member");
  assert.equal("level" in p.members[0], false);
  assert.equal("health" in p.members[0], false);
});

test("party presentation respects formation boundary in replay", () => {
  const e = compiledTimeline.events.find((event) => event.id === "evt-f1-party-royal-court-formed");
  assert.ok(e);
  const before = projectState(compiledTimeline, e.sequence - 1);
  const formed = projectState(compiledTimeline, e.sequence);
  assert.equal(derivePartyPresentation({ party: before.party }).hasParty, false);
  assert.equal(derivePartyPresentation({ party: formed.party }).memberCount, 2);
});
