import { expect, test } from "@playwright/test";

test("concepts retain replay state, capability boundaries and device storage", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("crawler_timeline_doc_v2", "existing-device-data"));
  await page.goto("concepts.html");
  const initialStorage = await page.evaluate(() => JSON.stringify(localStorage));
  const menu = page.getByRole("navigation", { name: "Main Navigation" });
  await expect(menu.getByRole("button", { name: "PARTY", exact: true })).toBeVisible();
  await page.getByLabel("Floor timeline scope").selectOption("all");
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.focus();
  await slider.press("Home");
  await expect(menu.getByRole("button", { name: "PARTY", exact: true })).toHaveCount(0);
  const sequence = await slider.inputValue();
  for (const name of ["Authority", "Tactical", "Theater"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(slider).toHaveValue(sequence);
    await expect(page.getByTestId("hud-audience-mode")).toContainText("REPLAY");
    await expect(menu.getByRole("button", { name: "MAGIC", exact: true })).toHaveCount(0);
    await expect(menu.getByRole("button", { name: "QUESTS", exact: true })).toHaveCount(0);
    await expect(page.locator(".hud-reading[data-evidence=unknown]").first()).toContainText("Unknown");
    await page.screenshot({ path: testInfo.outputPath(`${name.toLowerCase()}-early.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole("button", { name: "Return to live", exact: true }).click();
  await expect(menu.getByRole("button", { name: "PARTY", exact: true })).toBeVisible();
  await expect(page.locator('.hud-reading[data-evidence="last-known"]').getByLabel("Inspect Mana evidence"))
    .toContainText(/Last known · sequence \d+/);
  for (const name of ["Authority", "Tactical", "Theater"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath(`${name.toLowerCase()}-live.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await menu.getByRole("button", { name: "INVENTORY", exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath(`${name.toLowerCase()}-inventory.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await menu.getByRole("button", { name: "CRAWLER", exact: true }).click();
  }
  await page.getByRole("button", { name: "Open data tools" }).click();
  await expect(page.getByRole("heading", { name: "IMPORT / EXPORT CRAWLER TIMELINE" })).toBeVisible();
  await page.getByRole("button", { name: "RESET TO DEFAULT FIXTURE", exact: false }).click();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(initialStorage);
  expect(errors).toEqual([]);
});

test("direct and invalid concept URLs select a safe, shareable state", async ({ page }) => {
  await page.goto("concepts.html?concept=theater");
  await expect(page.getByRole("button", { name: "Theater", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".concept-lab")).toHaveAttribute("data-concept", "theater");

  await page.getByRole("button", { name: "Tactical", exact: true }).click();
  await expect(page).toHaveURL(/concepts\.html\?concept=tactical$/);

  await page.goto("concepts.html?concept=unsupported");
  await expect(page.getByRole("button", { name: "Authority", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".concept-lab")).toHaveAttribute("data-concept", "authority");
});
