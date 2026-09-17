import type { ProjectedObservationValue } from "../../../app/domain/types";

export type RatingsMetricGroup = "audience" | "engagement" | "patronage" | "ranking" | "bounty";

export interface RatingsMetric {
  label: string;
  value: string | number;
  group: RatingsMetricGroup;
  observation: ProjectedObservationValue;
}

export interface RatingsMetricPresentation extends RatingsMetric {
  key: string;
  formattedValue?: string;
  evidence: { state: "current" | "last-known", sourceSequence?: number };
}

export interface RatingsGroupPresentation {
  group: RatingsMetricGroup;
  title: string;
  metrics: RatingsMetricPresentation[];
}

export interface DerivedRatingsPresentation {
  audienceBadgeLabel: string;
  totalViewersFormatted?: string;
  hasMetrics: boolean;
  groups: RatingsGroupPresentation[];
}

const headings: Record<RatingsMetricGroup, string> = {
  audience: "AUDIENCE",
  engagement: "ENGAGEMENT",
  patronage: "PATRONAGE",
  ranking: "RANKING",
  bounty: "BOUNTY",
};

const definitions: Array<[string, string, RatingsMetricGroup, (value: number | string) => string | number]> = [
  ["viewers", "Views", "audience", value => value],
  ["followers", "Followers", "audience", value => value],
  ["favorites", "Favorites", "engagement", value => value],
  ["patrons", "Patrons", "patronage", value => value],
  ["leaderboardRank", "Floor rank", "ranking", value => `#${value}`],
  ["bounty", "Bounty", "bounty", value => value],
];

export function projectRatingsMetrics(observations: Record<string, ProjectedObservationValue>): RatingsMetric[] {
  return definitions.flatMap(([key, label, group, format]) => {
    const observation = observations[key];
    return observation
      ? [{ label, value: format(observation.value as number), group, observation }]
      : [];
  });
}

/** Derives the narrow Ratings surface from the selected temporal observation set. */
export function deriveRatingsPresentation({
  observations = {},
  }: {
  observations?: Record<string, ProjectedObservationValue>;
}): DerivedRatingsPresentation {
  const viewers = observations.viewers;
  const totalViewersFormatted = viewers && typeof viewers.value === "number"
    ? viewers.value.toLocaleString()
    : undefined;

  const metrics: RatingsMetricPresentation[] = definitions.flatMap(([key, label, group, format]) => {
    const observation = observations[key];
    if (!observation) return [];
    return [{
      key,
      label,
      value: format(observation.value as number),
      formattedValue: typeof observation.value === "number" ? observation.value.toLocaleString() : String(observation.value),
      group,
      observation,
      evidence: { state: observation.status === "stated" ? "current" : "last-known", sourceSequence: observation.sequence }
    }];
  });

  const groups = (Object.keys(headings) as RatingsMetricGroup[])
    .map(group => ({ group, title: headings[group], metrics: metrics.filter(metric => metric.group === group) }))
    .filter(group => group.metrics.length > 0);

  return {
    audienceBadgeLabel: `AUDIENCE${totalViewersFormatted ? ` ${totalViewersFormatted}` : ""}`,
    totalViewersFormatted,
    groups,
    hasMetrics: metrics.length > 0,
  };
}
