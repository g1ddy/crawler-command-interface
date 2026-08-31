import type { CrawlerState, ProjectedObservationsState, ProjectedObservationValue } from "../../../../app/domain/types";
import { TelemetryBadge } from "../../../../app/components/TelemetryBadge";
import { Panel } from "../../../shared/ui/Panel";
import { groupConditions } from "./condition-presentation";

function Vital({ name, current, maximum, observation, causalValue, color, inspect }: { name: string; current?: number; maximum?: number; observation?: ProjectedObservationValue; causalValue?: unknown; color: string; inspect: (o: ProjectedObservationValue) => void }) {
  const percent = maximum ? Math.min(100, Math.round((Number(current ?? 0) / maximum) * 100)) : 0;
  return <p className="meter"><span>{name}<TelemetryBadge observation={observation} causalValue={causalValue} onClick={() => observation && inspect(observation)} /></span><b>{current?.toLocaleString() ?? "—"} / {maximum?.toLocaleString() ?? "—"}</b><em><i className={color} style={{ width: `${percent}%` }} /></em></p>;
}
export function HealthConditions({ state, observations, onInspectObservation }: { state: CrawlerState; observations: ProjectedObservationsState; onInspectObservation: (o: ProjectedObservationValue) => void }) {
  const condition = state.crawler.condition;
  const vital = (key: "currentHealth" | "maxHealth" | "currentMana" | "maxMana" | "currentStamina" | "maxStamina") => observations.condition[key]?.value ?? condition[key];
  const { beneficial, harmful, injuries, other } = groupConditions(state.effects);
  const renderEffects = (effects: CrawlerState["effects"], className?: string) => effects.length ? effects.map(e => <p key={e.effectId} className={className}>{e.icon} {e.name} <b>{e.durationSeconds}s</b><small>{e.description}</small></p>) : <p>NONE SOURCED</p>;
  return <div className="two-col">
    <Panel title="VITALS"><div className="meters"><Vital name="HEALTH" current={vital("currentHealth")} maximum={vital("maxHealth")} observation={observations.condition.currentHealth || observations.condition.maxHealth} causalValue={condition.currentHealth} color="red" inspect={onInspectObservation} /><Vital name="MANA" current={vital("currentMana")} maximum={vital("maxMana")} observation={observations.condition.currentMana || observations.condition.maxMana} causalValue={condition.currentMana} color="blue" inspect={onInspectObservation} /><Vital name="STAMINA" current={vital("currentStamina")} maximum={vital("maxStamina")} observation={observations.condition.currentStamina || observations.condition.maxStamina} causalValue={condition.currentStamina} color="yellow" inspect={onInspectObservation} /></div></Panel>
    <Panel title="CONDITIONS"><div className="effects"><p className="eyebrow">INJURIES</p>{renderEffects(injuries, "bad")}<p className="eyebrow">BENEFICIAL EFFECTS</p>{renderEffects(beneficial, "good")}<p className="eyebrow">HARMFUL EFFECTS</p>{renderEffects(harmful, "bad")}<p className="eyebrow">OTHER / STATUS CONDITIONS</p>{renderEffects(other)}</div></Panel>
  </div>;
}
