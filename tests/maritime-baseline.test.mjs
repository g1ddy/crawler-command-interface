import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateMaritimeArtifacts } from "../scripts/validate-maritime-artifacts.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const comparisonScript = join(repositoryRoot, "scripts/has-substantive-maritime-changes.mjs");

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runComparison(cwd) {
  return spawnSync(process.execPath, [comparisonScript], { cwd, encoding: "utf8" });
}

function assertComparison(cwd, expectedStatus) {
  const result = runComparison(cwd);
  assert.equal(result.status, expectedStatus, result.stderr);
}

test("Maritime baseline comparison ignores only volatile metadata", async (t) => {
  const temporaryRepository = mkdtempSync(join(tmpdir(), "maritime-baseline-"));
  const evidenceDirectory = join(temporaryRepository, ".maritime");
  mkdirSync(evidenceDirectory);

  const manifestPath = join(evidenceDirectory, "manifest.json");
  const reportPath = join(evidenceDirectory, "complexity-report.md");
  const metricsPath = join(evidenceDirectory, "complexity-metrics.json");
  const graphPath = join(evidenceDirectory, "dependency-graph.json");

  const manifest = {
    schemaVersion: "1.0.0",
    toolVersion: "0.1.0-beta.4",
    generatedAt: "2026-08-28T00:00:00.000Z",
    summary: { totalFiles: 2 },
  };

  writeJson(manifestPath, manifest);
  writeFileSync(reportPath, "## Complexity Report\n\n**Last Updated:** 2026-08-28\n\nStable content.\n");
  writeJson(metricsPath, { files: [{ path: "app/a.ts", complexity: 1 }] });
  writeJson(graphPath, { modules: [{ source: "app/a.ts" }] });

  execFileSync("git", ["init", "--quiet"], { cwd: temporaryRepository });
  execFileSync("git", ["config", "user.name", "Maritime Test"], { cwd: temporaryRepository });
  execFileSync("git", ["config", "user.email", "maritime-test@example.invalid"], {
    cwd: temporaryRepository,
  });
  execFileSync("git", ["add", ".maritime"], { cwd: temporaryRepository });
  execFileSync("git", ["commit", "--quiet", "-m", "baseline"], { cwd: temporaryRepository });

  t.after(() => rmSync(temporaryRepository, { recursive: true, force: true }));

  await t.test("manifest generatedAt only is not substantive", () => {
    writeJson(manifestPath, { ...manifest, generatedAt: "2026-08-29T00:00:00.000Z" });
    assertComparison(temporaryRepository, 0);
    execFileSync("git", ["checkout", "--quiet", "--", ".maritime"], { cwd: temporaryRepository });
  });

  await t.test("report Last Updated only is not substantive", () => {
    const report = readFileSync(reportPath, "utf8").replace("2026-08-28", "2026-08-29");
    writeFileSync(reportPath, report);
    assertComparison(temporaryRepository, 0);
    execFileSync("git", ["checkout", "--quiet", "--", ".maritime"], { cwd: temporaryRepository });
  });

  await t.test("metrics changes are substantive", () => {
    writeJson(metricsPath, { files: [{ path: "app/a.ts", complexity: 2 }] });
    assertComparison(temporaryRepository, 1);
    execFileSync("git", ["checkout", "--quiet", "--", ".maritime"], { cwd: temporaryRepository });
  });

  await t.test("graph changes are substantive", () => {
    writeJson(graphPath, { modules: [{ source: "app/b.ts" }] });
    assertComparison(temporaryRepository, 1);
    execFileSync("git", ["checkout", "--quiet", "--", ".maritime"], { cwd: temporaryRepository });
  });

  await t.test("nonvolatile manifest changes are substantive", () => {
    writeJson(manifestPath, { ...manifest, summary: { totalFiles: 3 } });
    assertComparison(temporaryRepository, 1);
    execFileSync("git", ["checkout", "--quiet", "--", ".maritime"], { cwd: temporaryRepository });
  });

  await t.test("added or removed files are substantive", () => {
    const addedPath = join(evidenceDirectory, "additional.json");
    writeJson(addedPath, { added: true });
    assertComparison(temporaryRepository, 1);
    rmSync(addedPath);

    rmSync(graphPath);
    assertComparison(temporaryRepository, 1);
    execFileSync("git", ["checkout", "--quiet", "--", ".maritime"], { cwd: temporaryRepository });
  });
});

test("Maritime consumer artifact validator enforces contract rules", async (t) => {
  const temporaryDir = mkdtempSync(join(tmpdir(), "maritime-validator-"));
  const evidenceDirectory = join(temporaryDir, ".maritime");
  const docsDirectory = join(temporaryDir, "docs/images");
  mkdirSync(evidenceDirectory, { recursive: true });
  mkdirSync(docsDirectory, { recursive: true });

  const manifestPath = join(evidenceDirectory, "manifest.json");
  const reportPath = join(evidenceDirectory, "complexity-report.md");
  const metricsPath = join(evidenceDirectory, "complexity-metrics.json");
  const graphPath = join(evidenceDirectory, "dependency-graph.json");
  const svgPath = join(docsDirectory, "dependency-graph.svg");

  t.after(() => rmSync(temporaryDir, { recursive: true, force: true }));

  function createValidBundle() {
    writeJson(manifestPath, {
      schemaVersion: "1.0.0",
      toolVersion: "0.1.0-beta.4",
      generatedAt: "2026-08-30T00:00:00.000Z",
      sourceRoots: ["app", "src"],
      summary: { totalFiles: 2, scannedCount: 2, skippedCount: 0 },
    });
    writeFileSync(reportPath, "# Report");
    writeJson(metricsPath, {
      "app/a.ts": { complexity: 1, loc: 10, scanned: true },
      "src/b.ts": { complexity: 2, loc: 20, scanned: true },
    });
    writeJson(graphPath, {
      modules: [
        { source: "app/a.ts", valid: true },
        { source: "src/b.ts", valid: true },
      ],
    });
    writeFileSync(
      svgPath,
      '<svg><g class="cluster" id="cluster:app"></g><g class="cluster" id="cluster:src"></g></svg>',
    );
  }

  await t.test("valid non-empty Crawler bundle is accepted", () => {
    createValidBundle();
    assert.equal(validateMaritimeArtifacts(evidenceDirectory, svgPath), true);
  });

  await t.test("zero-file / zero-scanned bundle is rejected even if claiming health 100", () => {
    createValidBundle();
    writeJson(manifestPath, {
      schemaVersion: "1.0.0",
      toolVersion: "0.1.0-beta.4",
      generatedAt: "2026-08-30T00:00:00.000Z",
      sourceRoots: ["app", "src"],
      summary: { totalFiles: 0, scannedCount: 0, skippedCount: 0, healthScore: 100 },
    });
    writeJson(metricsPath, {});
    writeJson(graphPath, { modules: [] });
    assert.throws(
      () => validateMaritimeArtifacts(evidenceDirectory, svgPath),
      /Invalid or non-positive totalFiles/,
    );
  });

  await t.test("metric missing from dependency graph is rejected", () => {
    createValidBundle();
    writeJson(graphPath, {
      modules: [{ source: "app/a.ts", valid: true }],
    });
    // Missing src/ in graph leads to local modules check error or missing from graph error
    assert.throws(
      () => validateMaritimeArtifacts(evidenceDirectory, svgPath),
      /Dependency graph must contain local modules under both app\/ and src\/|Measured file 'src\/b.ts' is missing from dependency graph/,
    );
  });

  await t.test("unmeasured metric is rejected", () => {
    createValidBundle();
    writeJson(metricsPath, {
      "app/a.ts": { complexity: 1, loc: 10, scanned: true },
      "src/b.ts": { complexity: 2, loc: 20, scanned: false },
    });
    assert.throws(
      () => validateMaritimeArtifacts(evidenceDirectory, svgPath),
      /Metric entry for 'src\/b.ts' is missing or not scanned: true/,
    );
  });

  await t.test("bundle with wrong source roots is rejected", () => {
    createValidBundle();
    writeJson(manifestPath, {
      schemaVersion: "1.0.0",
      toolVersion: "0.1.0-beta.4",
      generatedAt: "2026-08-30T00:00:00.000Z",
      sourceRoots: ["app"],
      summary: { totalFiles: 2, scannedCount: 2, skippedCount: 0 },
    });
    assert.throws(
      () => validateMaritimeArtifacts(evidenceDirectory, svgPath),
      /Expected sourceRoots \['app', 'src'\]/,
    );
  });

  await t.test("beta.3 manifest is rejected after migration", () => {
    createValidBundle();
    writeJson(manifestPath, {
      schemaVersion: "1.0.0",
      toolVersion: "0.1.0-beta.3",
      generatedAt: "2026-08-30T00:00:00.000Z",
      sourceRoots: ["app", "src"],
      summary: { totalFiles: 2, scannedCount: 2, skippedCount: 0 },
    });
    assert.throws(
      () => validateMaritimeArtifacts(evidenceDirectory, svgPath),
      /Expected toolVersion '0.1.0-beta.4', got '0.1.0-beta.3'/,
    );
  });

  await t.test("empty / non-Crawler SVG is rejected", () => {
    createValidBundle();
    writeFileSync(svgPath, "<svg><g></g></svg>");
    assert.throws(
      () => validateMaritimeArtifacts(evidenceDirectory, svgPath),
      /SVG contains no local app\/ or src\/ module nodes/,
    );
  });
});
