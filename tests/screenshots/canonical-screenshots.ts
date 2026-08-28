import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCREENSHOTS = {
  crawler: "screenshot-crawler.png",
  inventory: "screenshot-inventory.png",
  skills: "screenshot-skills.png",
  journal: "screenshot-journal.png",
  crawlerOverview: "screenshot-crawler-overview.png",
  crawlerAchievements: "screenshot-crawler-achievements.png",
  crawlerBroadcast: "screenshot-crawler-broadcast.png",
} as const;

export type ScreenshotKey = keyof typeof SCREENSHOTS;

export const CANONICAL_SCREENSHOT_FILENAMES = Object.freeze(Object.values(SCREENSHOTS));
export const CANONICAL_SCREENSHOT_DIR = path.resolve("docs/images");
export const SCREENSHOT_STAGING_DIR = path.resolve("test-results/documentation-screenshots");

export function assertUniqueCanonicalScreenshotFilenames() {
  const uniqueNames = new Set(CANONICAL_SCREENSHOT_FILENAMES);
  if (uniqueNames.size !== CANONICAL_SCREENSHOT_FILENAMES.length) {
    throw new Error("Canonical screenshot filenames must be unique; duplicate output names would overwrite documentation assets.");
  }
}

export function stagedScreenshotPath(key: ScreenshotKey) {
  return path.join(SCREENSHOT_STAGING_DIR, SCREENSHOTS[key]);
}

export async function resetScreenshotStaging() {
  assertUniqueCanonicalScreenshotFilenames();
  await rm(SCREENSHOT_STAGING_DIR, { recursive: true, force: true });
  await mkdir(SCREENSHOT_STAGING_DIR, { recursive: true });
}

async function assertCompleteStagedScreenshotSet() {
  assertUniqueCanonicalScreenshotFilenames();

  const entries = await readdir(SCREENSHOT_STAGING_DIR, { withFileTypes: true });
  const actualFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const expectedFiles = [...CANONICAL_SCREENSHOT_FILENAMES].sort();

  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error(
      `Staged screenshot set does not match the canonical manifest. Expected ${expectedFiles.join(", ")}; found ${actualFiles.join(", ") || "none"}.`,
    );
  }

  for (const filename of expectedFiles) {
    const file = await stat(path.join(SCREENSHOT_STAGING_DIR, filename));
    if (file.size === 0) {
      throw new Error(`Staged screenshot ${filename} is empty.`);
    }
  }
}

export async function promoteCanonicalScreenshots() {
  await assertCompleteStagedScreenshotSet();
  await mkdir(CANONICAL_SCREENSHOT_DIR, { recursive: true });

  await Promise.all(
    CANONICAL_SCREENSHOT_FILENAMES.map((filename) =>
      copyFile(
        path.join(SCREENSHOT_STAGING_DIR, filename),
        path.join(CANONICAL_SCREENSHOT_DIR, filename),
      ),
    ),
  );
}

export async function verifyCanonicalScreenshots() {
  assertUniqueCanonicalScreenshotFilenames();
  for (const filename of CANONICAL_SCREENSHOT_FILENAMES) {
    const file = await stat(path.join(CANONICAL_SCREENSHOT_DIR, filename));
    if (file.size === 0) {
      throw new Error(`Canonical screenshot ${filename} is empty.`);
    }
  }
}

const invokedDirectly = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (invokedDirectly) {
  const command = process.argv[2];
  if (command === "--paths") {
    for (const filename of CANONICAL_SCREENSHOT_FILENAMES) {
      console.log(path.join("docs/images", filename));
    }
  } else if (command === "--verify-canonical") {
    await verifyCanonicalScreenshots();
  } else {
    throw new Error("Expected --paths or --verify-canonical.");
  }
}
