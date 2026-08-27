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

const floor1EndSequence = floorEndSequence(1);

test.beforeEach(async ({ page }) => {
  await page.goto("/crawler-command-interface/");
  await expect(page.getByText("FLOOR NAVIGATOR:")).toBeVisible();
});

test("scrubbing backward removes state that was introduced later", async ({ page }) => {
  await expect(sequenceHeading(page)).toContainText(`SEQ #${latestSequence}`);
  await expect(page.locator(".mobile-crawler-info")).toContainText("LVL 13");

  await selectSequence(page, 1);

  await expect(page.getByText(/HISTORICAL VIEW · REPLAYING SEQUENCE #1/)).toBeVisible();
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

test("Return to Live restores the latest projection", async ({ page }) => {
  await selectSequence(page, 1);
  await expect(page.locator(".mobile-crawler-info")).not.toContainText("LVL 13");

  await page.locator(".replay-banner").getByRole("button", { name: /RETURN TO LIVE/ }).click();

  await expect(sequenceHeading(page)).toContainText(`SEQ #${latestSequence}`);
  await expect(page.locator(".mobile-crawler-info")).toContainText("LVL 13");
  await expect(page.locator(".mobile-mode")).toContainText("LIVE");
});

test("live interactions append events without rewriting historical state", async ({ page }) => {
  await selectSequence(page, floor1EndSequence);
  await expect(page.getByText(`HISTORICAL VIEW · REPLAYING SEQUENCE #${floor1EndSequence}`)).toBeVisible();
  await page.getByRole("button", { name: "INVENTORY", exact: true }).click();
  const firstItem = page.locator(".grid .item").first();
  await firstItem.click();
  const itemName = (await firstItem.getAttribute("aria-label"))?.replace(/ \([^)]+\)$/, "") ?? "";
  await page.getByRole("button", { name: /LOCK/ }).click();

  await expect(sequenceHeading(page)).toContainText(`SEQ #${latestSequence + 1}`);
  await expect(page.getByRole("status")).toContainText(`Locked ${itemName}`);

  await selectSequence(page, floor1EndSequence);
  await expect(page.getByRole("button", { name: /LOCK/ })).toBeVisible();
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
