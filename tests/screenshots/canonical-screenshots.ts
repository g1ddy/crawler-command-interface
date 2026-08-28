import { copyFile, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CANONICAL_VIEWPORT = Object.freeze({ width: 1440, height: 1100 });

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
export const SCREENSHOT_STAGING_DIR = path.resolve(".screenshots-staging");

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

async function assertCanonicalPng(filePath: string, label: string) {
  const file = await stat(filePath);
  if (file.size === 0) {
    throw new Error(`${label} is empty.`);
  }

  const bytes = await readFile(filePath);
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`${label} is not a valid PNG.`);
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== CANONICAL_VIEWPORT.width || height !== CANONICAL_VIEWPORT.height) {
    throw new Error(
      `${label} must be ${CANONICAL_VIEWPORT.width}x${CANONICAL_VIEWPORT.height}; found ${width}x${height}.`,
    );
  }
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
    await assertCanonicalPng(
      path.join(SCREENSHOT_STAGING_DIR, filename),
      `Staged screenshot ${filename}`,
    );
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
    await assertCanonicalPng(
      path.join(CANONICAL_SCREENSHOT_DIR, filename),
      `Canonical screenshot ${filename}`,
    );
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
  } else if (command === "--reset-staging") {
    await resetScreenshotStaging();
  } else if (command === "--promote-staged") {
    await promoteCanonicalScreenshots();
  } else if (command === "--verify-canonical") {
    await verifyCanonicalScreenshots();
  } else {
    throw new Error("Expected --paths, --reset-staging, --promote-staged, or --verify-canonical.");
  }
}
