import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectObservations } from "../../app/domain/observations.ts";
import { projectState } from "../../app/domain/projection.ts";
import { validateRawCrawlerFloor } from "../../app/domain/validation.ts";
import { selectedSequenceCapabilities } from "../../src/shell/navigation/capabilities.ts";

const rawFloor1 = JSON.parse(fs.readFileSync("data/raw/floors/floor-1.json", "utf8"));
const formation = compiledTimeline.events.find((event) => event.id === "evt-f1-party-royal-court-formed");

test("the Royal Court formation records only the Floor 1 crawler roster", () => {
  assert.ok(formation);
  assert.equal(formation.type, "PartyFormed");
  assert.deepEqual(formation.party, {
    partyId: "party-royal-court",
    name: "The Royal Court of Princess Donut",
    members: [
      { crawlerId: "crawler-donut", name: "Princess Donut", role: "leader" },
      { crawlerId: "crawler-carl", name: "Carl", role: "member" },
    ],
  });
});

test("Party is replay bounded to its explicit formation event", () => {
  const before = projectState(compiledTimeline, formation.sequence - 1);
  const after = projectState(compiledTimeline, formation.sequence);
  const beforeCapabilities = selectedSequenceCapabilities(
    before,
    projectObservations(compiledTimeline, formation.sequence - 1),
    compiledTimeline.events,
    formation.sequence - 1,
  );
  const afterCapabilities = selectedSequenceCapabilities(
    after,
    projectObservations(compiledTimeline, formation.sequence),
    compiledTimeline.events,
    formation.sequence,
  );

  assert.equal(before.party, undefined);
  assert.equal(beforeCapabilities.party, false);
  assert.equal(after.party?.members.length, 2);
  assert.equal(afterCapabilities.party, true);
});

test("Party schema rejects a roster without its crawler roles", () => {
  const malformed = structuredClone(rawFloor1);
  const event = malformed.events.find((candidate) => candidate.id === "evt-f1-party-royal-court-formed");
  delete event.party.members[0].role;
  const result = validateRawCrawlerFloor(malformed);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("; "), /role|required/);
});

test("the Floor 2 Mongo narrative event cannot alter the crawler Party roster", () => {
  const mongo = compiledTimeline.events.find((event) => event.id === "evt-f2-mongo-bonded");
  assert.ok(mongo);
  const afterMongo = projectState(compiledTimeline, mongo.sequence);
  assert.deepEqual(afterMongo.party?.members.map((member) => member.crawlerId), ["crawler-donut", "crawler-carl"]);
});
