import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = process.argv[2];

if (target !== "live" && target !== "pages") {
  throw new Error("Usage: node scripts/write-build-provenance.mjs <live|pages>");
}

const outputDirectory = resolve(
  process.cwd(),
  target === "live" ? "dist" : "dist-pages",
);

const buildSha =
  process.env.GITHUB_SHA ??
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const sourceSha = process.env.BUILD_SOURCE_SHA ?? buildSha;
// `commitSha` is retained as the source revision for compatibility with the
// existing downstream workflow_run validator on main. `buildSha` records the
// exact checked-out revision (for PR CI, GitHub's synthetic merge commit).
const commitSha = sourceSha;

if (!buildSha || !sourceSha) {
  throw new Error("Unable to determine build provenance.");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, "build-provenance.json"),
  `${JSON.stringify({ target, commitSha, sourceSha, buildSha }, null, 2)}\n`,
  "utf8",
);
