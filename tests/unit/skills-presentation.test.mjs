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

test("filterSkills filters skills by category correctly including unknown category", () => {
  const skillsWithUnknownCategory = [
    ...mockSkills,
    {
      skillId: "sk-4",
      name: "Scutelliphily",
      owner: "donut",
    },
  ];

  assert.equal(filterSkills(skillsWithUnknownCategory, "ALL SKILLS").length, 4);
  assert.equal(filterSkills(skillsWithUnknownCategory, "ACTIVE").length, 2);
  assert.equal(filterSkills(skillsWithUnknownCategory, "PASSIVE").length, 1);
  assert.equal(filterSkills(skillsWithUnknownCategory, "COMBAT").length, 1);
  assert.equal(filterSkills(skillsWithUnknownCategory, "UTILITY").length, 1);
});

test("countCategorySkills returns accurate skill counts with unknown category skills", () => {
  const skillsWithUnknownCategory = [
    ...mockSkills,
    {
      skillId: "sk-4",
      name: "Scutelliphily",
      owner: "donut",
    },
  ];

  assert.equal(countCategorySkills(skillsWithUnknownCategory, "ALL SKILLS"), 4);
  assert.equal(countCategorySkills(skillsWithUnknownCategory, "ACTIVE"), 2);
  assert.equal(countCategorySkills(skillsWithUnknownCategory, "PASSIVE"), 1);
  assert.equal(countCategorySkills(skillsWithUnknownCategory, "COMBAT"), 1);
  assert.equal(countCategorySkills(skillsWithUnknownCategory, "UTILITY"), 1);
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

test("deriveSkillsPresentation compiles full presentation state and exposes skill ownership without fabrication", () => {
  const skillsWithOwnership = [
    {
      skillId: "sk-carl-1",
      name: "Cesta Punta",
      owner: "carl",
    },
    {
      skillId: "sk-donut-1",
      name: "Scutelliphily",
      owner: "donut",
    },
    {
      skillId: "sk-unknown-owner",
      name: "Generic Utility",
    },
  ];

  const presentation = deriveSkillsPresentation(skillsWithOwnership, [], "ALL SKILLS", "sk-carl-1");

  assert.equal(presentation.skills.length, 3);
  assert.equal(presentation.skills[0].owner, "carl");
  assert.equal(presentation.skills[1].owner, "donut");
  assert.equal(presentation.skills[2].owner, undefined);
});

test("isLive mutation gating disables hotlist assignment during replay", () => {
  let assignedSlot = null;
  const mockActions = {
    assignHotlistSlot: (slotIndex, skillId) => {
      assignedSlot = { slotIndex, skillId };
    },
  };

  const handleAssignHotlist = (isLive, selectedSkill, slotIndex) => {
    if (!isLive || !selectedSkill) return false;
    mockActions.assignHotlistSlot(slotIndex, selectedSkill.skillId);
    return true;
  };

  const selectedSkill = mockSkills[0];

  // 1. Live + selected skill -> assignment succeeds
  const liveResult = handleAssignHotlist(true, selectedSkill, 0);
  assert.equal(liveResult, true);
  assert.deepEqual(assignedSlot, { slotIndex: 0, skillId: "sk-1" });

  assignedSlot = null;

  // 2. Replay (isLive = false) + selected skill -> assignment disabled / rejected
  const replayResult = handleAssignHotlist(false, selectedSkill, 0);
  assert.equal(replayResult, false);
  assert.equal(assignedSlot, null);
});
