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

const ORDINAL_WORDS: Record<number, string[]> = {
  1: ["FIRST", "1ST", "1"],
  2: ["SECOND", "2ND", "2"],
  3: ["THIRD", "3RD", "3"],
  4: ["FOURTH", "4TH", "4"],
  5: ["FIFTH", "5TH", "5"],
  6: ["SIXTH", "6TH", "6"],
  7: ["SEVENTH", "7TH", "7"],
  8: ["EIGHTH", "8TH", "8"],
  9: ["NINTH", "9TH", "9"],
  10: ["TENTH", "10TH", "10"],
};

export function isOrdinalRestated(title: string, ordinal: number): boolean {
  const norm = title
    .toUpperCase()
    .trim()
    .replace(/^FLOOR\s+/, "")
    .replace(/\s+FLOOR$/, "")
    .trim();

  if (norm === String(ordinal)) return true;
  const words = ORDINAL_WORDS[ordinal];
  if (words && words.includes(norm)) return true;
  return false;
}

export function formatFloorDisplay(title: string, ordinal?: number | "all"): string {
  if (!title) return "";
  const uppercaseTitle = title.toUpperCase().trim();
  if (typeof ordinal === "number") {
    if (isOrdinalRestated(uppercaseTitle, ordinal)) {
      return `FLOOR ${ordinal}`;
    }
    return `FLOOR ${ordinal} · ${uppercaseTitle}`;
  }
  return uppercaseTitle;
}

export function deriveNotificationAccessibleLabel(
  attention?: { currentSequenceNotificationCount: number; hasActiveAlerts: boolean }
): string {
  const count = attention?.currentSequenceNotificationCount ?? 0;
  const hasAlerts = attention?.hasActiveAlerts ?? false;

  if (count > 0 && hasAlerts) {
    return `Notifications: ${count} current notice${count === 1 ? "" : "s"}, active alert`;
  }
  if (count > 0) {
    return `Notifications: ${count} current notice${count === 1 ? "" : "s"}`;
  }
  if (hasAlerts) {
    return "Notifications: active alert";
  }
  return "Notifications: no active notices";
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
