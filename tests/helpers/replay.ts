import { expect, type Page } from "@playwright/test";

export async function openReplayContext(page: Page) {
  const panel = page.getByRole("region", { name: "Timeline navigation panel" });
  if (await panel.isVisible()) {
    return;
  }
  const timelineBtn = page.getByRole("button", { name: "Open timeline utility" });
  await timelineBtn.click();
  await expect(panel).toBeVisible();
}

export async function returnToLive(page: Page) {
  const slider = page.getByRole("slider", { name: "Selected timeline sequence" });
  const maxSequence = await slider.getAttribute("max");
  expect(maxSequence).not.toBeNull();
  await slider.fill(maxSequence!);
  await expect(page.getByTestId("hud-audience-mode")).toHaveAttribute("data-mode", "live");
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
