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
    telemetryItems: [
    {
      key: "health",
      label: "HEALTH",
      valueDisplay: "84",
      badgeLabel: "SOURCE",
      semantics: { status: "present", temporal: "current", authority: "observed", affordance: "inspect" },
    },
    {
      key: "mana",
      label: "MANA",
      valueDisplay: "50",
      badgeLabel: "SOURCE",
      semantics: { status: "present", temporal: "current", authority: "observed", affordance: "inspect" },
    },
    {
      key: "level",
      label: "LEVEL",
      valueDisplay: "3",
      badgeLabel: "LAST KNOWN · SEQ 20",
      semantics: { status: "present", temporal: "last-known", authority: "observed", affordance: "inspect" },
    },
    {
      key: "viewers",
      label: "AUDIENCE VIEWERS",
      valueDisplay: "120",
      badgeLabel: "SOURCE",
      semantics: { status: "present", temporal: "current", authority: "observed", affordance: "inspect" },
    },
    ],
  };

  const html = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(ArwesPresentation, {
        model: fullModel,
        onInspectTelemetry: () => {},
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

test("ArwesPresentation directly exposes semantic attributes for current, last-known, estimated, and unknown states", () => {
  const model = {
    system: { crawlerName: "CARL", crawlerClass: "Class unknown", floorTitle: "FLOOR 1", sequence: 10 },
    temporal: { mode: "live", sequence: 10, isLive: true },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false },
    vitals: {},
    broadcast: {},
    telemetryItems: [
    {
      key: "health",
      label: "HEALTH",
      valueDisplay: "100",
      badgeLabel: "SOURCE",
      semantics: { status: "present", temporal: "current", authority: "observed", affordance: "inspect" },
    },
    {
      key: "mana",
      label: "MANA",
      valueDisplay: "50",
      badgeLabel: "LAST KNOWN · SEQ 5",
      semantics: { status: "present", temporal: "last-known", authority: "observed", affordance: "inspect" },
    },
    {
      key: "level",
      label: "LEVEL",
      valueDisplay: "4",
      badgeLabel: "ESTIMATED",
      semantics: { status: "present", temporal: "current", authority: "estimated", affordance: "inspect" },
    },
    {
      key: "viewers",
      label: "AUDIENCE VIEWERS",
      valueDisplay: "— ABSENT",
      badgeLabel: "— ABSENT",
      semantics: { status: "unknown", affordance: "none" },
    },
    ],
  };

  const html = renderToString(
    React.createElement(ArwesPresentation, {
      model,
      onInspectTelemetry: () => {},
    })
  );

  assert.match(html, /data-testid="telemetry-health"[^>]*data-status="present"[^>]*data-authority="observed"[^>]*data-temporal="current"/);
  assert.match(html, /data-testid="telemetry-mana"[^>]*data-status="present"[^>]*data-authority="observed"[^>]*data-temporal="last-known"/);
  assert.match(html, /data-testid="telemetry-level"[^>]*data-status="present"[^>]*data-authority="estimated"/);
  assert.match(html, /data-testid="telemetry-viewers"[^>]*data-status="unknown"/);
  assert.doesNotMatch(html, /data-testid="telemetry-viewers"[^>]*data-authority=/);
  assert.doesNotMatch(html, /data-testid="telemetry-viewers"[^>]*data-temporal=/);

  assert.match(html, /<button[^>]*data-testid="telemetry-health-badge"/);
  assert.match(html, /<span[^>]*data-testid="telemetry-viewers-badge"/);
});

test("ArwesPresentation keeps stable present telemetry motionIntent undefined", () => {
  const model = {
    system: { crawlerName: "TEST-CRAWLER", crawlerClass: "Test Class", floorTitle: "FLOOR 1", sequence: 10 },
    temporal: { mode: "live", sequence: 10, isLive: true },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false },
    vitals: {},
    broadcast: {},
    telemetryItems: [
      {
        key: "health",
        label: "HEALTH",
        valueDisplay: "100",
        badgeLabel: "SOURCE",
        semantics: { status: "present", authority: "observed", affordance: "inspect" },
      },
      {
        key: "mana",
        label: "MANA",
        valueDisplay: "50",
        badgeLabel: "SOURCE",
        semantics: { status: "present", motionIntent: "established", authority: "observed", affordance: "inspect" },
      },
      {
        key: "level",
        label: "LEVEL",
        valueDisplay: "5",
        badgeLabel: "SOURCE",
        semantics: { status: "present", motionIntent: "changed", authority: "observed", affordance: "inspect" },
      },
    ],
  };

  const html = renderToString(
    React.createElement(ArwesPresentation, {
      model,
      onInspectTelemetry: () => {},
    })
  );

  // Stable present value has no motion intent
  assert.doesNotMatch(html, /data-testid="telemetry-health"[^>]*data-motion-intent/);

  // Explicit transition-driven intents survive directly
  assert.match(html, /data-testid="telemetry-mana"[^>]*data-motion-intent="established"/);
  assert.match(html, /data-testid="telemetry-level"[^>]*data-motion-intent="changed"/);
});

test("ArwesPresentation reduced motion produces semantically equivalent markup without physical animation dependency", () => {
  const model = {
    system: { crawlerName: "TEST-CRAWLER", crawlerClass: "Test Class", floorTitle: "FLOOR 1", sequence: 10 },
    temporal: { mode: "replay", sequence: 10, isLive: false },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false },
    vitals: {},
    broadcast: {},
    telemetryItems: [
      {
        key: "health",
        label: "HEALTH",
        valueDisplay: "80",
        badgeLabel: "SOURCE",
        semantics: { status: "present", temporal: "current", authority: "observed", affordance: "inspect" },
      },
    ],
  };

  const enabledHtml = renderToString(
    React.createElement(ArwesPresentation, { model, motionMode: "enabled" })
  );
  const reducedHtml = renderToString(
    React.createElement(ArwesPresentation, { model, motionMode: "reduced" })
  );

  assert.match(enabledHtml, /data-mode="replay"/);
  assert.match(reducedHtml, /data-mode="replay"/);
  assert.match(reducedHtml, /data-status="present"/);
  assert.match(reducedHtml, /data-authority="observed"/);
  assert.match(reducedHtml, /data-temporal="current"/);
  assert.match(reducedHtml, /80/);
});

test("ArwesPresentation ensures initial renders have no spurious transition motion intents", () => {
  const baseModel = {
    system: { crawlerName: "CARL", crawlerClass: "Scout", floorTitle: "FLOOR 1", sequence: 10 },
    temporal: { mode: "live", sequence: 10, isLive: true },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false, latestNotificationTitle: undefined },
    vitals: {},
    broadcast: {},
    telemetryItems: [],
  };

  const html = renderToString(React.createElement(ArwesPresentation, { model: baseModel }));

  // Initial render: no spurious enter-replay, return-live, or attention motion intents
  assert.doesNotMatch(html, /data-motion-intent="return-live"/);
  assert.doesNotMatch(html, /data-motion-intent="enter-replay"/);
  assert.doesNotMatch(html, /data-motion-intent="attention"/);
});

test("ArwesPresentation directly consumes motionIntents from HudCompositionModel", () => {
  const modelWithIntent = {
    system: { crawlerName: "CARL", crawlerClass: "Scout", floorTitle: "FLOOR 1", sequence: 10 },
    temporal: { mode: "replay", sequence: 10, isLive: false, motionIntent: "enter-replay" },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 1, hasActiveAlerts: true, latestNotificationTitle: "NEW ALERT", motionIntent: "attention" },
    vitals: {},
    broadcast: {},
    telemetryItems: [],
  };

  const html = renderToString(
    React.createElement(ArwesPresentation, {
      model: modelWithIntent,
      motionMode: "deterministic",
    })
  );

  assert.match(html, /data-motion-intent="enter-replay"/);
  assert.match(html, /data-motion-intent="attention"/);
});

test("Ticking countdowns and ordinary telemetry numeric value updates do not emit changed motion intents", () => {
  const tickingModel = {
    system: { crawlerName: "TEST-CRAWLER", crawlerClass: "Test Class", floorTitle: "FLOOR 1", sequence: 10 },
    temporal: { mode: "live", sequence: 10, isLive: true },
    urgency: {
      activeCountdown: {
        remainingSeconds: 239,
        formattedTime: "03:59",
        formattedLabel: "Level Collapse In 03:59",
        lifecycleStatus: "active",
        referencePoints: [],
      },
      formattedLabel: "Level Collapse In 03:59",
      lifecycleStatus: "active",
    },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false },
    vitals: {},
    broadcast: {},
    telemetryItems: [
      {
        key: "health",
        label: "HEALTH",
        valueDisplay: "84",
        badgeLabel: "SOURCE",
        semantics: { status: "present", temporal: "current", authority: "observed", affordance: "inspect" },
      },
    ],
  };

  const html = renderToString(
    React.createElement(ArwesPresentation, { model: tickingModel })
  );

  assert.doesNotMatch(html, /data-testid="telemetry-health"[^>]*data-motion-intent="changed"/);
  assert.match(html, /03:59/);
});

test("ArwesPresentation handles minimal HudCompositionModel gracefully", () => {
  const minimalModel = {
    system: {
      crawlerName: "MINIMAL-UNIT",
      crawlerClass: "Class unknown",
      floorTitle: "FLOOR 3",
      sequence: 12,
    },
    temporal: {
      mode: "replay",
      sequence: 12,
      isLive: false,
    },
    urgency: {
      activeCountdown: null,
      formattedLabel: "Collapse time unavailable",
    },
    attention: {
      totalNotificationsCount: 0,
      hasActiveAlerts: false,
    },
    vitals: {},
    broadcast: {},
    telemetryItems: [],
  };

  const html = renderToString(
    React.createElement(
      StrictMode,
      null,
      React.createElement(ArwesPresentation, {
        model: minimalModel,
      })
    )
  );

  assert.match(html, /data-presentation="authority-arwes"/);
  assert.match(html, /MINIMAL-UNIT/);
  assert.match(html, /FLOOR 3/);
  assert.match(html, /SEQ 12/);
  assert.match(html, /REPLAY/);
});

test("ArwesPresentation renders Pet domain surface across lifecycle states and motion modes", () => {
  // 1. Unestablished / not-established Pet state
  const unestablishedModel = {
    system: { crawlerName: "CARL", crawlerClass: "Scout", floorTitle: "FLOOR 1", sequence: 10 },
    temporal: { mode: "live", sequence: 10, isLive: true },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false },
    vitals: {},
    broadcast: {},
    pet: {
      hasPets: false,
      petCount: 0,
      badgeLabel: "NO PETS",
      semantics: { status: "not-established", affordance: "none" },
    },
    telemetryItems: [],
  };

  const htmlUnestablished = renderToString(
    React.createElement(ArwesPresentation, { model: unestablishedModel })
  );

  assert.match(htmlUnestablished, /data-testid="arwes-pet-frame"/);
  assert.match(htmlUnestablished, /data-testid="arwes-pet-summary"[^>]*data-status="not-established"/);
  assert.match(htmlUnestablished, /NO PETS/);
  assert.match(htmlUnestablished, /Pet domain not established/);

  // 2. Established Pet state with newly-established change and motion intent
  const acquiredModel = {
    system: { crawlerName: "CARL", crawlerClass: "Scout", floorTitle: "FLOOR 2", sequence: 116 },
    temporal: { mode: "replay", sequence: 116, isLive: false },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false },
    vitals: {},
    broadcast: {},
    pet: {
      hasPets: true,
      petCount: 1,
      badgeLabel: "1 PET",
      semantics: { status: "present", change: "newly-established", affordance: "none" },
      primaryPet: {
        petId: "pet-mongo",
        displayName: "mongoliensis",
        hasExplicitName: false,
        species: "mongoliensis",
        speciesLabel: "Species: mongoliensis",
        hostilityState: "hostile",
        hostilityLabel: "HOSTILE",
        bondState: "unbonded",
        bondStateLabel: "UNBONDED",
        bondHolderLabel: "NONE (UNBONDED)",
      },
      motionIntent: "established",
    },
    telemetryItems: [],
  };

  const htmlAcquired = renderToString(
    React.createElement(ArwesPresentation, { model: acquiredModel, motionMode: "reduced" })
  );

  assert.match(htmlAcquired, /data-testid="arwes-pet-summary"[^>]*data-status="present"[^>]*data-change="newly-established"[^>]*data-motion-intent="established"/);
  assert.match(htmlAcquired, /mongoliensis/);
  assert.match(htmlAcquired, /HOSTILE/);
  assert.match(htmlAcquired, /UNBONDED/);

  // 3. Established Pet state after bonding (Mongo, Royal Steed) in deterministic mode
  const bondedModel = {
    system: { crawlerName: "CARL", crawlerClass: "Scout", floorTitle: "FLOOR 2", sequence: 118 },
    temporal: { mode: "replay", sequence: 118, isLive: false },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false },
    vitals: {},
    broadcast: {},
    pet: {
      hasPets: true,
      petCount: 1,
      badgeLabel: "1 PET",
      semantics: { status: "present", change: "changed", affordance: "none" },
      primaryPet: {
        petId: "pet-mongo",
        displayName: "Mongo",
        hasExplicitName: true,
        species: "mongoliensis",
        speciesLabel: "Species: mongoliensis",
        hostilityState: "non-hostile",
        hostilityLabel: "NON-HOSTILE",
        bondState: "bonded",
        bondStateLabel: "BONDED",
        bondHolderLabel: "crawler-donut",
        title: "Royal Steed",
        formattedTitle: "«Royal Steed»",
      },
      motionIntent: "changed",
    },
    telemetryItems: [],
  };

  const htmlBonded = renderToString(
    React.createElement(ArwesPresentation, { model: bondedModel, motionMode: "deterministic" })
  );

  assert.match(htmlBonded, /data-testid="arwes-pet-summary"[^>]*data-status="present"[^>]*data-change="changed"[^>]*data-motion-intent="changed"/);
  assert.match(htmlBonded, /data-testid="arwes-pet-display-name"[^>]*>Mongo</);
  assert.match(htmlBonded, /data-testid="arwes-pet-title"[^>]*>«Royal Steed»</);
  assert.match(htmlBonded, /NON-HOSTILE/);
  assert.match(htmlBonded, /BONDED/);
});

test("ArwesPresentation maintains renderer exclusivity without alternate HUD markers", () => {
  const model = {
    system: { crawlerName: "CARL", crawlerClass: "Scout", floorTitle: "FLOOR 1", sequence: 10 },
    temporal: { mode: "live", sequence: 10, isLive: true },
    urgency: { activeCountdown: null, formattedLabel: "Collapse time unavailable" },
    attention: { totalNotificationsCount: 0, hasActiveAlerts: false },
    vitals: {},
    broadcast: {},
    telemetryItems: [],
  };

  const html = renderToString(React.createElement(ArwesPresentation, { model }));

  assert.match(html, /data-hud-renderer="authority-arwes"/);
  assert.doesNotMatch(html, /data-hud-composition="persistent"/);
  assert.doesNotMatch(html, /data-hud-renderer="concept"/);
});
