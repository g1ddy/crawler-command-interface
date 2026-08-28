import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.resolve("docs/images");

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

async function capture(page: Page, filename: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(OUTPUT_DIR, filename),
    fullPage: true,
    animations: "disabled",
  });
}

test.beforeAll(async () => {
  await mkdir(OUTPUT_DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("export top-level Crawler tab", async ({ page }) => {
  await selectTopLevelTab(page, "CRAWLER");
  await expect(page.locator(".subnav")).toBeVisible();
  await capture(page, "screenshot-crawler.png");
});

test("export top-level Inventory tab", async ({ page }) => {
  await selectTopLevelTab(page, "INVENTORY");
  await expect(page.getByRole("heading", { name: "INVENTORY", exact: true })).toBeVisible();
  await capture(page, "screenshot-inventory.png");
});

test("export top-level Skills tab", async ({ page }) => {
  await selectTopLevelTab(page, "SKILLS");
  await expect(page.getByRole("heading", { name: "SKILLS", exact: true })).toBeVisible();
  await capture(page, "screenshot-skills.png");
});

test("export top-level Journal tab", async ({ page }) => {
  await selectTopLevelTab(page, "JOURNAL");
  await expect(page.getByRole("heading", { name: "JOURNAL", exact: true })).toBeVisible();
  await capture(page, "screenshot-journal.png");
});

test("export Crawler Overview profile sub-tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "OVERVIEW");
  await expect(page.locator(".view-content")).toBeVisible();
  await capture(page, "screenshot-crawler-overview.png");
});

test("export Crawler Achievements profile sub-tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "ACHIEVEMENTS");
  await expect(page.locator(".view-content")).toBeVisible();
  await capture(page, "screenshot-crawler-achievements.png");
});

test("export Crawler Broadcast profile sub-tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "BROADCAST");
  await expect(page.locator(".view-content")).toBeVisible();
  await capture(page, "screenshot-crawler-broadcast.png");
});
