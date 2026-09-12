import type { Page } from "@playwright/test";

export async function openReplayContext(page: Page) {
  const context = page.getByRole("complementary", { name: "Replay controls" }).locator("details").first();
  if (await context.getAttribute("open") === null) await context.locator("summary").click();
}
