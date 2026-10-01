import { expect, type Page } from "@playwright/test";

export async function openReplayContext(page: Page) {
  const expandBtn = page.getByRole("button", { name: "Expand replay controls" });
  if (await expandBtn.isVisible()) {
    await expect(expandBtn).toHaveAttribute("aria-expanded", "false");
    await expandBtn.click();
    await expect(page.getByRole("button", { name: "Collapse replay controls" })).toHaveAttribute("aria-expanded", "true");
  }
  const context = page.getByRole("complementary", { name: "Replay controls" }).locator("details").first();
  if (await context.getAttribute("open") === null) await context.locator("summary").click();
}
