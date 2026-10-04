import { expect, test, type Page } from "@playwright/test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { openReplayContext, enterReplayByScrubbing } from "../helpers/replay";

const boundary = (type: string) => {
  const event = compiledTimeline.events.find(event => event.type === type);
  if (!event) throw new Error(`Missing canonical ${type} boundary`);
  return event.sequence;
};
const navigation = (page: Page) => page.getByRole("navigation", { name: "Main Navigation" });

test.beforeEach(async ({ page }) => {
  await page.goto("/crawler-command-interface/");
});

for (const [domain, eventType] of [["PARTY", "PartyFormed"], ["PET", "PetBonded"]]) {
  test(`${domain} enters at its sourced boundary and falls back without losing replay`, async ({ page }) => {
    await enterReplayByScrubbing(page);
    await openReplayContext(page);
    await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
    const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
    const sequence = boundary(eventType);
    const destination = navigation(page).getByRole("button", { name: domain, exact: true });
    await slider.fill(String(sequence - 1));
    await expect(destination).toHaveCount(0);
    await slider.fill(String(sequence));
    await destination.click();
    await expect(destination).toHaveAttribute("aria-pressed", "true");
    await slider.fill(String(sequence - 1));
    await expect(destination).toHaveCount(0);
    await expect(navigation(page).getByRole("button", { name: "CRAWLER", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(slider).toHaveValue(String(sequence - 1));
    await expect(page.getByTestId("hud-audience-mode")).toContainText("REPLAY");
    await page.getByRole("complementary", { name: "Replay controls" }).getByRole("button", { name: /Return to Live sequence/i }).click();
    await expect(destination).toBeVisible();
    await expect(page.getByTestId("hud-audience-mode")).toContainText("LIVE");
  });
}

test("early HUD readings remain unknown rather than displaying causal defaults", async ({ page }) => {
  await enterReplayByScrubbing(page);
  await openReplayContext(page);
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
  await page.getByRole("slider", { name: "Selected timeline sequence" }).fill("1");

  // Persistent HUD chrome no longer renders persistent Health, Mana, or Level readings
  await expect(page.getByRole("group", { name: "Health reading" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Mana reading" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Level reading" })).toHaveCount(0);

  // Crawler feature HEALTH / CONDITIONS surface exposes early vitals
  await page.getByRole("button", { name: "HEALTH / CONDITIONS", exact: true }).click();
  await expect(page.getByText("VITALS")).toBeVisible();
});

test("System Tools traps focus, blocks navigation shortcuts, and restores its trigger", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Open data tools" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "System tools", exact: true });
  const first = dialog.getByRole("button").first();
  const last = dialog.getByRole("button").last();
  await expect(first).toBeFocused();
  await first.press("Shift+Tab");
  await expect(last).toBeFocused();
  await last.press("Tab");
  await expect(first).toBeFocused();
  await first.press("2");
  await expect(navigation(page)).toHaveCount(0); // Background is inert, not another focus scope.
  await dialog.getByRole("textbox", { name: "Timeline JSON" }).fill("{");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(navigation(page).getByRole("button", { name: "CRAWLER", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("closing a nested inspector restores the parent evidence surface", async ({ page }) => {
  await enterReplayByScrubbing(page);
  await openReplayContext(page);
  const trigger = page.getByRole("button", { name: "📡 TELEMETRY", exact: true });
  await trigger.click();
  const parent = page.getByRole("dialog", { name: "Timeline evidence", exact: true });
  const reading = parent.locator(".telemetry-pill").first();
  await reading.click();
  await expect(page.getByRole("dialog", { name: "Telemetry provenance", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(parent).toBeVisible();
  await expect(reading).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("Persistent shell reflows without viewport overflow and supports reduced motion", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterReplayByScrubbing(page);
  await page.getByRole("button", { name: /Expand replay controls|Collapse replay controls/i }).click();
  await expect(page.getByRole("slider", { name: "Selected timeline sequence" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const hud = page.locator('[data-hud-composition="persistent"]');
  await expect(hud).toBeVisible();
  const target = await page.getByRole("button", { name: "Open data tools" }).boundingBox();
  expect(target?.height).toBeGreaterThanOrEqual(44);
  if (testInfo.project.name === "mobile-chromium") {
    await page.screenshot({ path: testInfo.outputPath("authority-mobile.png"), fullPage: true });
  }
});

test("Primary navigation avoids horizontal scrolling at narrow viewports and preserves touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const navContainer = navigation(page);
  await expect(navContainer).toBeVisible();

  // Verify navigation container requires no horizontal scrolling
  const hasNoHorizontalScroll = await navContainer.evaluate(
    (el) => el.scrollWidth <= el.clientWidth,
  );
  expect(hasNoHorizontalScroll).toBe(true);

  // Verify all available destination buttons fit, are visible, and meet 44px min height
  const buttons = navContainer.getByRole("button");
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  // Verify clicking a destination updates active state
  const inventoryBtn = navContainer.getByRole("button", { name: "INVENTORY" });
  await inventoryBtn.click();
  await expect(inventoryBtn).toHaveAttribute("aria-pressed", "true");

  // Verify System Tools trigger remains distinct and reachable
  const toolsBtn = page.getByRole("button", { name: "Open data tools" });
  await expect(toolsBtn).toBeVisible();
  const toolsBox = await toolsBtn.boundingBox();
  expect(toolsBox?.height).toBeGreaterThanOrEqual(44);
});

test("Primary navigation supports keyboard focus and desktop bar layout", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const navContainer = navigation(page);
  await expect(navContainer).toBeVisible();

  // Desktop navigation container requires no horizontal scrolling
  const noScrollDesktop = await navContainer.evaluate(
    (el) => el.scrollWidth <= el.clientWidth,
  );
  expect(noScrollDesktop).toBe(true);

  // Test keyboard navigation (Tab focus) through navigation buttons
  const crawlerBtn = navContainer.getByRole("button", { name: "CRAWLER" });
  await crawlerBtn.focus();
  await expect(crawlerBtn).toBeFocused();

  await page.keyboard.press("Tab");
  const inventoryBtn = navContainer.getByRole("button", { name: "INVENTORY" });
  await expect(inventoryBtn).toBeFocused();
});

test("layout integration: Live mode has compact scrubber, scrubbing enters Replay", async ({ page }) => {
  // Assert the shared dock exists
  const dock = page.getByRole("complementary", { name: "Replay controls" });
  await expect(dock).toBeVisible();

  // Assert the timeline slider is visible
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await expect(slider).toBeVisible();

  // Assert LIVE is shown
  await expect(page.getByTestId("hud-audience-mode")).toContainText("LIVE");

  // Assert there are zero Return to Live sequence buttons
  const returnToLiveBtn = page.getByRole("button", { name: /Return to Live sequence/i });
  await expect(returnToLiveBtn).toHaveCount(0);

  // Assert expand controls do not exist
  const expandBtn = page.getByRole("button", { name: /Expand replay controls|Collapse replay controls/i });
  await expect(expandBtn).toHaveCount(0);

  // Scrub the slider directly from Live
  await enterReplayByScrubbing(page);

  // Assert the session is now Replay
  await expect(page.getByTestId("hud-audience-mode")).toContainText("REPLAY");

  // Assert the historical cue is visible
  await expect(page.getByTestId("historical-context-cue")).toBeVisible();

  // Assert exactly one Return to Live sequence button exists
  await expect(returnToLiveBtn).toHaveCount(1);

  // Assert expand controls exist
  await expect(expandBtn).toHaveCount(1);

  // Expand controls
  await openReplayContext(page);
  await expect(page.getByTestId("replay-transport-container")).toBeVisible();

  // Return to Live
  await returnToLiveBtn.click();

  // Assert Live mode again
  await expect(page.getByTestId("hud-audience-mode")).toContainText("LIVE");

  // Assert the Return to Live button is gone
  await expect(returnToLiveBtn).toHaveCount(0);

  // Assert the timeline scrubber remains visible
  await expect(slider).toBeVisible();

  // Assert expanded replay controls are gone
  await expect(expandBtn).toHaveCount(0);
  await expect(page.getByTestId("replay-transport-container")).not.toBeVisible();
});
