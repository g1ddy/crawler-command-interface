import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function validateMaritimeArtifacts(
  evidenceDir = ".maritime",
  svgPath = "docs/images/dependency-graph.svg",
) {
  const manifestPath = resolve(evidenceDir, "manifest.json");
  const reportPath = resolve(evidenceDir, "complexity-report.md");
  const metricsPath = resolve(evidenceDir, "complexity-metrics.json");
  const graphPath = resolve(evidenceDir, "dependency-graph.json");
  const resolvedSvgPath = resolve(svgPath);

  if (!existsSync(manifestPath)) {
    throw new Error(`Maritime manifest missing at ${manifestPath}`);
  }
  if (!existsSync(reportPath)) {
    throw new Error(`Maritime complexity report missing at ${reportPath}`);
  }
  if (!existsSync(metricsPath)) {
    throw new Error(`Maritime complexity metrics missing at ${metricsPath}`);
  }
  if (!existsSync(graphPath)) {
    throw new Error(`Maritime dependency graph missing at ${graphPath}`);
  }
  if (!existsSync(resolvedSvgPath)) {
    throw new Error(`Maritime SVG missing at ${resolvedSvgPath}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (err) {
    throw new Error(`Invalid manifest JSON: ${err.message}`);
  }

  if (manifest.toolVersion !== "0.1.0-beta.4") {
    throw new Error(`Expected toolVersion '0.1.0-beta.4', got '${manifest.toolVersion}'`);
  }

  if (
    !Array.isArray(manifest.sourceRoots) ||
    manifest.sourceRoots.length !== 2 ||
    manifest.sourceRoots[0] !== "app" ||
    manifest.sourceRoots[1] !== "src"
  ) {
    throw new Error(
      `Expected sourceRoots ['app', 'src'], got ${JSON.stringify(manifest.sourceRoots)}`,
    );
  }

  const summary = manifest.summary ?? {};
  if (typeof summary.totalFiles !== "number" || summary.totalFiles <= 0) {
    throw new Error(`Invalid or non-positive totalFiles: ${summary.totalFiles}`);
  }
  if (typeof summary.scannedCount !== "number" || summary.scannedCount <= 0) {
    throw new Error(`Invalid or non-positive scannedCount: ${summary.scannedCount}`);
  }
  if (summary.scannedCount !== summary.totalFiles) {
    throw new Error(
      `scannedCount (${summary.scannedCount}) does not match totalFiles (${summary.totalFiles})`,
    );
  }
  if (summary.skippedCount !== 0) {
    throw new Error(`Expected skippedCount to be 0, got ${summary.skippedCount}`);
  }

  let metrics;
  try {
    metrics = JSON.parse(readFileSync(metricsPath, "utf8"));
  } catch (err) {
    throw new Error(`Invalid metrics JSON: ${err.message}`);
  }

  const metricKeys = Object.keys(metrics);
  if (metricKeys.length !== summary.totalFiles) {
    throw new Error(
      `Metric count (${metricKeys.length}) does not match totalFiles (${summary.totalFiles})`,
    );
  }

  for (const file of metricKeys) {
    const entry = metrics[file];
    if (!entry || entry.scanned !== true) {
      throw new Error(`Metric entry for '${file}' is missing or not scanned: true`);
    }
  }

  let graph;
  try {
    graph = JSON.parse(readFileSync(graphPath, "utf8"));
  } catch (err) {
    throw new Error(`Invalid dependency graph JSON: ${err.message}`);
  }

  if (!Array.isArray(graph.modules) || graph.modules.length === 0) {
    throw new Error("Dependency graph contains no modules");
  }

  const graphSources = new Set(graph.modules.map((m) => m.source));
  const hasApp = graph.modules.some((m) => typeof m.source === "string" && m.source.startsWith("app/"));
  const hasSrc = graph.modules.some((m) => typeof m.source === "string" && m.source.startsWith("src/"));

  if (!hasApp || !hasSrc) {
    throw new Error("Dependency graph must contain local modules under both app/ and src/");
  }

  for (const file of metricKeys) {
    if (!graphSources.has(file)) {
      throw new Error(`Measured file '${file}' is missing from dependency graph`);
    }
  }

  for (const file of graphSources) {
    if (
      typeof file === "string" &&
      (file.startsWith("app/") || file.startsWith("src/")) &&
      /\.[cm]?[jt]sx?$/.test(file) &&
      !Object.hasOwn(metrics, file)
    ) {
      throw new Error(`Local dependency graph module '${file}' is missing from metrics`);
    }
  }

  const svgContent = readFileSync(resolvedSvgPath, "utf8");
  if (!svgContent.includes("<svg") || !svgContent.includes("</svg>")) {
    throw new Error("SVG file missing root <svg> elements");
  }

  const hasAppInSvg = svgContent.includes("app/") || svgContent.includes("cluster:app");
  const hasSrcInSvg = svgContent.includes("src/") || svgContent.includes("cluster:src");

  if (!hasAppInSvg || !hasSrcInSvg) {
    throw new Error("SVG must contain local module nodes under both app/ and src/");
  }

  return true;
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  try {
    const [evidenceDir, svgPath] = process.argv.slice(2);
    validateMaritimeArtifacts(evidenceDir, svgPath);
    console.log("✅ Maritime artifact validation passed.");
  } catch (err) {
    console.error(`❌ Maritime artifact validation failed: ${err.message}`);
    process.exit(1);
  }
}
