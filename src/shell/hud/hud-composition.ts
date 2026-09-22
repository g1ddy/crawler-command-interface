import type {
  CrawlerState,
  ProjectedCountdownState,
  ProjectedObservationsState,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";
import {
  deriveEvidencePresentation,
  mapEvidenceToSemantics,
} from "../../features/timeline/public.ts";

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
}

export interface HudUrgencyContext {
  activeCountdown: ProjectedCountdownState | null;
  formattedLabel: string;
  lifecycleStatus?: "scheduled" | "active" | "completed";
}

export interface HudAttentionSummary {
  totalNotificationsCount: number;
  hasActiveAlerts: boolean;
  latestNotificationTitle?: string;
  latestNotificationMessage?: string;
}

export interface HudTelemetryItem {
  key: "health" | "mana" | "level" | "viewers";
  label: string;
  valueDisplay: string;
  badgeLabel: string;
  status: "present" | "known-empty" | "not-established" | "unknown" | "unavailable";
  authority?: "observed" | "estimated" | "causal";
  temporal?: "current" | "last-known";
  isInspectable: boolean;
  rawObservation?: ProjectedObservationValue | null;
}

export interface HudVitalsSummary {
  health?: ProjectedObservationValue;
  mana?: ProjectedObservationValue;
  level?: ProjectedObservationValue;
}

export interface HudBroadcastSummary {
  viewers?: ProjectedObservationValue;
}

/**
 * Renderer-neutral HUD composition model describing semantic presentation meaning.
 *
 * INVARIANTS:
 * - Expresses semantic presentation context (identity, temporal state, urgency, attention, vitals, broadcast, telemetryItems).
 * - Remains strictly renderer-neutral: MUST NOT contain CSS classes, styling tokens, border treatments,
 *   animation-library primitives, or renderer-specific component choices (e.g., Arwes/POC types).
 * - Capabilities and action contracts (e.g. Return to Live, sequence navigation) retain their existing application
 *   ownership and are intentionally NOT modeled as action handlers or tool commands inside this composition model.
 * - Explicitly PROVISIONAL: The current arrangement of identity, countdown, mode, audience, and vitals
 *   is an implementation slice and does not represent settled or final persistent HUD product requirements.
 */
export interface HudCompositionModel {
  system: HudSystemIdentity;
  temporal: HudTemporalContext;
  urgency: HudUrgencyContext;
  attention: HudAttentionSummary;
  vitals: HudVitalsSummary;
  broadcast: HudBroadcastSummary;
  telemetryItems: HudTelemetryItem[];
}

export interface DeriveHudCompositionInput {
  projectedState: CrawlerState;
  projectedObservations: ProjectedObservationsState;
  activeCountdown: ProjectedCountdownState | null;
  sequence: number;
  isLive: boolean;
  floorHudTitle: string;
  notificationsSummary?: HudAttentionSummary;
}

function createTelemetryItem(
  key: "health" | "mana" | "level" | "viewers",
  label: string,
  observation: ProjectedObservationValue | undefined | null,
  sequence: number
): HudTelemetryItem {
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
    status: semantics.status,
    authority: semantics.authority,
    temporal: semantics.temporal,
    isInspectable: Boolean(semantics.provenance?.inspectable) && Boolean(observation),
    rawObservation: observation ?? null,
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
    },
    urgency: {
      activeCountdown,
      formattedLabel: activeCountdown?.formattedLabel ?? "Collapse time unavailable",
      lifecycleStatus: activeCountdown?.lifecycleStatus,
    },
    attention: notificationsSummary,
    vitals: {
      health: projectedObservations.condition.currentHealth,
      mana: projectedObservations.condition.currentMana,
      level: projectedObservations.xpProgress.level,
    },
    broadcast: {
      viewers: projectedObservations.broadcast.viewers,
    },
    telemetryItems: [healthItem, manaItem, levelItem, viewersItem],
  };
}
