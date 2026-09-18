import type {
  CrawlerEvent,
  CrawlerState,
  ProjectedCountdownState,
  ProjectedObservationsState,
} from "../../../app/domain/types.ts";
import { projectNotifications } from "../../../app/domain/notifications.ts";
import type { CanonCapabilities } from "../../application/capabilities.ts";
import type { RootView } from "../navigation/navigation-model.ts";
import { availableRootViews } from "../navigation/capabilities.ts";

import {
  deriveCrawlerPresentation,
  type DerivedCrawlerPresentation,
} from "../../features/crawler/public.ts";
import {
  derivePartyPresentation,
  type DerivedPartyPresentation,
} from "../../features/party/public.ts";
import {
  derivePetPresentation,
  type DerivedPetPresentation,
} from "../../features/pet/public.ts";
import {
  deriveRatingsPresentation,
  type DerivedRatingsPresentation,
} from "../../features/ratings/public.ts";
import {
  deriveNotificationsPresentation,
  type DerivedNotificationItem,
  type DerivedNotificationsPresentation,
} from "../../features/notifications/public.ts";
import {
  deriveSkillsPresentation,
  type SkillsPresentation,
} from "../../features/skills/public.ts";
import {
  deriveInventoryPresentation,
  type DerivedInventoryPresentation,
  deriveEquipmentPresentation,
  type DerivedEquipmentPresentation,
  deriveAwardHistory,
  type AwardHistoryEntry,
} from "../../features/inventory/public.ts";

export interface AuthoritySystemIdentity {
  crawlerName: string;
  crawlerClass: string;
  floorTitle: string;
  sequence: number;
}

export interface AuthorityTemporalContext {
  mode: "live" | "replay";
  sequence: number;
  isLive: boolean;
  canReturnToLive: boolean;
}

export interface AuthorityUrgencyContext {
  activeCountdown: ProjectedCountdownState | null;
  hasUrgentCollapse: boolean;
  formattedLabel: string;
  lifecycleStatus?: "scheduled" | "active" | "completed";
}

export interface AuthorityAttentionContext {
  totalNotificationsCount: number;
  recentNotifications: DerivedNotificationItem[];
  hasActiveAlerts: boolean;
  hasUnclaimedRewards: boolean;
}

export interface AuthorityDomainSummary {
  crawler: DerivedCrawlerPresentation;
  party: DerivedPartyPresentation;
  pet: DerivedPetPresentation;
  ratings: DerivedRatingsPresentation;
  notifications: DerivedNotificationsPresentation;
  skills: SkillsPresentation;
  inventory: DerivedInventoryPresentation;
  equipment: DerivedEquipmentPresentation;
  awardHistory: AwardHistoryEntry[];
}

export interface AuthorityCompositionModel {
  system: AuthoritySystemIdentity;
  temporal: AuthorityTemporalContext;
  urgency: AuthorityUrgencyContext;
  attention: AuthorityAttentionContext;
  domains: AuthorityDomainSummary;
  capabilities: CanonCapabilities;
  navigation: {
    activeView: RootView;
    availableViews: RootView[];
  };
}

export interface DeriveAuthorityCompositionInput {
  projectedState: CrawlerState;
  projectedObservations: ProjectedObservationsState;
  activeCountdown: ProjectedCountdownState | null;
  events: CrawlerEvent[];
  sequence: number;
  isLive: boolean;
  floorHudTitle: string;
  capabilities: CanonCapabilities;
  activeView: RootView;
}

/**
 * Derives the layout-neutral, contextual Authority composition model.
 * Consumes feature-owned presentation contracts without reaching into raw events or projection implementations.
 */
export function deriveAuthorityComposition({
  projectedState,
  projectedObservations,
  activeCountdown,
  events,
  sequence,
  isLive,
  floorHudTitle,
  capabilities,
  activeView,
}: DeriveAuthorityCompositionInput): AuthorityCompositionModel {
  const crawler = deriveCrawlerPresentation(
    projectedState,
    projectedObservations,
  );

  const party = derivePartyPresentation({ party: projectedState.party });
  const pet = derivePetPresentation({ pets: projectedState.pets });
  const ratings = deriveRatingsPresentation({
    observations: projectedObservations.broadcast,
    isLive,
    sequence,
  });

  const rawNotifications = projectNotifications(events, sequence);
  const notifications = deriveNotificationsPresentation({
    notifications: rawNotifications,
    sequence,
  });

  const skills = deriveSkillsPresentation(
    projectedState.skills,
    projectedState.hotlist,
    "ALL SKILLS"
  );

  const awardHistory = deriveAwardHistory(events, sequence, projectedState.inventory);

  const inventory = deriveInventoryPresentation({
    inventory: projectedState.inventory,
    equippedSlots: projectedState.equippedSlots,
    observations: projectedObservations.inventory,
    crawler: projectedState.crawler,
    filter: "ALL ITEMS",
    search: "",
    sortOrder: "newest",
    selectedInstanceId: null,
    awards: awardHistory,
    isLive,
  });

  const equipment = deriveEquipmentPresentation({
    inventory: projectedState.inventory,
    equippedSlots: projectedState.equippedSlots,
    observations: projectedObservations.equipment,
    crawler: projectedState.crawler,
    selectedSlot: "TORSO",
    selectedCandidateId: null,
    isLive,
  });

  const availableViews = availableRootViews(capabilities);

  const totalNotificationsCount = notifications.totalCount;
  const recentNotifications = notifications.notifications.slice(0, 3);
  const hasActiveAlerts = notifications.notifications.some(
    (item) => item.severity === "warning" || item.severity === "critical"
  );
  const hasUnclaimedRewards = notifications.notifications.some(
    (item) => Boolean(item.rewards && item.rewards.length > 0)
  );

  const hasUrgentCollapse = Boolean(
    activeCountdown &&
      activeCountdown.lifecycleStatus === "active" &&
      activeCountdown.remainingSeconds <= 300
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
      recentNotifications,
      hasActiveAlerts,
      hasUnclaimedRewards,
    },
    domains: {
      crawler,
      party,
      pet,
      ratings,
      notifications,
      skills,
      inventory,
      equipment,
      awardHistory,
    },
    capabilities,
    navigation: {
      activeView,
      availableViews,
    },
  };
}
