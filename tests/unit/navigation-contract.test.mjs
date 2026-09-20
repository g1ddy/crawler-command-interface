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

test("Navigation Research Inventory: surface inventory completeness and taxonomy categorization", () => {
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

  const establishedItems = NAVIGATION_SURFACE_INVENTORY.filter(
    (item) => item.disposition === "established",
  );
  const provisionalItems = NAVIGATION_SURFACE_INVENTORY.filter(
    (item) => item.disposition === "provisional",
  );
  const removedItems = NAVIGATION_SURFACE_INVENTORY.filter(
    (item) => item.disposition === "remove",
  );

  assert.ok(establishedItems.length > 0);
  assert.ok(provisionalItems.length > 0);
  assert.strictEqual(removedItems.length, 1);
  assert.strictEqual(removedItems[0].surfaceId, "duplicate_concept_hud_return_to_live");
});

test("Navigation Contract: derives runtime SystemChromeContract containing strictly consumed primary navigation data", () => {
  const contract = deriveNavigationContract({
    capabilities: mockCapabilitiesAllActive,
    activeView: "inventory",
  });

  assert.strictEqual("inventory" in contract, false);
  assert.strictEqual("overlays" in contract, false);
  assert.strictEqual("temporalControls" in contract, false);
  assert.ok(contract.primaryNavigation);
  assert.strictEqual(Object.keys(contract).length, 1);
});

test("Navigation Contract: derives primary navigation given full capability snapshot", () => {
  const contract = deriveNavigationContract({
    capabilities: mockCapabilitiesAllActive,
    activeView: "inventory",
  });

  assert.strictEqual(contract.primaryNavigation.activeView, "inventory");
  assert.strictEqual(contract.primaryNavigation.availableViews.length, 8);
  assert.strictEqual(contract.primaryNavigation.items.length, 8);

  const activeItem = contract.primaryNavigation.items.find((item) => item.id === "inventory");
  assert.ok(activeItem);
  assert.strictEqual(activeItem.isActive, true);
  assert.strictEqual(activeItem.isAvailable, true);
  assert.strictEqual("shortcutKey" in activeItem, false);
});

test("Navigation Contract: filters unavailable root views and falls back safely", () => {
  const contract = deriveNavigationContract({
    capabilities: mockCapabilitiesMinimal,
    activeView: "quests", // unavailable in minimal capabilities
  });

  // Since 'quests' is unavailable, it must fall back safely to 'crawler'
  assert.strictEqual(contract.primaryNavigation.activeView, "crawler");
  assert.strictEqual(contract.primaryNavigation.availableViews.length, 3);

  const questsItem = contract.primaryNavigation.items.find((item) => item.id === "quests");
  assert.ok(questsItem);
  assert.strictEqual(questsItem.isAvailable, false);
  assert.strictEqual(questsItem.isActive, false);
});
