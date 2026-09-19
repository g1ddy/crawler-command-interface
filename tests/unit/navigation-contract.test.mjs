import assert from "node:assert/strict";
import test from "node:test";
import {
  NAVIGATION_SURFACE_INVENTORY,
  deriveNavigationContract,
} from "../../src/shell/navigation/public.ts";

const mockCapabilitiesAllActive = {
  crawler: true,
  inventory: true,
  skills: true,
  quests: true,
  ratings: true,
  party: true,
  pet: true,
  notifications: true,
};

const mockCapabilitiesMinimal = {
  crawler: true,
  inventory: true,
  skills: true,
  quests: false,
  ratings: false,
  party: false,
  pet: false,
  notifications: false,
};

test("Navigation Contract: surface inventory completeness and taxonomy categorization", () => {
  assert.ok(Array.isArray(NAVIGATION_SURFACE_INVENTORY));
  assert.strictEqual(NAVIGATION_SURFACE_INVENTORY.length, 14);

  const categories = new Set(NAVIGATION_SURFACE_INVENTORY.map((item) => item.category));
  assert.ok(categories.has("system_identity"));
  assert.ok(categories.has("primary_navigation"));
  assert.ok(categories.has("contextual_navigation"));
  assert.ok(categories.has("temporal_controls"));
  assert.ok(categories.has("contextual_status"));
  assert.ok(categories.has("feature_local"));
  assert.ok(categories.has("overlay_on_demand"));

  const duplicateReturnToLive = NAVIGATION_SURFACE_INVENTORY.find(
    (item) => item.surfaceId === "duplicate_concept_hud_return_to_live",
  );
  assert.ok(duplicateReturnToLive);
  assert.strictEqual(duplicateReturnToLive.disposition, "remove");
});

test("Navigation Contract: derives primary navigation given full capability snapshot", () => {
  const contract = deriveNavigationContract({
    capabilities: mockCapabilitiesAllActive,
    activeView: "inventory",
    isLive: true,
    selectedSequence: 42,
    activeOverlay: null,
  });

  assert.strictEqual(contract.primaryNavigation.activeView, "inventory");
  assert.strictEqual(contract.primaryNavigation.availableViews.length, 8);
  assert.strictEqual(contract.primaryNavigation.items.length, 8);

  const activeItem = contract.primaryNavigation.items.find((item) => item.id === "inventory");
  assert.ok(activeItem);
  assert.strictEqual(activeItem.isActive, true);
  assert.strictEqual(activeItem.isAvailable, true);
});

test("Navigation Contract: filters unavailable root views and falls back safely", () => {
  const contract = deriveNavigationContract({
    capabilities: mockCapabilitiesMinimal,
    activeView: "quests", // unavailable in minimal capabilities
    isLive: false,
    selectedSequence: 10,
    activeOverlay: "stat_inspector",
  });

  // Since 'quests' is unavailable, it must fall back safely to 'crawler'
  assert.strictEqual(contract.primaryNavigation.activeView, "crawler");
  assert.strictEqual(contract.primaryNavigation.availableViews.length, 3);

  const questsItem = contract.primaryNavigation.items.find((item) => item.id === "quests");
  assert.ok(questsItem);
  assert.strictEqual(questsItem.isAvailable, false);
  assert.strictEqual(questsItem.isActive, false);

  assert.strictEqual(contract.overlays.activeOverlay, "stat_inspector");
  assert.strictEqual(contract.overlays.hasActiveModal, true);
});

test("Navigation Contract: separates Return to Live capability from semantic HUD state", () => {
  const liveContract = deriveNavigationContract({
    capabilities: mockCapabilitiesAllActive,
    activeView: "crawler",
    isLive: true,
    selectedSequence: 100,
  });

  assert.strictEqual(liveContract.temporalControls.mode, "live");
  assert.strictEqual(liveContract.temporalControls.isLive, true);
  assert.strictEqual(liveContract.temporalControls.canReturnToLive, false);

  const replayContract = deriveNavigationContract({
    capabilities: mockCapabilitiesAllActive,
    activeView: "crawler",
    isLive: false,
    selectedSequence: 25,
  });

  assert.strictEqual(replayContract.temporalControls.mode, "replay");
  assert.strictEqual(replayContract.temporalControls.isLive, false);
  assert.strictEqual(replayContract.temporalControls.canReturnToLive, true);
});
