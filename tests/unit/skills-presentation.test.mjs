import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveSkillsPresentation,
  deriveHotlistPresentation,
  filterSkills,
  countCategorySkills,
} from "../../src/features/skills/skills-presentation.ts";

const mockSkills = [
  {
    skillId: "sk-1",
    name: "Power Slash",
    icon: "⚔️",
    rank: "RANK 1",
    description: "Deals heavy physical damage.",
    cooldown: "5s",
    category: "combat",
    cost: "10 Mana",
  },
  {
    skillId: "sk-2",
    name: "Sprint",
    icon: "🏃",
    rank: "RANK 2",
    description: "Increases movement speed.",
    cooldown: "15s",
    category: "utility",
  },
  {
    skillId: "sk-3",
    name: "Tough Skin",
    icon: "🛡️",
    rank: "RANK 1",
    description: "Passively increases armor.",
    cooldown: "PASSIVE",
    category: "passive",
  },
];

test("filterSkills filters skills by category correctly", () => {
  assert.equal(filterSkills(mockSkills, "ALL SKILLS").length, 3);
  assert.equal(filterSkills(mockSkills, "ACTIVE").length, 2);
  assert.equal(filterSkills(mockSkills, "PASSIVE").length, 1);
  assert.equal(filterSkills(mockSkills, "COMBAT").length, 1);
  assert.equal(filterSkills(mockSkills, "UTILITY").length, 1);
});

test("countCategorySkills returns accurate skill counts", () => {
  assert.equal(countCategorySkills(mockSkills, "ALL SKILLS"), 3);
  assert.equal(countCategorySkills(mockSkills, "ACTIVE"), 2);
  assert.equal(countCategorySkills(mockSkills, "PASSIVE"), 1);
  assert.equal(countCategorySkills(mockSkills, "COMBAT"), 1);
  assert.equal(countCategorySkills(mockSkills, "UTILITY"), 1);
});

test("deriveHotlistPresentation maps hotlist slots to skills", () => {
  const hotlist = ["sk-1", "", "sk-3"];
  const slots = deriveHotlistPresentation(hotlist, mockSkills);

  assert.equal(slots.length, 10);
  assert.equal(slots[0].isAssigned, true);
  assert.equal(slots[0].skill?.name, "Power Slash");
  assert.equal(slots[1].isAssigned, false);
  assert.equal(slots[1].skill, undefined);
  assert.equal(slots[2].isAssigned, true);
  assert.equal(slots[2].skill?.name, "Tough Skin");
});

test("deriveSkillsPresentation compiles full presentation state", () => {
  const hotlist = ["sk-2"];
  const presentation = deriveSkillsPresentation(mockSkills, hotlist, "ACTIVE", "sk-2");

  assert.equal(presentation.skills.length, 3);
  assert.equal(presentation.filteredSkills.length, 2);
  assert.equal(presentation.selectedSkill?.skillId, "sk-2");
  assert.equal(presentation.hotlistSlots[0].skill?.skillId, "sk-2");
});
