import type { Skill } from "../../../../app/domain/types";

export function Hotlist({ hotlist, skills }: { hotlist: string[]; skills: Skill[] }) {
  if (hotlist.length === 0) return null;

  const skillsById = new Map(skills.map((skill) => [skill.skillId, skill]));

  return (
    <section className="hud-hotlist" aria-label="Hotlist">
      <b>HOTLIST</b>
      <div>
        {Array.from({ length: 10 }, (_, index) => {
          const skill = skillsById.get(hotlist[index]);
          return (
            <span key={index} title={skill ? `Slot ${index + 1}: ${skill.name}` : `Slot ${index + 1}: Empty`}>
              <small>{index + 1}</small>
              <i aria-hidden="true">{skill?.icon ?? "—"}</i>
              <em>{skill?.name ?? "EMPTY"}</em>
            </span>
          );
        })}
      </div>
    </section>
  );
}
