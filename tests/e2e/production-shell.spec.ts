import { expect, test, type Page } from "@playwright/test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { openReplayContext } from "../helpers/replay";

const boundary = (type: string) => {
  const event = compiledTimeline.events.find(event => event.type === type);
  if (!event) throw new Error(`Missing canonical ${type} boundary`);
  return event.sequence;
};
const navigation = (page: Page) => page.getByRole("navigation", { name: "Main Navigation" });

test.beforeEach(async ({ page }) => {
  await page.goto("/crawler-command-interface/");
  await openReplayContext(page);
});

for (const [domain, eventType] of [["PARTY", "PartyFormed"], ["PET", "PetBonded"]]) {
  test(`${domain} enters at its sourced boundary and falls back without losing replay`, async ({ page }) => {
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
    await page.getByRole("button", { name: "Return to live", exact: true }).click();
    await expect(destination).toBeVisible();
    await expect(page.getByTestId("hud-audience-mode")).toContainText("LIVE");
  });
}

test("early HUD readings remain unknown rather than displaying causal defaults", async ({ page }) => {
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
  await page.getByRole("slider", { name: "Selected timeline sequence" }).fill("1");
  for (const label of ["Health", "Mana", "Level", "Viewers"]) {
    const reading = page.getByRole("group", { name: `${label} reading` });
    await expect(reading).toHaveAttribute("data-evidence", "unknown");
    await expect(reading).toContainText("Unknown");
    await expect(reading.locator("strong")).toHaveText("—");
  }
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

test("Authority shell reflows without viewport overflow and supports reduced motion", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("summary").filter({ hasText: "Replay context & tools" }).click();
  await expect(page.getByRole("group", { name: "Viewers reading" }).locator("strong")).not.toHaveText("—");
  await expect(page.getByRole("slider", { name: "Selected timeline sequence" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const hud = page.locator('[data-production-hud="authority"]');
  await expect(hud).toBeVisible();
  const target = await page.getByRole("button", { name: "Open data tools" }).boundingBox();
  expect(target?.height).toBeGreaterThanOrEqual(44);
  if (testInfo.project.name === "mobile-chromium") {
    await page.screenshot({ path: testInfo.outputPath("authority-mobile.png"), fullPage: true });
  }
});
