import type { ProjectedObservationValue } from "../../../app/domain/types";
import { TelemetryBadge } from "../timeline/public";
import { Panel } from "../../shared/ui/Panel";
import styles from "./RatingsView.module.css";
import type { RatingsMetricGroup, RatingsMetric } from "./ratings-presentation";

const headings: Record<RatingsMetricGroup, string> = { audience: "AUDIENCE", engagement: "ENGAGEMENT", patronage: "PATRONAGE", ranking: "RANKING", bounty: "BOUNTY" };

export function RatingsView({ metrics, viewers, selectedSequence, isLive, onInspectObservation }: { metrics: RatingsMetric[]; viewers?: ProjectedObservationValue; selectedSequence?: number; isLive: boolean; onInspectObservation: (o: ProjectedObservationValue) => void }) {
  const activeGroups = (Object.keys(headings) as RatingsMetricGroup[]).filter(group => metrics.some(metric => metric.group === group));
  return <section className={styles.viewContent}><header className={styles.title}><div><p className={styles.eyebrow}>BROADCAST TELEMETRY</p><h1>RATINGS</h1></div><b>{isLive ? "● LIVE AUDIENCE" : "◷ REPLAY AUDIENCE"}{viewers ? ` ${viewers.value.toLocaleString()}` : ""}</b></header>{metrics.length === 0 ? <Panel title="RATINGS UNAVAILABLE"><p>No authored broadcast metrics are available at this sequence.</p></Panel> : <div className={styles.broadcastPage}>{activeGroups.map(group => <Panel key={group} title={headings[group]}><div className={styles.audience}>{metrics.filter(metric => metric.group === group).map(metric => <p key={metric.label} style={{ display: "flex", justifyContent: "space-between" }}><span><b>{typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}</b> {metric.label}</span><TelemetryBadge observation={metric.observation} selectedSequence={selectedSequence} onClick={() => onInspectObservation(metric.observation)} /></p>)}</div></Panel>)}</div>}</section>;
}
