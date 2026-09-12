import { expect, test } from "@playwright/test";

const pagesPath = "/crawler-command-interface/";

for (const variant of ["authority", "tactical", "theater"] as const) {
  test(`${variant} HUD preview is URL-selected and source-backed`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("crawler_timeline_doc_v2", "existing-device-data"));
    await page.goto(`${pagesPath}?hud=${variant}`);

    const previewScope = page.locator(".concept-hud-wrapper[data-hud-presentation]");
    await expect(previewScope).toHaveAttribute("data-hud-presentation", variant);
    await expect(previewScope).toHaveCSS("--surface", variant === "tactical" ? "#131c18" : variant === "theater" ? "#21151b" : "#101820");
    await expect(page.locator('header[aria-label="Crawler HUD"]')).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main Navigation" }).getByText("MAGIC", { exact: true })).toHaveCount(0);
    await expect(page.locator('.hud-reading[data-evidence="last-known"]').first()).toContainText(/Last known · sequence \d+/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (variant === "authority") {
      await page.getByRole("button", { name: "Open data tools" }).click();
      await page.getByRole("button", { name: "RESET TO DEFAULT FIXTURE", exact: false }).click();
    }
    expect(await page.evaluate(() => localStorage.getItem("crawler_timeline_doc_v2"))).toBe("existing-device-data");
  });
}

for (const query of ["", "?hud=unsupported"]) {
  test(`production HUD is the safe fallback for ${query || "a missing parameter"}`, async ({ page }) => {
    await page.goto(`${pagesPath}${query}`);
    await expect(page.locator("[data-hud-presentation]")).toHaveCount(0);
    await expect(page.locator('[data-production-hud="authority"]')).toBeVisible();
    await expect(page.locator(".system-hud")).toHaveCount(0);
  });
}

test("live presentation switching in System Tools preserves session state and updates URL", async ({ page }) => {
  await page.goto(pagesPath);

  // Enter replay mode by scrubbing slider to sequence 117 (where pet is acquired, not bonded)
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill("117");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");

  const nav = page.getByRole("navigation", { name: "Main Navigation" });
  await expect(nav.getByRole("button", { name: "PET", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "PARTY", exact: true })).toBeVisible();

  // Open System Tools
  await page.getByRole("button", { name: "Open data tools" }).click();
  await expect(page.getByRole("heading", { name: "IMPORT / EXPORT CRAWLER TIMELINE" })).toBeVisible();

  // Switch through each presentation choice via System Tools buttons
  const choices = [
    { name: "Authority (HUD Preview)", id: "authority" },
    { name: "Tactical (HUD Preview)", id: "tactical" },
    { name: "Theater (HUD Preview)", id: "theater" },
    { name: "Production", id: "production" },
  ];

  for (const choice of choices) {
    await page.getByRole("button", { name: choice.name, exact: true }).click();

    // Verify URL parameter synchronization
    if (choice.id === "production") {
      await expect(page).not.toHaveURL(/hud=/);
      await expect(page.locator("[data-hud-presentation]")).toHaveCount(0);
    } else {
      await expect(page).toHaveURL(new RegExp(`hud=${choice.id}$`));
      const previewScope = page.locator(".concept-hud-wrapper[data-hud-presentation]");
      await expect(previewScope).toHaveAttribute("data-hud-presentation", choice.id);
      await expect(previewScope).toHaveCSS(
        "--surface",
        choice.id === "tactical" ? "#131c18" : choice.id === "theater" ? "#21151b" : "#101820",
      );
    }

    // Close the focus boundary before querying the accessible background.
    await page.getByRole("button", { name: "CANCEL" }).click();
    // Verify continuity of replay sequence, live/replay mode, and capabilities
    await expect(slider).toHaveValue("117");
    await expect(page.getByTestId("hud-audience-mode")).toContainText("REPLAY");
    await expect(nav.getByRole("button", { name: "PET", exact: true })).toHaveCount(0);
    await expect(nav.getByRole("button", { name: "PARTY", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open data tools" }).click();
  }

  // Close System Tools
  await page.getByRole("button", { name: "CANCEL" }).click();
});


test("editing import JSON clears stale validation feedback", async ({ page }) => {
  await page.goto(pagesPath);
  await page.getByRole("button", { name: "Open data tools" }).click();

  const jsonInput = page.getByPlaceholder("Paste crawler-timeline document JSON here to import...");
  await jsonInput.fill("{");
  await page.getByRole("button", { name: "IMPORT TIMELINE ENVELOPE" }).click();
  await expect(page.getByText("VALIDATION FAILED:")).toBeVisible();

  await jsonInput.fill("{}");
  await expect(page.getByText("VALIDATION FAILED:")).toHaveCount(0);
});

test("System Tools modal consumes token-backed styles and enforces 44px minimum touch targets", async ({ page }) => {
  await page.goto(pagesPath);
  await page.getByRole("button", { name: "Open data tools" }).click();

  const modalCard = page.locator('div[class*="modalContent"]').first();
  await expect(modalCard).toBeVisible();

  // Verify background uses token value #101820 (rgb(16, 24, 32)) and border uses #435562 (rgb(67, 85, 98))
  const computedBg = await modalCard.evaluate((el) => getComputedStyle(el).backgroundColor);
  const computedBorder = await modalCard.evaluate((el) => getComputedStyle(el).borderColor);

  expect(computedBg).toBe("rgb(16, 24, 32)");
  expect(computedBorder).toBe("rgb(67, 85, 98)");

  // Verify touch target heights on action buttons and presentation choices are at least 44px
  const downloadBtn = page.getByRole("button", { name: "DOWNLOAD TIMELINE JSON" });
  const downloadBox = await downloadBtn.boundingBox();
  expect(downloadBox?.height).toBeGreaterThanOrEqual(44);

  const presentationBtn = page.getByRole("button", { name: "Authority (HUD Preview)" });
  const presentationBox = await presentationBtn.boundingBox();
  expect(presentationBox?.height).toBeGreaterThanOrEqual(44);
});
