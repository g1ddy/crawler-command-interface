import type {
  CrawlerState,
  ProjectedCountdownState,
  ProjectedObservationsState,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";

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
  canReturnToLive: boolean;
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

export interface HudVitalsSummary {
  health?: ProjectedObservationValue;
  mana?: ProjectedObservationValue;
  level?: ProjectedObservationValue;
}

export interface HudBroadcastSummary {
  viewers?: ProjectedObservationValue;
}

export interface HudCompositionModel {
  system: HudSystemIdentity;
  temporal: HudTemporalContext;
  urgency: HudUrgencyContext;
  attention: HudAttentionSummary;
  vitals: HudVitalsSummary;
  broadcast: HudBroadcastSummary;
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

/**
 * Derives the renderer-neutral HUD composition model.
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
      canReturnToLive: !isLive,
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
  };
}
