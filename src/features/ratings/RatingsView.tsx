import type { CrawlerState, ProjectedObservationValue } from "../../../app/domain/types";
import { TelemetryBadge } from "../../../app/components/TelemetryBadge";
import { Panel } from "../../shared/ui/Panel";
export type RatingsMetricGroup = "audience" | "engagement" | "patronage" | "ranking" | "sponsorship" | "bounty" | "other";
type Metric = { label: string; value: string | number; group: RatingsMetricGroup; observation?: ProjectedObservationValue };
const headings: Record<RatingsMetricGroup, string> = { audience: "AUDIENCE", engagement: "ENGAGEMENT", patronage: "PATRONAGE", ranking: "RANKING", sponsorship: "SPONSORSHIP", bounty: "BOUNTY", other: "OTHER" };
export function RatingsView({ broadcast, observations, onInspectObservation }: { broadcast: CrawlerState["broadcast"]; observations: Record<string, ProjectedObservationValue>; onInspectObservation: (o: ProjectedObservationValue) => void }) {
  const viewers = observations.viewers?.value ?? broadcast.viewers;
  const followers = observations.followers?.value ?? broadcast.followers;
  const metrics: Metric[] = [
    { label: "Views", value: viewers, group: "audience", observation: observations.viewers },
    { label: "Followers", value: followers, group: "audience", observation: observations.followers },
    ...(observations.favorites ? [{ label: "Favorites", value: observations.favorites.value, group: "engagement" as const, observation: observations.favorites }] : []),
    ...(observations.patrons ? [{ label: "Patrons", value: observations.patrons.value, group: "patronage" as const, observation: observations.patrons }] : []),
    ...(observations.leaderboardRank ? [{ label: "Floor rank", value: `#${observations.leaderboardRank.value}`, group: "ranking" as const, observation: observations.leaderboardRank }] : broadcast.fameRank ? [{ label: "Fame rank", value: broadcast.fameRank, group: "ranking" as const }] : []),
    ...(broadcast.sponsorInterest ? [{ label: "Sponsor interest", value: "DETECTED", group: "sponsorship" as const }] : []),
    ...(observations.bounty ? [{ label: "Bounty", value: observations.bounty.value, group: "bounty" as const, observation: observations.bounty }] : []),
  ];
  const activeGroups = (["audience", "engagement", "patronage", "ranking", "sponsorship", "bounty", "other"] as RatingsMetricGroup[]).filter(group => metrics.some(metric => metric.group === group));
  return <section className="view-content"><header className="title"><div><p className="eyebrow">SOURCE-BACKED BROADCAST TELEMETRY</p><h1>RATINGS</h1></div><b>● LIVE AUDIENCE {viewers.toLocaleString()}</b></header><div className="broadcast-page">{activeGroups.map(group => <Panel key={group} title={headings[group]}><div className="audience">{metrics.filter(metric => metric.group === group).map(metric => <p key={metric.label} style={{ display: "flex", justifyContent: "space-between" }}><span><b>{typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}</b> {metric.label}</span><TelemetryBadge observation={metric.observation} causalValue={metric.observation ? undefined : metric.value} onClick={() => metric.observation && onInspectObservation(metric.observation)} /></p>)}</div></Panel>)}</div></section>;
}
