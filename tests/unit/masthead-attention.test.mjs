import assert from "node:assert/strict";
import test from "node:test";
import React, { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { PersistentHud } from "../../src/shell/hud/PersistentHud.ts";
import { ConceptHud } from "../../src/shell/hud/ConceptHud.ts";
import { ArwesAuthorityComposition } from "../../src/presentation/authority-arwes/ArwesAuthorityComposition.ts";

function makeComposition(attention) {
  return {
    system: {
      floorTitle: "FLOOR 3",
      sequence: 100,
    },
    urgency: {
      activeCountdown: null,
      formattedLabel: "",
    },
    attention,
    progression: {
      level: 13,
      valueDisplay: "LVL 13",
    },
  };
}

const mockState = { sequence: 100, hotlist: [], skills: [], crawler: { level: 13 } };

test("Masthead attention matrix across renderers", async (t) => {
  const cases = [
    {
      name: "Case 1: currentSequenceNotificationCount=2, hasActiveAlerts=false, totalNotificationsCount=2",
      attention: {
        currentSequenceNotificationCount: 2,
        hasActiveAlerts: false,
        totalNotificationsCount: 2,
      },
      expectLabel: "Notifications: 2 current notices",
      expectBadge: "2",
      expectAlertBadge: false,
    },
    {
      name: "Case 2: currentSequenceNotificationCount=1, hasActiveAlerts=true, totalNotificationsCount=1",
      attention: {
        currentSequenceNotificationCount: 1,
        hasActiveAlerts: true,
        totalNotificationsCount: 1,
      },
      expectLabel: "Notifications: 1 current notice, active alert",
      expectBadge: "1",
      expectAlertBadge: true,
    },
    {
      name: "Case 3: currentSequenceNotificationCount=0, hasActiveAlerts=true, totalNotificationsCount=2",
      attention: {
        currentSequenceNotificationCount: 0,
        hasActiveAlerts: true,
        totalNotificationsCount: 2,
      },
      expectLabel: "Notifications: active alert",
      expectBadge: false,
      expectAlertBadge: true,
    },
    {
      name: "Case 4: currentSequenceNotificationCount=0, hasActiveAlerts=false, totalNotificationsCount=2 (historical total ignored)",
      attention: {
        currentSequenceNotificationCount: 0,
        hasActiveAlerts: false,
        totalNotificationsCount: 2,
      },
      expectLabel: "Notifications: no active notices",
      expectBadge: false,
      expectAlertBadge: false,
    },
    {
      name: "Case 5: currentSequenceNotificationCount=0, hasActiveAlerts=false, totalNotificationsCount=0",
      attention: {
        currentSequenceNotificationCount: 0,
        hasActiveAlerts: false,
        totalNotificationsCount: 0,
      },
      expectLabel: "Notifications: no active notices",
      expectBadge: false,
      expectAlertBadge: false,
    },
  ];

  for (const c of cases) {
    await t.test(c.name, () => {
      const comp = makeComposition(c.attention);

      // PersistentHud
      const persistentHtml = renderToString(
        React.createElement(StrictMode, null, React.createElement(PersistentHud, { composition: comp, state: mockState }))
      );

      // ConceptHud
      const conceptHtml = renderToString(
        React.createElement(StrictMode, null, React.createElement(ConceptHud, { composition: comp, state: mockState }))
      );

      // ArwesAuthorityComposition
      const arwesHtml = renderToString(
        React.createElement(StrictMode, null, React.createElement(ArwesAuthorityComposition, { composition: comp }))
      );

      for (const [name, html] of [
        ["PersistentHud", persistentHtml],
        ["ConceptHud", conceptHtml],
        ["ArwesAuthorityComposition", arwesHtml],
      ]) {
        // Assert accessible label
        assert.match(html, new RegExp(`aria-label="${c.expectLabel}"`), `${name} expected aria-label "${c.expectLabel}"`);

        // Assert notification count badge
        if (c.expectBadge) {
          assert.match(html, new RegExp(`data-testid="(notification-count-badge|concept-hud-notice-count)"[^>]*>${c.expectBadge}<`), `${name} expected badge count "${c.expectBadge}"`);
        } else {
          assert.doesNotMatch(html, /data-testid="(notification-count-badge|concept-hud-notice-count)"/, `${name} expected no notice count badge`);
        }

        // Assert alert badge
        if (c.expectAlertBadge) {
          assert.match(html, /data-testid="notification-alert-badge"/, `${name} expected alert badge`);
        } else {
          assert.doesNotMatch(html, /data-testid="notification-alert-badge"/, `${name} expected no alert badge`);
        }

        // Assert no prominent text labels (like "2 NOTICES" or "⚠️ ALERT") in masthead
        assert.doesNotMatch(html, />\s*\d+\s+NOTICE/i, `${name} must not render prominent N NOTICES text`);
        assert.doesNotMatch(html, />\s*⚠️\s*ALERT/i, `${name} must not render prominent ⚠️ ALERT text in masthead`);
      }
    });
  }
});
