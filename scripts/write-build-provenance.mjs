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

const commitSha =
  process.env.GITHUB_SHA ??
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const sourceSha = process.env.BUILD_SOURCE_SHA ?? commitSha;

if (!commitSha || !sourceSha) {
  throw new Error("Unable to determine build provenance.");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, "build-provenance.json"),
  `${JSON.stringify({ target, commitSha, sourceSha }, null, 2)}\n`,
  "utf8",
);
