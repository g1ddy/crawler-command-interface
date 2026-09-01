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
  // Undici lazily initializes Request internals with Function. Construct the
  // request before simulating the Workerd code-generation restriction so the
  // assertion exercises application rendering rather than Node bootstrap.
  const request = new Request("http://localhost/", {
    headers: { accept: "text/html" },
  });
  const originalFunction = globalThis.Function;
  globalThis.Function = function WorkerSafeFunction() {
    throw new Error("Code generation from strings disallowed for this context");
  };

  try {
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      request,
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
    assert.match(html, /aria-label="Hotlist"/);
  } finally {
    globalThis.Function = originalFunction;
  }
});
