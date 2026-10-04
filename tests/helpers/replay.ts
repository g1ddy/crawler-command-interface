import { expect, type Page } from "@playwright/test";

export async function openReplayContext(page: Page) {
  const timelineBtn = page.getByRole("button", { name: "TIMELINE", exact: true });
  if (await timelineBtn.isVisible()) {
    await timelineBtn.click();
    await expect(page.getByRole("region", { name: "Timeline navigation panel" })).toBeVisible();
  }
}

export async function enterReplayByScrubbing(page: Page) {
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  const minSequence = await slider.getAttribute("min");
  const maxSequence = await slider.getAttribute("max");
  const currentSequence = await slider.inputValue();

  expect(minSequence).not.toBeNull();
  expect(maxSequence).not.toBeNull();

  if (currentSequence !== minSequence) {
    await slider.fill(minSequence!);
  } else {
    await slider.fill(maxSequence!);
  }

  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "replay");
}
