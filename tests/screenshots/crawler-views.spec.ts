import { expect, test, type Page } from "@playwright/test";
import { SCREENSHOTS, stagedScreenshotPath } from "./canonical-screenshots.ts";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { openReplayContext } from "../helpers/replay";

async function preparePage(page: Page) {
  await page.goto("/crawler-command-interface/");
  await openReplayContext(page);
  await expect(page.getByRole("navigation", { name: "Main Navigation" })).toBeVisible();
  await page.addStyleTag({ content: `*, *::before, *::after { animation: none !important; caret-color: transparent !important; transition: none !important; }` });
  await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
}

async function selectTopLevelTab(page: Page, name: "CRAWLER" | "INVENTORY" | "SKILLS" | "QUESTS" | "RATINGS" | "PARTY" | "PET" | "NOTIFICATIONS") {
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
  // Capture the default compact replay surface, except behind an open inspector.
  if (await page.getByRole("dialog").count() === 0) {
    const context = page.getByRole("complementary", { name: "Replay controls" }).locator("details").first();
    if (await context.getAttribute("open") !== null) await context.locator("summary").click();
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: stagedScreenshotPath(key), fullPage: false, animations: "disabled" });
}

async function seedHotlistSkillsScenario(page: Page) {
  await page.evaluate(() => {
    const docWithSkill = { schemaVersion: "crawler-timeline/v1", timeline: { id: "tl-hotlist-doc", title: "Hotlist Skills Timeline Document", story: { id: "st-hotlist", title: "Crawler Story" } }, sources: [{ id: "src-wda-skill-log", kind: "official-text", trust: "primary", title: "Test-only source", url: "https://example.com/test-hotlist" }], initialState: { crawler: { name: "CARL G.", level: 42, race: "PRIMAL", class: "SCOUT", xp: 21500, maxXp: 74000, attributes: { Strength: 24, Dexterity: 34, Constitution: 30, Intelligence: 18, Charisma: 20 }, condition: { currentHealth: 3100, maxHealth: 4200, currentMana: 800, maxMana: 1360, currentStamina: 200, maxStamina: 280 } }, skills: [{ skillId: "skill-hotlist-demo", name: "Test Skill", icon: "✦", rank: "RANK 1", category: "utility", description: "An isolated test skill used to verify Hotlist assignment presentation.", cooldown: "READY" }] }, events: [{ id: "evt-hotlist-floor-entry", sequence: 1, type: "NarrativeEvent", kind: "floor-entered", position: { floor: 1 }, summary: "Entered Floor 1", evidence: [{ sourceId: "src-wda-skill-log" }] }] };
    localStorage.setItem("crawler_timeline_doc_v2", JSON.stringify(docWithSkill));
  });
  await page.reload();
  await expect(page.getByRole("slider", { name: "Selected timeline sequence" })).toBeVisible();
}

test.beforeEach(async ({ page }) => { await preparePage(page); });

test("export early replay before conditional canon capabilities", async ({ page }) => {
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
  await page.getByRole("slider", { name: "Selected timeline sequence" }).fill("1");
  await expect(page.getByTestId("hud-audience-mode")).toContainText("REPLAY");
  await expect(page.getByRole("button", { name: "PARTY", exact: true })).toHaveCount(0);
  await capture(page, "earlyReplay");
});

test("export replay at the sourced Pet bond boundary", async ({ page }) => {
  const bond = compiledTimeline.events.find(event => event.type === "PetBonded");
  if (!bond) throw new Error("Missing canonical Pet bond");
  await page.getByRole("slider", { name: "Selected timeline sequence" }).fill(String(bond.sequence));
  await selectTopLevelTab(page, "PET");
  await expect(page.getByRole("heading", { name: "PETS", exact: true })).toBeVisible();
  await capture(page, "petBoundary");
});

test("export top-level Crawler tab", async ({ page }) => { await selectCrawlerSubTab(page, "STATS"); await expect(page.getByText("PLAYER ATTRIBUTES", { exact: true })).toBeVisible(); await capture(page, "crawler"); });
test("export top-level Inventory tab", async ({ page }) => { await selectTopLevelTab(page, "INVENTORY"); await expect(page.getByRole("heading", { name: "INVENTORY", exact: true })).toBeVisible(); await expect(page.getByRole("button", { name: /^ALL ITEMS\b/ })).toHaveClass(/\bon\b/); await expect(page.getByRole("textbox", { name: "Search items" })).toBeVisible(); await capture(page, "inventory"); });
test("export Inventory Awards and Boxes at the sourced award sequence", async ({ page }) => { await page.getByRole("button", { name: "◄ PREV FLOOR", exact: true }).click(); await page.getByRole("slider", { name: "Selected timeline sequence" }).fill("13"); await selectTopLevelTab(page, "INVENTORY"); await page.getByRole("button", { name: /^AWARDS \/ BOXES\b/ }).click(); await expect(page.getByText("AWARD LEDGER", { exact: true })).toBeVisible(); await expect(page.getByLabel("Silver Adventurer Box award", { exact: true })).toBeVisible(); await expect(page.getByLabel("Bronze Weapon Box award", { exact: true })).toBeVisible(); await capture(page, "awards"); });
test("export top-level Skills tab", async ({ page }) => { await selectTopLevelTab(page, "SKILLS"); await expect(page.getByRole("heading", { name: "SKILLS", exact: true })).toBeVisible(); await expect(page.getByText("SKILL LIBRARY", { exact: true })).toBeVisible(); await capture(page, "skills"); });
test("renders the Hotlist after a live assignment from an isolated test timeline", async ({ page }) => { await seedHotlistSkillsScenario(page); await selectTopLevelTab(page, "SKILLS"); await page.getByRole("button", { name: "Slot #1", exact: true }).click(); await expect(page.locator('[aria-label="Hotlist"]')).toBeVisible(); await expect(page.locator('[aria-label="Hotlist"]')).toContainText("1"); });

test("renders Quests from an isolated noncanonical fixture without publishing a canonical screenshot", async ({ page }) => {
  await page.evaluate(() => {
    const documentWithQuests = { schemaVersion: "crawler-timeline/v1", timeline: { id: "tl-quests-test", title: "Quests component scenario", story: { id: "st-quests-test", title: "Test story" } }, sources: [{ id: "src-test-quests", kind: "official-text", trust: "primary", title: "Test-only source", url: "https://example.com/test-quests" }], initialState: { crawler: { name: "TEST CRAWLER", level: 1, race: "UNKNOWN", class: "UNKNOWN", xp: 0, maxXp: 1, attributes: {}, condition: {} }, quests: [{ questId: "q-test", title: "Test Quest", urgency: "URGENT", goals: ["Exercise quest presentation"], rewards: "Test-only reward", status: "active" }] }, events: [{ id: "evt-test-floor", sequence: 1, type: "NarrativeEvent", kind: "floor-entered", position: { floor: 1 }, summary: "Test floor", evidence: [{ sourceId: "src-test-quests" }] }] };
    localStorage.setItem("crawler_timeline_doc_v2", JSON.stringify(documentWithQuests));
  });
  await page.reload();
  await expect(page.getByRole("slider", { name: "Selected timeline sequence" })).toBeVisible();
  await selectTopLevelTab(page, "QUESTS");
  await expect(page.getByRole("heading", { name: "QUESTS", exact: true })).toBeVisible();
  await expect(page.getByText("Test Quest", { exact: true })).toBeVisible();
});

test("root navigation follows the real Party capability boundary during replay", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "Main Navigation" });
  await page.getByRole("button", { name: "◄ PREV FLOOR", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill("2");
  await expect(navigation.getByRole("button", { name: "PARTY", exact: true })).toHaveCount(0);
  await slider.fill("3");
  await expect(navigation.getByRole("button", { name: "PARTY", exact: true })).toBeVisible();
  await selectTopLevelTab(page, "PARTY");
  await slider.fill("2");
  await expect(navigation.getByRole("button", { name: "PARTY", exact: true })).toHaveCount(0);
  await expect(navigation.getByRole("button", { name: "CRAWLER", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("export Crawler Stats", async ({ page }) => { await selectCrawlerSubTab(page, "STATS"); await expect(page.getByText("AVAILABLE STAT POINTS", { exact: true })).toBeVisible(); await capture(page, "crawlerStats"); });
test("export Crawler Health and Conditions", async ({ page }) => { await selectCrawlerSubTab(page, "HEALTH / CONDITIONS"); await expect(page.getByText("VITALS", { exact: true })).toBeVisible(); await capture(page, "crawlerHealth"); });
test("export Ratings", async ({ page }) => { await selectTopLevelTab(page, "RATINGS"); await expect(page.getByRole("heading", { name: "RATINGS", exact: true })).toBeVisible(); await capture(page, "ratings"); });
test("export Party after the sourced formation sequence", async ({ page }) => { await selectTopLevelTab(page, "PARTY"); await expect(page.getByRole("heading", { name: "PARTY", exact: true })).toBeVisible(); await expect(page.getByLabel("The Royal Court of Princess Donut roster", { exact: true })).toContainText("Princess Donut"); await capture(page, "party"); });
test("export Pet after the sourced bond sequence", async ({ page }) => { await selectTopLevelTab(page, "PET"); await expect(page.getByRole("heading", { name: "PETS", exact: true })).toBeVisible(); await expect(page.getByLabel("Pet Mongo", { exact: true })).toBeVisible(); await capture(page, "pet"); });
test("export Notifications", async ({ page }) => { await selectTopLevelTab(page, "NOTIFICATIONS"); await expect(page.getByRole("heading", { name: "NOTIFICATIONS", exact: true })).toBeVisible(); await capture(page, "notifications"); });
test("export Floor Rules modal view", async ({ page }) => { await page.getByRole("button", { name: "📜 FLOOR RULES", exact: true }).click(); await expect(page.getByRole("heading", { name: "FLOOR RULES", exact: true })).toBeVisible(); await capture(page, "floorRules"); });
test("export Timeline History modal view", async ({ page }) => { await page.getByRole("button", { name: "📜 HISTORY", exact: true }).click(); await expect(page.getByRole("heading", { name: "EVENT & NARRATIVE LOG", exact: true })).toBeVisible(); await capture(page, "timelineHistory"); });
test("export System Tools modal view", async ({ page }) => { await page.getByRole("button", { name: "Open data tools" }).click(); await expect(page.getByRole("heading", { name: "IMPORT / EXPORT CRAWLER TIMELINE", exact: true })).toBeVisible(); await capture(page, "systemTools"); });
