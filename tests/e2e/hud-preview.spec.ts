import { expect, test } from "@playwright/test";
import { openReplayContext } from "../helpers/replay";

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
    await expect(page.locator('[data-hud-composition="persistent"]')).toBeVisible();
    await expect(page.locator(".system-hud")).toHaveCount(0);
  });
}

test("live presentation switching in System Tools preserves session state and updates URL", async ({ page }) => {
  await page.goto(pagesPath);
  await openReplayContext(page);

  // Select "all" floor timeline scope so sequence 117 is within bounds
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");

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
    { name: "Authority (Arwes POC)", id: "authority-arwes" },
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


test("authority-arwes presentation is URL-selected and renders Arwes renderer composition foundation", async ({ page }) => {
  await page.goto(`${pagesPath}?hud=authority-arwes`);

  const previewScope = page.locator(".concept-hud-wrapper[data-hud-presentation]");
  await expect(previewScope).toHaveAttribute("data-hud-presentation", "authority-arwes");

  // Verify exclusive renderer selection: exactly 1 Arwes HUD renderer and zero alternate HUD renderers
  await expect(page.locator('[data-hud-renderer="authority-arwes"]')).toHaveCount(1);
  await expect(page.locator(".system-hud")).toHaveCount(0);
  await expect(page.locator('[data-hud-composition="persistent"]')).toHaveCount(0);

  // Verify the Arwes renderer composition foundation mounts and renders
  const composition = page.getByTestId("arwes-authority-composition");
  await expect(composition).toBeVisible();
  await expect(page.getByTestId("arwes-spine-header")).toBeVisible();
  await expect(page.getByTestId("arwes-vitals-frame")).toBeVisible();
  await expect(page.getByTestId("arwes-attention-frame")).toBeVisible();

  // Verify vitals telemetry and evidence inspection trigger
  const healthRow = page.getByTestId("telemetry-health");
  await expect(healthRow).toBeVisible();

  // Target specific telemetry inspection badge (mana)
  const manaBadge = page.getByTestId("telemetry-mana-badge");
  await expect(manaBadge).toBeVisible();

  // Test interactive evidence inspection via application capability callback
  await manaBadge.click();
  await expect(page.getByText("TELEMETRY OBSERVATION & PROVENANCE")).toBeVisible();
  await page.getByRole("button", { name: "CLOSE" }).click();
});

test("authority-arwes presentation mounts, unmounts cleanly on navigation away, and remounts without stale state", async ({ page }) => {
  await page.goto(`${pagesPath}?hud=authority-arwes`);

  // Initial mount check
  await expect(page.getByTestId("arwes-authority-composition")).toHaveCount(1);

  // Navigate away to Tactical HUD
  await page.getByRole("button", { name: "Open data tools" }).click();
  await page.getByRole("button", { name: "Tactical (HUD Preview)", exact: true }).click();
  await page.getByRole("button", { name: "CANCEL" }).click();

  // Verify Arwes composition unmounted cleanly
  await expect(page.getByTestId("arwes-authority-composition")).toHaveCount(0);

  // Return to authority-arwes presentation
  await page.getByRole("button", { name: "Open data tools" }).click();
  await page.getByRole("button", { name: "Authority (Arwes POC)", exact: true }).click();
  await page.getByRole("button", { name: "CANCEL" }).click();

  // Verify Arwes composition remounts cleanly with exactly 1 instance
  await expect(page.getByTestId("arwes-authority-composition")).toHaveCount(1);
  await expect(page.getByTestId("arwes-authority-composition")).toBeVisible();
});

test("authority-arwes handles live -> enter-replay -> return-live sequence with exclusive mounting", async ({ page }) => {
  await page.goto(`${pagesPath}?hud=authority-arwes&motion=deterministic`);

  // Initial Live state: exactly 1 Arwes renderer, zero alternate HUDs
  await expect(page.locator('[data-hud-renderer="authority-arwes"]')).toHaveCount(1);
  await expect(page.locator(".system-hud")).toHaveCount(0);
  await expect(page.locator('[data-hud-composition="persistent"]')).toHaveCount(0);
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "live");

  // Enter replay by scrubbing timeline to sequence 130
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill("130");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-motion-intent", "enter-replay");

  // Scrub again within replay mode to sequence 135 -> temporal mode stays replay, transient motionIntent is cleared
  await slider.fill("135");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
  await expect(page.getByTestId("hud-audience-mode")).not.toHaveAttribute("data-motion-intent");

  // Return to Live
  await page.getByRole("button", { name: "RETURN TO LIVE" }).click();
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "live");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-motion-intent", "return-live");

  // Renderer exclusivity maintained throughout
  await expect(page.locator('[data-hud-renderer="authority-arwes"]')).toHaveCount(1);
  await expect(page.locator(".system-hud")).toHaveCount(0);
});

test("authority-arwes presentation supports reduced and deterministic motion modes", async ({ page }) => {
  await page.goto(`${pagesPath}?hud=authority-arwes&motion=reduced`);
  const compositionReduced = page.getByTestId("arwes-authority-composition");
  await expect(compositionReduced).toBeVisible();
  await expect(compositionReduced).toHaveAttribute("data-motion-mode", "reduced");

  await page.goto(`${pagesPath}?hud=authority-arwes&motion=deterministic`);
  const compositionDeterministic = page.getByTestId("arwes-authority-composition");
  await expect(compositionDeterministic).toBeVisible();
  await expect(compositionDeterministic).toHaveAttribute("data-motion-mode", "deterministic");
});

test("captures research screenshot artifact for authority-arwes presentation foundation", async ({ page }, testInfo) => {
  await page.goto(`${pagesPath}?hud=authority-arwes&motion=deterministic`);

  const composition = page.getByTestId("arwes-authority-composition");
  await expect(composition).toBeVisible();

  // Capture screenshot of the Arwes Authority composition surface for research evidence
  await composition.screenshot({
    path: testInfo.outputPath("arwes-authority-poc.png"),
  });
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
