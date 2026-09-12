import type {
  AttributeName,
  CrawlerState,
  ProjectedObservationsState,
  ProjectedObservationValue,
  ActiveEffect,
} from "../../../app/domain/types.ts";
import {
  displayedReadingAuthority,
  selectDisplayedReading,
  type DisplayAuthority,
} from "../timeline/public.ts";
import { groupConditions } from "./health/condition-presentation.ts";

export interface DerivedAttributePresentation {
  name: AttributeName;
  color: "red" | "green" | "yellow" | "blue" | "purple";
  value: number | undefined;
  causalValue: number | undefined;
  observation?: ProjectedObservationValue;
  displayAuthority: DisplayAuthority;
}

export interface DerivedVitalPresentation {
  name: string;
  current?: number;
  maximum?: number;
  causalValue?: number;
  observation?: ProjectedObservationValue;
  displayAuthority: DisplayAuthority;
  color: "red" | "blue" | "yellow";
}

export interface DerivedCrawlerPresentation {
  sequence: number;
  name: string;
  race: string;
  class: string;
  level: number | undefined;
  xp: number | undefined;
  maxXp: number | undefined;
  xpPercent: number;
  xpObservation?: ProjectedObservationValue;
  xpAuthority: DisplayAuthority;
  availablePoints: number | undefined;
  availablePointsObservation?: ProjectedObservationValue;
  availablePointsAuthority: DisplayAuthority;
  canAllocatePoints: boolean;
  attributes: DerivedAttributePresentation[];
  vitals: DerivedVitalPresentation[];
  effects: {
    beneficial: ActiveEffect[];
    harmful: ActiveEffect[];
    injuries: ActiveEffect[];
    other: ActiveEffect[];
  };
}

const ATTRIBUTE_CONFIGS: Array<[AttributeName, "red" | "green" | "yellow" | "blue" | "purple"]> = [
  ["Strength", "red"],
  ["Dexterity", "green"],
  ["Constitution", "yellow"],
  ["Intelligence", "blue"],
  ["Charisma", "purple"],
];

export function deriveCrawlerPresentation(
  state: Pick<CrawlerState, "crawler" | "effects" | "sequence" | "causalProvenance">,
  observations: Pick<ProjectedObservationsState, "xpProgress" | "attributes" | "condition">,
): DerivedCrawlerPresentation {
  const crawler = state.crawler;
  const level = selectDisplayedReading(crawler.level, observations.xpProgress.level?.value, state.causalProvenance.level);
  const xp = selectDisplayedReading(crawler.xp, observations.xpProgress.xp?.value, state.causalProvenance.xp);
  const maxXp = selectDisplayedReading(crawler.maxXp, observations.xpProgress.maxXp?.value, state.causalProvenance.maxXp);
  const xpAuthority = displayedReadingAuthority(crawler.xp, observations.xpProgress.xp?.value, state.causalProvenance.xp);
  const xpObservation = observations.xpProgress.xp || observations.xpProgress.maxXp;

  const availablePoints = selectDisplayedReading(
    crawler.availableAttributePoints,
    observations.attributes.availableAttributePoints?.value,
    state.causalProvenance.availableAttributePoints,
  );
  const availablePointsAuthority = displayedReadingAuthority(
    crawler.availableAttributePoints,
    observations.attributes.availableAttributePoints?.value,
    state.causalProvenance.availableAttributePoints,
  );
  const availablePointsObservation = observations.attributes.availableAttributePoints;
  const canAllocatePoints = crawler.availableAttributePoints > 0;

  const xpPercent = maxXp ? Math.min(100, Math.round((Number(xp ?? 0) / Number(maxXp)) * 100)) : 0;

  const attributes: DerivedAttributePresentation[] = ATTRIBUTE_CONFIGS.map(([name, color]) => {
    const obs = observations.attributes[name];
    const val = selectDisplayedReading(crawler.attributes[name], obs?.value, state.causalProvenance.attributes[name]);
    const auth = displayedReadingAuthority(crawler.attributes[name], obs?.value, state.causalProvenance.attributes[name]);
    return {
      name,
      color,
      value: val,
      causalValue: crawler.attributes[name],
      observation: obs,
      displayAuthority: auth,
    };
  });

  const condition = crawler.condition;
  const vitalVal = (key: keyof typeof condition) =>
    selectDisplayedReading(condition[key], observations.condition[key]?.value, state.causalProvenance.condition[key]);
  const vitalAuth = (key: "currentHealth" | "currentMana" | "currentStamina") =>
    displayedReadingAuthority(condition[key], observations.condition[key]?.value, state.causalProvenance.condition[key]);

  const vitals: DerivedVitalPresentation[] = [
    {
      name: "HEALTH",
      current: vitalVal("currentHealth"),
      maximum: vitalVal("maxHealth"),
      causalValue: condition.currentHealth,
      observation: observations.condition.currentHealth || observations.condition.maxHealth,
      displayAuthority: vitalAuth("currentHealth"),
      color: "red",
    },
    {
      name: "MANA",
      current: vitalVal("currentMana"),
      maximum: vitalVal("maxMana"),
      causalValue: condition.currentMana,
      observation: observations.condition.currentMana || observations.condition.maxMana,
      displayAuthority: vitalAuth("currentMana"),
      color: "blue",
    },
    {
      name: "STAMINA",
      current: vitalVal("currentStamina"),
      maximum: vitalVal("maxStamina"),
      causalValue: condition.currentStamina,
      observation: observations.condition.currentStamina || observations.condition.maxStamina,
      displayAuthority: vitalAuth("currentStamina"),
      color: "yellow",
    },
  ];

  const groupedEffects = groupConditions(state.effects);

  return {
    sequence: state.sequence,
    name: crawler.name,
    race: crawler.race || "—",
    class: crawler.class || "—",
    level,
    xp,
    maxXp,
    xpPercent,
    xpObservation,
    xpAuthority,
    availablePoints,
    availablePointsObservation,
    availablePointsAuthority,
    canAllocatePoints,
    attributes,
    vitals,
    effects: groupedEffects,
  };
}
