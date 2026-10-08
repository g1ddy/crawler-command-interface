import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { openReplayContext, enterReplayByScrubbing } from "../helpers/replay";

const compiledTimeline = JSON.parse(
  fs.readFileSync(new URL("../../data/compiled-timeline.json", import.meta.url), "utf8")
);

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
  await enterReplayByScrubbing(page);

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

    // Verify continuity of replay sequence, live/replay mode, and capabilities
    await expect(slider).toHaveValue("117");
    await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
    await expect(nav.getByRole("button", { name: "PET", exact: true })).toHaveCount(0);
    await expect(nav.getByRole("button", { name: "PARTY", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open data tools" }).click();
  }

  // Close System Tools
  await page.getByRole("button", { name: "CANCEL" }).click();
});

test("Pet visibility follows selected destination and survives renderer switching when available", async ({ page }) => {
  await page.goto(pagesPath);
  await enterReplayByScrubbing(page);

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

test("global replay scrubber operates cleanly across responsive widths", async ({ page }) => {
  const widths = [320, 390, 760, 1024, 1440];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(pagesPath);

    await enterReplayByScrubbing(page);
    const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
    await slider.fill("10");

    const dock = page.getByRole("complementary", { name: "Replay controls" });
    await expect(dock).toBeVisible();
    await expect(slider).toBeVisible();

    await slider.fill("20");
    await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");

    // Scrubbing to max sequence enters Live mode
    const maxSeq = await slider.getAttribute("max");
    if (maxSeq) await slider.fill(maxSeq);
    await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "live");

    // Verify page has no horizontal overflow
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("layout integration: Live mode has compact scrubber, scrubbing enters Replay", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pagesPath);

  const dock = page.getByRole("complementary", { name: "Replay controls" });
  await expect(dock).toBeVisible();

  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await expect(slider).toBeVisible();

  // Enter Replay by scrubbing slider to sequence 50
  await enterReplayByScrubbing(page);
  await slider.fill("50");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");

  // Feature area remains independently scrollable and its last interactive control is reachable
  const featureArea = page.locator("#crawler-workspace");
  await expect(featureArea).toBeVisible();

  // Navigate to CRAWLER STATS and scroll to bottom
  const statsBtn = page.getByRole("button", { name: "STATS", exact: true });
  await statsBtn.click();

  // Scroll to bottom of feature area and verify last control is visible & clickable
  const allocateBtn = page.getByRole("button", { name: "Allocate attribute point to Charisma" }).or(page.getByRole("button", { name: "Allocate attribute point to Strength" })).first();
  await allocateBtn.scrollIntoViewIfNeeded();
  await expect(allocateBtn).toBeVisible();

  // Resizing viewport maintains selected sequence
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(slider).toHaveValue("50");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(slider).toHaveValue("50");
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
  await expect(page.getByTestId("arwes-telemetry-frame")).toBeVisible();
  await expect(page.getByTestId("arwes-attention-frame")).toBeVisible();

  // Verify telemetry and evidence inspection trigger
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

  // Enter replay by scrubbing timeline to sequence 130
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  const maxSeq = await slider.getAttribute("max");
  await slider.fill("130");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-motion-intent", "enter-replay");

  // Scrub again within replay mode to sequence 135 -> temporal mode stays replay, transient motionIntent is cleared
  await slider.fill("135");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
  await expect(page.getByTestId("hud-audience-mode")).not.toHaveAttribute("data-motion-intent");

  // Return to Live sequence by scrubbing to rightmost edge
  if (maxSeq) await slider.fill(maxSeq);
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

test("mobile timeline utility panel opens, navigates floors, and closes cleanly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pagesPath);

  await enterReplayByScrubbing(page);
  await openReplayContext(page);

  const panel = page.getByRole("region", { name: "Timeline navigation panel" });
  await expect(panel).toBeVisible();

  const floorSelect = page.getByRole("combobox", { name: "Select floor context" });
  await expect(floorSelect).toBeVisible();
  await floorSelect.selectOption("1");

  await page.getByRole("button", { name: "Close timeline controls" }).click();
  await expect(panel).not.toBeVisible();

  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await expect(slider).toBeVisible();
});

test("authority-arwes validates narrow 360px viewport with sparse Pet, Party, and Skills content without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(`${pagesPath}?hud=authority-arwes&motion=deterministic`);

  const composition = page.getByTestId("arwes-authority-composition");
  await expect(composition).toBeVisible();

  // Verify persistent floor identity in Arwes spine header
  const spine = page.getByTestId("arwes-spine-header");
  await expect(spine).toBeVisible();
  await expect(spine).toContainText("FLOOR 3");

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
  await enterReplayByScrubbing(page);
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

test("countdown presentation is compact, source-backed, and inspectable across all HUD renderers without persistent verbose filler", async ({ page }) => {
  const floor1Seq = compiledTimeline.countdowns
    .find((countdown: { id: string }) => countdown.id === "countdown-floor-1-collapse")
    ?.references[0]?.sequence;

  expect(typeof floor1Seq).toBe("number");

  const renderers = [
    { name: "production", query: "", rendererAttr: "persistent" },
    { name: "authority", query: "?hud=authority", rendererAttr: "concept" },
    { name: "authority-arwes", query: "?hud=authority-arwes", rendererAttr: "authority-arwes" },
  ] as const;

  for (const { name, query, rendererAttr } of renderers) {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`${pagesPath}${query}`);

    await enterReplayByScrubbing(page);
    const slider = page.getByRole("slider", { name: "Selected timeline sequence" });

    const setSliderValue = async (seq: number) => {
      await slider.evaluate((el, val) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeSetter?.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }, String(seq));
    };

    // --- A. Established Countdown ---
    await setSliderValue(floor1Seq);

    const hudRenderer = page.locator(`[data-hud-renderer="${rendererAttr}"]`);
    await expect(hudRenderer).toBeVisible();

    // Verify expected formatted time (sequence 1 = 5d 0h left)
    await expect(hudRenderer).toContainText("5d 0h left");

    // Verify verbose status labels and filler text are absent
    await expect(hudRenderer).not.toContainText(/Collapse time unavailable/i);
    await expect(hudRenderer).not.toContainText(/NO SOURCED COUNTDOWN/i);
    await expect(hudRenderer).not.toContainText(/EXACT TIME/i);
    await expect(hudRenderer).not.toContainText(/· STATED/i);
    await expect(hudRenderer).not.toContainText(/· ESTIMATED/i);
    await expect(hudRenderer).not.toContainText(/Observed/i);
    await expect(hudRenderer).not.toContainText(/Estimated/i);
    await expect(hudRenderer).not.toContainText(/Last known/i);
    await expect(hudRenderer).not.toContainText(/lifecycle status/i);

    if (name === "authority-arwes") {
      const timer = page.getByTestId("arwes-countdown-timer");
      await expect(timer).toBeVisible();
      await expect(hudRenderer).not.toContainText(/LEVEL COLLAPSE/i);
    }

    // Locate accessible evidence inspection control
    const evidenceBtn = page.getByRole("button", { name: /Inspect collapse clock evidence/i });
    await expect(evidenceBtn).toBeVisible();

    // Verify visible content is strictly the exact marker "●" for current/stated sequence 1
    const markerText = await evidenceBtn.innerText();
    expect(markerText.trim()).toBe("●");

    // Verify no document horizontal overflow
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    // Click evidence control and verify modal
    await evidenceBtn.click();
    await expect(page.getByText("COUNTDOWN ESTIMATE & PROVENANCE")).toBeVisible();

    // Close modal and verify it closes cleanly
    await page.getByRole("button", { name: "CLOSE" }).click();
    await expect(page.getByText("COUNTDOWN ESTIMATE & PROVENANCE")).not.toBeVisible();

    // --- B. Sequence before countdown establishment ---
    // Floor 3 has no established collapse countdown (e.g., sequence 140)
    await setSliderValue(140);

    // Verify complete absence of countdown values or filler strings
    await expect(hudRenderer).not.toContainText(/left/i);
    await expect(hudRenderer).not.toContainText(/Collapse time unavailable/i);
    await expect(hudRenderer).not.toContainText(/NO SOURCED COUNTDOWN/i);
    await expect(hudRenderer).not.toContainText(/EXACT TIME/i);
    await expect(page.getByRole("button", { name: /Inspect collapse clock evidence/i })).toHaveCount(0);

    // --- C. Replay sequence correctness ---
    // Return to established sequence and verify value returns
    await setSliderValue(floor1Seq);
    await expect(hudRenderer).toContainText("5d 0h left");
    await expect(page.getByRole("button", { name: /Inspect collapse clock evidence/i })).toBeVisible();

    // --- D. Estimated sequence interpolation formatting ---
    // Go to a sequence past floor1Seq to trigger interpolation estimate (e.g., floor1Seq + 2)
    const estimatedSeq = floor1Seq + 2;
    await setSliderValue(estimatedSeq);

    // Verify it remains visible but DOES NOT contain ~
    await expect(hudRenderer).toContainText(/left/);
    await expect(hudRenderer).not.toContainText("~");

    // Verify evidence marker transitions to ≈
    const estimatedEvidenceBtn = page.getByRole("button", { name: /Inspect collapse clock evidence/i });
    await expect(estimatedEvidenceBtn).toBeVisible();
    const estimatedMarkerText = await estimatedEvidenceBtn.innerText();
    expect(estimatedMarkerText.trim()).toBe("≈");

  }
});

test("authority-arwes validates mutation gating during replay while preserving telemetry and stat inspection", async ({ page }) => {
  // Seed scenario with valid available points observation before navigation
  await page.addInitScript((timelineDoc) => {
    try {
      const doc = JSON.parse(JSON.stringify(timelineDoc));
      if (!doc.observations) doc.observations = [];
      const maxSeq = doc.events?.at(-1)?.sequence ?? 182;
      doc.observations.push({
        id: "obs-e2e-points",
        kind: "crawler-attributes",
        sequence: maxSeq,
        availableAttributePoints: 3,
        evidence: [{ sourceId: doc.sources?.[0]?.id || "src-book-1", confidence: "confirmed" }],
      });
      localStorage.setItem("crawler_timeline_doc_v2", JSON.stringify(doc));
    } catch (e) {
      console.error(e);
    }
  }, compiledTimeline);

  await page.goto(pagesPath);

  // Switch to Authority (Arwes POC) via System Tools
  await page.getByRole("button", { name: "Open data tools" }).click();
  await page.getByRole("button", { name: "Authority (Arwes POC)", exact: true }).click();
  await page.getByRole("button", { name: "CANCEL" }).click();

  // 1. Live mode with available points: allocate button must be enabled
  const allocateBtn = page.getByRole("button", { name: "Allocate attribute point to Strength" });
  await expect(allocateBtn).toBeEnabled();

  // 2. Scrub into Replay mode
  await enterReplayByScrubbing(page);
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  await slider.fill("130");
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");

  // 3. Replay mode gating: allocate button must transition to disabled
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
