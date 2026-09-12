import { useState } from "react";
import type { CrawlerState } from "../../../app/domain/types.ts";
import { Panel } from "../../shared/ui/Panel.tsx";
import type { SkillActions } from "../../application/crawler-action-contracts.ts";
import { deriveSkillsPresentation } from "./skills-presentation.ts";
import styles from "./SkillsView.module.css";

export function SkillsView({
  state,
  actions,
}: {
  state: CrawlerState;
  actions: SkillActions;
}) {
  const [selectedSkillId, setSelectedSkillId] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<string>("ALL SKILLS");

  const presentation = deriveSkillsPresentation(
    state.skills,
    state.hotlist,
    filter,
    selectedSkillId,
  );

  const { skills, filteredSkills, categoryFilters, selectedSkill, hotlistSlots } = presentation;

  const handleAssignHotlist = (hotlistIndex: number) => {
    if (!selectedSkill) return;
    actions.assignHotlistSlot(hotlistIndex, selectedSkill.skillId);
  };

  return (
    <section className={styles.viewContent}>
      <header className={styles.title}>
        <div>
          <p className={styles.eyebrow}>ABILITY MANAGEMENT</p>
          <h1>SKILLS</h1>
        </div>
        <b className={styles.titleCount}>{skills.length} ABILITIES DISCOVERED</b>
      </header>

      <div className={styles.skillsGrid}>
        <Panel title="ABILITY TYPE">
          <div className={styles.categories}>
            {categoryFilters.map((cat) => (
              <button
                className={filter === cat.id ? styles.on : ""}
                onClick={() => setFilter(cat.id)}
                key={cat.id}
              >
                {cat.label}
                <b>{cat.count}</b>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="SKILL LIBRARY">
          <div className={styles.skillList}>
            {filteredSkills.map((x) => (
              <button
                className={`${styles.skillItem} ${selectedSkill?.skillId === x.skillId ? styles.selected : ""}`}
                key={x.skillId}
                onClick={() => setSelectedSkillId(x.skillId)}
              >
                <i>{x.icon}</i>
                <span>
                  <b>{x.name}</b>
                  <small>{x.description}</small>
                </span>
                <em>{x.cooldown}</em>
              </button>
            ))}
          </div>
        </Panel>

        {selectedSkill && (
          <Panel title="SKILL INSPECTOR">
            <div className={styles.hero}>{selectedSkill.icon}</div>
            <h1 className={styles.inspectorTitle}>{selectedSkill.name.toUpperCase()}</h1>
            <i className={styles.badge}>{selectedSkill.rank}</i>
            <i className={`${styles.badge} ${styles.activeTag}`}>{selectedSkill.category.toUpperCase()} ABILITY</i>
            <dl className={styles.details}>
              <div>
                <dt>EFFECT</dt>
                <dd>{selectedSkill.description}</dd>
              </div>
              <div>
                <dt>COOLDOWN</dt>
                <dd>{selectedSkill.cooldown}</dd>
              </div>
              {selectedSkill.cost && (
                <div>
                  <dt>RESOURCE COST</dt>
                  <dd>{selectedSkill.cost}</dd>
                </div>
              )}
            </dl>

            <div className={styles.assignSection}>
              <p className={styles.eyebrow}>ASSIGN TO HOTLIST SLOT</p>
              <div className={styles.slotButtons}>
                {hotlistSlots.map((slot) => {
                  const isAssignedToThisSkill = slot.skill?.skillId === selectedSkill.skillId;
                  return (
                    <button
                      key={slot.slotIndex}
                      className={`${styles.slotBtn} ${isAssignedToThisSkill ? styles.assigned : ""}`}
                      onClick={() => handleAssignHotlist(slot.slotIndex)}
                      aria-label={`Assign to hotlist slot ${slot.slotNumber}`}
                    >
                      Slot #{slot.slotNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>
        )}
      </div>
    </section>
  );
}
