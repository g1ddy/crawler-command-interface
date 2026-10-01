import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const repositoryRoot = process.cwd();
const evidenceDirectory = resolve(repositoryRoot, ".maritime");

function listGeneratedFiles(directory) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const parentPath = entry.parentPath ?? entry.path;
      return relative(repositoryRoot, resolve(parentPath, entry.name)).split(sep).join("/");
    })
    .sort();
}

function listBaselineFiles() {
  return execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", "HEAD", "--", ".maritime"],
    { cwd: repositoryRoot, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .sort();
}

function normalizedContents(path, contents) {
  if (path === ".maritime/complexity-report.md") {
    const report = contents
      .toString("utf8")
      .replace(/^\*\*Last Updated:\*\*\s+.*$/m, "**Last Updated:** <generated>");
    return Buffer.from(report);
  }

  if (path === ".maritime/manifest.json") {
    const manifest = JSON.parse(contents.toString("utf8"));
    delete manifest.generatedAt;
    return Buffer.from(JSON.stringify(manifest));
  }

  if (path === ".maritime/dependency-graph.json") {
    const graph = JSON.parse(contents.toString("utf8"));
    if (graph.summary?.optionsUsed && typeof graph.summary.optionsUsed === "object") {
      delete graph.summary.optionsUsed.baseDir;
    }
    return Buffer.from(JSON.stringify(graph));
  }

  return contents;
}

function baselineContents(path) {
  return execFileSync("git", ["show", `HEAD:${path}`], {
    cwd: repositoryRoot,
    encoding: "buffer",
  });
}

try {
  const generatedFiles = listGeneratedFiles(evidenceDirectory);
  const baselineFiles = listBaselineFiles();

  if (JSON.stringify(generatedFiles) !== JSON.stringify(baselineFiles)) {
    process.exitCode = 1;
  } else {
    const hasSubstantiveChange = generatedFiles.some((path) => {
      const generated = normalizedContents(path, readFileSync(resolve(repositoryRoot, path)));
      const baseline = normalizedContents(path, baselineContents(path));
      return !generated.equals(baseline);
    });

    process.exitCode = hasSubstantiveChange ? 1 : 0;
  }
} catch (error) {
  console.error(`Unable to compare Maritime evidence: ${error.message}`);
  process.exitCode = 2;
}
