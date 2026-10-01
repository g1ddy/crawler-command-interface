import assert from "node:assert/strict";
import test from "node:test";
import { deriveRatingsPresentation, projectRatingsMetrics } from "../../src/features/ratings/public.ts";

test("deriveRatingsPresentation handles empty or unobserved broadcast telemetry gracefully", () => {
  const result = deriveRatingsPresentation({ observations: {}, isLive: true });

  assert.equal(result.hasMetrics, false);
  assert.equal(result.groups.length, 0);
  assert.equal(result.audienceBadgeLabel, "LIVE AUDIENCE");
  assert.equal(result.totalViewersFormatted, undefined);
});

test("deriveRatingsPresentation formats audience badge correctly with viewers", () => {
  const obs = {
    viewers: { sequence: 5, key: "viewers", value: 1250, status: "stated", basis: "exact-observation", evidence: [], referenceObservationIds: [] },
  };

  const result = deriveRatingsPresentation({ observations: obs, isLive: true });
  assert.equal(result.audienceBadgeLabel, "LIVE AUDIENCE 1,250");
  assert.equal(result.totalViewersFormatted, "1,250");
});

test("deriveRatingsPresentation evaluates status to assign correct current, estimated, or last-known evidence", () => {
  const obs = {
    viewers: { sequence: 10, key: "viewers", value: 5000, status: "stated", basis: "exact-observation", evidence: [], referenceObservationIds: [] },
    favorites: { sequence: 8, key: "favorites", value: 45, status: "estimated", basis: "exact-observation", evidence: [], referenceObservationIds: [] },
  };

  const result = deriveRatingsPresentation({ observations: obs, isLive: true, sequence: 11 });

  assert.equal(result.hasMetrics, true);

  const audienceGroup = result.groups.find((g) => g.group === "audience");
  assert.ok(audienceGroup);

  const viewersMetric = audienceGroup.metrics.find((m) => m.key === "viewers");
  assert.ok(viewersMetric);
  assert.equal(viewersMetric.evidence.state, "last-known", "Stated observations from past map to last-known");

  const favoritesMetric = result.groups.flatMap(g => g.metrics).find(m => m.key === "favorites");
  assert.ok(favoritesMetric);
  assert.equal(favoritesMetric.evidence.state, "estimated", "Estimated observations map to estimated");
});

test("projectRatingsMetrics maintains backwards compatibility with raw metric projections", () => {
  const obs = {
    viewers: { sequence: 5, key: "viewers", value: 100, status: "stated", basis: "exact-observation", evidence: [], referenceObservationIds: [] },
  };
  const metrics = projectRatingsMetrics(obs);
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].label, "Views");
  assert.equal(metrics[0].value, 100);
});
