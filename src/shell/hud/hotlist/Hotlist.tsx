import type { Skill } from "../../../../app/domain/types.ts";
import { deriveHotlistPresentation } from "../../../features/skills/public.ts";
import styles from "./Hotlist.module.css";

export function Hotlist({ hotlist, skills }: { hotlist: string[]; skills: Skill[] }) {
  if (hotlist.length === 0) return null;

  const slots = deriveHotlistPresentation(hotlist, skills);

  return (
    <section className={styles.hotlist} aria-label="Hotlist">
      <b className={styles.title}>HOTLIST</b>
      <div className={styles.slots}>
        {slots.map((slot) => {
          const { slotIndex, slotNumber, skill, isAssigned } = slot;
          return (
            <span
              key={slotIndex}
              className={styles.slot}
              data-assigned={isAssigned}
              title={skill ? `Slot ${slotNumber}: ${skill.name}` : `Slot ${slotNumber}: Empty`}
            >
              <small className={styles.slotNumber}>{slotNumber}</small>
              <i className={styles.icon} aria-hidden="true">
                {skill?.icon ?? "—"}
              </i>
              <em className={styles.label}>{skill?.name ?? "EMPTY"}</em>
            </span>
          );
        })}
      </div>
    </section>
  );
}
