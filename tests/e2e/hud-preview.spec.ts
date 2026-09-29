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

    // Verify exactly one active HUD renderer mounted for the selection
    if (choice.id === "production") {
      await expect(page.locator('[data-hud-renderer="persistent"]')).toHaveCount(1);
      await expect(page.locator('[data-hud-renderer="authority-arwes"]')).toHaveCount(0);
      await expect(page.locator('[data-hud-renderer="concept"]')).toHaveCount(0);
    } else if (choice.id === "authority-arwes") {
      await expect(page.locator('[data-hud-renderer="authority-arwes"]')).toHaveCount(1);
      await expect(page.locator('[data-hud-renderer="persistent"]')).toHaveCount(0);
      await expect(page.locator('[data-hud-renderer="concept"]')).toHaveCount(0);
    } else {
      await expect(page.locator('[data-hud-renderer="concept"]')).toHaveCount(1);
      await expect(page.locator('[data-hud-renderer="authority-arwes"]')).toHaveCount(0);
      await expect(page.locator('[data-hud-renderer="persistent"]')).toHaveCount(0);
    }

    // Verify continuity of replay sequence, live/replay mode, capabilities, and historical cue
    await expect(slider).toHaveValue("117");
    await expect(page.getByTestId("hud-audience-mode")).toContainText("REPLAY");
    await expect(page.locator('[data-testid="historical-context-cue"]:visible').first()).toBeVisible();
    await expect(nav.getByRole("button", { name: "PET", exact: true })).toHaveCount(0);
    await expect(nav.getByRole("button", { name: "PARTY", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open data tools" }).click();
  }

  // Close System Tools
  await page.getByRole("button", { name: "CANCEL" }).click();
});

test("Pet visibility follows selected destination and survives renderer switching when available", async ({ page }) => {
  await page.goto(pagesPath);
  await openReplayContext(page);

  // Select "all" floor timeline scope so sequence 130 (bonded pet sequence) is within bounds
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");

  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill("130");

  const nav = page.getByRole("navigation", { name: "Main Navigation" });
  const petNavBtn = nav.getByRole("button", { name: "PET", exact: true });
  await expect(petNavBtn).toBeVisible();

  // Select PET view
  await petNavBtn.click();
  await expect(page.getByText("PET & DUNGEON FAMILIARS")).toBeVisible();

  // Select PARTY destination -> Pet contextual content is absent
  await nav.getByRole("button", { name: "PARTY", exact: true }).click();
  await expect(page.getByTestId("arwes-pet-frame")).toHaveCount(0);

  // Re-select PET destination
  await petNavBtn.click();
  await expect(page.getByText("PET & DUNGEON FAMILIARS")).toBeVisible();

  // Switch renderer to Authority (Arwes POC) via System Tools
  await page.getByRole("button", { name: "Open data tools" }).click();
  await page.getByRole("button", { name: "Authority (Arwes POC)", exact: true }).click();
  await page.getByRole("button", { name: "CANCEL" }).click();

  // Verify PET destination remains selected and Arwes renders Pet contextual frame
  await expect(page.locator('[data-hud-renderer="authority-arwes"]')).toHaveCount(1);
  await expect(page.getByTestId("arwes-pet-frame")).toBeVisible();

  // Switch destination to CRAWLER -> Pet contextual frame is removed in Arwes
  await nav.getByRole("button", { name: "CRAWLER", exact: true }).click();
  await expect(page.getByTestId("arwes-pet-frame")).toHaveCount(0);

  // Switch back to PET -> Pet contextual frame is restored in Arwes
  await petNavBtn.click();
  await expect(page.getByTestId("arwes-pet-frame")).toBeVisible();

  // Switch back to Production
  await page.getByRole("button", { name: "Open data tools" }).click();
  await page.getByRole("button", { name: "Production", exact: true }).click();
  await page.getByRole("button", { name: "CANCEL" }).click();

  // Verify PET view remains active in Production
  await expect(page.locator('[data-hud-renderer="persistent"]')).toHaveCount(1);
  await expect(page.getByText("PET & DUNGEON FAMILIARS")).toBeVisible();
});

test("historical-context cue is visible during Replay in compact, expanded, renderer-switched, and Live states", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pagesPath);

  // Expand replay controls on mobile to access timeline scope and sequence scrubber
  const expandBtn = page.getByRole("button", { name: "Expand replay controls" });
  await expandBtn.click();

  // Select "all" floor timeline scope and scrub to sequence 130
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill("130");

  const cue = page.locator('[data-testid="historical-context-cue"]:visible').first();

  // Replay mode active with controls expanded: historical cue is visible
  await expect(cue).toBeVisible();

  // Collapse compact replay controls: historical cue remains visible in compact bar
  const collapseBtn = page.getByRole("button", { name: "Collapse replay controls" });
  await collapseBtn.click();
  await expect(cue).toBeVisible();

  // Expand compact replay controls again: historical cue remains visible
  await expandBtn.click();
  await expect(cue).toBeVisible();

  // Collapse again
  await collapseBtn.click();
  await expect(cue).toBeVisible();

  // Switch renderer to Authority (Arwes POC) via System Tools while in Replay
  await page.getByRole("button", { name: "Open data tools" }).click();
  await page.getByRole("button", { name: "Authority (Arwes POC)", exact: true }).click();
  await page.getByRole("button", { name: "CANCEL" }).click();

  // Historical cue remains visible in Arwes during Replay
  await expect(cue).toBeVisible();

  // Return to Live removes historical cue
  const compactReturn = page.getByRole("button", { name: "Return to Live sequence" });
  await compactReturn.click();
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "live");
  await expect(page.getByTestId("historical-context-cue")).toHaveCount(0);
});

test("collapsed replay dock keeps scrubber visible and operable across responsive widths", async ({ page }) => {
  const widths = [320, 390, 760, 1024, 1440];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(pagesPath);

    const dock = page.getByRole("complementary", { name: "Replay controls" });
    await expect(dock).toBeVisible();

    const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
    await expect(slider).toBeVisible();

    // Verify slider is operable while collapsed
    await openReplayContext(page);
    await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
    const collapseBtn = page.getByRole("button", { name: "Collapse replay controls" });
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
    }

    await slider.fill("10");
    await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
    await expect(page.getByTestId("historical-context-cue")).toBeVisible();

    // Verify exactly 1 Return to Live button exists in Replay mode
    const returnBtn = page.getByRole("button", { name: "Return to Live sequence" });
    await expect(returnBtn).toHaveCount(1);

    // Click Return to Live
    await returnBtn.click();
    await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "live");

    // Verify 0 Return to Live buttons in Live mode
    await expect(returnBtn).toHaveCount(0);

    // Verify page has no horizontal overflow
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
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
  const manaBadge = page.getByRole("button", { name: /Inspect mana evidence/i });
  await expect(manaBadge).toBeVisible();
  await expect(manaBadge).toHaveText("◷");

  // Test interactive evidence inspection via application capability callback
  await manaBadge.click();
  await expect(page.getByText("TELEMETRY OBSERVATION & PROVENANCE")).toBeVisible();
  await page.getByRole("button", { name: "CLOSE" }).click();
});

test("authority-arwes supports keyboard navigation, focus return, and passive unknown evidence", async ({ page }) => {
  await page.goto(`${pagesPath}?hud=authority-arwes`);

  // Target inspectable mana evidence button via accessible role/name
  const manaBadge = page.getByRole("button", { name: /Inspect mana evidence/i });
  await expect(manaBadge).toBeVisible();

  // Reach the evidence button through real keyboard navigation so :focus-visible is active.
  for (let tabCount = 0; tabCount < 40; tabCount += 1) {
    if (await manaBadge.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(manaBadge).toBeFocused();

  const computedOutline = await manaBadge.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth) || 0,
    };
  });
  expect(computedOutline.outlineStyle).not.toBe("none");
  expect(computedOutline.outlineWidth).toBeGreaterThan(0);

  // Activate with Enter key
  await page.keyboard.press("Enter");

  // Confirm inspection modal opens
  await expect(page.getByText("TELEMETRY OBSERVATION & PROVENANCE")).toBeVisible();

  // Close modal via Close button
  await page.getByRole("button", { name: "CLOSE" }).click();
  await expect(page.getByText("TELEMETRY OBSERVATION & PROVENANCE")).not.toBeVisible();

  // Verify focus returns to the mana evidence indicator button
  await expect(manaBadge).toBeFocused();

  // Verify unknown health telemetry indicator remains passive (span with role="img", not a button)
  const healthBadge = page.getByTestId("telemetry-health-badge");
  await expect(healthBadge).toBeVisible();
  await expect(healthBadge).toHaveAttribute("role", "img");
  await expect(healthBadge).toHaveAttribute("aria-label", "health evidence: unknown");
  await expect(page.getByRole("button", { name: /Inspect health evidence/i })).toHaveCount(0);
});

test("authority-arwes maintains single-line compact telemetry rows at 390px narrow width without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${pagesPath}?hud=authority-arwes&motion=deterministic`);

  const composition = page.getByTestId("arwes-authority-composition");
  await expect(composition).toBeVisible();

  // Telemetry rows remain visible
  const manaRow = page.getByTestId("telemetry-mana");
  await expect(manaRow).toBeVisible();

  // Compact marker is visible and verbose badge label is absent from persistent row
  const manaBadge = page.getByRole("button", { name: /Inspect mana evidence/i });
  await expect(manaBadge).toBeVisible();
  await expect(manaBadge).toHaveText("◷");
  await expect(manaRow).not.toContainText("LAST KNOWN · SEQ");

  // No horizontal page overflow
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Activate compact marker and verify detailed evidence modal opens
  await manaBadge.click();
  await expect(page.getByText("TELEMETRY OBSERVATION & PROVENANCE")).toBeVisible();
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

  await openReplayContext(page);

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
  await page.getByRole("complementary", { name: "Replay controls" }).getByRole("button", { name: /RETURN TO LIVE/i }).click();
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

test("compact mobile replay controls support expand, collapse, keyboard focus, and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pagesPath);

  // Initially on narrow viewport, compact bar is visible and transport controls are collapsed
  const compactBar = page.getByTestId("replay-compact-bar");
  await expect(compactBar).toBeVisible();

  const toggleBtn = page.getByRole("button", { name: "Expand replay controls" });
  await expect(toggleBtn).toBeVisible();
  await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

  const transportContainer = page.getByTestId("replay-transport-container");
  await expect(transportContainer).not.toBeVisible();

  // Keyboard navigation: focus and press Enter on expand toggle
  await toggleBtn.focus();
  await expect(toggleBtn).toBeFocused();
  await page.keyboard.press("Enter");

  const collapseBtn = page.getByRole("button", { name: "Collapse replay controls" });
  await expect(collapseBtn).toBeVisible();
  await expect(collapseBtn).toHaveAttribute("aria-expanded", "true");
  await expect(transportContainer).toBeVisible();

  // Sequence scrubber is now reachable
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await expect(slider).toBeVisible();

  // Collapse controls again via keyboard
  await collapseBtn.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Expand replay controls" })).toBeVisible();
  await expect(transportContainer).not.toBeVisible();

  // Return to Live remains available in the collapsed mobile bar.
  await page.getByRole("button", { name: "Expand replay controls" }).click();

  // Select "all" floor timeline scope so sequence 117 is within bounds
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");

  await slider.fill("117");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
  await page.getByRole("button", { name: "Collapse replay controls" }).click();
  const compactReturn = page.getByRole("button", { name: "Return to Live sequence" });
  await expect(compactReturn).toBeVisible();
  await compactReturn.click();
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "live");
});

test("mobile replay disclosure resets when returning from desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pagesPath);

  const compactBar = page.getByTestId("replay-compact-bar");
  const transport = page.getByTestId("replay-transport-container");
  const expandButton = page.getByRole("button", { name: "Expand replay controls" });

  await expect(compactBar).toBeVisible();
  await expect(expandButton).toHaveAttribute("aria-expanded", "false");

  await expandButton.click();
  await expect(page.getByRole("button", { name: "Collapse replay controls" })).toHaveAttribute("aria-expanded", "true");
  await expect(transport).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(transport).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const collapsedButton = page.getByRole("button", { name: "Expand replay controls" });
  await expect(compactBar).toBeVisible();
  await expect(collapsedButton).toHaveAttribute("aria-expanded", "false");
  await expect(transport).not.toBeVisible();
});

test("authority-arwes validates narrow 360px viewport with sparse Pet, Party, and Skills content without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(`${pagesPath}?hud=authority-arwes&motion=deterministic`);

  const composition = page.getByTestId("arwes-authority-composition");
  await expect(composition).toBeVisible();

  // Verify persistent crawler identity in Arwes spine header
  const spine = page.getByTestId("arwes-spine-header");
  await expect(spine).toBeVisible();
  await expect(spine).toContainText("CRAWLER HUD");

  // Verify CRAWLER view begins with player attributes and progression
  await expect(page.getByText("PLAYER ATTRIBUTES")).toBeVisible();

  // Verify no page-level horizontal overflow
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const nav = page.getByRole("navigation", { name: "Main Navigation" });

  // Navigate to SKILLS
  await nav.getByRole("button", { name: "SKILLS", exact: true }).click();
  await expect(page.getByRole("heading", { name: "SKILLS", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Open Replay context to reach bonded pet sequence 130
  await openReplayContext(page);
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill("130");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");

  // PET tab is now available -> navigate to PET
  const petNavBtn = nav.getByRole("button", { name: "PET", exact: true });
  await expect(petNavBtn).toBeVisible();
  await petNavBtn.click();

  // Arwes renders Pet surface inside HUD
  await expect(page.getByTestId("arwes-pet-frame")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Navigate to PARTY
  await nav.getByRole("button", { name: "PARTY", exact: true }).click();
  await expect(page.getByRole("heading", { name: "PARTY", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("authority-arwes validates mutation gating during replay while preserving telemetry and stat inspection", async ({ page }) => {
  await page.goto(`${pagesPath}?hud=authority-arwes&motion=deterministic`);

  // In Live mode: allocate stat button is enabled if points available
  const allocateBtn = page.getByRole("button", { name: "Allocate attribute point to Strength" });
  await expect(allocateBtn).toBeEnabled();

  // Enter Replay mode via sequence scrubber
  await openReplayContext(page);
  await page.getByRole("combobox", { name: "Floor timeline scope" }).selectOption("all");
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill("130");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");

  // Mutation action is gated (disabled) during replay
  await expect(allocateBtn).toBeDisabled();

  // Telemetry inspection remains active
  const manaBadge = page.getByRole("button", { name: /Inspect mana evidence/i });
  await expect(manaBadge).toBeVisible();
  await manaBadge.click();
  await expect(page.getByText("TELEMETRY OBSERVATION & PROVENANCE")).toBeVisible();
  await page.getByRole("button", { name: "CLOSE" }).click();

  // Stat inspection remains active
  const strengthBtn = page.getByRole("button", { name: "Strength 🔍" });
  await strengthBtn.click();
  await expect(page.getByRole("heading", { name: /WHY THIS VALUE\? · STRENGTH/i })).toBeVisible();
  await page.getByRole("button", { name: "CLOSE INSPECTOR" }).click();
});
