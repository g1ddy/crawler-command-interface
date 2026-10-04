import type {
  ActiveCountdownState,
  CrawlerState,
  ProjectedObservationsState,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";
import {
  deriveEvidencePresentation,
  evidenceGlanceMarker,
  mapEvidenceToSemantics,
} from "../../features/timeline/public.ts";
import type { PetPresentationSummary as HudPetSummary } from "../../features/pet/public.ts";
import type { RootView } from "../navigation/navigation-model.ts";
import type {
  PresentationMotionIntent,
  PresentationSemantics,
} from "../../presentation/semantic/public.ts";

export type { HudPetSummary };

export interface HudSystemIdentity {
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
  formattedLabel?: string;
  lifecycleStatus?: "scheduled" | "active" | "completed";
}

export interface HudAttentionSummary {
  totalNotificationsCount: number;
  hasActiveAlerts: boolean;
  latestNotificationTitle?: string;
  latestNotificationMessage?: string;
  motionIntent?: PresentationMotionIntent;
}

export type HudTelemetryKey = "viewers";

export interface HudEvidencePresentation {
  marker: string;
  detailLabel: string;
}

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
  evidence: HudEvidencePresentation;
  semantics: PresentationSemantics;
}

export interface HudBroadcastSummary {
  viewers?: ProjectedObservationValue;
}

/**
 * Renderer-neutral HUD composition model describing semantic presentation meaning.
 *
 * INVARIANTS:
 * - Expresses semantic presentation context (system context, temporal state, urgency, attention, broadcast, telemetryItems).
 * - Remains strictly renderer-neutral: MUST NOT contain CSS classes, styling tokens, border treatments,
 *   animation-library primitives, executable action callbacks, or renderer-specific component choices (e.g., Arwes/POC types).
 * - Capabilities and action contracts (e.g. Return to Live, sequence navigation, evidence inspection) retain their existing application
 *   ownership and are intentionally NOT modeled as action handlers or tool commands inside this composition model.
 * - Persistent chrome exposes cross-cutting system context; crawler identity, progression, and vitals are owned by the Crawler feature.
 */
export interface HudCompositionModel {
  system: HudSystemIdentity;
  temporal: HudTemporalContext;
  urgency: HudUrgencySummary;
  attention: HudAttentionSummary;
  broadcast: HudBroadcastSummary;
  pet?: HudPetSummary;
  telemetryItems: HudTelemetryPresentation[];
  activeView?: RootView;
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
  activeView?: RootView;
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
    evidence: {
      marker: evidenceGlanceMarker(evidence.state),
      detailLabel: evidence.label,
    },
    semantics,
  };
}

/**
 * Derives the renderer-neutral HUD composition model from replayed domain state slices and telemetry context.
 * Focuses strictly on HUD header/masthead context without domain event projection or hardcoded visual policies.
 */
export function deriveHudComposition({
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
  activeView,
}: DeriveHudCompositionInput): HudCompositionModel {
  const viewersItem = createTelemetryItem(
    "viewers",
    "AUDIENCE VIEWERS",
    projectedObservations.broadcast.viewers,
    sequence
  );

  return {
    system: {
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
      formattedLabel: activeCountdown?.formattedLabel,
      lifecycleStatus: activeCountdown?.lifecycleStatus,
    },
    attention: {
      ...notificationsSummary,
      motionIntent: attentionMotionIntent,
    },
    broadcast: {
      viewers: projectedObservations.broadcast.viewers,
    },
    pet: petSummary,
    telemetryItems: [viewersItem],
    activeView,
  };
}
