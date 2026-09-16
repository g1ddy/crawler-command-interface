import assert from "node:assert/strict";
import test from "node:test";
import { projectNotifications } from "../../src/features/notifications/notification-presentation.ts";
import { projectRatingsMetrics } from "../../src/features/ratings/ratings-presentation.ts";

const observation = (value) => ({ value, evidence: [] });

const baseEvent = {
  occurred_at: "2025-01-01",
  category: "system",
  position: { floor: 1 },
  evidence: [],
};

test("Ratings presentation preserves zero and formats ranking without inventing missing metrics", () => {
  const metrics = projectRatingsMetrics({
    viewers: observation(0),
    leaderboardRank: observation(7),
    followers: observation(42),
  });

  assert.deepEqual(metrics.map(({ label, value, group }) => ({ label, value, group })), [
    { label: "Views", value: 0, group: "audience" },
    { label: "Followers", value: 42, group: "audience" },
    { label: "Floor rank", value: "#7", group: "ranking" },
  ]);
  assert.equal(metrics.some(({ label }) => label === "Favorites"), false);
  assert.equal(metrics.some(({ label }) => label === "Patrons"), false);
});

test("Notifications only expose authored delivery and respect the selected replay sequence", () => {
  const events = [
    {
      ...baseEvent,
      id: "achievement-not-delivered",
      sequence: 1,
      type: "AchievementUnlocked",
      summary: "Achievement happened",
      achievement: { title: "Award", description: "Award text", reward: [{ type: "box", id: "box-1" }] },
    },
    {
      ...baseEvent,
      id: "delivered",
      sequence: 3,
      type: "NarrativeEvent",
      summary: "Explicit fallback summary",
      notificationDelivery: {
        delivered: true,
        kind: "system",
        severity: "warning",
        title: "SYSTEM NOTICE",
        message: "Crawler notice",
      },
    },
    {
      ...baseEvent,
      id: "later",
      sequence: 5,
      type: "NarrativeEvent",
      notificationDelivery: {
        delivered: true,
        kind: "system",
        severity: "info",
        title: "Later",
        message: "Later notice",
      },
    },
  ];

  assert.deepEqual(projectNotifications(events, 2), []);
  assert.deepEqual(projectNotifications(events, 3), [
    {
      id: "delivered",
      sequence: 3,
      kind: "system",
      severity: "warning",
      title: "SYSTEM NOTICE",
      message: "Crawler notice",
      rewards: undefined,
    },
  ]);
});

test("Delivered achievement notifications preserve authored reward data", () => {
  const reward = [{ type: "box", id: "box-1" }];
  const events = [{
    ...baseEvent,
    id: "achievement",
    sequence: 4,
    type: "AchievementUnlocked",
    summary: "Achievement summary",
    achievement: { title: "Award", description: "Award description", reward },
    notificationDelivery: {
      delivered: true,
      kind: "achievement",
      severity: "info",
    },
  }];

  assert.deepEqual(projectNotifications(events, 4)[0], {
    id: "achievement",
    sequence: 4,
    kind: "achievement",
    severity: "info",
    title: "Award",
    message: "Award description",
    rewards: reward,
  });
});
