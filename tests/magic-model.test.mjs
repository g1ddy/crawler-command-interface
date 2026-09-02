import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline.ts";
import { projectState } from "../app/domain/projection.ts";
import { selectedSequenceCapabilities } from "../src/shell/navigation/capabilities.ts";
import { projectObservations } from "../app/domain/observations.ts";
import { validateRawCrawlerFloor } from "../app/domain/validation.ts";

const rawFloor2 = JSON.parse(fs.readFileSync("data/raw/floors/floor-2.json", "utf8"));
const grant = compiledTimeline.events.find((event) => event.id === "evt-f2-005-dungeon-book-club");

test("Second Chance is a valid, primary-sourced spell grant rather than a skill or party change", () => {
  assert.ok(grant);
  assert.equal(grant.type, "SpellGranted");
  assert.deepEqual(grant.spell, {
    spellId: "spell-second-chance",
    name: "Second Chance",
    owner: "donut",
    abilityKind: "spell",
    acquisitionSource: { kind: "dungeon-book", name: "Dungeon Book of the Floor Club" },
  });
  assert.equal(grant.evidence[0].sourceId, "src-book-1");
  assert.equal(grant.evidence[0].confidence, "confirmed");
});

test("malformed spell grants fail raw schema validation", () => {
  const malformed = structuredClone(rawFloor2);
  const event = malformed.events.find((candidate) => candidate.id === "evt-f2-005-dungeon-book-club");
  delete event.spell.owner;
  const result = validateRawCrawlerFloor(malformed);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("; "), /owner|required/);
});

test("spell state obeys replay boundaries without entering skills or exposing a Magic capability", () => {
  const before = projectState(compiledTimeline, grant.sequence - 1);
  const after = projectState(compiledTimeline, grant.sequence);
  const rewound = projectState(compiledTimeline, grant.sequence - 1);

  assert.deepEqual(before.spells, []);
  assert.deepEqual(rewound.spells, []);
  assert.equal(after.spells.length, 1);
  assert.equal(after.spells[0].owner, "donut");
  assert.equal(after.skills.some((skill) => skill.name === "Second Chance"), false);

  const capabilities = selectedSequenceCapabilities(
    after,
    projectObservations(compiledTimeline, grant.sequence),
    compiledTimeline.events,
    grant.sequence,
  );
  assert.equal(Object.hasOwn(capabilities, "magic"), false);
});
