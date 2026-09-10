import type { AttributeName, CrawlerState, ProjectedObservationsState, ProjectedObservationValue } from "../../../../app/domain/types";
import { TelemetryBadge, selectDisplayedReading } from "../../timeline/public";
import { Panel } from "../../../shared/ui/Panel";
import type { CrawlerActions } from "../../../application/crawler-action-contracts";

const INITIAL_ATTRIBUTE_DEFAULT = 10;
const INITIAL_LEVEL_DEFAULT = 1;
const INITIAL_XP_DEFAULT = 0;
const INITIAL_MAX_XP_DEFAULT = 1000;

export function PlayerStats({ state, observations, onInspectStat, onInspectObservation, actions }: {
  state: CrawlerState;
  observations: ProjectedObservationsState;
  onInspectStat: (stat: string) => void;
  onInspectObservation: (observation: ProjectedObservationValue) => void;
  actions: CrawlerActions;
}) {
  const crawler = state.crawler;
  const level = selectDisplayedReading(crawler.level, observations.xpProgress.level?.value, INITIAL_LEVEL_DEFAULT, state.sequence);
  const xp = selectDisplayedReading(crawler.xp, observations.xpProgress.xp?.value, INITIAL_XP_DEFAULT, state.sequence);
  const maxXp = selectDisplayedReading(crawler.maxXp, observations.xpProgress.maxXp?.value, INITIAL_MAX_XP_DEFAULT, state.sequence);
  const xpPercent = maxXp ? Math.min(100, Math.round((Number(xp ?? 0) / Number(maxXp)) * 100)) : 0;
  const attributes: [AttributeName, string][] = [["Strength", "red"], ["Dexterity", "green"], ["Constitution", "yellow"], ["Intelligence", "blue"], ["Charisma", "purple"]];

  return <>
    <header className="profile">
      <div className="portrait">C</div>
      <div><p className="eyebrow">PLAYER STATS · ACTIVE CRAWLER</p><h1>{crawler.name}</h1><i>LEVEL {level ?? "—"}</i><i>RACE: {crawler.race || "—"}</i><i>CLASS: {crawler.class || "—"}</i></div>
      <div className="xp"><span>EXPERIENCE <b>{xp?.toLocaleString() ?? "—"} / {maxXp?.toLocaleString() ?? "—"}</b><TelemetryBadge observation={observations.xpProgress.xp || observations.xpProgress.maxXp} causalValue={crawler.xp} selectedSequence={state.sequence} onClick={() => { const observation = observations.xpProgress.xp || observations.xpProgress.maxXp; if (observation) onInspectObservation(observation); }} /></span><em><b style={{ width: `${xpPercent}%` }} /></em></div>
    </header>
    <Panel title="PLAYER ATTRIBUTES">
      <div className="stats">{attributes.map(([name, color]) => {
        const observation = observations.attributes[name];
        const value = selectDisplayedReading(crawler.attributes[name], observation?.value, INITIAL_ATTRIBUTE_DEFAULT, state.sequence);
        const canAllocate = crawler.availableAttributePoints > 0;
        return <div key={name} className="stat-row"><p className="stat-clickable" onClick={() => onInspectStat(name)}><span>{name} 🔍</span><b>{value ?? "—"}</b><TelemetryBadge observation={observation} causalValue={crawler.attributes[name]} selectedSequence={state.sequence} onClick={() => observation && onInspectObservation(observation)} /><em><i className={color} style={{ width: `${Math.min(100, Number(value || 0) * 2)}%` }} /></em></p><div className="attr-actions"><button className="attr-btn add" disabled={!canAllocate} onClick={() => canAllocate && actions.allocateAttribute(name)}>+1</button></div></div>;
      })}</div>
      <div className="points-banner"><span>AVAILABLE STAT POINTS</span><b className={crawler.availableAttributePoints > 0 ? "has-points" : ""}>{crawler.availableAttributePoints}</b><TelemetryBadge observation={observations.attributes.availableAttributePoints} causalValue={crawler.availableAttributePoints} selectedSequence={state.sequence} onClick={() => observations.attributes.availableAttributePoints && onInspectObservation(observations.attributes.availableAttributePoints)} /></div>
    </Panel>
  </>;
}
