import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveNotificationAccessibleLabel,
  formatFloorDisplay,
} from "../../src/shell/hud/hud-composition.ts";

test("floor title display avoids repeating the ordinal as a title", () => {
  assert.equal(formatFloorDisplay("Third Floor", 3), "FLOOR 3");
  assert.equal(formatFloorDisplay("Floor 3", 3), "FLOOR 3");
  assert.equal(formatFloorDisplay("Over City", 3), "FLOOR 3 · OVER CITY");
  assert.equal(formatFloorDisplay("", 3), "");
});

test("notification accessible label reflects only current attention state", async (t) => {
  const cases = [
    {
      name: "current notices without an active alert",
      attention: { currentSequenceNotificationCount: 2, hasActiveAlerts: false },
      expected: "Notifications: 2 current notices",
    },
    {
      name: "one current notice with an active alert",
      attention: { currentSequenceNotificationCount: 1, hasActiveAlerts: true },
      expected: "Notifications: 1 current notice, active alert",
    },
    {
      name: "active alert without a current notice",
      attention: { currentSequenceNotificationCount: 0, hasActiveAlerts: true },
      expected: "Notifications: active alert",
    },
    {
      name: "historical total does not create a current notice label",
      attention: { currentSequenceNotificationCount: 0, hasActiveAlerts: false, totalNotificationsCount: 2 },
      expected: "Notifications: no active notices",
    },
  ];

  for (const item of cases) {
    await t.test(item.name, () => {
      assert.equal(deriveNotificationAccessibleLabel(item.attention), item.expected);
    });
  }
});
