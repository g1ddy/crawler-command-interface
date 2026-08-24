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

if (!commitSha) {
  throw new Error("Unable to determine the source commit for this build.");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, "build-provenance.json"),
  `${JSON.stringify({ target, commitSha }, null, 2)}\n`,
  "utf8",
);
