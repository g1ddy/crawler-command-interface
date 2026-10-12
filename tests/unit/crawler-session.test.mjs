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

test("selectSequence synchronizes floor context and handles Live boundary at maxSeq", () => {
  const controller = new CrawlerSessionController({
    timelineDoc: compiledTimeline,
    storageAdapter: null,
  });

  // Select Floor 1 historical sequence (e.g., seq 1)
  controller.selectSequence(1);
  const snapSeq1 = controller.getSnapshot();
  assert.strictEqual(snapSeq1.isLive, false);
  assert.strictEqual(snapSeq1.selectedFloorOrdinal, 1);
  assert.strictEqual(snapSeq1.floorHudTitle, "First Floor");

  // Select max sequence (Live boundary)
  controller.selectSequence(snapSeq1.maxSeq);
  const snapLive = controller.getSnapshot();
  assert.strictEqual(snapLive.isLive, true);
  assert.strictEqual(snapLive.selectedFloorOrdinal, snapLive.latestFloor);
});

test("CrawlerSessionController snapshot resolves floor context from selected sequence position independently of floor filter", () => {
  const multiFloorFixture = {
    version: "2.0.0",
    floors: [
      { ordinal: 1, title: "First Floor", startSequence: 10, endSequence: 50 },
      { ordinal: 2, title: "Second Floor", startSequence: 51, endSequence: 100 },
    ],
    events: [
      { id: "e1", sequence: 10, position: { floor: 1 }, summary: "Floor 1 start" },
      { id: "e2", sequence: 50, position: { floor: 1 }, summary: "Floor 1 end" },
      { id: "e3", sequence: 51, position: { floor: 2 }, summary: "Floor 2 start" },
      { id: "e4", sequence: 100, position: { floor: 2 }, summary: "Floor 2 end" },
    ],
  };

  const controller = new CrawlerSessionController({
    timelineDoc: multiFloorFixture,
    storageAdapter: null,
  });

  // 1. Live with All Floors selected: floorHudTitle reflects actual latest floor (Floor 2)
  controller.selectFloor("all");
  const snapLiveAll = controller.getSnapshot();
  assert.strictEqual(snapLiveAll.selectedFloorOrdinal, "all");
  assert.strictEqual(snapLiveAll.floorHudTitle, "Second Floor");
  assert.strictEqual(snapLiveAll.floorHudOrdinal, 2);

  // 2. Historical sequence on Floor 1: selectSequence syncs selectedFloorOrdinal to 1, floorHudTitle reflects Floor 1
  controller.selectSequence(20);
  const snapHistAll = controller.getSnapshot();
  assert.strictEqual(snapHistAll.selectedFloorOrdinal, 1);
  assert.strictEqual(snapHistAll.floorHudTitle, "First Floor");
  assert.strictEqual(snapHistAll.floorHudOrdinal, 1);

  // 3. Return to Live: restores latest floor context
  controller.returnToLive();
  const snapRestoredLive = controller.getSnapshot();
  assert.strictEqual(snapRestoredLive.floorHudTitle, "Second Floor");
  assert.strictEqual(snapRestoredLive.floorHudOrdinal, 2);

  // 4. Specific floor selection: existing floor selection intact
  controller.selectFloor(1);
  const snapFloor1Filter = controller.getSnapshot();
  assert.strictEqual(snapFloor1Filter.selectedFloorOrdinal, 1);
  assert.strictEqual(snapFloor1Filter.floorHudTitle, "First Floor");
  assert.strictEqual(snapFloor1Filter.floorHudOrdinal, 1);

  // 5. Missing floor evidence: sequence before any floor event or segment range
  const unestablishedFixture = {
    version: "2.0.0",
    floors: [
      { ordinal: 1, title: "First Floor", startSequence: 10, endSequence: 50 },
    ],
    events: [
      { id: "e0", sequence: 1, summary: "Pre-floor event" },
      { id: "e1", sequence: 10, position: { floor: 1 }, summary: "Floor 1 start" },
    ],
  };

  const unestController = new CrawlerSessionController({
    timelineDoc: unestablishedFixture,
    storageAdapter: null,
  });

  unestController.selectFloor("all");
  unestController.selectSequence(1);
  const snapUnest = unestController.getSnapshot();
  assert.strictEqual(snapUnest.selectedFloorOrdinal, "all");
  assert.strictEqual(snapUnest.floorHudTitle, "");
  assert.strictEqual(snapUnest.floorHudOrdinal, undefined);
  assert.notStrictEqual(snapUnest.floorHudTitle, "All Floors (Whole Story)");
});

test("presentation choice and local UI state are decoupled from persistence and timeline JSON", () => {
  const jsonDocument = JSON.stringify(compiledTimeline);
  assert.strictEqual(jsonDocument.includes("presentationChoice"), false);
  assert.strictEqual(jsonDocument.includes("hudPresentation"), false);
});
