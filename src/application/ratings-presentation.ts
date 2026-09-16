import type { ProjectedObservationValue } from "../../app/domain/types";

export type RatingsMetricGroup = "audience" | "engagement" | "patronage" | "ranking" | "bounty";
export interface RatingsMetricPresentation { key: string; label: string; value: string | number; group: RatingsMetricGroup; observation: ProjectedObservationValue; }
export interface RatingsGroupPresentation { group: RatingsMetricGroup; title: string; metrics: RatingsMetricPresentation[]; }
export interface DerivedRatingsPresentation { audienceBadgeLabel: string; groups: RatingsGroupPresentation[]; hasMetrics: boolean; }

const headings: Record<RatingsMetricGroup, string> = { audience: "AUDIENCE", engagement: "ENGAGEMENT", patronage: "PATRONAGE", ranking: "RANKING", bounty: "BOUNTY" };
const definitions: Array<[string, string, RatingsMetricGroup, (value: number) => string | number]> = [
  ["viewers", "Views", "audience", value => value],
  ["followers", "Followers", "audience", value => value],
  ["favorites", "Favorites", "engagement", value => value],
  ["patrons", "Patrons", "patronage", value => value],
  ["leaderboardRank", "Floor rank", "ranking", value => `#${value}`],
  ["bounty", "Bounty", "bounty", value => value],
];

/** Derives the narrow Ratings surface from the selected temporal observation set. */
export function deriveRatingsPresentation(observations: Record<string, ProjectedObservationValue>, isLive: boolean): DerivedRatingsPresentation {
  const metrics = definitions.flatMap(([key, label, group, format]) => {
    const observation = observations[key];
    return observation ? [{ key, label, value: format(observation.value), group, observation }] : [];
  });
  const groups = (Object.keys(headings) as RatingsMetricGroup[])
    .map(group => ({ group, title: headings[group], metrics: metrics.filter(metric => metric.group === group) }))
    .filter(group => group.metrics.length > 0);
  const viewers = observations.viewers?.value;
  const viewersLabel = typeof viewers === "number" ? ` ${viewers.toLocaleString()}` : "";
  return { audienceBadgeLabel: `${isLive ? "● LIVE AUDIENCE" : "◷ REPLAY AUDIENCE"}${viewersLabel}`, groups, hasMetrics: metrics.length > 0 };
}
