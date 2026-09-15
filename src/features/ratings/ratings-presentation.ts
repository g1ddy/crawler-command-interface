import type { ProjectedObservationValue } from "../../../app/domain/types";
export type RatingsMetricGroup = "audience" | "engagement" | "patronage" | "ranking" | "bounty";
export type RatingsMetric = { label: string; value: string | number; group: RatingsMetricGroup; observation: ProjectedObservationValue };
const definitions: Array<[string, string, RatingsMetricGroup, (value: number) => string | number]> = [
  ["viewers", "Views", "audience", value => value], ["followers", "Followers", "audience", value => value], ["favorites", "Favorites", "engagement", value => value], ["patrons", "Patrons", "patronage", value => value], ["leaderboardRank", "Floor rank", "ranking", value => `#${value}`], ["bounty", "Bounty", "bounty", value => value],
];
export function projectRatingsMetrics(observations: Record<string, ProjectedObservationValue>): RatingsMetric[] {
  return definitions.flatMap(([key, label, group, format]) => observations[key] ? [{ label, value: format(observations[key].value), group, observation: observations[key] }] : []);
}
