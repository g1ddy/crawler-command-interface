import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadRawFloorDocument } from "../../app/domain/raw-loader.ts";

const PRE_REFACTOR_FLOOR_BLOB_SHA = new Map([
  [1, "7814594fd94026a29b9247d077cc2a6e74f91ab8"],
  [2, "9c398e5adf2b9c32ace95e50438caec7b55a47f4"],
]);

function gitBlobSha(content) {
  const bytes = Buffer.from(content, "utf8");
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}

test("generated compatibility floors remain identical to the pre-refactor storage baseline", () => {
  for (const [floor, expectedSha] of PRE_REFACTOR_FLOOR_BLOB_SHA) {
    const content = fs.readFileSync(`data/floors/floor-${floor}.json`, "utf8");
    assert.equal(
      gitBlobSha(content),
      expectedSha,
      `Floor ${floor} compatibility output changed during the raw-storage-only migration.`,
    );
  }
});

test("floor catalog membership remains local when definitions are shared", () => {
  const floor1 = loadRawFloorDocument("floor-1");
  const floor2 = loadRawFloorDocument("floor-2");

  assert.equal(floor1.catalog.items.some((item) => item.id === "item-goo-inator-3000"), false);
  assert.equal(floor1.catalog.achievements.some((achievement) => achievement.id === "achievement-dungeonpreneur"), false);
  assert.equal(floor2.catalog.items.some((item) => item.id === "item-trollskin-shirt-of-pummeling"), false);
  assert.equal(floor2.catalog.achievements.some((achievement) => achievement.id === "achievement-empty-pockets"), false);
});

test("floor catalog membership is required rather than falling back to the global catalog union", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "crawler-raw-storage-"));
  const tempRaw = path.join(tempRoot, "raw");

  try {
    fs.cpSync("data/raw", tempRaw, { recursive: true });
    fs.rmSync(path.join(tempRaw, "floors", "floor-1", "catalog.json"));

    assert.throws(
      () => loadRawFloorDocument("floor-1", tempRaw),
      /required floor catalog membership file/,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
