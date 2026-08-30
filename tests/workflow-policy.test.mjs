import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("ordinary PR verification workflows do not commit or push to active branches", async () => {
  const verificationWorkflows = [
    ".github/workflows/ci.yml",
    ".github/workflows/playwright.yml",
    ".github/workflows/deploy-pages.yml",
  ];

  for (const relPath of verificationWorkflows) {
    const filePath = join(repositoryRoot, relPath);
    const content = await readFile(filePath, "utf8");

    assert.doesNotMatch(
      content,
      /git commit/i,
      `${relPath} must not contain git commit steps`,
    );
    assert.doesNotMatch(
      content,
      /git push/i,
      `${relPath} must not contain git push steps`,
    );
    assert.doesNotMatch(
      content,
      /contents:\s*write/i,
      `${relPath} must not have write permissions to repo contents`,
    );
  }
});

test("publish workflow enforces job dependencies, protected environment, single commit, SHA verification, and PR resolution", async () => {
  const publishWorkflowPath = join(repositoryRoot, ".github/workflows/publish-artifacts.yml");
  const content = await readFile(publishWorkflowPath, "utf8");

  assert.match(
    content,
    /needs:\s*\[resolve-pr,\s*verify-screenshots,\s*verify-maritime\]/,
    "publish job must depend on successful screenshot and Maritime verification",
  );
  assert.match(
    content,
    /environment:\s*artifact-finalization/,
    "publish job must use the protected artifact-finalization environment",
  );
  assert.match(
    content,
    /permissions:\s*\n\s*contents:\s*write/,
    "publish workflow top-level must request contents: write permission for publication",
  );
  assert.match(
    content,
    /cancel-in-progress:\s*true/,
    "publish workflow must use cancel-in-progress concurrency",
  );
  assert.match(
    content,
    /git commit/,
    "publish workflow must contain git commit for controlled artifact publication",
  );
  assert.match(
    content,
    /git push/,
    "publish workflow must contain git push for controlled artifact publication",
  );
  assert.match(
    content,
    /EXPECTED_HEAD_SHA/,
    "publish workflow must check expected head SHA before publishing",
  );
  assert.match(
    content,
    /INPUT_PR_NUMBER/,
    "publish workflow must handle workflow_dispatch pr_number resolution",
  );
  assert.match(
    content,
    /is_fork/,
    "publish workflow must check fork status before publication",
  );
});
