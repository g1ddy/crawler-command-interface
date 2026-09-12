import type { Skill } from "../../../app/domain/types.ts";

export interface HotlistSlotPresentation {
  slotIndex: number; // 0..9
  slotNumber: number; // 1..10
  skill?: Skill;
  isAssigned: boolean;
}

export interface CategoryFilterPresentation {
  id: string;
  label: string;
  count: number;
}

export interface SkillsPresentation {
  skills: Skill[];
  filteredSkills: Skill[];
  categoryFilters: CategoryFilterPresentation[];
  selectedSkill?: Skill;
  hotlistSlots: HotlistSlotPresentation[];
}

export const SKILLS_CATEGORY_FILTERS = ["ALL SKILLS", "ACTIVE", "PASSIVE", "COMBAT", "UTILITY"] as const;

export function filterSkills(skills: Skill[], filter: string): Skill[] {
  return skills.filter((s) => {
    if (filter === "ALL SKILLS") return true;
    if (filter === "ACTIVE") return s.category !== "passive";
    if (filter === "PASSIVE") return s.category === "passive";
    return s.category.toUpperCase() === filter;
  });
}

export function countCategorySkills(skills: Skill[], filter: string): number {
  if (filter === "ALL SKILLS") return skills.length;
  if (filter === "ACTIVE") return skills.filter((s) => s.category !== "passive").length;
  if (filter === "PASSIVE") return skills.filter((s) => s.category === "passive").length;
  return skills.filter((s) => s.category.toUpperCase() === filter).length;
}

export function deriveHotlistPresentation(hotlist: string[], skills: Skill[]): HotlistSlotPresentation[] {
  const skillsById = new Map(skills.map((skill) => [skill.skillId, skill]));
  return Array.from({ length: 10 }, (_, index) => {
    const skillId = hotlist[index];
    const skill = skillId ? skillsById.get(skillId) : undefined;
    return {
      slotIndex: index,
      slotNumber: index + 1,
      skill,
      isAssigned: Boolean(skill),
    };
  });
}

export function deriveSkillsPresentation(
  skills: Skill[],
  hotlist: string[],
  activeFilter: string,
  selectedSkillId?: string,
): SkillsPresentation {
  const filteredSkills = filterSkills(skills, activeFilter);
  const categoryFilters = SKILLS_CATEGORY_FILTERS.map((cat) => ({
    id: cat,
    label: cat,
    count: countCategorySkills(skills, cat),
  }));

  const selectedSkill = (selectedSkillId ? skills.find((s) => s.skillId === selectedSkillId) : undefined) ||
    filteredSkills[0] ||
    skills[0];

  const hotlistSlots = deriveHotlistPresentation(hotlist, skills);

  return {
    skills,
    filteredSkills,
    categoryFilters,
    selectedSkill,
    hotlistSlots,
  };
}
