import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState, applyEvent } from "../app/domain/projection.ts";
import { projectNotifications } from "../src/features/notifications/notification-presentation.ts";
import { projectRatingsMetrics } from "../src/features/ratings/ratings-presentation.ts";
import { groupConditions } from "../src/features/crawler/health/condition-presentation.ts";
import { availableRootViews, resolveRootView, selectedSequenceCapabilities } from "../src/shell/navigation/capabilities.ts";

const base = { occurred_at: "2025-01-01", category: "system", position: { floor: 1 }, evidence: [] };
const delivered = { delivered: true, kind: "achievement", severity: "warning" };
const events = [
  { ...base, id: "generic", sequence: 1, type: "AchievementUnlocked", summary: "Occurred, but was not delivered" },
  { ...base, id: "delivered", sequence: 3, type: "NarrativeEvent", kind: "other", summary: "Explicit message", notificationDelivery: delivered },
];
const emptyObservations = { condition: {}, attributes: {}, xpProgress: {}, broadcast: {}, floor: {}, inventory: {}, equipment: {} };

test("authored notification delivery is replay bounded and independent of event type", () => {
  assert.deepEqual(projectNotifications(events, 2), []);
  assert.deepEqual(projectNotifications(events, 3).map(({ id, kind, severity }) => ({ id, kind, severity })), [{ id: "delivered", kind: "achievement", severity: "warning" }]);
});

test("ratings unavailable state never presents projection defaults as sourced facts", () => {
  assert.deepEqual(projectRatingsMetrics({}), []);
});

test("selected-sequence capabilities cross evidence boundaries and resolve unavailable views", () => {
  const state = createInitialState({ crawler: { name: "Carl", level: 1, attributes: {}, condition: {} } });
  const before = selectedSequenceCapabilities(state, emptyObservations, events, 2);
  assert.equal(before.ratings, false); assert.equal(before.notifications, false); assert.equal(resolveRootView("ratings", before), "crawler");
  const after = selectedSequenceCapabilities(state, { ...emptyObservations, broadcast: { viewers: { value: 12 } } }, events, 3);
  assert.equal(after.ratings, true); assert.equal(after.notifications, true); assert.equal(resolveRootView("notifications", after), "notifications");
});

test("numeric navigation follows capability-filtered visible order", () => {
  const state = createInitialState({ crawler: { name: "Carl", level: 1, attributes: {}, condition: {} } });
  const capabilities = selectedSequenceCapabilities(
    state,
    { ...emptyObservations, broadcast: { viewers: { value: 12 } } },
    events,
    3,
  );

  assert.equal(capabilities.quests, false);
  assert.deepEqual(availableRootViews(capabilities), ["crawler", "inventory", "skills", "ratings", "notifications"]);
});

test("condition UI renders every explicit authored classification without text inference", () => {
  let state = createInitialState();
  for (const [sequence, effectType, name] of [[1,"good","Blessing"],[2,"bad","Poison"],[3,"injury","Broken arm"],[4,"other","Marked"]]) state = applyEvent(state, { ...base, id: `e${sequence}`, sequence, type: "EffectApplied", effectId: `effect-${sequence}`, effectType, name, durationSeconds: 5, description: name });
  const groups = groupConditions(state.effects);
  assert.deepEqual([groups.beneficial[0].name, groups.harmful[0].name, groups.injuries[0].name, groups.other[0].name], ["Blessing", "Poison", "Broken arm", "Marked"]);
});
