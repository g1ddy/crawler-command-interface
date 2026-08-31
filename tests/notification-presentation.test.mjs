import assert from "node:assert/strict";
import test from "node:test";
import { projectNotifications } from "../src/features/notifications/notification-presentation.ts";

const base = { occurred_at: "2025-01-01", category: "system", position: { floor: 1 }, evidence: [] };
const events = [
  { ...base, id: "achievement", sequence: 1, type: "AchievementUnlocked", summary: "Unlocked One", notificationDelivery: { delivered: true, kind: "achievement", severity: "success" } },
  { ...base, id: "narrative", sequence: 2, type: "NarrativeEvent", kind: "floor-collapsed", summary: "A dramatic collapse" },
  { ...base, id: "level", sequence: 3, type: "LevelChanged", level: 2, summary: "Reached level two", notificationDelivery: { delivered: true, kind: "progression", severity: "success" } },
  { ...base, id: "inventory", sequence: 4, type: "ItemAcquired", summary: "Picked up an item" },
];

test("notification projection is semantic and replay-bounded", () => {
  assert.deepEqual(projectNotifications(events, 2).map(({ kind, sequence }) => ({ kind, sequence })), [
    { kind: "achievement", sequence: 1 },
  ]);
  assert.deepEqual(projectNotifications(events, 4).map(item => item.kind), ["progression", "achievement"]);
});

test("notification kind remains separate from severity", () => {
  const [notice] = projectNotifications(events, 1);
  assert.equal(notice.kind, "achievement");
  assert.equal(notice.severity, "success");
});
