import type { CanonCapabilities } from "../../application/capabilities";
import { availableRootViews, resolveRootView } from "./capabilities.ts";
import { ROOT_NAVIGATION, type RootView } from "./navigation-model.ts";

export type NavigationSurfaceCategory =
  | "system_identity"
  | "primary_navigation"
  | "contextual_navigation"
  | "temporal_controls"
  | "contextual_status"
  | "feature_local"
  | "overlay_on_demand";

export interface NavigationSurfaceInventoryItem {
  surfaceId: string;
  label: string;
  currentOwner: string;
  purpose: string;
  scope: "system" | "context" | "feature" | "peripheral" | "on_demand";
  category: NavigationSurfaceCategory;
  disposition: "keep" | "merge" | "remove";
  reason: string;
}

/**
 * Surface inventory mapping for the 4-level navigation and system chrome hierarchy.
 */
export const NAVIGATION_SURFACE_INVENTORY: readonly NavigationSurfaceInventoryItem[] = [
  {
    surfaceId: "masthead_identity",
    label: "Crawler Identity & Class",
    currentOwner: "PersistentHud / deriveHudComposition",
    purpose: "Persistent indication of active crawler context and system identity",
    scope: "system",
    category: "system_identity",
    disposition: "keep",
    reason: "Essential persistent system context; not a button or contextual header",
  },
  {
    surfaceId: "primary_navigation_tabs",
    label: "Root Navigation Tabs",
    currentOwner: "RootNavigation",
    purpose: "Application-level root domain switcher, capability-filtered",
    scope: "system",
    category: "primary_navigation",
    disposition: "keep",
    reason: "Primary navigation contract for root views (Crawler, Inventory, etc.)",
  },
  {
    surfaceId: "system_tools_trigger",
    label: "System Tools Button",
    currentOwner: "RootNavigation -> WorkspaceOverlays -> TimelineToolsModal",
    purpose: "Access peripheral application tools (import/export/reset, presentation mode)",
    scope: "peripheral",
    category: "temporal_controls",
    disposition: "keep",
    reason: "Peripheral application utility with single clear modal owner",
  },
  {
    surfaceId: "replay_transport_controls",
    label: "Replay Transport & Scrubber",
    currentOwner: "ReplayControls / ReplaySurface",
    purpose: "Time travel, sequence stepping, scrubbing, and Return to Live",
    scope: "peripheral",
    category: "temporal_controls",
    disposition: "keep",
    reason: "Peripheral application controls; kept distinct from semantic HUD state",
  },
  {
    surfaceId: "floor_navigator",
    label: "Floor Scope Navigator",
    currentOwner: "ReplayControls",
    purpose: "Select floor scope for replay inspection",
    scope: "peripheral",
    category: "contextual_navigation",
    disposition: "keep",
    reason: "Peripheral replay floor context selector",
  },
  {
    surfaceId: "replay_inspection_tools",
    label: "Replay Inspection Triggers",
    currentOwner: "ReplayControls",
    purpose: "Launch Floor Rules, History, Telemetry, and Clock Evidence overlays",
    scope: "on_demand",
    category: "overlay_on_demand",
    disposition: "keep",
    reason: "Peripheral triggers for on-demand inspection modals",
  },
  {
    surfaceId: "level_collapse_clock",
    label: "Level Collapse Urgency Clock",
    currentOwner: "PersistentHud / deriveHudComposition",
    purpose: "Displays floor collapse countdown and lifecycle status",
    scope: "context",
    category: "contextual_status",
    disposition: "keep",
    reason: "Critical system urgency status in HUD composition model",
  },
  {
    surfaceId: "broadcast_audience_context",
    label: "Audience / Broadcast Reading",
    currentOwner: "PersistentHud / deriveHudComposition",
    purpose: "Displays source-backed viewer telemetry",
    scope: "context",
    category: "contextual_status",
    disposition: "keep",
    reason: "Source-backed audience status in HUD composition model",
  },
  {
    surfaceId: "telemetry_vitals_readings",
    label: "Vitals Readings (Health, Mana, Level)",
    currentOwner: "PersistentHud / deriveHudComposition",
    purpose: "Core crawler vitals telemetry",
    scope: "context",
    category: "contextual_status",
    disposition: "keep",
    reason: "Essential vitals telemetry status in HUD composition model",
  },
  {
    surfaceId: "attention_summary_badge",
    label: "Attention Summary & Alert Indicator",
    currentOwner: "PersistentHud / deriveHudComposition",
    purpose: "Expresses active alert and notification counts",
    scope: "system",
    category: "contextual_status",
    disposition: "keep",
    reason: "System attention summary status",
  },
  {
    surfaceId: "hotlist_action_bar",
    label: "Skill Hotlist Bar",
    currentOwner: "PersistentHud / Hotlist",
    purpose: "Quick visibility and assignment bar for active hotlist skills",
    scope: "feature",
    category: "feature_local",
    disposition: "keep",
    reason: "Contextual skill bar present in HUD area without duplicating root navigation",
  },
  {
    surfaceId: "duplicate_concept_hud_return_to_live",
    label: "ConceptHud Return to Live Button",
    currentOwner: "ConceptHud",
    purpose: "Embedded Return to Live capability control inside HUD header",
    scope: "system",
    category: "temporal_controls",
    disposition: "remove",
    reason: "Violates capability separation: Return to Live is an application capability, not semantic HUD state; duplicated ReplayControls button",
  },
  {
    surfaceId: "feature_local_tabs",
    label: "Feature-Local Category & Filter Controls",
    currentOwner: "Feature Views (InventoryView, EquipmentView, SkillsView, etc.)",
    purpose: "Local domain filtering, inspectors, and sub-view controls",
    scope: "feature",
    category: "feature_local",
    disposition: "keep",
    reason: "Domain-specific local controls that must remain within feature views",
  },
  {
    surfaceId: "modal_overlay_stack",
    label: "Modal & Provenance Overlays",
    currentOwner: "WorkspaceOverlays / ModalBoundary",
    purpose: "On-demand detail, provenance, floor rules, history, system tools",
    scope: "on_demand",
    category: "overlay_on_demand",
    disposition: "keep",
    reason: "Deterministic overlay stack using ModalBoundary focus trap and Escape handling",
  },
] as const;

export interface NavigationItemContract {
  id: RootView;
  label: string;
  shortcutKey: string;
  isAvailable: boolean;
  isActive: boolean;
}

export interface PrimaryNavigationContract {
  items: readonly NavigationItemContract[];
  activeView: RootView;
  availableViews: readonly RootView[];
}

export interface TemporalControlsContract {
  mode: "live" | "replay";
  isLive: boolean;
  canReturnToLive: boolean;
  selectedSequence: number;
}

export interface OverlayStateContract {
  activeOverlay: string | null;
  hasActiveModal: boolean;
}

/**
 * Renderer-neutral System Chrome and Navigation Contract snapshot.
 */
export interface SystemChromeContract {
  inventory: readonly NavigationSurfaceInventoryItem[];
  primaryNavigation: PrimaryNavigationContract;
  temporalControls: TemporalControlsContract;
  overlays: OverlayStateContract;
}

export interface DeriveNavigationContractInput {
  capabilities: CanonCapabilities;
  activeView: RootView;
  isLive: boolean;
  selectedSequence: number;
  activeOverlay?: string | null;
}

/**
 * Derives the renderer-neutral navigation and system chrome contract snapshot.
 */
export function deriveNavigationContract({
  capabilities,
  activeView,
  isLive,
  selectedSequence,
  activeOverlay = null,
}: DeriveNavigationContractInput): SystemChromeContract {
  const available = availableRootViews(capabilities);
  const resolvedActive = resolveRootView(activeView, capabilities);

  const items: NavigationItemContract[] = ROOT_NAVIGATION.map((item, idx) => {
    const isAvailable = Boolean(capabilities[item.id]);
    return {
      id: item.id,
      label: item.label,
      shortcutKey: String(idx + 1),
      isAvailable,
      isActive: resolvedActive === item.id,
    };
  });

  return {
    inventory: NAVIGATION_SURFACE_INVENTORY,
    primaryNavigation: {
      items,
      activeView: resolvedActive,
      availableViews: available,
    },
    temporalControls: {
      mode: isLive ? "live" : "replay",
      isLive,
      canReturnToLive: !isLive,
      selectedSequence,
    },
    overlays: {
      activeOverlay,
      hasActiveModal: activeOverlay !== null,
    },
  };
}
