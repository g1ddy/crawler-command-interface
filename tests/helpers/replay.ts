import { expect, type Page } from "@playwright/test";

export async function openReplayContext(page: Page) {
  const expandBtn = page.getByRole("button", { name: "Expand replay controls" });
  if (await expandBtn.isVisible()) {
    if (await expandBtn.getAttribute("aria-expanded") === "false") {
      await expandBtn.click();
      await expect(page.getByRole("button", { name: "Collapse replay controls" })).toHaveAttribute("aria-expanded", "true");
    }
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
