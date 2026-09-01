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

async function selectTopLevelTab(page: Page, name: "CRAWLER" | "INVENTORY" | "SKILLS" | "QUESTS" | "RATINGS" | "NOTIFICATIONS") {
  const navigation = page.getByRole("navigation", { name: "Main Navigation" });
  const tab = navigation.getByRole("button", { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-pressed", "true");
}

async function selectCrawlerSubTab(page: Page, name: "STATS" | "HEALTH / CONDITIONS") {
  await selectTopLevelTab(page, "CRAWLER");
  const tab = page.locator(".subnav").getByRole("button", { name, exact: true });
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

async function seedHotlistSkillsScenario(page: Page) {
  await page.evaluate(() => {
    const docWithSkill = {
      schemaVersion: "crawler-timeline/v1",
      timeline: {
        id: "tl-hotlist-doc",
        title: "Hotlist Skills Timeline Document",
        story: { id: "st-hotlist", title: "Crawler Story" },
      },
      sources: [
        {
          id: "src-wda-skill-log",
          kind: "official-text",
          trust: "primary",
          title: "Test-only source",
          url: "https://example.com/test-hotlist",
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
        skills: [
          {
            skillId: "skill-hotlist-demo",
            name: "Test Skill",
            icon: "✦",
            rank: "RANK 1",
            category: "utility",
            description: "An isolated test skill used to verify Hotlist assignment presentation.",
            cooldown: "READY",
          },
        ],
      },
      events: [
        {
          id: "evt-hotlist-floor-entry",
          sequence: 1,
          type: "NarrativeEvent",
          kind: "floor-entered",
          position: { floor: 1 },
          summary: "Entered Floor 1",
          evidence: [{ sourceId: "src-wda-skill-log" }],
        },
      ],
    };
    localStorage.setItem("crawler_timeline_doc_v2", JSON.stringify(docWithSkill));
  });
  await page.reload();
  await expect(page.getByText("FLOOR NAVIGATOR:")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test("export top-level Crawler tab", async ({ page }) => {
  await selectCrawlerSubTab(page, "STATS");
  await expect(page.getByText("PLAYER ATTRIBUTES · CLICK TO INSPECT PROVENANCE", { exact: true })).toBeVisible();
  await capture(page, "crawler");
});

test("export top-level Inventory tab", async ({ page }) => {
  await selectTopLevelTab(page, "INVENTORY");
  await expect(page.getByRole("heading", { name: "INVENTORY", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^ALL ITEMS\b/ })).toHaveClass(/\bon\b/);
  await expect(page.getByRole("textbox", { name: "Search items" })).toBeVisible();
  await capture(page, "inventory");
});

test("export Inventory Awards and Boxes at the sourced award sequence", async ({ page }) => {
  await page.getByRole("button", { name: "◄ PREV FLOOR", exact: true }).click();
  await page.getByRole("slider", { name: "Selected timeline sequence" }).fill("12");
  await selectTopLevelTab(page, "INVENTORY");
  await page.getByRole("button", { name: /^AWARDS \/ BOXES\b/ }).click();
  await expect(page.getByText("AWARD LEDGER", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Silver Adventurer Box award", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Bronze Weapon Box award", { exact: true })).toBeVisible();
  await capture(page, "awards");
});

test("export top-level Skills tab", async ({ page }) => {
  await selectTopLevelTab(page, "SKILLS");
  await expect(page.getByRole("heading", { name: "SKILLS", exact: true })).toBeVisible();
  await expect(page.getByText("SKILL LIBRARY", { exact: true })).toBeVisible();
  await capture(page, "skills");
});

test("renders the Hotlist after a live assignment from an isolated test timeline", async ({ page }) => {
  await seedHotlistSkillsScenario(page);
  await selectTopLevelTab(page, "SKILLS");
  await expect(page.getByText("SKILL LIBRARY", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Slot #1", exact: true }).click();
  await expect(page.locator('[aria-label="Hotlist"]')).toBeVisible();
  await expect(page.locator('[aria-label="Hotlist"]')).toContainText("1");
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

test("export Crawler Stats", async ({ page }) => {
  await selectCrawlerSubTab(page, "STATS");
  await expect(page.getByText("AVAILABLE STAT POINTS", { exact: true })).toBeVisible();
  await capture(page, "crawlerStats");
});

test("export Crawler Health and Conditions", async ({ page }) => {
  await selectCrawlerSubTab(page, "HEALTH / CONDITIONS");
  await expect(page.getByText("VITALS", { exact: true })).toBeVisible();
  await capture(page, "crawlerHealth");
});

test("export Ratings", async ({ page }) => {
  await selectTopLevelTab(page, "RATINGS");
  await expect(page.getByRole("heading", { name: "RATINGS", exact: true })).toBeVisible();
  await capture(page, "ratings");
});

test("export Notifications", async ({ page }) => {
  await selectTopLevelTab(page, "NOTIFICATIONS");
  await expect(page.getByRole("heading", { name: "NOTIFICATIONS", exact: true })).toBeVisible();
  await capture(page, "notifications");
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
