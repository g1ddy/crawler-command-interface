import assert from "node:assert/strict";
import test from "node:test";
import React, { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { ArwesCompatibilityProbe } from "../../src/presentation/authority-arwes/compatibility/ArwesCompatibilityProbe.ts";
import { AuthorityFrame } from "../../src/presentation/authority-arwes/primitives/AuthorityFrame.ts";
import { AuthorityTransition } from "../../src/presentation/authority-arwes/primitives/AuthorityTransition.ts";
import { AuthorityText } from "../../src/presentation/authority-arwes/primitives/AuthorityText.ts";
import { AuthorityBackground } from "../../src/presentation/authority-arwes/primitives/AuthorityBackground.ts";
import { ArwesPresentation } from "../../src/presentation/authority-arwes/ArwesPresentation.ts";

test("Arwes compatibility probe renders in React 19 StrictMode", () => {
  const html = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(ArwesCompatibilityProbe, {
        crawlerName: "TEST-CRAWLER",
        floorTitle: "FLOOR 2",
        sequence: 42,
        isLive: true,
      })
    )
  );

  assert.match(html, /arwes-compatibility-probe/);
  assert.match(html, /TEST-CRAWLER/);
  assert.match(html, /FLOOR 2/);
  assert.match(html, /SEQ 42/);
  assert.match(html, /LIVE/);
  assert.match(html, /data-testid="probe-header-frame"/);
  assert.match(html, /data-testid="probe-controls-frame"/);
  assert.match(html, /data-testid="probe-surface-frame"/);
});

test("AuthorityFrame renders stroke styles and svg frames", () => {
  const html = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(
        AuthorityFrame,
        { significance: "critical", variant: "lines", "data-testid": "frame-test" },
        "Framed Content"
      )
    )
  );

  assert.match(html, /data-significance="critical"/);
  assert.match(html, /#ef4444/);
  assert.match(html, /Framed Content/);
});

test("AuthorityTransition handles deterministic and enabled motion modes", () => {
  const enabledHtml = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(
        AuthorityTransition,
        { state: "entered", motionMode: "enabled" },
        "Animated Content"
      )
    )
  );
  assert.match(enabledHtml, /data-motion-mode="enabled"/);
  assert.match(enabledHtml, /data-transition-state="entered"/);

  const deterministicHtml = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(
        AuthorityTransition,
        { state: "entered", motionMode: "deterministic" },
        "Deterministic Content"
      )
    )
  );
  assert.match(deterministicHtml, /data-motion-mode="deterministic"/);
  assert.match(deterministicHtml, /opacity:1/);
});

test("AuthorityText distinguishes instant and decoded delivery", () => {
  const instantHtml = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(AuthorityText, { delivery: "instant" }, "Instant Message")
    )
  );
  assert.match(instantHtml, /data-delivery="instant"/);
  assert.match(instantHtml, /Instant Message/);

  const decodedHtml = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(AuthorityText, { delivery: "decoded" }, "Decoded Message")
    )
  );
  assert.match(decodedHtml, /data-delivery="decoded"/);
});

test("AuthorityBackground renders SVG background primitives", () => {
  const gridHtml = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(AuthorityBackground, { variant: "grid" })
    )
  );
  assert.match(gridHtml, /data-variant="grid"/);

  const dotsHtml = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(AuthorityBackground, { variant: "dots" })
    )
  );
  assert.match(dotsHtml, /data-variant="dots"/);
});

test("ArwesPresentation integrates HudCompositionModel into real composition foundation", () => {
  const fullModel = {
    system: {
      crawlerName: "PRINCESS CARL",
      crawlerClass: "Coast Guard Crawler",
      floorTitle: "FLOOR 1: DUNGEON ENTRANCE",
      sequence: 25,
    },
    temporal: {
      mode: "live",
      sequence: 25,
      isLive: true,
    },
    urgency: {
      activeCountdown: {
        remainingSeconds: 240,
        formattedTime: "04:00",
        formattedLabel: "Level Collapse In 04:00",
        lifecycleStatus: "active",
        referencePoints: [],
      },
      formattedLabel: "Level Collapse In 04:00",
      lifecycleStatus: "active",
    },
    attention: {
      totalNotificationsCount: 2,
      hasActiveAlerts: true,
      latestNotificationTitle: "ITEM CRAFTED",
      latestNotificationMessage: "Created Light Bomb",
    },
    vitals: {
      health: { value: 84, sequence: 25 },
      mana: { value: 50, sequence: 25 },
      level: { value: 3, sequence: 20 },
    },
    broadcast: {
      viewers: { value: 120, sequence: 25 },
    },
  };

  const html = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(ArwesPresentation, {
        model: fullModel,
      })
    )
  );

  assert.match(html, /data-presentation="authority-arwes"/);
  assert.match(html, /data-testid="arwes-authority-composition"/);
  assert.match(html, /PRINCESS CARL/);
  assert.match(html, /Coast Guard Crawler/);
  assert.match(html, /FLOOR 1: DUNGEON ENTRANCE/);
  assert.match(html, /SEQ 25/);
  assert.match(html, /LIVE/);
  assert.match(html, /04:00/);
  assert.match(html, /ITEM CRAFTED/);
  assert.match(html, /Created Light Bomb/);
  assert.match(html, /84/);
  assert.match(html, /50/);
  assert.match(html, /120/);
  assert.match(html, /LAST KNOWN · SEQ 20/);
});

test("ArwesPresentation converts ArwesProbeModel fallback seamlessly", () => {
  const probeModel = {
    crawlerName: "PROBE-FALLBACK-UNIT",
    floorTitle: "FLOOR 3",
    sequence: 12,
    temporalMode: "replay",
  };

  const html = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(ArwesPresentation, {
        model: probeModel,
      })
    )
  );

  assert.match(html, /data-presentation="authority-arwes"/);
  assert.match(html, /PROBE-FALLBACK-UNIT/);
  assert.match(html, /FLOOR 3/);
  assert.match(html, /SEQ 12/);
  assert.match(html, /REPLAY/);
  assert.match(html, /— ABSENT/);
});
