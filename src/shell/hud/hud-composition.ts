import type {
  ActiveCountdownState,
  CrawlerState,
  ProjectedObservationsState,
} from "../../../app/domain/types.ts";
import type { PetPresentationSummary as HudPetSummary } from "../../features/pet/public.ts";
import type { RootView } from "../navigation/navigation-model.ts";
import type { PresentationMotionIntent } from "../../presentation/semantic/public.ts";

export type { HudPetSummary };

export interface HudSystemIdentity {
  floorTitle: string;
  floorOrdinal?: number | "all";
  sequence: number;
}

export function formatFloorDisplay(title: string, ordinal?: number | "all"): string {
  if (!title) return "";
  const uppercaseTitle = title.toUpperCase();
  if (typeof ordinal === "number") {
    if (uppercaseTitle.startsWith(`FLOOR ${ordinal}`)) {
      return uppercaseTitle;
    }
    return `FLOOR ${ordinal} · ${uppercaseTitle}`;
  }
  return uppercaseTitle;
}

export interface HudUrgencySummary {
  activeCountdown: ActiveCountdownState | null;
  formattedLabel: string;
  lifecycleStatus?: "scheduled" | "active" | "completed";
}

export interface HudAttentionSummary {
  totalNotificationsCount: number;
  currentSequenceNotificationCount: number;
  hasActiveAlerts: boolean;
  latestNotificationTitle?: string;
  latestNotificationMessage?: string;
  motionIntent?: PresentationMotionIntent;
}

export interface HudProgressionSummary {
  level: number | null;
  valueDisplay: string;
}

/**
 * Renderer-neutral HUD composition model describing semantic presentation meaning.
 *
 * INVARIANTS:
 * - Expresses persistent masthead context (system location, urgency countdown, notification attention, compact level progression).
 * - Remains strictly renderer-neutral: MUST NOT contain CSS classes, styling tokens, border treatments,
 *   animation-library primitives, executable action callbacks, or renderer-specific component choices.
 * - Capabilities and action contracts retain their existing application ownership outside this model.
 */
export interface HudCompositionModel {
  system: HudSystemIdentity;
  urgency: HudUrgencySummary;
  attention: HudAttentionSummary;
  progression: HudProgressionSummary;
  pet?: HudPetSummary;
  activeView?: RootView;
}

export interface DeriveHudCompositionInput {
  projectedObservations: ProjectedObservationsState;
  projectedState?: Pick<CrawlerState, "crawler">;
  activeCountdown: ActiveCountdownState | null;
  sequence: number;
  isLive?: boolean;
  floorHudTitle: string;
  selectedFloorOrdinal?: number | "all";
  notificationsSummary?: HudAttentionSummary;
  petSummary?: HudPetSummary;
  attentionMotionIntent?: PresentationMotionIntent;
  activeView?: RootView;
  crawlerLevel?: number | null;
}

/**
 * Derives the renderer-neutral HUD composition model from replayed domain state slices and persistent masthead context.
 * Focuses strictly on HUD header/masthead context without domain event projection or hardcoded visual policies.
 */
export function deriveHudComposition({
  projectedObservations,
  projectedState,
  activeCountdown,
  sequence,
  floorHudTitle,
  selectedFloorOrdinal,
  notificationsSummary = {
    totalNotificationsCount: 0,
    currentSequenceNotificationCount: 0,
    hasActiveAlerts: false,
  },
  petSummary,
  attentionMotionIntent,
  activeView,
  crawlerLevel,
}: DeriveHudCompositionInput): HudCompositionModel {
  const levelNum =
    crawlerLevel !== undefined
      ? crawlerLevel
      : (projectedObservations.xpProgress.level?.value ?? projectedState?.crawler?.level ?? null);

  const levelValueDisplay = levelNum !== null && levelNum !== undefined ? `LVL ${levelNum}` : "LVL —";

  return {
    system: {
      floorTitle: floorHudTitle,
      floorOrdinal: selectedFloorOrdinal,
      sequence,
    },
    urgency: {
      activeCountdown,
      formattedLabel: activeCountdown ? activeCountdown.formattedTime : "",
      lifecycleStatus: activeCountdown?.lifecycleStatus,
    },
    attention: {
      ...notificationsSummary,
      motionIntent: attentionMotionIntent,
    },
    progression: {
      level: levelNum,
      valueDisplay: levelValueDisplay,
    },
    pet: petSummary,
    activeView,
  };
}
