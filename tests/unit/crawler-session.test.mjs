import assert from "node:assert";
import { test } from "node:test";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { CrawlerSessionController } from "../../src/application/crawler-session-controller.ts";

test("CrawlerSessionController manages state and commands cleanly", () => {
  const controller = new CrawlerSessionController({
    timelineDoc: compiledTimeline,
    storageAdapter: null,
  });

  const sequence = 117; // Replay sequence where pet is acquired but not bonded

  // Step to sequence 117
  controller.selectSequence(sequence);
  const snapshotSeq = controller.getSnapshot();

  assert.strictEqual(snapshotSeq.isLive, false);
  assert.strictEqual(snapshotSeq.currentSeq, 117);
  assert.strictEqual(snapshotSeq.capabilities.pet, false);
  assert.strictEqual(snapshotSeq.capabilities.party, true);

  // Return to live
  controller.returnToLive();
  const snapshotLive = controller.getSnapshot();

  assert.strictEqual(snapshotLive.isLive, true);
  assert.strictEqual(snapshotLive.currentSeq, snapshotLive.maxSeq);
});

test("presentation choice and local UI state are decoupled from persistence and timeline JSON", () => {
  const jsonDocument = JSON.stringify(compiledTimeline);
  assert.strictEqual(jsonDocument.includes("presentationChoice"), false);
  assert.strictEqual(jsonDocument.includes("hudPresentation"), false);
});
