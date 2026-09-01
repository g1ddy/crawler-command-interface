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

    assert.doesNotMatch(content, /git commit/i, `${relPath} must not contain git commit steps`);
    assert.doesNotMatch(content, /git push/i, `${relPath} must not contain git push steps`);
    assert.doesNotMatch(content, /contents:\s*write/i, `${relPath} must not have write permissions to repo contents`);
  }
});

test("artifact workflow keeps verification read-only and gates the only writer", async () => {
  const publishWorkflowPath = join(repositoryRoot, ".github/workflows/publish-artifacts.yml");
  const content = await readFile(publishWorkflowPath, "utf8");

  assert.match(content, /^permissions:\s*\n\s*actions:\s*read\s*\n\s*contents:\s*read\s*\n\s*pull-requests:\s*read/m,
    "workflow defaults must be read-only");
  assert.match(content, /needs:\s*\[resolve-pr,\s*verify-screenshots,\s*verify-maritime\]/,
    "publish job must depend on successful screenshot and Maritime verification");
  assert.match(content, /environment:\s*artifact-finalization/,
    "publish job must use the protected artifact-finalization environment");
  assert.match(content, /publish:[\s\S]*?permissions:\s*\n\s*actions:\s*read\s*\n\s*contents:\s*write/,
    "only the publish job should receive contents: write");
  assert.match(content, /cancel-in-progress:\s*true/,
    "publish workflow must use cancel-in-progress concurrency");
  assert.match(content, /git add -- 'docs\/images\/screenshot-\*\.png' \.maritime docs\/images\/dependency-graph\.svg/,
    "the single approved writer must promote screenshots and Maritime evidence together");
  assert.match(content, /git commit -m "chore: publish generated artifacts"/,
    "generated artifacts must be published in one controlled commit");
  assert.doesNotMatch(content, /\[(?:skip ci|ci skip|no ci|skip actions|actions skip)\]/i,
    "generated artifact commits must not persist workflow-skip directives that could suppress main CI");
  assert.match(content, /git push/, "publish workflow must contain controlled git push");
  assert.match(content, /EXPECTED_HEAD_SHA/, "publish workflow must check expected head SHA before publishing");
  assert.match(content, /INPUT_PR_NUMBER/, "workflow_dispatch must resolve a requested PR");
  assert.match(content, /required:\s*true/, "manual finalization must require a PR number");
  assert.match(content, /is_fork/, "publish workflow must check fork status before publication");
  assert.match(content, /comparison_status=\$\?/, "Maritime comparator status must be captured explicitly");
  assert.match(content, /1\)\s*\n\s*has_maritime_changes=true/, "Maritime comparator status 1 must mean substantive change");
});
