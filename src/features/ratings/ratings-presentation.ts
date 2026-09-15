import type { ProjectedObservationValue } from "../../../app/domain/types";
import { deriveEvidencePresentation, type EvidencePresentation } from "../timeline/public.ts";

export type RatingsMetricGroup = "audience" | "engagement" | "patronage" | "ranking" | "bounty";

export const RATINGS_GROUP_HEADINGS: Record<RatingsMetricGroup, string> = {
  audience: "AUDIENCE",
  engagement: "ENGAGEMENT",
  patronage: "PATRONAGE",
  ranking: "RANKING",
  bounty: "BOUNTY",
};

export interface RatingsMetricPresentation {
  key: string;
  label: string;
  value: string | number;
  formattedValue: string;
  group: RatingsMetricGroup;
  observation: ProjectedObservationValue;
  evidence: EvidencePresentation;
}

export interface RatingsGroupPresentation {
  group: RatingsMetricGroup;
  title: string;
  metrics: RatingsMetricPresentation[];
}

export interface DeriveRatingsPresentationInput {
  observations?: Record<string, ProjectedObservationValue>;
  selectedSequence?: number;
  isLive?: boolean;
}

export interface DerivedRatingsPresentation {
  isLive: boolean;
  audienceBadgeLabel: string;
  totalViewersFormatted?: string;
  hasMetrics: boolean;
  groups: RatingsGroupPresentation[];
}

export type RatingsMetric = {
  label: string;
  value: string | number;
  group: RatingsMetricGroup;
  observation: ProjectedObservationValue;
};

const definitions: Array<[string, string, RatingsMetricGroup, (value: number) => string | number]> = [
  ["viewers", "Views", "audience", (value) => value],
  ["followers", "Followers", "audience", (value) => value],
  ["favorites", "Favorites", "engagement", (value) => value],
  ["patrons", "Patrons", "patronage", (value) => value],
  ["leaderboardRank", "Floor rank", "ranking", (value) => `#${value}`],
  ["bounty", "Bounty", "bounty", (value) => value],
];

export function projectRatingsMetrics(observations: Record<string, ProjectedObservationValue>): RatingsMetric[] {
  return definitions.flatMap(([key, label, group, format]) =>
    observations[key]
      ? [{ label, value: format(observations[key].value), group, observation: observations[key] }]
      : []
  );
}

export function deriveRatingsPresentation(input: DeriveRatingsPresentationInput): DerivedRatingsPresentation {
  const { observations = {}, selectedSequence, isLive = false } = input;
  const viewersObs = observations.viewers;

  const totalViewersFormatted = viewersObs && typeof viewersObs.value === "number"
    ? viewersObs.value.toLocaleString()
    : undefined;

  const audienceBadgeLabel = isLive
    ? `● LIVE AUDIENCE${totalViewersFormatted ? ` ${totalViewersFormatted}` : ""}`
    : `◷ REPLAY AUDIENCE${totalViewersFormatted ? ` ${totalViewersFormatted}` : ""}`;

  const allMetrics: RatingsMetricPresentation[] = definitions.flatMap(([key, label, group, format]) => {
    const obs = observations[key];
    if (!obs) return [];
    const rawVal = obs.value;
    const formattedVal = typeof rawVal === "number" ? rawVal.toLocaleString() : String(rawVal);
    const displayVal = format(rawVal);
    const finalVal = typeof displayVal === "number" ? displayVal.toLocaleString() : displayVal;

    return [
      {
        key,
        label,
        value: finalVal,
        formattedValue: formattedVal,
        group,
        observation: obs,
        evidence: deriveEvidencePresentation(obs, selectedSequence),
      },
    ];
  });

  const groupKeys = Object.keys(RATINGS_GROUP_HEADINGS) as RatingsMetricGroup[];
  const groups: RatingsGroupPresentation[] = groupKeys
    .map((group) => {
      const groupMetrics = allMetrics.filter((m) => m.group === group);
      return {
        group,
        title: RATINGS_GROUP_HEADINGS[group],
        metrics: groupMetrics,
      };
    })
    .filter((g) => g.metrics.length > 0);

  return {
    isLive,
    audienceBadgeLabel,
    totalViewersFormatted,
    hasMetrics: allMetrics.length > 0,
    groups,
  };
}
