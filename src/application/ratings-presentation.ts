import type { ProjectedObservationValue } from "../../app/domain/types";

export type RatingsMetricGroup = "audience" | "engagement" | "patronage" | "ranking" | "bounty";
export type RatingsMetric = {
  label: string;
  value: string | number;
  group: RatingsMetricGroup;
  observation: ProjectedObservationValue;
};

const definitions: Array<[keyof Record<string, ProjectedObservationValue>, string, RatingsMetricGroup, (value: number) => string | number]> = [
  ["viewers", "Views", "audience", value => value],
  ["followers", "Followers", "audience", value => value],
  ["favorites", "Favorites", "engagement", value => value],
  ["patrons", "Patrons", "patronage", value => value],
  ["leaderboardRank", "Floor rank", "ranking", value => `#${value}`],
  ["bounty", "Bounty", "bounty", value => value],
];

/** Derives the narrow Ratings surface from the selected temporal observation set. */
export function deriveRatingsPresentation(observations: Record<string, ProjectedObservationValue>): RatingsMetric[] {
  return definitions.flatMap(([key, label, group, format]) => {
    const observation = observations[key];
    return observation ? [{ label, value: format(observation.value), group, observation }] : [];
  });
}
