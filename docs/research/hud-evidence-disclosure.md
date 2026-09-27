# HUD Evidence Disclosure — Research & Design for #240

**Issue:** #240 — POC: render evidence and provenance without a technical panel  
**Status:** Implementation design baseline  
**Branch:** `research/issue-240-evidence-disclosure`  
**Date:** 2026-09-27

## Purpose

Issue #240 should make evidence trustworthy and useful at a glance without turning the persistent HUD into a provenance dashboard.

The design is a **progressive-disclosure interaction**:

```text
glance
  ↓
compact evidence indicator
  ↓
existing inspection interaction
  ↓
existing Timeline-owned evidence/provenance detail
```

The persistent HUD communicates the **class of evidence**. The existing Timeline inspector communicates the **details of the evidence**.

This preserves the existing architecture:

```text
source-backed observation
        ↓
Timeline evidence presentation
        ↓
HudCompositionModel
        ↓
Authority Arwes renderer
        ↓
compact indicator
```

No second evidence model, provenance store, modal, route, or renderer-specific evidence semantics should be introduced.

---

## Research findings

### 1. Progressive disclosure is the correct interaction model

The current Arwes telemetry row puts the complete evidence label beside every value, including strings such as `LAST KNOWN · SEQ 20`. That makes every reading carry its diagnostic explanation permanently.

NN/g's progressive-disclosure guidance recommends initially showing the important information and disclosing secondary detail on request; the transition into the secondary level should be obvious and clearly labeled. This matches the CCI requirement that the HUD remain glanceable while detailed provenance remains available through an explicit inspection path.

Source: https://www.nngroup.com/articles/progressive-disclosure/

### 2. Evidence meaning cannot depend on color

WCAG 2.2 SC 1.4.1 says color cannot be the only visual means used to convey information. The current semantic model already gives us better axes than color: observed, last-known, estimated, causal, unknown, and inspectability.

The indicator therefore uses a distinct **symbolic marker** plus an accessible text label. Color may reinforce the marker, but it is not the semantic carrier.

Source: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color

### 3. The inspection trigger should be a native button

The current Arwes implementation creates an inspectable `<button>`, but does not give it an explicit accessible name and uses a very small pointer target. A native button already supplies the correct role and keyboard activation semantics when used normally.

WCAG 4.1.2 requires an accessible name, role, state/value where applicable. WCAG 2.4.7 requires a visible focus mode for keyboard-operable UI.

Source:
- https://www.w3.org/WAI/WCAG21/Understanding/name-role-value
- https://www.w3.org/WAI/WCAG22/Understanding/focus-visible

### 4. Compact status indicators work best adjacent to their subject

Carbon's status-indicator guidance places status indicators near the content they qualify and recommends pairing symbolic indicators with labels/other context rather than making color do all the work.

For CCI, the persistent HUD should retain a compact marker beside the value while moving the detailed text into the existing inspector. This gives the scanability benefit without retaining full provenance strings in every row.

Source: https://carbondesignsystem.com/patterns/status-indicator-pattern/

### 5. Do not announce ordinary evidence changes as live-region status messages

The evidence marker is persistent UI, not a system alert. An observation changing from current to last-known during navigation/replay is normal presentation state, not an interruptive status announcement.

Do **not** add `role="status"`, `aria-live`, or `role="alert"` to the indicator. The interactive indicator is a button; the passive unknown state is informational content.

This avoids turning routine replay/scrub changes into assistive-technology interruptions.

---

# Current implementation findings

## Existing semantic model

`src/presentation/semantic/types.ts` already exposes:

- `status`
- `temporal`
- `authority`
- `change`
- `affordance`
- `provenance.inspectable`

Do not expand this model for #240.

## Existing evidence derivation

`src/features/timeline/evidence/evidencePresentation.ts` is already the correct owner for the evidence-state vocabulary:

```ts
type EvidenceState =
  | "current"
  | "last-known"
  | "estimated"
  | "causal-only"
  | "unknown";
```

It already derives the detailed labels and maps the evidence state into renderer-neutral `PresentationSemantics`.

## Existing inspection path

`src/shell/adapters/CrawlerWorkspace.tsx` already owns the application callback:

```text
Arwes indicator
    ↓
onInspectTelemetry(key)
    ↓
CrawlerWorkspace.handleInspectTelemetry()
    ↓
setInspectObservation(observation)
    ↓
WorkspaceOverlays
    ↓
ModalBoundary
    ↓
TelemetryInspectorModal
```

`src/features/timeline/evidence/TelemetryInspectorModal.tsx` already exposes status, calculation basis, value, observation IDs, cited evidence, source title, locator, confidence, and notes.

`src/shared/ui/ModalBoundary.tsx` already owns focus trapping, Escape handling, and focus restoration.

**Do not create another disclosure surface.**

---

# UX design

## Glance level

Each telemetry reading should show:

```text
HEALTH
84                                           ●
```

```text
MANA
50                                           ≈
```

```text
LEVEL
3                                            ◷
```

The marker means:

| Evidence state | Marker | Human-readable meaning |
| --- | --- | --- |
| `current` | `●` | Observed |
| `last-known` | `◷` | Last known |
| `estimated` | `≈` | Estimated |
| `causal-only` | `◆` | Causal |
| `unknown` | `?` | Unknown |

These symbols are **Crawler presentation language**, not Arwes APIs. They must not appear as Arwes-specific semantic lookup logic.

The marker remains next to the value so the user can immediately associate evidence class with the reading.

## Inspect level

For an inspectable indicator, activating the marker opens the **existing** `TelemetryInspectorModal`.

The accessible name should explain both the related reading and the action, for example:

```text
Inspect health evidence: observed
Inspect mana evidence: estimated
Inspect level evidence: last known
```

Do not make the compact button's accessible name depend on its glyph alone.

The detailed modal remains the Level-2 evidence surface.

## Unknown level

Unknown is not inspectable because there is no evidence object to inspect.

Render a passive `?` indicator with an accessible text alternative such as:

```text
Health evidence: unknown
```

Do not make the unknown marker clickable and do not invent a provenance modal for it.

This preserves the semantic distinction between unknown and empty/unavailable/not-established.

---

# Exact code changes

## 1. Add a compact evidence marker to Timeline evidence presentation

**File:** `src/features/timeline/evidence/evidencePresentation.ts`

Add this renderer-neutral presentation type immediately after `EvidenceState`:

```ts
export type EvidenceGlanceMarker = "●" | "◷" | "≈" | "◆" | "?";
```

Add:

```ts
export function evidenceGlanceMarker(state: EvidenceState): EvidenceGlanceMarker {
  switch (state) {
    case "current":
      return "●";
    case "last-known":
      return "◷";
    case "estimated":
      return "≈";
    case "causal-only":
      return "◆";
    case "unknown":
      return "?";
  }
}
```

Do not put this mapping into `authority-arwes`. The Arwes renderer should receive the already-decided Crawler marker.

Export `EvidenceGlanceMarker` and `evidenceGlanceMarker` from `src/features/timeline/public.ts`.

Do not change the existing `badgeLabel` field. Other presentations/tests may still consume the verbose label.

## 2. Add compact evidence presentation to the renderer-neutral HUD model

**File:** `src/shell/hud/hud-composition.ts`

Add:

```ts
export interface HudEvidencePresentation {
  marker: string;
  detailLabel: string;
}
```

Extend `HudTelemetryPresentation`:

```ts
export interface HudTelemetryPresentation {
  key: HudTelemetryKey;
  label: string;
  valueDisplay: string;
  badgeLabel: string;
  evidence: HudEvidencePresentation;
  semantics: PresentationSemantics;
}
```

Import `evidenceGlanceMarker` alongside the existing Timeline evidence functions.

Change `createTelemetryItem()` so that it returns:

```ts
evidence: {
  marker: evidenceGlanceMarker(evidence.state),
  detailLabel: evidence.label,
},
```

Keep `badgeLabel: evidence.badgeLabel` unchanged.

This makes the composition layer the adapter between Timeline evidence meaning and renderer-neutral Crawler presentation. The Arwes renderer should not inspect `EvidenceState`.

Export `HudEvidencePresentation` from `src/shell/hud/public.ts`.

## 3. Create the proposed Authority indicator primitive

**File:** `src/presentation/authority-arwes/primitives/AuthorityIndicator.ts`

Create a small renderer-owned primitive with this contract:

```ts
"use client";

import type { CSSProperties } from "react";
import { createElement } from "react";

export interface AuthorityIndicatorProps {
  marker: string;
  label: string;
  onActivate?: () => void;
  testId?: string;
  style?: CSSProperties;
}
```

Behavior:

### Interactive case

When `onActivate` is provided, render a native `<button type="button">`.

Required properties:

```tsx
aria-label={label}
title={label}
data-testid={testId}
```

The **hit target** must be at least 44px by 44px, but the visual marker itself should remain compact. Use a 44px button box with the marker centered inside it.

The button must have a visible focus indicator. Prefer a CSS `:focus-visible` rule in the Arwes presentation stylesheet instead of React event handlers.

Do not implement manual Enter/Space key handling. Native button behavior already provides it.

### Passive case

When `onActivate` is absent, render a `<span>` with:

```tsx
role="img"
aria-label={label}
data-testid={testId}
```

The passive marker must not enter the tab order.

Do not make this primitive know about:

- observed
- estimated
- last-known
- unknown
- causal
- Timeline
- Arwes frame variants
- colors by evidence state

It only renders `marker + label + optional activation`.

## 4. Replace verbose Arwes telemetry badges

**File:** `src/presentation/authority-arwes/ArwesAuthorityComposition.ts`

Import:

```ts
import { AuthorityIndicator } from "./primitives/AuthorityIndicator.ts";
```

In `TelemetryRow()`, delete the current `badgeElement` conditional block that manually creates the button/span.

Replace it with:

```ts
const indicatorLabel = isInspectable
  ? `Inspect ${label.toLowerCase()} evidence: ${item.evidence.detailLabel.toLowerCase()}`
  : `${label.toLowerCase()} evidence: ${item.evidence.detailLabel.toLowerCase()}`;

const indicator = createElement(AuthorityIndicator, {
  marker: item.evidence.marker,
  label: indicatorLabel,
  onActivate: isInspectable ? onInspect : undefined,
  testId: `telemetry-${rowKey}-badge`,
});
```

Then render `indicator` in the existing right-hand indicator position.

Remove `badgeLabel` from the Arwes telemetry-row visual output entirely. Keep it in `HudTelemetryPresentation` for other consumers.

The Arwes row should therefore look like:

```text
[label + value]                                  [marker]
```

not:

```text
[label + value]                          LAST KNOWN · SEQ 20 🔍
```

## 5. Keep telemetry rows single-line and compact

**File:** `src/presentation/authority-arwes/ArwesAuthorityComposition.ts`

For the existing `.arwes-telemetry-row` inline style:

- set `flexWrap: "nowrap"`;
- set `minWidth: 0`;
- keep the left content at `minWidth: 0`;
- keep the indicator as a fixed-size non-growing item;
- do not allow evidence text to create a second line.

The left value stack may truncate only if necessary; the evidence indicator must remain visible.

Do not add a mobile-only second evidence line.

## 6. Preserve the existing application-owned inspection path

**Files:** no changes required

Keep:

```text
CrawlerWorkspace.handleInspectTelemetry
WorkspaceOverlays
ModalBoundary
TelemetryInspectorModal
```

Do not move the inspector into `authority-arwes`.

Do not pass `sources`, `events`, or `CrawlerSession` into `ArwesAuthorityComposition`.

The only renderer callback remains:

```ts
onInspectTelemetry?: (key: HudTelemetryKey) => void
```

This is already the correct capability/action boundary.

---

# Exact tests

## Unit tests

### A. `tests/unit/evidence-presentation.test.mjs`

Import:

```ts
evidenceGlanceMarker
```

Add one test covering every state:

```ts
test("evidence glance markers are stable and distinct", () => {
  assert.equal(evidenceGlanceMarker("current"), "●");
  assert.equal(evidenceGlanceMarker("last-known"), "◷");
  assert.equal(evidenceGlanceMarker("estimated"), "≈");
  assert.equal(evidenceGlanceMarker("causal-only"), "◆");
  assert.equal(evidenceGlanceMarker("unknown"), "?");
});
```

This test validates the Crawler presentation mapping independently of Arwes.

### B. `tests/unit/arwes-compatibility.test.mjs`

Update each `HudTelemetryPresentation` fixture to include:

```ts
evidence: {
  marker: "●",
  detailLabel: "Observed",
}
```

Use the appropriate marker/detail values in the last-known, estimated, and unknown fixtures.

Change assertions so the Arwes renderer is verified to output:

- the compact marker;
- the accessible button name;
- no verbose `LAST KNOWN · SEQ N` text in the telemetry row;
- unknown remains passive.

Add an assertion equivalent to:

```ts
assert.match(
  html,
  /<button[^>]*data-testid="telemetry-health-badge"[^>]*aria-label="Inspect health evidence: observed"/
);
```

For the passive unknown indicator, assert it is a span with `role="img"` and an `aria-label`.

Do not assert a particular Arwes color for evidence state.

## E2E

### `tests/e2e/hud-preview.spec.ts`

Update the existing `authority-arwes presentation...` test:

1. Confirm the health/mana indicator is visible.
2. Confirm its visual text is only the compact marker, not the verbose evidence label.
3. Activate the mana indicator.
4. Confirm `TELEMETRY OBSERVATION & PROVENANCE` opens.
5. Confirm the inspector still displays detailed provenance.
6. Close the inspector.
7. Move keyboard focus to the evidence button with Tab.
8. Assert the button is focused.
9. Assert its focus indicator is visibly distinguishable.
10. Activate it with Enter.
11. Confirm the same inspector opens.
12. Close it and verify focus returns to the indicator.

Use native accessibility queries such as `getByRole("button", { name: /Inspect mana evidence/i })` rather than class selectors where possible.

### Narrow viewport evidence test

Add one focused test at a representative narrow width, e.g. 390px:

- navigate to `?hud=authority-arwes&motion=deterministic`;
- verify the telemetry row remains one visual row;
- verify the compact marker is visible;
- verify the full `LAST KNOWN · SEQ` detail is absent from the persistent row;
- activate the marker;
- verify detailed provenance is visible in the existing modal.

Also assert the page does not horizontally overflow:

```ts
expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
```

This test belongs in #240 because its purpose is evidence disclosure density, not general mobile-shell work.

---

# Accessibility implementation notes

## Accessible name

The button accessible name must identify the **action and related reading**, for example:

```text
Inspect mana evidence: estimated
```

This is preferable to `"≈"` or `"Evidence"` because the user can understand what will happen before activating the control.

## Native interaction

Use `<button>`, not:

```html
<span role="button" tabindex="0">...</span>
```

The existing Timeline `TelemetryBadge` can retain its current implementation for now; #240's compact Arwes surface should use the native button directly.

## Focus

Keep the visual marker compact but give the button a 44px interaction box. The visible focus treatment belongs around the hit area, not just around the tiny glyph.

This satisfies the repository's existing 44px touch-target convention while keeping the evidence indicator visually subordinate.

## Screen-reader behavior

Do not add a live region.

Do not repeat the detailed evidence string in visually hidden text inside the persistent row. The accessible button name already supplies the semantic explanation and the modal supplies the full evidence detail.

---

# Failure / state handling

The compact marker must preserve the current semantic distinctions:

- `current` ≠ `last-known`
- `estimated` ≠ `observed`
- `causal-only` ≠ `observed`
- `unknown` ≠ `known-empty`
- `unknown` ≠ `unavailable`
- `not-established` is not an evidence state and must not be synthesized from missing evidence.

Do not add markers for statuses that the current telemetry derivation cannot produce.

The current evidence presentation contract only derives:

```text
current
last-known
estimated
causal-only
unknown
```

Keep the mapping exhaustive for those actual values.

---

# Visual composition guidance

The marker should be visually subordinate to:

1. the telemetry label;
2. the numeric value;
3. the feature's actual controls.

It should not be:

- a full badge;
- a second text line;
- a colored status pill with a long label;
- a framed card;
- a permanent tooltip;
- a separate provenance panel.

The visual pattern is:

```text
┌───────────────────────────────────────┐
│ HEALTH                           ●    │
│ 84                                     │
└───────────────────────────────────────┘
```

The marker gets attention only when the user chooses to inspect the evidence.

The Arwes renderer may add restrained frame/transition treatment through existing Authority primitives, but the meaning of the marker remains independent of those effects.

---

# What this issue should demonstrate

Use the real source-backed telemetry already flowing through `HudCompositionModel`.

At minimum, demonstrate:

1. a current observed value;
2. a last-known value;
3. an estimated value;
4. unknown/no observation.

The current test fixture already contains all four semantic cases, so no new story data is required.

The implementation should also continue to work at a real replay sequence where a last-known value occurs naturally.

No synthetic provenance source is necessary.

---

# Files to change

Expected implementation files:

```text
src/features/timeline/evidence/evidencePresentation.ts
src/features/timeline/public.ts
src/shell/hud/hud-composition.ts
src/shell/hud/public.ts
src/presentation/authority-arwes/primitives/AuthorityIndicator.ts
src/presentation/authority-arwes/ArwesAuthorityComposition.ts
tests/unit/evidence-presentation.test.mjs
tests/unit/arwes-compatibility.test.mjs
tests/e2e/hud-preview.spec.ts
```

Expected files that should **not** change for this implementation:

```text
src/shell/adapters/CrawlerWorkspace.tsx
src/shell/overlays/WorkspaceOverlays.tsx
src/features/timeline/evidence/TelemetryInspectorModal.tsx
src/shared/ui/ModalBoundary.tsx
app/domain/*
src/application/*
```

Those files already provide the correct ownership and inspection path.

---

# Verification

Run:

```bash
npm run test:unit
npm run test:e2e -- tests/e2e/hud-preview.spec.ts
npm run test:architecture
npm run typecheck
npm run verify
```

Also run:

```bash
npm run test:screenshots
```

Do not promote a new screenshot to canonical documentation unless the captured state is backed by real supported timeline data.

---

# Definition of done

- [ ] Current, last-known, estimated, causal-only, and unknown receive distinct compact Crawler markers.
- [ ] The compact marker is carried through `HudCompositionModel` rather than derived from evidence semantics inside Arwes.
- [ ] Inspectable markers use native buttons with explicit accessible names.
- [ ] Button hit areas are at least 44px while the visual marker remains compact.
- [ ] Keyboard focus is visible.
- [ ] Enter activates inspection.
- [ ] Existing `TelemetryInspectorModal` remains the detailed evidence surface.
- [ ] Unknown is passive and not inspectable.
- [ ] Persistent HUD no longer prints verbose provenance strings such as `LAST KNOWN · SEQ N` beside every metric.
- [ ] Narrow viewport telemetry rows do not create a stacked provenance block.
- [ ] No live region or alert is introduced for ordinary evidence changes.
- [ ] No Arwes-specific evidence semantics leak into the renderer-neutral model.
- [ ] No second provenance model or evidence route is introduced.
- [ ] Existing renderer exclusivity remains unchanged.
- [ ] Reduced-motion and deterministic modes retain the same evidence meaning.
- [ ] `npm run verify` passes.
- [ ] `npm run test:screenshots` passes.

---

# Handoff to Jules

Implement the design above exactly as a small vertical slice.

Start with the renderer-neutral evidence marker and `HudEvidencePresentation`, then add `AuthorityIndicator`, then replace the Arwes telemetry badge, then update the focused unit/E2E tests.

Keep `TelemetryInspectorModal` and the existing `CrawlerWorkspace → WorkspaceOverlays` inspection path unchanged.

The success criterion is not a more sophisticated evidence system. It is a **smaller persistent HUD with faster visual scanning and an obvious accessible path to the existing detailed evidence**.

The core UX rule is:

> **At a glance, show what kind of evidence supports this value. On inspection, show why.**
