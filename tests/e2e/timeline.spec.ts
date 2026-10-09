import { expect, test, type Page } from "@playwright/test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { openReplayContext, enterReplayByScrubbing } from "../helpers/replay";

async function latestRuntimeSequence(page: Page): Promise<number> {
  const slider = page.getByRole("slider", {
    name: "Selected timeline sequence",
  });
  const max = await slider.getAttribute("max");
  expect(max).not.toBeNull();
  return Number(max);
}

async function selectSequence(page: Page, sequence: number) {
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill(String(sequence));
}

function floorEndSequence(ordinal: number) {
  const floor = (compiledTimeline.floors || []).find((candidate) => candidate.ordinal === ordinal);
  if (!floor) throw new Error(`Missing Floor ${ordinal} in the compiled timeline.`);
  return floor.endSequence;
}

function eventSequence(id: string) {
  const event = compiledTimeline.events.find((candidate) => candidate.id === id);
  if (!event) throw new Error(`Missing event ${id} in the compiled timeline.`);
  return event.sequence;
}

const floor1EndSequence = floorEndSequence(1);
const floor2EndSequence = floorEndSequence(2);
const floor2SystemPatchSequence = eventSequence("evt-f2-system-patch");

test.beforeEach(async ({ page }) => {
  await page.goto("/crawler-command-interface/");
});

test("scrubbing backward removes state that was introduced later", async ({ page }) => {
  const latestSequence = await latestRuntimeSequence(page);
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await expect(slider).toHaveValue(String(latestSequence));

  // Use a piece of state that demonstrably changes.
  // Let's use the audience count which is part of the persistent HUD telemetry/broadcast state.
  await expect(page.locator('header[aria-label="Crawler HUD"]')).toContainText("212,000,000,000");

  await enterReplayByScrubbing(page);
  await selectSequence(page, 1);

  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
  await expect(page.locator('header[aria-label="Crawler HUD"]')).not.toContainText("212,000,000,000");

  await page.getByRole("button", { name: "INVENTORY", exact: true }).click();
  await expect(page.locator("[class*='item']")).toHaveCount(0);
});

test("floor navigation selects derived floor endpoints", async ({ page }) => {
  const runtimeLatestSequence = await latestRuntimeSequence(page);
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });

  await enterReplayByScrubbing(page);
  await openReplayContext(page);
  const floors = page.getByRole("combobox", { name: "Select floor context" });

  await floors.selectOption("1");
  await page.getByRole("button", { name: "Close timeline controls" }).click();
  await expect(slider).toHaveValue(String(floor1EndSequence));

  await openReplayContext(page);
  await page.getByRole("button", { name: /NEXT FLOOR/ }).click();
  await page.getByRole("button", { name: "Close timeline controls" }).click();
  await expect(slider).toHaveValue(String(floor2EndSequence));

  await openReplayContext(page);
  await page.getByRole("button", { name: /NEXT FLOOR/ }).click();
  await page.getByRole("button", { name: "Close timeline controls" }).click();
  await expect(slider).toHaveValue(String(runtimeLatestSequence));
});

test("timeline evidence surfaces preserve source locators and confidence", async ({ page }) => {
  await enterReplayByScrubbing(page);
  await selectSequence(page, floor2SystemPatchSequence);
  await openReplayContext(page);

  const secondaryCountdown = page.locator("[class*='secondaryCountdown']").filter({ hasText: "TIME TO SAFE ROOM CLOSURE" });
  await expect(secondaryCountdown).toContainText("EVIDENCE: src-dcc-database-floor-2");
  await expect(secondaryCountdown).toContainText("Floor Timeline & Patch Notes");
  await expect(secondaryCountdown).toContainText("CORROBORATED");

  await page.getByRole("button", { name: "📡 TELEMETRY", exact: true }).click();
  const evidenceModal = page.locator(".modal-content").filter({ hasText: "SOURCED HUD OBSERVATIONS" });
  const floorMetrics = evidenceModal.getByRole("heading", { name: "FLOOR METRICS" }).locator("..");
  await floorMetrics.locator(".telemetry-pill").first().click();
  const inspectorModal = page.locator(".modal-content").filter({ hasText: "TELEMETRY OBSERVATION & PROVENANCE" });
  await expect(inspectorModal).toContainText("CORROBORATED");
  await expect(inspectorModal).toContainText("Locator:");
});

test("Return to Live sequence restores the latest projection", async ({ page }) => {
  const latestSequence = await latestRuntimeSequence(page);
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });

  await enterReplayByScrubbing(page);
  await selectSequence(page, 1);
  await expect(page.locator('header[aria-label="Crawler HUD"]')).not.toContainText("212,000,000,000");

  await slider.fill(String(latestSequence));

  await expect(slider).toHaveValue(String(latestSequence));
  await expect(page.locator('header[aria-label="Crawler HUD"]')).toContainText("212,000,000,000");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "live");
});

test("inventory browser and inspector resolve the same visible selection", async ({ page }) => {
  await page.getByRole("button", { name: "INVENTORY", exact: true }).click();

  const itemCards = page.locator("[class*='item']");
  await expect(itemCards).not.toHaveCount(0);
  await expect(itemCards.first()).toHaveClass(/selected/);

  const secondItem = itemCards.nth(1);
  await expect(secondItem).toBeVisible();
  const secondItemName =
    (await secondItem.getAttribute("aria-label"))?.replace(/ \([^)]+\)$/, "") ?? "";
  expect(secondItemName).not.toBe("");

  await page.getByRole("textbox", { name: "Search items" }).fill(secondItemName);

  const visibleCard = page.locator("[class*='item']").first();
  await expect(visibleCard).toHaveClass(/selected/);
  await expect(page.getByRole("heading", { name: secondItemName.toUpperCase() })).toBeVisible();

  await page.getByRole("textbox", { name: "Search items" }).fill("");
  await page.getByRole("combobox", { name: "Sort items" }).selectOption("oldest");
  const oldestCard = page.locator("[class*='item']").first();
  const oldestItemName =
    (await oldestCard.getAttribute("aria-label"))?.replace(/ \([^)]+\)$/, "") ?? "";
  await expect(oldestCard).toHaveClass(/selected/);
  await expect(page.getByRole("heading", { name: oldestItemName.toUpperCase() })).toBeVisible();
});

test("live interactions append events without rewriting historical state", async ({ page }) => {
  const latestSequence = await latestRuntimeSequence(page);
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });

  await page.getByRole("button", { name: "INVENTORY", exact: true }).click();
  const firstItem = page.locator("[class*='item']").first();
  await firstItem.click();
  const itemName = (await firstItem.getAttribute("aria-label"))?.replace(/ \([^)]+\)$/, "") ?? "";
  await page.getByRole("button", { name: /^LOCK/ }).click();

  const newMaxSeq = latestSequence + 1;
  await expect(slider).toHaveValue(String(newMaxSeq));
  await expect(page.getByRole("status")).toContainText(`Locked ${itemName}`);

  await enterReplayByScrubbing(page);
  await selectSequence(page, floor1EndSequence);
  await expect(page.getByRole("button", { name: /^LOCK/ })).toBeDisabled();

  await slider.fill(String(newMaxSeq));
  await expect(page.getByRole("button", { name: /UNLOCK/ })).toBeVisible();
});

test("timeline scrubber orientation row updates status badge and temporal context during historical scrubbing", async ({ page }) => {
  const statusBadge = page.getByTestId("replay-status-badge");
  const temporalContext = page.getByTestId("replay-temporal-context");
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });

  // Initial Live state
  await expect(statusBadge).toContainText("LIVE ●");
  await expect(temporalContext).toContainText("NOW");

  // Scrub to historical position on Floor 1
  await slider.fill("50");
  await expect(statusBadge).toContainText("HISTORICAL ●");
  await expect(temporalContext).toContainText("TIME UNKNOWN");

  // Scrub back to max sequence (Live edge)
  const maxSeq = await latestRuntimeSequence(page);
  await slider.fill(String(maxSeq));
  await expect(statusBadge).toContainText("LIVE ●");
  await expect(temporalContext).toContainText("NOW");
});

test("timeline scrubber maintains 44px min touch-target height without page horizontal overflow", async ({ page }) => {
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await expect(slider).toBeVisible();

  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  // Check no document-level horizontal overflow
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasOverflow).toBe(false);
});

test("static bundle renders its essential HUD at desktop and mobile sizes", async ({ page }, testInfo) => {
  await expect(page.getByRole("navigation", { name: "Main Navigation" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Selected timeline sequence" })).toBeVisible();
  await expect(page.locator('header[aria-label="Crawler HUD"]')).toContainText("Audience");

  if (testInfo.project.name === "mobile-chromium") {
    await expect(page.locator('[data-hud-composition="persistent"]')).toBeVisible();
    expect(page.viewportSize()?.width).toBeLessThanOrEqual(412);
  }
});
