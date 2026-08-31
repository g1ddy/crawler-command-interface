import type { AttributeName, CrawlerEvent, CrawlerState, ProjectedObservationsState, ProjectedObservationValue } from "../../../../app/domain/types";
import { TelemetryBadge } from "../../../../app/components/TelemetryBadge";
import { Panel } from "../../../shared/ui/Panel";

export function PlayerStats({ state, observations, onInspectStat, onInspectObservation, onEmitEvent }: {
  state: CrawlerState;
  observations: ProjectedObservationsState;
  onInspectStat: (stat: string) => void;
  onInspectObservation: (observation: ProjectedObservationValue) => void;
  onEmitEvent: (event: Partial<CrawlerEvent>) => void;
}) {
  const crawler = state.crawler;
  const level = observations.xpProgress.level?.value ?? crawler.level;
  const xp = observations.xpProgress.xp?.value ?? crawler.xp;
  const maxXp = observations.xpProgress.maxXp?.value ?? crawler.maxXp;
  const xpPercent = maxXp ? Math.min(100, Math.round((Number(xp ?? 0) / Number(maxXp)) * 100)) : 0;
  const attributes: [AttributeName, string][] = [["Strength", "red"], ["Dexterity", "green"], ["Constitution", "yellow"], ["Intelligence", "blue"], ["Charisma", "purple"]];

  return <>
    <header className="profile">
      <div className="portrait">C</div>
      <div><p className="eyebrow">PLAYER STATS · ACTIVE CRAWLER</p><h1>{crawler.name}</h1><i>LEVEL {level ?? "—"}</i><i>RACE: {crawler.race || "—"}</i><i>CLASS: {crawler.class || "—"}</i></div>
      <div className="xp"><span>EXPERIENCE <b>{xp?.toLocaleString() ?? "—"} / {maxXp?.toLocaleString() ?? "—"}</b><TelemetryBadge observation={observations.xpProgress.xp || observations.xpProgress.maxXp} causalValue={crawler.xp} onClick={() => { const observation = observations.xpProgress.xp || observations.xpProgress.maxXp; if (observation) onInspectObservation(observation); }} /></span><em><b style={{ width: `${xpPercent}%` }} /></em></div>
    </header>
    <Panel title="PLAYER ATTRIBUTES · CLICK TO INSPECT PROVENANCE">
      <div className="stats">{attributes.map(([name, color]) => {
        const observation = observations.attributes[name];
        const value = observation?.value ?? crawler.attributes[name];
        const canAllocate = crawler.availableAttributePoints > 0;
        return <div key={name} className="stat-row"><p className="stat-clickable" onClick={() => onInspectStat(name)}><span>{name} 🔍</span><b>{value ?? "—"}</b><TelemetryBadge observation={observation} causalValue={crawler.attributes[name]} onClick={() => observation && onInspectObservation(observation)} /><em><i className={color} style={{ width: `${Math.min(100, Number(value || 0) * 2)}%` }} /></em></p><div className="attr-actions"><button className="attr-btn add" disabled={!canAllocate} onClick={() => canAllocate && onEmitEvent({ type: "AttributeModified", attribute: name, source: "allocation", delta: 1, summary: `Allocated +1 point to ${name}` })}>+1</button></div></div>;
      })}</div>
      <div className="points-banner"><span>AVAILABLE STAT POINTS</span><b className={crawler.availableAttributePoints > 0 ? "has-points" : ""}>{crawler.availableAttributePoints}</b><TelemetryBadge observation={observations.attributes.availableAttributePoints} causalValue={crawler.availableAttributePoints} onClick={() => observations.attributes.availableAttributePoints && onInspectObservation(observations.attributes.availableAttributePoints)} /></div>
    </Panel>
  </>;
}
