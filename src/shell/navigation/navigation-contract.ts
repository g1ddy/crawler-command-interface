import type { CanonCapabilities } from "../../application/capabilities";
import { availableRootViews, resolveRootView } from "./capabilities.ts";
import { ROOT_NAVIGATION, type RootView } from "./navigation-model.ts";

export interface NavigationItemContract {
  id: RootView;
  label: string;
  isAvailable: boolean;
  isActive: boolean;
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
}

/**
 * Derives the renderer-neutral primary navigation contract snapshot.
 */
export function deriveNavigationContract({
  capabilities,
  activeView,
}: DeriveNavigationContractInput): SystemChromeContract {
  const available = availableRootViews(capabilities);
  const resolvedActive = resolveRootView(activeView, capabilities);

  const items: NavigationItemContract[] = ROOT_NAVIGATION.map((item) => {
    const isAvailable = Boolean(capabilities[item.id]);
    return {
      id: item.id,
      label: item.label,
      isAvailable,
      isActive: resolvedActive === item.id,
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
