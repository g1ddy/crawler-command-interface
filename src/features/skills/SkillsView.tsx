import { useMemo, useState } from "react";
import type { CrawlerEvent, CrawlerState } from "../../../app/domain/types";
import { Panel } from "../../shared/ui/Panel";

export function SkillsView({
  state,
  onEmitEvent,
}: {
  state: CrawlerState;
  onEmitEvent: (evt: Partial<CrawlerEvent>) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [filter, setFilter] = useState<string>("ALL SKILLS");

  const skills = state.skills;
  const shown = useMemo(() => {
    return skills.filter((s) => {
      if (filter === "ALL SKILLS") return true;
      if (filter === "ACTIVE") return s.category !== "passive";
      if (filter === "PASSIVE") return s.category === "passive";
      return s.category.toUpperCase() === filter;
    });
  }, [skills, filter]);

  const selectedSkill = shown[selectedIdx] || shown[0] || skills[0];

  const handleAssignHotlist = (hotlistIndex: number) => {
    if (!selectedSkill) return;
    const currentHotlist = [...state.hotlist];
    currentHotlist[hotlistIndex] = selectedSkill.skillId;
    onEmitEvent({
      type: "HotlistUpdated",
      hotlist: currentHotlist,
      index: hotlistIndex,
      skillId: selectedSkill.skillId,
      summary: `Assigned ${selectedSkill.name} to hotlist slot #${hotlistIndex + 1}`,
    });
  };

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">ABILITY MANAGEMENT</p>
          <h1>SKILLS</h1>
        </div>
        <b>{skills.length} ABILITIES DISCOVERED</b>
      </header>

      <div className="skills">
        <Panel title="ABILITY TYPE">
          <div className="categories">
            {["ALL SKILLS", "ACTIVE", "PASSIVE", "COMBAT", "UTILITY"].map((x) => (
              <button className={filter === x ? "on" : ""} onClick={() => setFilter(x)} key={x}>
                {x}
                <b>{x === "ALL SKILLS" ? skills.length : x === "ACTIVE" ? skills.filter((skill) => skill.category !== "passive").length : x === "PASSIVE" ? skills.filter((skill) => skill.category === "passive").length : skills.filter((skill) => skill.category.toUpperCase() === x).length}</b>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="SKILL LIBRARY">
          <div className="skill-list">
            {shown.map((x, idx) => (
              <button
                className={selectedSkill?.skillId === x.skillId ? "selected" : ""}
                key={x.skillId}
                onClick={() => setSelectedIdx(idx)}
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
            <div className="hero">{selectedSkill.icon}</div>
            <h1>{selectedSkill.name.toUpperCase()}</h1>
            <i>{selectedSkill.rank}</i>
            <i className="active-tag">{selectedSkill.category.toUpperCase()} ABILITY</i>
            <dl className="details">
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

            <div style={{ marginTop: "14px" }}>
              <p className="eyebrow">ASSIGN TO HOTLIST SLOT</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    style={{
                      padding: "5px 9px",
                      fontSize: "9px",
                      background: state.hotlist[i] === selectedSkill.skillId ? "#0e3443" : "#09141d",
                      border: `1px solid ${state.hotlist[i] === selectedSkill.skillId ? "#1bd9ff" : "#244452"}`,
                      color: state.hotlist[i] === selectedSkill.skillId ? "#1bd9ff" : "#8ca8b3",
                    }}
                    onClick={() => handleAssignHotlist(i)}
                  >
                    Slot #{i + 1}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </div>

    </section>
  );
}
