# HUD Semantic Visual Language

**Issue:** #220  
**Status:** Living design baseline for implementation  
**Consumers:** #217 Arwes realization and future HUD renderers

## Purpose

This document defines the renderer-neutral semantic language for Crawler Command Interface HUD presentation. It is the source of truth for #220 and should be referenced by future implementation issues instead of duplicating this design.

The architectural pipeline is:

```
source-backed application truth
        ↓
feature presentation contracts
        ↓
renderer-neutral composition
        ↓
semantic presentation meaning
        ↓
renderer realization
```

#220 is not a visual redesign, an Arwes commitment, or a new design system. It establishes the smallest truthful semantic vocabulary that renderers can consume without inventing meanings.

## Existing architecture

The following are infrastructure, not #220 redesign targets:

- focused feature presentation contracts;
- replay-aware `CanonCapabilities`;
- modular shell/presentation selection;
- isolated Arwes compatibility boundary;
- renderer-neutral `HudCompositionModel`;
- composition seam cleanup;
- renderer-neutral navigation/system-chrome contract.

Ownership remains:

- application/session: projected state, replay, persistence, capabilities;
- features: feature-specific presentation derivation;
- Timeline: detailed evidence/provenance;
- shell: composition, navigation, replay tooling, presentation selection;
- renderers: visual treatment and physical interaction realization.

## Core principles

1. **Semantic meaning ≠ visual treatment.** No colors, glyphs, CSS, typography, Arwes primitives, or animation timing in the semantic contract.
2. **Provenance ≠ status.** Source/evidence detail remains owned by Timeline.
3. **Capability ≠ information.** An informational value is not automatically an action.
4. **Change ≠ attention.** A value can change without needing emphasis.
5. **Motion intent ≠ animation implementation.** Semantic transitions may be named; renderers choose their physical realization.
6. **Independent semantic dimensions must not become one mutually exclusive `HudState` enum.**

## Semantic axes

These are conceptual axes. Only fields proven useful by current consumers should enter the runtime contract.

### Status / presence

```
present
known-empty
not-established
unknown
unavailable
```

These are deliberately distinct:

| Status | Meaning | Must not imply |
|---|---|---|
| `present` | Value/entity is established and available to presentation | direct observation |
| `known-empty` | Explicitly known empty/zero | unknown/unavailable |
| `not-established` | Concept has not yet become established at the selected temporal state | application failure |
| `unknown` | Evidence does not establish the relevant value | zero/empty |
| `unavailable` | Application cannot currently provide the requested value | story absence |

Existing Party/Pet behavior is authoritative: Party before establishment is `not-established`; an explicitly empty Pet collection is `known-empty`.

### Temporal

```
current
last-known
```

Temporal position is independent from how the value was established.

Valid combinations include:

- current + observed;
- current + estimated;
- last-known + observed.

### Authority / basis

```
observed
estimated
causal
```

- `observed`: supported by a source observation;
- `estimated`: derived/interpolated rather than directly observed;
- `causal`: established from a causal/domain event rather than a source observation.

Do not add `derived` without a concrete current consumer requiring that distinction.

### Change

```
changed
newly-established
```

No change value means no meaningful change needs to be communicated.

Do not create domain-specific states such as `new-party` or `changed-health`.

### Affordance

```
none
inspect
action
```

`inspect` means additional detail can be disclosed. `action` means the application has an actual capability that can be surfaced.

The semantic contract must not contain action names, handlers, routing, or capability evaluation:

```
CanonCapabilities
      ↓
application establishes capability
      ↓
presentation exposes affordance
      ↓
renderer chooses physical control
```

### Provenance

Provenance is not a status enum. Existing evidence metadata may include source sequences, source identifiers, observation IDs, locators, confidence, causal/supporting details, and inspectability.

The semantic layer may communicate that supporting evidence is inspectable. Timeline remains responsible for the detailed evidence surface.

### Motion

Motion is a semantic transition intent, not an animation implementation. Candidate intents:

```
established
changed
attention
enter-context
enter-replay
return-live
disclose
```

Never encode milliseconds, repeat counts, easing, CSS classes, Arwes Animator objects, or animation-library objects.

## Progressive disclosure

Use three information levels:

### Level 0 — glance

Communicate only:

- value/presence;
- non-default temporal/authority meaning;
- meaningful change;
- obvious affordance where appropriate.

### Level 1 — inspect

Expose enough explanation to understand the state, for example:

```
HEALTH
84
OBSERVED · SEQ 142
```

or:

```
COLLAPSE
08:21:04
ESTIMATED
Derived from sequences 138–142
```

Exact copy is renderer/product work.

### Level 2 — evidence

Use Timeline's existing infrastructure for source, sequence, observation IDs, confidence, locators, and causal/supporting details.

> **Primary presentation communicates evidence class; inspection communicates evidence detail.**

Do not create a second provenance subsystem just to support the HUD.

## Accessibility constraints

These are semantic constraints, not final styling decisions.

- Semantic states must remain distinguishable without color alone.
- Motion must never be required to understand state, hierarchy, temporal context, or capability.
- Reduced-motion behavior preserves semantic meaning.
- Deterministic mode reaches the same stable state without waiting for animation.
- Only actual interactive affordances need interactive focus.
- Informational/historical content must not become button-like because a renderer can animate it.

References:

- WCAG 2.2 — Use of Color: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- WCAG 2.2 Technique C39 — prefers-reduced-motion: https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- Carbon Status Indicator pattern: https://carbondesignsystem.com/patterns/status-indicator-pattern/

## Existing CCI mappings

These mappings show how the vocabulary relates to real current concepts.

### Evidence

Approximate mapping:

```
EvidenceState.current
    → temporal=current + authority=observed

EvidenceState.last-known
    → temporal=last-known + authority=observed

EvidenceState.estimated
    → temporal=current + authority=estimated

EvidenceState.causal-only
    → authority=causal

EvidenceState.unknown
    → status=unknown
```

This is an adapter target, not a demand to delete `EvidenceState` immediately. If an existing state does not map cleanly, document the exception instead of forcing a false meaning.

### Party

Before source-backed establishment:

```
status = not-established
```

When established:

```
status = present
change = newly-established
```

Later meaningful membership changes may use `change = changed`.

### Pet

Explicitly empty:

```
status = known-empty
```

Acquisition/bond establishment may use:

```
status = present
change = newly-established
```

### Countdown

Observed:

```
status = present
temporal = current
authority = observed
```

Estimated/interpolated:

```
status = present
temporal = current
authority = estimated
provenance = inspectable
```

Detailed evidence remains Timeline-owned.

### Last-known telemetry

```
status = present
temporal = last-known
authority = observed
provenance = inspectable
```

The renderer must not imply that last-known means current truth.

### Unknown / unavailable

Use `unknown` when evidence does not establish the value.

Use `unavailable` only when the application can establish that it cannot currently provide the requested value.

Never manufacture a zero, empty value, timestamp, countdown, or other plausible fallback.

### Historical change

A historical delta can be:

```
change = changed
affordance = none
```

if informational only. A change does not become actionable merely because it is emphasized.

### Actual capability

When application capability evaluation says an operation is available:

```
affordance = action
```

The semantic layer still does not contain the action implementation.

### Replay

Replay is application context, not a fictional crawler action. Compact replay state may appear in the HUD, but scrubbing, sequence navigation, and Return to Live remain application/replay/navigation responsibilities.

## Minimal runtime contract

The following is the target shape to evaluate against actual consumers:

```ts
export type PresentationStatus =
  | "present"
  | "known-empty"
  | "not-established"
  | "unknown"
  | "unavailable";

export type PresentationTemporal =
  | "current"
  | "last-known";

export type PresentationAuthority =
  | "observed"
  | "estimated"
  | "causal";

export type PresentationChange =
  | "changed"
  | "newly-established";

export type PresentationAffordance =
  | "none"
  | "inspect"
  | "action";

export interface PresentationSemantics {
  status: PresentationStatus;
  temporal?: PresentationTemporal;
  authority?: PresentationAuthority;
  change?: PresentationChange;
  affordance?: PresentationAffordance;
  provenance?: {
    inspectable: boolean;
  };
}

export type PresentationMotionIntent =
  | "established"
  | "changed"
  | "attention"
  | "enter-context"
  | "enter-replay"
  | "return-live"
  | "disclose";
```

**This is a design target, not a mandate to implement it literally.** Before implementation, compare every field with real current consumers and remove fields with no demonstrated use.

In particular, `status: "present"` may be structurally redundant for some value-bearing contracts. Do not introduce it merely for symmetry.

If a runtime contract is needed, prefer:

```
src/presentation/semantic/
```

It must be React-free, renderer-free, Arwes-free, CSS-free, and action-free. Do not place it in `src/shared/ui/`, `src/shell/`, or the Arwes renderer namespace.

## Migration strategy

Do not replace the evidence model in one pass.

First adapt existing presentation data into the semantic vocabulary, then migrate representative consumers where the distinction is useful.

Keep Timeline ownership of detailed evidence and keep existing public feature contracts narrow.

Broad HUD churn is out of scope for #220.

## Test strategy

Tests should verify semantic meaning, not a renderer's visuals.

Representative cases:

- current + observed;
- current + estimated;
- last-known + observed;
- unknown;
- unavailable where application truth establishes it;
- known-empty;
- not-established;
- changed;
- newly-established;
- inspectable;
- actionable;
- historical/informational;
- replay context.

Preserve Party/Pet replay semantics and capability-boundary tests.

If a semantic module is introduced, add architecture verification ensuring semantic code cannot import Arwes or renderer modules.

## Renderer test matrix for #217

The same semantic cases should be renderable through each candidate renderer:

| Case | Semantic meaning |
|---|---|
| Ordinary health | present + current + observed |
| Estimated countdown | present + current + estimated + inspect |
| Stale health | present + last-known + observed + inspect |
| Missing value | unknown |
| Application-unavailable value | unavailable |
| Empty Pet | known-empty |
| Party before formation | not-established |
| Party formation | present + newly-established |
| Historical delta | changed + informational |
| Actual navigation capability | actionable |
| Replay | application temporal context |
| Evidence inspector | inspectable |

The comparison question is:

> How clearly and efficiently does each renderer express the same source-backed semantics?

It is not a winner-selection mechanism.

## Deferred decisions

#220 deliberately does not decide:

- final visual direction;
- colors;
- glyph vocabulary;
- typography;
- exact status markers;
- Arwes-specific components/effects;
- animation durations/physics;
- final Authority/Tactical/Theater treatment.

## Scope guardrails

#220 must not:

- redesign HUD composition;
- reopen modular shell work;
- redo navigation/system chrome;
- rewrite session/projection/replay/persistence;
- replace Timeline evidence;
- make Arwes mandatory;
- move Arwes imports outside `src/presentation/authority-arwes/**`;
- create a generic design system;
- create a giant `HudState`;
- create a large motion framework;
- create renderer-specific semantic badges;
- migrate every feature merely to prove the abstraction;
- select a final visual direction.

## Definition of done

- [ ] This document is the living source of truth for #220/#217 semantic work.
- [ ] Independent dimensions are separated; no giant HUD state enum.
- [ ] known-empty, not-established, unknown, and unavailable remain distinguishable.
- [ ] current/last-known are distinct from observed/estimated/causal.
- [ ] changed/newly-established are separate from value status.
- [ ] capability remains outside semantic meaning.
- [ ] detailed provenance remains Timeline-owned.
- [ ] glance → inspect → evidence is defined.
- [ ] motion intent is renderer-neutral.
- [ ] accessibility constraints are explicit.
- [ ] existing CCI states are mapped without inventing unsupported state.
- [ ] a minimal runtime contract is added only after consumer-driven validation.
- [ ] representative Party/Pet/countdown/telemetry/replay cases are covered.
- [ ] semantic code cannot depend on Arwes.
- [ ] `npm run verify` passes once implementation begins.
- [ ] #217 consumes this language rather than inventing its own semantics.
- [ ] no final visual direction is selected by #220.

## Relationship to #217

The intended sequence is:

```
existing evidence + presentation contracts
        ↓
#220 semantic language / minimal contract
        ↓
#217 polished Arwes realization
        ↓
same semantic cases through other candidates
        ↓
eventual visual-direction decision
```

The architectural test is:

> **Arwes supplies the physics; CCI supplies the language.**

If implementing Arwes requires changing the meaning of `unknown`, `last-known`, `newly-established`, or `actionable`, the renderer has crossed the wrong boundary.

## References

- Issue #220: https://github.com/g1ddy/crawler-command-interface/issues/220
- Arwes research baseline: https://github.com/g1ddy/crawler-command-interface/blob/main/docs/research/arwes-authority-poc.md
- Architecture: https://github.com/g1ddy/crawler-command-interface/blob/main/docs/ARCHITECTURE.md
- Architecture policy: https://github.com/g1ddy/crawler-command-interface/blob/main/architecture-policy.json
- WCAG 2.2 — Use of Color: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- WCAG 2.2 Technique C39 — prefers-reduced-motion: https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- Carbon Status Indicator pattern: https://carbondesignsystem.com/patterns/status-indicator-pattern/
