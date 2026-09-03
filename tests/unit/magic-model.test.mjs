import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { applyEvent, createInitialState, projectState } from "../../app/domain/projection.ts";
import { selectedSequenceCapabilities } from "../../src/shell/navigation/capabilities.ts";
import { projectObservations } from "../../app/domain/observations.ts";
import { validateRawCrawlerFloor } from "../../app/domain/validation.ts";

const rawFloor2 = JSON.parse(fs.readFileSync("data/raw/floors/floor-2.json", "utf8"));
const secondChance = compiledTimeline.events.find((event) => event.id === "evt-f2-dungeon-book-club");
const basicHealing = compiledTimeline.events.find((event) => event.id === "evt-f1-basic-healing-spell");
const puddleJumper = compiledTimeline.events.find((event) => event.id === "evt-f1-puddle-jumper-granted");
const protectiveShell = compiledTimeline.events.find((event) => event.id === "evt-f2-protective-shell-granted");

test("the Floors 1–2 spell grants preserve the smallest sourced acquisition facts", () => {
  assert.ok(basicHealing);
  assert.ok(puddleJumper);
  assert.ok(protectiveShell);
  assert.ok(secondChance);
  assert.deepEqual(basicHealing.spell, {
    spellId: "spell-basic-healing",
    name: "Basic healing spell",
    owner: "carl",
    abilityKind: "spell",
    acquisitionSource: { kind: "crawler-menu", name: "Magic menu tutorial" },
  });
  assert.deepEqual(puddleJumper.spell, {
    spellId: "spell-puddle-jumper",
    name: "Puddle Jumper",
    owner: "donut",
    abilityKind: "spell",
    acquisitionSource: { kind: "loot-box", name: "Post-Juicer loot boxes" },
  });
  assert.deepEqual(protectiveShell.spell, {
    spellId: "spell-protective-shell",
    name: "Protective Shell",
    owner: "carl",
    abilityKind: "spell",
    acquisitionSource: {
      kind: "equipment",
      name: "Enchanted BigBoi Boxers",
      itemInstanceId: "inst-f2-bigboi-boxers",
    },
  });
  assert.deepEqual(secondChance.spell, {
    spellId: "spell-second-chance",
    name: "Second Chance",
    owner: "donut",
    abilityKind: "spell",
    acquisitionSource: { kind: "dungeon-book", name: "Dungeon Book of the Floor Club" },
  });
  assert.equal(basicHealing.evidence[0].confidence, "confirmed");
  assert.equal(secondChance.evidence[0].confidence, "confirmed");
  assert.equal(puddleJumper.evidence[0].confidence, "corroborated");
  assert.equal(protectiveShell.evidence[0].confidence, "corroborated");
});

test("malformed spell grants fail raw schema validation", () => {
  const malformed = structuredClone(rawFloor2);
  const event = malformed.events.find((candidate) => candidate.id === "evt-f2-dungeon-book-club");
  delete event.spell.owner;
  const result = validateRawCrawlerFloor(malformed);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("; "), /owner|required/);
});

test("spell state obeys replay boundaries without entering skills or exposing a Magic capability", () => {
  const beforeHealing = projectState(compiledTimeline, basicHealing.sequence - 1);
  const before = projectState(compiledTimeline, puddleJumper.sequence - 1);
  const after = projectState(compiledTimeline, protectiveShell.sequence);
  const rewound = projectState(compiledTimeline, puddleJumper.sequence - 1);

  assert.deepEqual(beforeHealing.spells, []);
  assert.deepEqual(before.spells.map((spell) => spell.spellId), ["spell-basic-healing"]);
  assert.deepEqual(rewound.spells.map((spell) => spell.spellId), ["spell-basic-healing"]);
  assert.deepEqual(after.spells.map((spell) => spell.spellId), [
    "spell-basic-healing",
    "spell-puddle-jumper",
    "spell-protective-shell",
  ]);
  assert.equal(after.skills.some((skill) => ["Basic healing spell", "Puddle Jumper", "Protective Shell"].includes(skill.name)), false);

  const capabilities = selectedSequenceCapabilities(
    after,
    projectObservations(compiledTimeline, protectiveShell.sequence),
    compiledTimeline.events,
    protectiveShell.sequence,
  );
  assert.equal(Object.hasOwn(capabilities, "magic"), false);
});

test("the same spell granted to different owners preserves both acquisitions", () => {
  const baseEvent = {
    type: "SpellGranted",
    summary: "Second Chance granted",
    spell: {
      spellId: "spell-second-chance",
      name: "Second Chance",
      abilityKind: "spell",
      acquisitionSource: { kind: "dungeon-book", name: "Dungeon Book of the Floor Club" },
    },
  };

  const afterDonut = applyEvent(createInitialState(), {
    ...baseEvent,
    sequence: 1,
    spell: { ...baseEvent.spell, owner: "donut" },
  });
  const afterCarl = applyEvent(afterDonut, {
    ...baseEvent,
    sequence: 2,
    spell: { ...baseEvent.spell, owner: "carl" },
  });

  assert.deepEqual(
    afterCarl.spells.map(({ spellId, owner }) => [spellId, owner]),
    [["spell-second-chance", "donut"], ["spell-second-chance", "carl"]],
  );
});
