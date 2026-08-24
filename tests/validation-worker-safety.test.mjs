import assert from "node:assert/strict";
import test from "node:test";

test("runtime fixture import path does not compile Ajv schemas", async () => {
  const originalFunction = globalThis.Function;
  globalThis.Function = function WorkerSafeFunction() {
    throw new Error("Code generation from strings disallowed for this context");
  };

  try {
    await import(`../app/domain/fixtures/compiled-timeline.ts?worker-safe-import=${Date.now()}`);
  } finally {
    globalThis.Function = originalFunction;
  }

  assert.ok(true);
});
