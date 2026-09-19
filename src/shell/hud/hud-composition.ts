import type {
  CrawlerState,
  ProjectedCountdownState,
  ProjectedObservationsState,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";
import { projectNotifications } from "../../../app/domain/notifications.ts";

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

/**
 * Level collapse urgency policy:
 * Active countdowns with 300 seconds (5 minutes) or less remaining until collapse
 * are flagged as urgent to allow renderers to provide appropriate visual focus.
 */
export const URGENT_COLLAPSE_THRESHOLD_SECONDS = 300;

export interface HudUrgencyContext {
  activeCountdown: ProjectedCountdownState | null;
  hasUrgentCollapse: boolean;
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
  events?: Parameters<typeof projectNotifications>[0];
}

/**
 * Derives the renderer-neutral HUD composition model.
 * Focuses strictly on HUD header/masthead context without eagerly deriving wholesale application domain trees.
 */
export function deriveHudComposition({
  projectedState,
  projectedObservations,
  activeCountdown,
  sequence,
  isLive,
  floorHudTitle,
  events = [],
}: DeriveHudCompositionInput): HudCompositionModel {
  const notifications = projectNotifications(events, sequence);
  const totalNotificationsCount = notifications.length;
  const hasActiveAlerts = notifications.some(
    (item) => item.severity === "warning" || item.severity === "critical"
  );
  const latestNotification = notifications[0];

  const hasUrgentCollapse = Boolean(
    activeCountdown &&
      activeCountdown.lifecycleStatus === "active" &&
      activeCountdown.remainingSeconds <= URGENT_COLLAPSE_THRESHOLD_SECONDS
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
      canReturnToLive: !isLive,
    },
    urgency: {
      activeCountdown,
      hasUrgentCollapse,
      formattedLabel: activeCountdown?.formattedLabel ?? "Collapse time unavailable",
      lifecycleStatus: activeCountdown?.lifecycleStatus,
    },
    attention: {
      totalNotificationsCount,
      hasActiveAlerts,
      latestNotificationTitle: latestNotification?.title,
      latestNotificationMessage: latestNotification?.message,
    },
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
