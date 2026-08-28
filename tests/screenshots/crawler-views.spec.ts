import { expect, test, type Page } from "@playwright/test";
import {
  SCREENSHOTS,
  stagedScreenshotPath,
} from "./canonical-screenshots.ts";

async function preparePage(page: Page) {
  await page.goto("/crawler-command-interface/");
  await expect(page.getByText("FLOOR NAVIGATOR:")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main Navigation" })).toBeVisible();

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        caret-color: transparent !important;
        transition: none !important;
      }
    `,
  });

  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
}

async function selectTopLevelTab(page: Page, name: "CRAWLER" | "INVENTORY" | "SKILLS" | "JOURNAL") {
  const navigation = page.getByRole("navigation", { name: "Main Navigation" });
  const tab = navigation.getByRole("button", { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-pressed", "true");
}

async function selectCrawlerSubTab(page: Page, name: "OVERVIEW" | "ACHIEVEMENTS" | "BROADCAST") {
  await selectTopLevelTab(page, "CRAWLER");
  const subnav = page.locator(".subnav");
  const tab = subnav.getByRole("button", { name, exact: true });
  await tab.click();
  await expect(tab).toHaveClass(/\bon\b/);
}

async function capture(page: Page, key: keyof typeof SCREENSHOTS) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: stagedScreenshotPath(key),
    fullPage: true,
    animations: "disabled",
  });
}

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("export top-level Crawler tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "OVERVIEW");
  await expect(page.getByRole("button", { name: "Manage in Inventory →", exact: true })).toBeVisible();
  await expect(page.getByText("BROADCAST STATUS", { exact: true })).toBeVisible();
  await capture(page, "crawler");
});

test("export top-level Inventory tab", async ({ page }) => {
  await selectTopLevelTab(page, "INVENTORY");
  await expect(page.getByRole("heading", { name: "INVENTORY", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^ALL ITEMS\b/ })).toHaveClass(/\bon\b/);
  await expect(page.getByRole("textbox", { name: "Search items" })).toBeVisible();
  await capture(page, "inventory");
});

test("export top-level Skills tab", async ({ page }) => {
  await selectTopLevelTab(page, "SKILLS");
  await expect(page.getByRole("heading", { name: "SKILLS", exact: true })).toBeVisible();
  await expect(page.getByText("SKILL LIBRARY", { exact: true })).toBeVisible();
  await capture(page, "skills");
});

test("export top-level Journal tab", async ({ page }) => {
  await selectTopLevelTab(page, "JOURNAL");
  await expect(page.getByRole("heading", { name: "JOURNAL", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^ACTIVE\b/ })).toHaveClass(/\bon\b/);
  await expect(page.getByText("RECENT PROGRESS & ACHIEVEMENTS", { exact: true })).toBeVisible();
  await capture(page, "journal");
});

test("export Crawler Overview profile sub-tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "OVERVIEW");
  await expect(page.getByRole("button", { name: "Manage in Inventory →", exact: true })).toBeVisible();
  await expect(page.getByText("BROADCAST STATUS", { exact: true })).toBeVisible();
  await capture(page, "crawlerOverview");
});

test("export Crawler Achievements profile sub-tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "ACHIEVEMENTS");
  await expect(page.locator(".achievements .achievement").first()).toBeVisible();
  await expect(page.getByText(/ACHIEVEMENT UNLOCKED/).first()).toBeVisible();
  await capture(page, "crawlerAchievements");
});

test("export Crawler Broadcast profile sub-tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "BROADCAST");
  await expect(page.getByText("LIVE BROADCAST", { exact: true })).toBeVisible();
  await expect(page.getByText("CURRENT VIEWERS", { exact: true })).toBeVisible();
  await capture(page, "crawlerBroadcast");
});
