import type { CanonCapabilities } from "../../application/capabilities";
import type { HudAttentionSummary } from "../hud/hud-composition.ts";
import { availableRootViews, resolveRootView } from "./capabilities.ts";
import { ROOT_NAVIGATION, type RootView } from "./navigation-model.ts";

export interface NavigationBadgeContract {
  count: number;
  hasActiveAlerts: boolean;
  label: string;
}

export interface NavigationItemContract {
  id: RootView;
  label: string;
  isAvailable: boolean;
  isActive: boolean;
  badge?: NavigationBadgeContract;
}

export interface PrimaryNavigationContract {
  items: readonly NavigationItemContract[];
  activeView: RootView;
  availableViews: readonly RootView[];
}

/**
 * Renderer-neutral System Chrome and Navigation Contract snapshot.
 * Focuses on primary application destinations and capability-driven active view selection.
 */
export interface SystemChromeContract {
  primaryNavigation: PrimaryNavigationContract;
}

export interface DeriveNavigationContractInput {
  capabilities: CanonCapabilities;
  activeView: RootView;
  notificationsSummary?: HudAttentionSummary;
}

/**
 * Derives the renderer-neutral primary navigation contract snapshot.
 */
export function deriveNavigationContract({
  capabilities,
  activeView,
  notificationsSummary,
}: DeriveNavigationContractInput): SystemChromeContract {
  const available = availableRootViews(capabilities);
  const resolvedActive = resolveRootView(activeView, capabilities);

  const items: NavigationItemContract[] = ROOT_NAVIGATION.map((item) => {
    const isAvailable = Boolean(capabilities[item.id]);

    let badge: NavigationBadgeContract | undefined = undefined;
    if (
      item.id === "notifications" &&
      notificationsSummary &&
      notificationsSummary.totalNotificationsCount > 0
    ) {
      const count = notificationsSummary.totalNotificationsCount;
      const hasActiveAlerts = notificationsSummary.hasActiveAlerts;
      badge = {
        count,
        hasActiveAlerts,
        label: `${count} ${count === 1 ? "notice" : "notices"}${hasActiveAlerts ? " (active alert)" : ""}`,
      };
    }

    return {
      id: item.id,
      label: item.label,
      isAvailable,
      isActive: resolvedActive === item.id,
      badge,
    };
  });

  return {
    primaryNavigation: {
      items,
      activeView: resolvedActive,
      availableViews: available,
    },
  };
}
