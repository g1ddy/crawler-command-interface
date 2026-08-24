import assert from "node:assert/strict";
import test from "node:test";

test("validation module does not compile Ajv schemas while it is imported", async () => {
  const originalFunction = globalThis.Function;
  globalThis.Function = function WorkerSafeFunction() {
    throw new Error("Code generation from strings disallowed for this context");
  };

  try {
    await import(`../app/domain/validation.ts?worker-safe-import=${Date.now()}`);
  } finally {
    globalThis.Function = originalFunction;
  }

  assert.ok(true);
});
