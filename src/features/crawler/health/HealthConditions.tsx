import type { CrawlerState, ProjectedObservationsState, ProjectedObservationValue } from "../../../../app/domain/types";
import { TelemetryBadge } from "../../../../app/components/TelemetryBadge";
import { Panel } from "../../../shared/ui/Panel";

function Vital({ name, current, maximum, observation, causalValue, color, inspect }: { name: string; current?: number; maximum?: number; observation?: ProjectedObservationValue; causalValue?: unknown; color: string; inspect: (o: ProjectedObservationValue) => void }) {
  const percent = maximum ? Math.min(100, Math.round((Number(current ?? 0) / maximum) * 100)) : 0;
  return <p className="meter"><span>{name}<TelemetryBadge observation={observation} causalValue={causalValue} onClick={() => observation && inspect(observation)} /></span><b>{current?.toLocaleString() ?? "—"} / {maximum?.toLocaleString() ?? "—"}</b><em><i className={color} style={{ width: `${percent}%` }} /></em></p>;
}
export function HealthConditions({ state, observations, onInspectObservation }: { state: CrawlerState; observations: ProjectedObservationsState; onInspectObservation: (o: ProjectedObservationValue) => void }) {
  const condition = state.crawler.condition;
  const vital = (key: "currentHealth" | "maxHealth" | "currentMana" | "maxMana" | "currentStamina" | "maxStamina") => observations.condition[key]?.value ?? condition[key];
  const beneficial = state.effects.filter(effect => effect.type === "good");
  const harmful = state.effects.filter(effect => effect.type === "bad");
  return <div className="two-col">
    <Panel title="VITALS"><div className="meters"><Vital name="HEALTH" current={vital("currentHealth")} maximum={vital("maxHealth")} observation={observations.condition.currentHealth || observations.condition.maxHealth} causalValue={condition.currentHealth} color="red" inspect={onInspectObservation} /><Vital name="MANA" current={vital("currentMana")} maximum={vital("maxMana")} observation={observations.condition.currentMana || observations.condition.maxMana} causalValue={condition.currentMana} color="blue" inspect={onInspectObservation} /><Vital name="STAMINA" current={vital("currentStamina")} maximum={vital("maxStamina")} observation={observations.condition.currentStamina || observations.condition.maxStamina} causalValue={condition.currentStamina} color="yellow" inspect={onInspectObservation} /></div></Panel>
    <Panel title="CONDITIONS"><div className="effects"><p className="eyebrow">INJURIES</p><p>No explicitly sourced injuries.</p><p className="eyebrow">BENEFICIAL EFFECTS</p>{beneficial.length ? beneficial.map(e => <p key={e.effectId} className="good">{e.icon} {e.name} <b>{e.durationSeconds}s</b><small>{e.description}</small></p>) : <p>NONE</p>}<p className="eyebrow">HARMFUL EFFECTS</p>{harmful.length ? harmful.map(e => <p key={e.effectId} className="bad">{e.icon} {e.name} <b>{e.durationSeconds}s</b><small>{e.description}</small></p>) : <p>NONE</p>}<p className="eyebrow">OTHER / STATUS CONDITIONS</p><p>NONE SOURCED</p></div></Panel>
  </div>;
}
