import type {
  ActiveCountdownState,
  CrawlerEvent,
  CrawlerState,
  Pet,
  ProjectedObservationsState,
  ProjectedObservationValue,
  TimelineEvent,
} from "../../../app/domain/types.ts";
import {
  deriveEvidencePresentation,
  mapEvidenceToSemantics,
} from "../../features/timeline/public.ts";
import {
  derivePetPresentation,
  mapPetStatusToSemantics,
} from "../../features/pet/public.ts";
import type {
  PresentationChange,
  PresentationMotionIntent,
  PresentationSemantics,
} from "../../presentation/semantic/public.ts";

export interface HudSystemIdentity {
  crawlerName: string;
  crawlerClass: string;
  floorTitle: string;
  sequence: number;
}

export interface HudTemporalContext {
  mode: "live" | "replay";
  sequence: number;
  isLive: boolean;
  motionIntent?: PresentationMotionIntent;
}

export interface HudUrgencySummary {
  activeCountdown: ActiveCountdownState | null;
  formattedLabel: string;
  lifecycleStatus?: "scheduled" | "active" | "completed";
}

export interface HudAttentionSummary {
  totalNotificationsCount: number;
  hasActiveAlerts: boolean;
  latestNotificationTitle?: string;
  latestNotificationMessage?: string;
  motionIntent?: PresentationMotionIntent;
}

export type HudTelemetryKey = "health" | "mana" | "level" | "viewers";

/**
 * BOUNDARY RULE:
 * Renderer-neutral presentation describes semantic meaning and inspectability;
 * executable application actions are wired outside the composition model.
 * The renderer chooses the physical affordance, while the application owns the action.
 */
export interface HudTelemetryPresentation {
  key: HudTelemetryKey;
  label: string;
  valueDisplay: string;
  badgeLabel: string;
  semantics: PresentationSemantics;
}

export interface HudVitalsSummary {
  health?: ProjectedObservationValue;
  mana?: ProjectedObservationValue;
  level?: ProjectedObservationValue;
}

export interface HudBroadcastSummary {
  viewers?: ProjectedObservationValue;
}

export interface HudPetSummary {
  hasPets: boolean;
  petCount: number;
  badgeLabel: string;
  semantics: PresentationSemantics;
  primaryPet?: {
    petId: string;
    displayName: string;
    hasExplicitName: boolean;
    species: string;
    speciesLabel: string;
    hostilityState: string;
    hostilityLabel: string;
    bondState: string;
    bondStateLabel: string;
    bondHolderLabel: string;
    title?: string;
    formattedTitle?: string;
    level?: number;
    formattedLevel?: string;
  };
  motionIntent?: PresentationMotionIntent;
}

/** Derives Pet summary and transition semantics for workspace composition. */
export function deriveWorkspacePetSummary({
  pets,
  events,
  currentSeq,
  isLivePetTransition = false,
}: {
  pets?: Pet[];
  events: (TimelineEvent | CrawlerEvent)[];
  currentSeq: number;
  isLivePetTransition?: boolean;
}): HudPetSummary {
  const derived = derivePetPresentation({ pets });
  const currentEvent = events.find((e) => (e.sequence ?? 0) === currentSeq);
  const eventType = currentEvent?.type;

  let change: PresentationChange | undefined = undefined;
  let motionIntent: PresentationMotionIntent | undefined = undefined;

  if (eventType === "PetAcquired") {
    change = "newly-established";
    if (isLivePetTransition) {
      motionIntent = "established";
    }
  } else if (
    eventType === "PetHostilityChanged" ||
    eventType === "PetBonded" ||
    eventType === "PetClassificationChanged"
  ) {
    change = "changed";
    if (isLivePetTransition) {
      motionIntent = "changed";
    }
  }

  const semantics = mapPetStatusToSemantics(derived.status, change);
  const primary = derived.pets[0];

  return {
    hasPets: derived.hasPets,
    petCount: derived.petCount,
    badgeLabel: derived.badgeLabel,
    semantics,
    primaryPet: primary
      ? {
          petId: primary.petId,
          displayName: primary.displayName,
          hasExplicitName: primary.hasExplicitName,
          species: primary.species,
          speciesLabel: primary.speciesLabel,
          hostilityState: primary.hostilityState,
          hostilityLabel: primary.hostilityLabel,
          bondState: primary.bondState,
          bondStateLabel: primary.bondStateLabel,
          bondHolderLabel: primary.bondHolderLabel,
          title: primary.title,
          formattedTitle: primary.formattedTitle,
          level: primary.level,
          formattedLevel: primary.formattedLevel,
        }
      : undefined,
    motionIntent,
  };
}

/**
 * Renderer-neutral HUD composition model describing semantic presentation meaning.
 *
 * INVARIANTS:
 * - Expresses semantic presentation context (identity, temporal state, urgency, attention, vitals, broadcast, telemetryItems).
 * - Remains strictly renderer-neutral: MUST NOT contain CSS classes, styling tokens, border treatments,
 *   animation-library primitives, executable action callbacks, or renderer-specific component choices (e.g., Arwes/POC types).
 * - Capabilities and action contracts (e.g. Return to Live, sequence navigation, evidence inspection) retain their existing application
 *   ownership and are intentionally NOT modeled as action handlers or tool commands inside this composition model.
 * - Explicitly PROVISIONAL: The current arrangement of identity, countdown, mode, audience, and vitals
 *   is an implementation slice and does not represent settled or final persistent HUD product requirements.
 */
export interface HudCompositionModel {
  system: HudSystemIdentity;
  temporal: HudTemporalContext;
  urgency: HudUrgencySummary;
  attention: HudAttentionSummary;
  vitals: HudVitalsSummary;
  broadcast: HudBroadcastSummary;
  pet?: HudPetSummary;
  telemetryItems: HudTelemetryPresentation[];
}

export interface DeriveHudCompositionInput {
  projectedState: CrawlerState;
  projectedObservations: ProjectedObservationsState;
  activeCountdown: ActiveCountdownState | null;
  sequence: number;
  isLive: boolean;
  floorHudTitle: string;
  notificationsSummary?: HudAttentionSummary;
  petSummary?: HudPetSummary;
  temporalMotionIntent?: PresentationMotionIntent;
  attentionMotionIntent?: PresentationMotionIntent;
}

function createTelemetryItem(
  key: HudTelemetryKey,
  label: string,
  observation: ProjectedObservationValue | undefined,
  sequence: number
): HudTelemetryPresentation {
  const evidence = deriveEvidencePresentation(observation, sequence);
  const semantics = mapEvidenceToSemantics(evidence);
  const valueDisplay =
    observation?.value !== undefined && observation?.value !== null
      ? `${observation.value}`
      : "— ABSENT";

  return {
    key,
    label,
    valueDisplay,
    badgeLabel: evidence.badgeLabel,
    semantics,
  };
}

/**
 * Derives the renderer-neutral HUD composition model from replayed domain state slices and telemetry context.
 * Focuses strictly on HUD header/masthead context without domain event projection or hardcoded visual policies.
 */
export function deriveHudComposition({
  projectedState,
  projectedObservations,
  activeCountdown,
  sequence,
  isLive,
  floorHudTitle,
  notificationsSummary = {
    totalNotificationsCount: 0,
    hasActiveAlerts: false,
  },
  petSummary,
  temporalMotionIntent,
  attentionMotionIntent,
}: DeriveHudCompositionInput): HudCompositionModel {
  const healthItem = createTelemetryItem(
    "health",
    "HEALTH",
    projectedObservations.condition.currentHealth,
    sequence
  );
  const manaItem = createTelemetryItem(
    "mana",
    "MANA",
    projectedObservations.condition.currentMana,
    sequence
  );
  const levelItem = createTelemetryItem(
    "level",
    "LEVEL",
    projectedObservations.xpProgress.level,
    sequence
  );
  const viewersItem = createTelemetryItem(
    "viewers",
    "AUDIENCE VIEWERS",
    projectedObservations.broadcast.viewers,
    sequence
  );

  return {
    system: {
      crawlerName: projectedState.crawler.name,
      crawlerClass: projectedState.crawler.class || "Class unknown",
      floorTitle: floorHudTitle,
      sequence,
    },
    temporal: {
      mode: isLive ? "live" : "replay",
      sequence,
      isLive,
      motionIntent: temporalMotionIntent,
    },
    urgency: {
      activeCountdown,
      formattedLabel: activeCountdown
        ? activeCountdown.formattedLabel
        : "Collapse time unavailable",
      lifecycleStatus: activeCountdown?.lifecycleStatus,
    },
    attention: {
      ...notificationsSummary,
      motionIntent: attentionMotionIntent,
    },
    vitals: {
      health: projectedObservations.condition.currentHealth,
      mana: projectedObservations.condition.currentMana,
      level: projectedObservations.xpProgress.level,
    },
    broadcast: {
      viewers: projectedObservations.broadcast.viewers,
    },
    pet: petSummary,
    telemetryItems: [healthItem, manaItem, levelItem, viewersItem],
  };
}
