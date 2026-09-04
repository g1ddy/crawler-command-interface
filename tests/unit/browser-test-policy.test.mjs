import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const BROWSER_TEST_DIRS = ["tests/e2e", "tests/screenshots"];
const FORCED_PLAYWRIGHT_ACTIONS = new Set([
  "check",
  "click",
  "dblclick",
  "dragTo",
  "hover",
  "setChecked",
  "tap",
  "uncheck",
]);

async function sourceFilesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await sourceFilesUnder(entryPath));
    } else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function scriptKindFor(file) {
  if (file.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (file.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (file.endsWith(".ts") || file.endsWith(".mts") || file.endsWith(".cts")) {
    return ts.ScriptKind.TS;
  }
  return ts.ScriptKind.JS;
}

function forcedBrowserActionsIn(file, source) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(file),
  );
  const violations = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      FORCED_PLAYWRIGHT_ACTIONS.has(node.expression.name.text)
    ) {
      for (const argument of node.arguments) {
        if (!ts.isObjectLiteralExpression(argument)) continue;

        const forceProperty = argument.properties.find(
          (property) =>
            ts.isPropertyAssignment(property) &&
            ((ts.isIdentifier(property.name) && property.name.text === "force") ||
              (ts.isStringLiteral(property.name) && property.name.text === "force")),
        );

        if (
          forceProperty &&
          ts.isPropertyAssignment(forceProperty) &&
          forceProperty.initializer.kind === ts.SyntaxKind.TrueKeyword
        ) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(forceProperty.getStart(sourceFile));
          violations.push(`${file}:${line + 1} (${node.expression.name.text})`);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

test("browser tests do not bypass Playwright actionability with force: true", async () => {
  const files = (
    await Promise.all(BROWSER_TEST_DIRS.map((directory) => sourceFilesUnder(directory)))
  ).flat();

  const violations = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    violations.push(...forcedBrowserActionsIn(file, source));
  }

  assert.deepEqual(
    violations,
    [],
    [
      "Do not use force: true on Playwright browser actions.",
      "Wait for the intended application state/actionability instead.",
      `Violations: ${violations.join(", ")}`,
    ].join("\n"),
  );
});
