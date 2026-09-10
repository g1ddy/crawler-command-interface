import type { AttributeName, CrawlerState, ProjectedObservationsState, ProjectedObservationValue } from "../../../../app/domain/types";
import { displayedReadingAuthority, TelemetryBadge, selectDisplayedReading } from "../../timeline/public";
import { Panel } from "../../../shared/ui/Panel";
import type { CrawlerActions } from "../../../application/crawler-action-contracts";

export function PlayerStats({ state, observations, onInspectStat, onInspectObservation, actions }: {
  state: CrawlerState;
  observations: ProjectedObservationsState;
  onInspectStat: (stat: string) => void;
  onInspectObservation: (observation: ProjectedObservationValue) => void;
  actions: CrawlerActions;
}) {
  const crawler = state.crawler;
  const level = selectDisplayedReading(crawler.level, observations.xpProgress.level?.value, state.causalProvenance.level);
  const xp = selectDisplayedReading(crawler.xp, observations.xpProgress.xp?.value, state.causalProvenance.xp);
  const maxXp = selectDisplayedReading(crawler.maxXp, observations.xpProgress.maxXp?.value, state.causalProvenance.maxXp);
  const xpAuthority = displayedReadingAuthority(crawler.xp, observations.xpProgress.xp?.value, state.causalProvenance.xp);
  const availablePoints = selectDisplayedReading(crawler.availableAttributePoints, observations.attributes.availableAttributePoints?.value, state.causalProvenance.availableAttributePoints);
  const availablePointsAuthority = displayedReadingAuthority(crawler.availableAttributePoints, observations.attributes.availableAttributePoints?.value, state.causalProvenance.availableAttributePoints);
  const xpPercent = maxXp ? Math.min(100, Math.round((Number(xp ?? 0) / Number(maxXp)) * 100)) : 0;
  const attributes: [AttributeName, string][] = [["Strength", "red"], ["Dexterity", "green"], ["Constitution", "yellow"], ["Intelligence", "blue"], ["Charisma", "purple"]];

  return <>
    <header className="profile">
      <div className="portrait">C</div>
      <div><p className="eyebrow">PLAYER STATS · ACTIVE CRAWLER</p><h1>{crawler.name}</h1><i>LEVEL {level ?? "—"}</i><i>RACE: {crawler.race || "—"}</i><i>CLASS: {crawler.class || "—"}</i></div>
      <div className="xp"><span>EXPERIENCE <b>{xp?.toLocaleString() ?? "—"} / {maxXp?.toLocaleString() ?? "—"}</b><TelemetryBadge observation={observations.xpProgress.xp || observations.xpProgress.maxXp} causalValue={crawler.xp} displayAuthority={xpAuthority} selectedSequence={state.sequence} onClick={() => { const observation = observations.xpProgress.xp || observations.xpProgress.maxXp; if (observation) onInspectObservation(observation); }} /></span><em><b style={{ width: `${xpPercent}%` }} /></em></div>
    </header>
    <Panel title="PLAYER ATTRIBUTES">
      <div className="stats">{attributes.map(([name, color]) => {
        const observation = observations.attributes[name];
        const value = selectDisplayedReading(crawler.attributes[name], observation?.value, state.causalProvenance.attributes[name]);
        const displayAuthority = displayedReadingAuthority(crawler.attributes[name], observation?.value, state.causalProvenance.attributes[name]);
        const canAllocate = crawler.availableAttributePoints > 0;
        return <div key={name} className="stat-row"><p className="stat-clickable" onClick={() => onInspectStat(name)}><span>{name} 🔍</span><b>{value ?? "—"}</b><TelemetryBadge observation={observation} causalValue={crawler.attributes[name]} displayAuthority={displayAuthority} selectedSequence={state.sequence} onClick={() => observation && onInspectObservation(observation)} /><em><i className={color} style={{ width: `${Math.min(100, Number(value || 0) * 2)}%` }} /></em></p><div className="attr-actions"><button className="attr-btn add" disabled={!canAllocate} onClick={() => canAllocate && actions.allocateAttribute(name)}>+1</button></div></div>;
      })}</div>
      <div className="points-banner"><span>AVAILABLE STAT POINTS</span><b className={crawler.availableAttributePoints > 0 ? "has-points" : ""}>{availablePoints}</b><TelemetryBadge observation={observations.attributes.availableAttributePoints} causalValue={crawler.availableAttributePoints} displayAuthority={availablePointsAuthority} selectedSequence={state.sequence} onClick={() => observations.attributes.availableAttributePoints && onInspectObservation(observations.attributes.availableAttributePoints)} /></div>
    </Panel>
  </>;
}
