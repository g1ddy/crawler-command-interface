import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveNotificationsPresentation,
  projectNotifications,
} from "../../src/features/notifications/public.ts";

const base = { occurred_at: "2025-01-01", category: "system", position: { floor: 1 }, evidence: [] };
const events = [
  {
    ...base,
    id: "achievement",
    sequence: 1,
    type: "AchievementUnlocked",
    summary: "Unlocked One",
    achievement: {
      title: "First Step",
      description: "Made your first step",
      reward: [{ kind: "box", boxType: "bronze", rarity: "common", amount: 1 }],
    },
    notificationDelivery: { delivered: true, kind: "achievement", severity: "success" },
  },
  { ...base, id: "narrative", sequence: 2, type: "NarrativeEvent", kind: "floor-collapsed", summary: "A dramatic collapse" },
  { ...base, id: "level", sequence: 3, type: "LevelChanged", level: 2, summary: "Reached level two", notificationDelivery: { delivered: true, kind: "progression", severity: "success" } },
  { ...base, id: "inventory", sequence: 4, type: "ItemAcquired", summary: "Picked up an item" },
];

test("notification projection is semantic and replay-bounded", () => {
  assert.deepEqual(projectNotifications(events, 2).map(({ kind, sequence }) => ({ kind, sequence })), [
    { kind: "achievement", sequence: 1 },
  ]);
  assert.deepEqual(projectNotifications(events, 4).map((item) => item.kind), ["progression", "achievement"]);
});

test("notification kind remains separate from severity", () => {
  const [notice] = projectNotifications(events, 1);
  assert.equal(notice.kind, "achievement");
  assert.equal(notice.severity, "success");
});

test("deriveNotificationsPresentation returns structured presentation model for live and replay", () => {
  const livePres = deriveNotificationsPresentation({ events, sequence: 3, isLive: true });
  assert.equal(livePres.isLive, true);
  assert.equal(livePres.sequence, 3);
  assert.equal(livePres.totalCount, 2);
  assert.equal(livePres.hasNotifications, true);
  assert.equal(livePres.badgeLabel, "2 NOTICES · LIVE");

  const replayPres = deriveNotificationsPresentation({ events, sequence: 1, isLive: false });
  assert.equal(replayPres.isLive, false);
  assert.equal(replayPres.sequence, 1);
  assert.equal(replayPres.totalCount, 1);
  assert.equal(replayPres.badgeLabel, "1 NOTICE · REPLAY @ SEQ #1");

  const achievementNotice = replayPres.notifications[0];
  assert.equal(achievementNotice.icon, "🏆");
  assert.equal(achievementNotice.title, "First Step");
  assert.equal(achievementNotice.isCurrentDelivery, true);
  assert.ok(achievementNotice.formattedRewards);
  assert.equal(achievementNotice.formattedRewards[0].kind, "BOX");
  assert.match(achievementNotice.formattedRewards[0].detail, /bronze/);
});

test("deriveNotificationsPresentation handles empty events without fabricating notices", () => {
  const emptyPres = deriveNotificationsPresentation({ events: [], sequence: 5, isLive: false });
  assert.equal(emptyPres.hasNotifications, false);
  assert.equal(emptyPres.totalCount, 0);
  assert.equal(emptyPres.notifications.length, 0);
  assert.equal(emptyPres.badgeLabel, "0 NOTICES · REPLAY @ SEQ #5");
});

test("events without delivered notificationDelivery do not generate notifications", () => {
  const nonDelivered = [
    { ...base, id: "inv-1", sequence: 1, type: "ItemAcquired", notificationDelivery: { delivered: false, kind: "system", severity: "info" } },
  ];
  const pres = deriveNotificationsPresentation({ events: nonDelivered, sequence: 2, isLive: true });
  assert.equal(pres.hasNotifications, false);
  assert.equal(pres.totalCount, 0);
});
