import type { ProjectedObservationValue } from "../../../app/domain/types";
import { TelemetryBadge } from "../../../app/components/TelemetryBadge";
import { Panel } from "../../shared/ui/Panel";
export type RatingsMetricGroup = "audience" | "engagement" | "patronage" | "ranking" | "bounty";
import { projectRatingsMetrics } from "./ratings-presentation";
const headings: Record<RatingsMetricGroup, string> = { audience: "AUDIENCE", engagement: "ENGAGEMENT", patronage: "PATRONAGE", ranking: "RANKING", bounty: "BOUNTY" };
export function RatingsView({ observations, isLive, sequence, onInspectObservation }: { observations: Record<string, ProjectedObservationValue>; isLive: boolean; sequence: number; onInspectObservation: (o: ProjectedObservationValue) => void }) {
  const metrics = projectRatingsMetrics(observations);
  const activeGroups = (Object.keys(headings) as RatingsMetricGroup[]).filter(group => metrics.some(metric => metric.group === group));
  const viewers = observations.viewers;
  return <section className="view-content"><header className="title"><div><p className="eyebrow">SOURCE-BACKED BROADCAST TELEMETRY · SEQUENCE #{sequence}</p><h1>RATINGS</h1></div><b>{isLive ? "● LIVE AUDIENCE" : "◷ REPLAY AUDIENCE"}{viewers ? ` ${viewers.value.toLocaleString()}` : ""}</b></header>{metrics.length === 0 ? <Panel title="RATINGS UNAVAILABLE"><p>No authored broadcast metrics are available at this sequence.</p></Panel> : <div className="broadcast-page">{activeGroups.map(group => <Panel key={group} title={headings[group]}><div className="audience">{metrics.filter(metric => metric.group === group).map(metric => <p key={metric.label} style={{ display: "flex", justifyContent: "space-between" }}><span><b>{typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}</b> {metric.label}</span><TelemetryBadge observation={metric.observation} onClick={() => onInspectObservation(metric.observation)} /></p>)}</div></Panel>)}</div>}</section>;
}
