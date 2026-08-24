import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async (t) => {
  const workerPath = new URL("../dist/server/index.js", import.meta.url);
  if (!fs.existsSync(workerPath)) {
    t.skip("dist/server/index.js build output required");
    return;
  }

  const workerUrl = new URL(workerPath.href);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /FLOOR NAVIGATOR:/);
  assert.match(html, /SELECTED TIMELINE SEQUENCE/);
  assert.match(html, /type="range"/);
});
