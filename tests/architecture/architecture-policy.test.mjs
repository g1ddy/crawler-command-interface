import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { analyzeArchitecture } from "../../scripts/check-architecture.mjs";

const policy = JSON.parse(fs.readFileSync(new URL("../../architecture-policy.json", import.meta.url), "utf8"));

function analyze(files, overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "crawler-architecture-"));
  for (const [file, contents] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), contents);
  }
  return analyzeArchitecture(root, { ...policy, ...overrides });
}

const forbidden = [
  ["domain-must-not-depend-on-ui", "app/domain/model.ts", "../../src/features/crawler/View", "src/features/crawler/View.tsx"],
  ["domain-must-not-depend-on-ui", "app/domain/model.ts", "../../src/shell/Nav", "src/shell/Nav.ts"],
  ["domain-must-not-depend-on-ui", "app/domain/model.ts", "../../src/application/actions", "src/application/actions.ts"],
  ["shared-must-remain-generic", "src/shared/ui/Panel.ts", "../../features/crawler/View", "src/features/crawler/View.tsx"],
  ["shared-must-remain-generic", "src/shared/ui/Panel.ts", "../../shell/Nav", "src/shell/Nav.ts"],
  ["shared-must-remain-generic", "src/shared/ui/Panel.ts", "../../application/actions", "src/application/actions.ts"],
  ["shared-must-remain-generic", "src/shared/ui/Panel.ts", "../../../app/domain/types", "app/domain/types.ts"],
  ["features-must-not-depend-on-shell", "src/features/crawler/View.ts", "../../shell/Nav", "src/shell/Nav.ts"],
  ["application-must-not-depend-on-ui", "src/application/actions.ts", "../features/crawler/View", "src/features/crawler/View.tsx"],
  ["application-must-not-depend-on-ui", "src/application/actions.ts", "../shell/Nav", "src/shell/Nav.ts"],
  ["application-must-not-depend-on-ui", "src/application/actions.ts", "../../app/chatgpt-auth", "app/chatgpt-auth.ts"],
  ["application-must-not-depend-on-react", "src/application/actions.ts", "react", null],
  ["shared-browser-must-not-depend-on-host", "src/CrawlerApp.tsx", "../app/chatgpt-auth", "app/chatgpt-auth.ts"],
  ["features-must-use-public-contracts", "src/features/inventory/View.ts", "../timeline/private", "src/features/timeline/private.ts"],
];

for (const [rule, from, specifier, target] of forbidden) {
  test(`rejects ${rule}`, () => {
    const files = { [from]: `import ${target ? "{} from " : ""}${JSON.stringify(specifier)};` };
    if (target) files[target] = "export {};";
    assert.ok(analyze(files).some((violation) => violation.rule === rule));
  });
}

test("rejects Node-only authoring code reachable from a browser runtime root", () => {
  const violations = analyze({
    "src/CrawlerApp.tsx": 'import "../app/domain/raw-loader";',
    "app/domain/raw-loader.ts": 'import fs from "node:fs";',
  });
  assert.ok(violations.some(({ rule }) => rule === "runtime-must-not-reach-node-authoring"));
  assert.ok(violations.some(({ rule }) => rule === "runtime-must-not-import-node-builtins"));
});

test("allows domain dependencies and an explicit feature public contract", () => {
  assert.deepEqual(analyze({
    "src/features/inventory/View.ts": 'import { Badge } from "../timeline/public"; import type {} from "../../../app/domain/types";',
    "src/features/timeline/public.ts": 'export { Badge } from "./Badge";',
    "src/features/timeline/Badge.ts": "export const Badge = 1;",
    "app/domain/types.ts": "export {};",
  }), []);
});

test("features may consume only focused application contracts", () => {
  const violations = analyze({
    "src/features/inventory/View.ts": 'import {} from "../../application/crawler-actions";',
    "src/application/crawler-actions.ts": "export {};",
  });
  assert.ok(violations.some(({ rule }) => rule === "features-must-use-action-contracts"));
});
