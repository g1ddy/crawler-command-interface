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

async function selectTopLevelTab(page: Page, name: "CRAWLER" | "INVENTORY" | "SKILLS" | "QUESTS") {
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
    fullPage: false,
    animations: "disabled",
  });
}

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("export top-level Crawler tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "OVERVIEW");
  await expect(page.getByRole("button", { name: "Manage in Inventory →", exact: true })).toBeVisible();
  await expect(page.getByText("BROADCAST STATUS", { exact: true })).toHaveCount(0);
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

test("export top-level Quests tab", async ({ page }) => {
  await page.evaluate(() => {
    const docWithQuests = {
      schemaVersion: "crawler-timeline/v1",
      timeline: {
        id: "tl-quests-doc",
        title: "Quests Timeline Document",
        story: { id: "st-quests", title: "Crawler Story" },
      },
      sources: [
        {
          id: "src-wda-log",
          kind: "official-text",
          trust: "primary",
          title: "World Dungeon Authority System Log",
          url: "https://example.com/log",
        },
      ],
      initialState: {
        crawler: {
          name: "CARL G.",
          level: 42,
          race: "PRIMAL",
          class: "SCOUT",
          xp: 21500,
          maxXp: 74000,
          attributes: { Strength: 24, Dexterity: 34, Constitution: 30, Intelligence: 18, Charisma: 20 },
          condition: { currentHealth: 3100, maxHealth: 4200, currentMana: 800, maxMana: 1360, currentStamina: 200, maxStamina: 280 },
        },
        quests: [
          {
            questId: "q-stairwell",
            title: "Tutorial: Reach the Stairs",
            urgency: "URGENT",
            goals: ["Find the emergency stairwell", "Bypass security lockdown"],
            rewards: "150 XP · Bronze Box",
            status: "active",
          },
          {
            questId: "q-clear-mobs",
            title: "Clear Entry Sector",
            urgency: "STANDARD",
            goals: ["Defeat sector guardians"],
            rewards: "50 XP",
            status: "completed",
          },
        ],
      },
      events: [
        {
          id: "evt-q-1",
          sequence: 1,
          type: "NarrativeEvent",
          kind: "floor-entered",
          position: { floor: 1 },
          summary: "Entered Floor 1",
          evidence: [{ sourceId: "src-wda-log" }],
        },
      ],
    };
    localStorage.setItem("crawler_timeline_doc_v2", JSON.stringify(docWithQuests));
  });
  await page.reload();
  await expect(page.getByText("FLOOR NAVIGATOR:")).toBeVisible();

  await selectTopLevelTab(page, "QUESTS");
  await expect(page.getByRole("heading", { name: "QUESTS", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^ACTIVE\b/ })).toHaveClass(/\bon\b/);
  await capture(page, "quests");
});

test("export Crawler Overview profile sub-tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "OVERVIEW");
  await expect(page.getByRole("button", { name: "Manage in Inventory →", exact: true })).toBeVisible();
  await expect(page.getByText("BROADCAST STATUS", { exact: true })).toHaveCount(0);
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

test("export Floor Rules modal view", async ({ page }) => {
  await page.getByRole("button", { name: "📜 FLOOR RULES", exact: true }).click();
  await expect(page.getByRole("heading", { name: "FLOOR RULES", exact: true })).toBeVisible();
  await capture(page, "floorRules");
});

test("export Timeline History modal view", async ({ page }) => {
  await page.getByRole("button", { name: "📜 HISTORY", exact: true }).click();
  await expect(page.getByRole("heading", { name: "EVENT & NARRATIVE LOG", exact: true })).toBeVisible();
  await capture(page, "timelineHistory");
});
