import { expect, test, type Page } from "@playwright/test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";

const sequenceHeading = (page: Page) =>
  page.getByRole("heading", { name: /SEQ #\d+/ });

async function selectSequence(page: Page, sequence: number) {
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill(String(sequence));
}

const latestSequence = Math.max(...compiledTimeline.events.map((event) => event.sequence));

function floorEndSequence(ordinal: number) {
  const floor = compiledTimeline.floors.find((candidate) => candidate.ordinal === ordinal);
  if (!floor) throw new Error(`Missing Floor ${ordinal} in the compiled timeline.`);
  return floor.endSequence;
}

function eventSequence(id: string) {
  const event = compiledTimeline.events.find((candidate) => candidate.id === id);
  if (!event) throw new Error(`Missing event ${id} in the compiled timeline.`);
  return event.sequence;
}

const floor1EndSequence = floorEndSequence(1);
const floor2SystemPatchSequence = eventSequence("evt-f2-system-patch");

test.beforeEach(async ({ page }) => {
  await page.goto("/crawler-command-interface/");
  await expect(page.getByText("FLOOR NAVIGATOR:")).toBeVisible();
});

test("scrubbing backward removes state that was introduced later", async ({ page }) => {
  await expect(sequenceHeading(page)).toContainText(`SEQ #${latestSequence}`);
  await expect(page.locator(".mobile-crawler-info")).toContainText("LVL 13");

  await selectSequence(page, 1);

  await expect(page.getByText(/HISTORICAL VIEW · REPLAYING SEQUENCE #1/)).toBeVisible();
  await expect(page.getByTestId("hud-audience-mode")).toContainText("REPLAY");
  await expect(page.getByTestId("hud-audience-mode")).not.toContainText("LIVE");
  await expect(page.locator(".mobile-crawler-info")).not.toContainText("LVL 13");
  await page.getByRole("button", { name: "INVENTORY", exact: true }).click();
  await expect(page.locator(".grid .item")).toHaveCount(0);
});

test("floor navigation selects derived floor endpoints", async ({ page }) => {
  const floors = page.getByRole("combobox", { name: "Floor timeline scope" });

  await floors.selectOption("1");
  await expect(sequenceHeading(page)).toContainText(`SEQ #${floor1EndSequence}`);
  await expect(page.getByText(`HISTORICAL VIEW · REPLAYING SEQUENCE #${floor1EndSequence}`)).toBeVisible();

  await page.getByRole("button", { name: /NEXT FLOOR/ }).click();
  await expect(floors).toHaveValue("2");
  await expect(sequenceHeading(page)).toContainText(`SEQ #${latestSequence}`);
});

test("timeline evidence surfaces preserve source locators and confidence", async ({ page }) => {
  await selectSequence(page, floor2SystemPatchSequence);

  const secondaryCountdown = page.locator(".secondary-countdown").filter({ hasText: "TIME TO SAFE ROOM CLOSURE" });
  await expect(secondaryCountdown).toContainText("EVIDENCE: src-dcc-database-floor-2");
  await expect(secondaryCountdown).toContainText("Floor Timeline & Patch Notes");
  await expect(secondaryCountdown).toContainText("CORROBORATED");

  await page.getByRole("button", { name: /COLLAPSE CLOCK EVIDENCE/ }).click();
  const countdownModal = page.locator(".modal-content").filter({ hasText: "COUNTDOWN ESTIMATE & PROVENANCE" });
  await expect(countdownModal).toContainText("Evidence: src-dcc-database-floor-2");
  await expect(countdownModal).toContainText("Floor Timeline & Patch Notes");
  await expect(countdownModal).toContainText("CORROBORATED");
  await countdownModal.getByRole("button", { name: "✕" }).click();

  await page.getByRole("button", { name: "📡 TELEMETRY", exact: true }).click();
  const evidenceModal = page.locator(".modal-content").filter({ hasText: "SOURCED HUD OBSERVATIONS" });
  const floorMetrics = evidenceModal.getByRole("heading", { name: "FLOOR METRICS" }).locator("..");
  await floorMetrics.getByText("SOURCE", { exact: true }).first().click();
  const inspectorModal = page.locator(".modal-content").filter({ hasText: "TELEMETRY OBSERVATION & PROVENANCE" });
  await expect(inspectorModal).toContainText("CORROBORATED");
  await expect(inspectorModal).toContainText("Locator:");
});

test("Return to Live restores the latest projection", async ({ page }) => {
  await selectSequence(page, 1);
  await expect(page.locator(".mobile-crawler-info")).not.toContainText("LVL 13");

  await page.locator(".replay-banner").getByRole("button", { name: /RETURN TO LIVE/ }).click();

  await expect(sequenceHeading(page)).toContainText(`SEQ #${latestSequence}`);
  await expect(page.locator(".mobile-crawler-info")).toContainText("LVL 13");
  await expect(page.locator(".mobile-mode")).toContainText("LIVE");
});

test("inventory browser and inspector resolve the same visible selection", async ({ page }) => {
  await page.getByRole("button", { name: "INVENTORY", exact: true }).click();

  const itemCards = page.locator(".grid .item");
  await expect(itemCards).not.toHaveCount(0);
  await expect(itemCards.first()).toHaveClass(/selected/);

  const secondItem = itemCards.nth(1);
  await expect(secondItem).toBeVisible();
  const secondItemName =
    (await secondItem.getAttribute("aria-label"))?.replace(/ \([^)]+\)$/, "") ?? "";
  expect(secondItemName).not.toBe("");

  await page.getByRole("textbox", { name: "Search items" }).fill(secondItemName);

  const visibleCard = page.locator(".grid .item").first();
  await expect(visibleCard).toHaveClass(/selected/);
  await expect(page.getByRole("heading", { name: secondItemName.toUpperCase() })).toBeVisible();

  await page.getByRole("textbox", { name: "Search items" }).fill("");
  await page.getByRole("combobox", { name: "Sort items" }).selectOption("oldest");
  const oldestCard = page.locator(".grid .item").first();
  const oldestItemName =
    (await oldestCard.getAttribute("aria-label"))?.replace(/ \([^)]+\)$/, "") ?? "";
  await expect(oldestCard).toHaveClass(/selected/);
  await expect(page.getByRole("heading", { name: oldestItemName.toUpperCase() })).toBeVisible();
});

test("live interactions append events without rewriting historical state", async ({ page }) => {
  await selectSequence(page, floor1EndSequence);
  await expect(page.getByText(`HISTORICAL VIEW · REPLAYING SEQUENCE #${floor1EndSequence}`)).toBeVisible();
  await page.getByRole("button", { name: "INVENTORY", exact: true }).click();
  const firstItem = page.locator(".grid .item").first();
  await firstItem.click();
  const itemName = (await firstItem.getAttribute("aria-label"))?.replace(/ \([^)]+\)$/, "") ?? "";
  await page.getByRole("button", { name: /^LOCK/ }).click();

  await expect(sequenceHeading(page)).toContainText(`SEQ #${latestSequence + 1}`);
  await expect(page.getByRole("status")).toContainText(`Locked ${itemName}`);

  await selectSequence(page, floor1EndSequence);
  await expect(page.getByRole("button", { name: /^LOCK/ })).toBeVisible();
  await page.getByRole("button", { name: /RETURN TO LIVE/ }).first().click();
  await expect(page.getByRole("button", { name: /UNLOCK/ })).toBeVisible();
});

test("static bundle renders its essential HUD at desktop and mobile sizes", async ({ page }, testInfo) => {
  await expect(page.getByRole("navigation", { name: "Main Navigation" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Selected timeline sequence" })).toBeVisible();
  await expect(page.locator(".timer")).toContainText("VIEWERS");

  if (testInfo.project.name === "mobile-chromium") {
    await expect(page.locator(".mobile-status-bar")).toBeVisible();
    expect(page.viewportSize()?.width).toBeLessThanOrEqual(412);
  }
});
