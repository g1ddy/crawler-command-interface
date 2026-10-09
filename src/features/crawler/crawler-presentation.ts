import type {
  AttributeName,
  CrawlerState,
  ProjectedObservationsState,
  ProjectedObservationValue,
  ActiveEffect,
} from "../../../app/domain/types";
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
  current: number | null;
  maximum: number | null;
  causalValue: number | null;
  observation?: ProjectedObservationValue;
  displayAuthority: DisplayAuthority;
  color: "red" | "blue" | "yellow";
}

export interface DerivedCrawlerPresentation {
  sequence: number;
  name: string;
  crawlerNumber?: string;
  race: string;
  class: string;
  level: number | null | undefined;
  xp: number | undefined;
  maxXp: number | undefined;
  xpPercent: number | undefined;
  xpObservation?: ProjectedObservationValue;
  xpAuthority: DisplayAuthority;
  availablePoints: number | undefined;
  availablePointsObservation?: ProjectedObservationValue;
  availablePointsAuthority: DisplayAuthority;
  canAllocatePoints: boolean;
  sharedAttributesObservation?: ProjectedObservationValue;
  sharedAttributesAuthority?: DisplayAuthority;
  hasSharedAttributesEvidence: boolean;
  attributes: DerivedAttributePresentation[];
  vitals: DerivedVitalPresentation[];
  effects: {
    beneficial: ActiveEffect[];
    harmful: ActiveEffect[];
    injuries: ActiveEffect[];
    other: ActiveEffect[];
    status: "known-empty" | "established" | "unavailable";
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
  const name = crawler.name ?? "—";
  const crawlerNumber = crawler.crawlerNumber != null ? String(crawler.crawlerNumber) : undefined;

  const level = selectDisplayedReading(crawler.level, observations.xpProgress.level?.value, state.causalProvenance.level);
  const xp = selectDisplayedReading(crawler.xp, observations.xpProgress.xp?.value, state.causalProvenance.xp);
  const maxXp = selectDisplayedReading(crawler.maxXp, observations.xpProgress.maxXp?.value, state.causalProvenance.maxXp);
  const xpAuthority = displayedReadingAuthority(crawler.xp, observations.xpProgress.xp?.value, state.causalProvenance.xp);
  const xpObservation = observations.xpProgress.xp || observations.xpProgress.maxXp;

  const hasAvailablePointsEvidence =
    observations.attributes.availableAttributePoints?.value !== undefined ||
    state.causalProvenance.availableAttributePoints !== undefined;

  const availablePoints = hasAvailablePointsEvidence
    ? selectDisplayedReading(
        crawler.availableAttributePoints,
        observations.attributes.availableAttributePoints?.value,
        state.causalProvenance.availableAttributePoints,
      )
    : undefined;

  const availablePointsAuthority = displayedReadingAuthority(
    crawler.availableAttributePoints,
    observations.attributes.availableAttributePoints?.value,
    state.causalProvenance.availableAttributePoints,
  );
  const availablePointsObservation = observations.attributes.availableAttributePoints;
  // Action availability must follow the value the user is actually seeing. If the
  // selected replay observation says 0, the live causal value must not re-enable
  // an allocation control. Likewise, an unavailable displayed value is not enough
  // evidence to offer a state-changing action.
  const canAllocatePoints = availablePoints != null && availablePoints > 0;

  const xpPercent =
    xp != null && maxXp != null && Number(maxXp) > 0
      ? Math.min(100, Math.round((Number(xp) / Number(maxXp)) * 100))
      : undefined;

  const attributesMap = crawler.attributes || {};
  const causalAttributesMap = state.causalProvenance?.attributes || {};
  const attributes: DerivedAttributePresentation[] = ATTRIBUTE_CONFIGS.map(([name, color]) => {
    const obs = observations.attributes[name];
    const val = selectDisplayedReading(attributesMap[name], obs?.value, causalAttributesMap[name]);
    const auth = displayedReadingAuthority(attributesMap[name], obs?.value, causalAttributesMap[name]);
    return {
      name,
      color,
      value: val,
      causalValue: attributesMap[name],
      observation: obs,
      displayAuthority: auth,
    };
  });

  const firstAuth = attributes[0]?.displayAuthority;
  const firstObs = attributes[0]?.observation;
  const allSameAuth = attributes.length === 5 && attributes.every((a) => a.displayAuthority === firstAuth);
  let hasSharedAttributesEvidence = false;
  let sharedAttributesObservation: ProjectedObservationValue | undefined = undefined;
  let sharedAttributesAuthority: DisplayAuthority | undefined = undefined;

  if (allSameAuth) {
    if (firstAuth === "observation") {
      const allHaveObs = attributes.every((a) => a.observation !== undefined);
      if (allHaveObs) {
        const getObsKey = (o?: ProjectedObservationValue) =>
          o ? `${o.sequence}:${o.status}:${(o.referenceObservationIds || []).join(",")}` : "";
        const firstKey = getObsKey(firstObs);
        const allSameObs = attributes.every((a) => getObsKey(a.observation) === firstKey);
        if (allSameObs) {
          hasSharedAttributesEvidence = true;
          sharedAttributesObservation = firstObs;
          sharedAttributesAuthority = "observation";
        }
      }
    } else if (firstAuth === "causal") {
      const firstCausalSeq = causalAttributesMap[attributes[0].name];
      if (firstCausalSeq !== undefined) {
        const allSameCausal = attributes.every(
          (attribute) =>
            causalAttributesMap[attribute.name] === firstCausalSeq,
        );

        if (allSameCausal) {
          hasSharedAttributesEvidence = true;
          sharedAttributesAuthority = "causal";
        }
      }
    }
  }

  const condition = crawler.condition || {};
  const causalConditionMap = state.causalProvenance?.condition || {};
  const vitalVal = (key: keyof typeof condition): number | null => {
    const val = selectDisplayedReading(condition[key], observations.condition[key]?.value ?? null, causalConditionMap[key]);
    return val !== undefined ? val : null;
  };
  const vitalAuth = (key: "currentHealth" | "currentMana" | "currentStamina") =>
    displayedReadingAuthority(condition[key], observations.condition[key]?.value, causalConditionMap[key]);

  const vitals: DerivedVitalPresentation[] = [
    {
      name: "HEALTH",
      current: vitalVal("currentHealth"),
      maximum: vitalVal("maxHealth"),
      causalValue: condition.currentHealth ?? null,
      observation: observations.condition.currentHealth || observations.condition.maxHealth,
      displayAuthority: vitalAuth("currentHealth"),
      color: "red",
    },
    {
      name: "MANA",
      current: vitalVal("currentMana"),
      maximum: vitalVal("maxMana"),
      causalValue: condition.currentMana ?? null,
      observation: observations.condition.currentMana || observations.condition.maxMana,
      displayAuthority: vitalAuth("currentMana"),
      color: "blue",
    },
    {
      name: "STAMINA",
      current: vitalVal("currentStamina"),
      maximum: vitalVal("maxStamina"),
      causalValue: condition.currentStamina ?? null,
      observation: observations.condition.currentStamina || observations.condition.maxStamina,
      displayAuthority: vitalAuth("currentStamina"),
      color: "yellow",
    },
  ];

  const groupedEffects = groupConditions(state.effects);

  return {
    sequence: state.sequence,
    name,
    crawlerNumber,
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
    sharedAttributesObservation,
    sharedAttributesAuthority,
    hasSharedAttributesEvidence,
    attributes,
    vitals,
    effects: groupedEffects,
  };
}
