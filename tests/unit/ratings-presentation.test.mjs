import assert from "node:assert/strict";
import test from "node:test";
import { deriveRatingsPresentation, projectRatingsMetrics } from "../../src/features/ratings/public.ts";

test("deriveRatingsPresentation handles empty or unobserved broadcast telemetry gracefully", () => {
  const result = deriveRatingsPresentation({ observations: {}, isLive: false, selectedSequence: 10 });

  assert.equal(result.isLive, false);
  assert.equal(result.hasMetrics, false);
  assert.equal(result.groups.length, 0);
  assert.equal(result.audienceBadgeLabel, "◷ REPLAY AUDIENCE");
  assert.equal(result.totalViewersFormatted, undefined);
});

test("deriveRatingsPresentation formats live vs replay audience badge correctly", () => {
  const obs = {
    viewers: { sequence: 5, key: "viewers", value: 1250 },
  };

  const liveResult = deriveRatingsPresentation({ observations: obs, isLive: true, selectedSequence: 5 });
  assert.equal(liveResult.isLive, true);
  assert.equal(liveResult.audienceBadgeLabel, "● LIVE AUDIENCE 1,250");
  assert.equal(liveResult.totalViewersFormatted, "1,250");

  const replayResult = deriveRatingsPresentation({ observations: obs, isLive: false, selectedSequence: 10 });
  assert.equal(replayResult.isLive, false);
  assert.equal(replayResult.audienceBadgeLabel, "◷ REPLAY AUDIENCE 1,250");
});

test("deriveRatingsPresentation groups metrics and attaches evidence presentation", () => {
  const obs = {
    viewers: { sequence: 10, key: "viewers", value: 5000 },
    followers: { sequence: 10, key: "followers", value: 120 },
    favorites: { sequence: 8, key: "favorites", value: 45 },
    leaderboardRank: { sequence: 10, key: "leaderboardRank", value: 1 },
    bounty: { sequence: 10, key: "bounty", value: 10000 },
  };

  const result = deriveRatingsPresentation({ observations: obs, isLive: true, selectedSequence: 10 });

  assert.equal(result.hasMetrics, true);
  const groupTitles = result.groups.map((g) => g.title);
  assert.deepEqual(groupTitles, ["AUDIENCE", "ENGAGEMENT", "RANKING", "BOUNTY"]);

  const audienceGroup = result.groups.find((g) => g.group === "audience");
  assert.ok(audienceGroup);
  assert.equal(audienceGroup.metrics.length, 2);

  const viewersMetric = audienceGroup.metrics.find((m) => m.key === "viewers");
  assert.ok(viewersMetric);
  assert.equal(viewersMetric.value, 5000);
  assert.equal(viewersMetric.formattedValue, "5,000");
  assert.equal(viewersMetric.evidence.state, "current");

  const rankGroup = result.groups.find((g) => g.group === "ranking");
  assert.ok(rankGroup);
  assert.equal(rankGroup.metrics[0].value, "#1");

  // Historical evidence test
  const replayResult = deriveRatingsPresentation({ observations: obs, isLive: false, selectedSequence: 12 });

  // Older observation should be last-known
  const favoritesMetric = replayResult.groups
    .flatMap((g) => g.metrics)
    .find((m) => m.key === "favorites");
  assert.ok(favoritesMetric);
  assert.equal(favoritesMetric.evidence.state, "last-known");
  assert.equal(favoritesMetric.evidence.sourceSequence, 8);

  // But we can also test an observation matching exactly the selected sequence
  const replayResult2 = deriveRatingsPresentation({ observations: obs, isLive: false, selectedSequence: 10 });
  const viewersMetricReplay2 = replayResult2.groups
    .flatMap((g) => g.metrics)
    .find((m) => m.key === "viewers");
  assert.ok(viewersMetricReplay2);
  assert.equal(viewersMetricReplay2.evidence.state, "current");
  assert.equal(viewersMetricReplay2.evidence.sourceSequence, 10);
});

test("projectRatingsMetrics maintains backwards compatibility with raw metric projections", () => {
  const obs = {
    viewers: { sequence: 5, key: "viewers", value: 100 },
  };
  const metrics = projectRatingsMetrics(obs);
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].label, "Views");
  assert.equal(metrics[0].value, 100);
});
