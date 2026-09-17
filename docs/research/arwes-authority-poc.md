# Arwes Authority POC — Research and Design Baseline

**Status:** Proposed implementation baseline  
**Scope:** First Arwes POC issue and subsequent Jules handoffs  
**Last reviewed:** 2026-09-17

## Purpose

This document is the living technical and architectural source of truth for the Arwes Authority presentation POC.

The POC is an experiment in **presentation**, not a commitment to Arwes as a production dependency and not a redesign of crawler state, replay, provenance, or application architecture.

The objective is to determine whether Arwes can provide useful visual and interaction primitives for the Crawler Command Interface's Authority visual grammar while remaining isolated from domain/application truth.

Future implementation issues should reference this document instead of duplicating the architecture and compatibility research below.

## Current repository boundary

The application already separates session bootstrap from presentation selection. `CrawlerApp` accepts `hudPresentation` and `hudPersistence`, creates the session independently, and passes the selected presentation into `CrawlerWorkspace`. Presentation changes therefore have an existing architectural seam to build on.

`HudPresentation` currently distinguishes the production presentation from the existing HUD concepts. The Arwes POC should be added as another presentation choice rather than becoming a new application/session mode.

`CrawlerWorkspace` remains the current composition adapter. It owns presentation selection, navigation, replay wiring, overlays, and feature composition. The POC must not make this component increasingly aware of Arwes internals.

### Target dependency direction

```text
Source data / domain
        |
        v
Application session / capabilities / replay
        |
        v
Feature presentation contracts
        |
        v
Authority presentation composition model
        |
        +--------------------------+
        |                          |
        v                          v
Existing Authority          Authority Arwes
presentation                presentation
                                   |
                                   v
                            Crawler visual
                              primitives
                                   |
                                   v
                                 Arwes
```

Arwes must remain downstream of presentation contracts.

## Arwes compatibility findings

Arwes documentation currently describes its React packages as React 18-specific and explicitly states that React Strict Mode and React Server Components are unsupported. The documentation also instructs React applications to disable Strict Mode and use client-side rendering.

The repository currently uses React 19.2.6 and includes React Server Components tooling. Therefore, Arwes compatibility is an explicit technical risk that must be proven before the POC becomes substantial.

The Arwes project README states that the project is no longer maintained and outdated, while remaining functional. The current documentation identifies `v1.0.0-alpha.23` as the latest alpha release. This makes Arwes suitable for a controlled visual POC, but it is not a reason to weaken the application's architecture or permanently couple application semantics to Arwes APIs.

### Consequence

**Do not disable Strict Mode globally. Do not alter the application's React/RSC architecture merely to accommodate Arwes.**

The first implementation issue is therefore a compatibility spike. If the React integration cannot be isolated safely, that finding is itself a valid POC result.

## What Arwes is useful for

Arwes is most valuable here as a source of visual/interaction primitives rather than a conventional component library.

Relevant current primitives include:

- animation/transition orchestration: `Animator`, `Animated`
- frames: `FrameUnderline`, `FrameLines`, `FrameCorners`, `FrameOctagon`, `FrameNefrex`, `FrameKranox`, `FrameHeader`, and related frame primitives
- text effects: `Text`
- passive backgrounds: `GridLines`, `Dots`, `Puffs`, `MovingLines`
- transient effects: `Illuminator`, `IlluminatorSVG`
- optional short interface sounds: Bleeps

The POC should use these selectively. The visual goal is **Authority**, not generic Arwes styling.

## Crawler visual principle

> **Arwes supplies the physics. Crawler supplies the language.**

The application should not expose Arwes component names or theme types to feature/domain code.

Prefer:

```tsx
<AuthorityFrame significance="critical">
  <SystemMessage ... />
</AuthorityFrame>
```

over:

```tsx
<FrameCorners>
  ...
</FrameCorners>
```

The latter should be an implementation detail of the former.

## Proposed presentation boundary

Create an isolated subtree:

```text
src/presentation/authority-arwes/
├── ArwesPresentation.tsx
├── ArwesProvider.tsx
├── compatibility/
│   └── ArwesCompatibilityProbe.tsx
├── primitives/
│   ├── AuthorityFrame.tsx
│   ├── AuthoritySurface.tsx
│   ├── AuthorityText.tsx
│   ├── AuthoritySignal.tsx
│   ├── AuthorityIndicator.tsx
│   ├── AuthorityTransition.tsx
│   └── AuthorityBackground.tsx
├── shell/
│   ├── ArwesShell.tsx
│   ├── ArwesContext.tsx
│   ├── ArwesHeader.tsx
│   └── ArwesNavigation.tsx
├── widgets/
│   ├── ArwesCrawlerStatus.tsx
│   ├── ArwesCountdown.tsx
│   ├── ArwesNotification.tsx
│   ├── ArwesParty.tsx
│   ├── ArwesEvidence.tsx
│   └── ArwesReplayState.tsx
├── tokens/
│   ├── authority-tokens.ts
│   └── authority-motion.ts
└── styles/
    └── arwes.css
```

Exact filenames may evolve. The important constraint is that Arwes imports remain inside the presentation implementation boundary.

## First issue: compatibility spike

The first issue should **not** build the Crawler HUD.

It should prove that a minimal Arwes React surface can coexist with the repository's current runtime/build architecture.

### Probe requirements

Render a minimal isolated probe containing:

1. one Arwes frame;
2. one `Animator`/`Animated` transition;
3. one Arwes text primitive;
4. one background primitive;
5. mount/unmount behavior;
6. repeated render behavior;
7. navigation away/back behavior;
8. development build behavior;
9. production build behavior.

The probe should use the smallest reasonable Arwes package imports rather than immediately importing the umbrella package everywhere.

### Compatibility matrix

Record results for:

| Concern | Required result |
| --- | --- |
| React 19 runtime | verified / incompatible / unknown |
| React Strict Mode | verified / incompatible / unknown |
| Vite development server | verified / incompatible / unknown |
| production build | verified / incompatible / unknown |
| browser runtime | verified / incompatible / unknown |
| RSC boundary | verified / incompatible / unknown |
| test environment | verified / incompatible / unknown |
| package/type compatibility | verified / incompatible / unknown |
| bundle/dependency impact | measured |

Do not hide failures by globally changing the application configuration.

## Architecture rules for the POC

### Rule 1 — No domain changes for visual needs

If Arwes needs information that the presentation contract does not expose, improve the presentation contract or composition adapter. Do not modify domain projection solely to make a visual component easier to implement.

### Rule 2 — No Arwes imports outside the presentation implementation

Arwes imports belong under `src/presentation/authority-arwes/**` unless a later architecture decision explicitly creates another adapter boundary.

### Rule 3 — No raw session objects in visual components

Prefer:

```tsx
<ArwesCrawlerStatus model={crawlerPresentation} />
```

not:

```tsx
<ArwesCrawlerStatus session={session} />
```

### Rule 4 — No raw events in visual components

Presentation components consume derived presentation models, not event arrays or projection internals.

### Rule 5 — No Arwes types in application contracts

Application-facing contracts must not expose `Frame*Props`, `AnimatorProps`, Arwes theme types, or other Arwes implementation types.

### Rule 6 — Preserve Live/Replay semantics

The Arwes presentation consumes the same source-backed presentation models in Live and Replay. It must not establish a second temporal state model.

### Rule 7 — Preserve evidence semantics

The POC must not visually imply certainty that the underlying evidence does not support. Existing concepts such as Observed, Last Known, Estimated, Causal, Unknown, and Unavailable remain application semantics.

### Rule 8 — Respect accessibility and reduced motion

Arwes animation must not be the sole carrier of information. Semantic HTML, keyboard interaction, focus behavior, and `prefers-reduced-motion` remain application responsibilities.

## Proposed Authority primitives

These are semantic Crawler abstractions, not necessarily direct one-to-one Arwes components:

- `AuthorityFrame` — structural boundary whose framing is driven by significance.
- `AuthoritySurface` — semantic region that may or may not receive a frame.
- `AuthorityText` — system typography/effect wrapper; effects remain selective.
- `AuthoritySignal` — transient or persistent state signal.
- `AuthorityIndicator` — compact state/threshold indicator.
- `AuthorityTransition` — meaningful system state transition, not generic animation.
- `AuthorityBackground` — restrained ambient system presence.

A semantic region is allowed to have **no frame**. Avoid turning every piece of information into a card.

## Significance model

The implementation should be able to distinguish at least:

```text
ambient
informational
active
important
critical
system-interruption
```

These are presentation semantics and may be refined during the POC.

## Evidence model

The visual grammar must support at least:

```text
observed
last-known
estimated
causal
unknown
unavailable
empty
```

The POC should test whether uncertainty can be made legible without turning the HUD into a developer diagnostics panel.

## Temporal model

The visual implementation must support:

```text
live
replay
historical
```

without owning temporal state itself.

## Initial vertical slice after compatibility

Once compatibility is proven, the first meaningful slice should be:

1. persistent Authority shell;
2. contextual navigation;
3. Crawler status;
4. Live/Replay indicator;
5. one system notification/interruption;
6. one evidence marker.

This is deliberately small. It tests persistent system presence, hierarchy, state change, provenance, navigation, and temporal context before migrating the rest of the application.

## Animation rules

Animation should communicate:

- system recognition;
- state change;
- interruption;
- transition of focus;
- entry/exit of meaningful information.

Do not animate every label, metric, or render. Prefer a sequence such as:

```text
state changes
  -> system recognizes significance
  -> presentation interrupts or emphasizes
  -> affected state updates
  -> resulting state persists
```

## Background rules

Arwes backgrounds are ambient infrastructure, not decoration. Use effects such as GridLines, Dots, Puffs, or MovingLines only when they reinforce system presence. Avoid full-screen visual noise.

## Widget mapping for later issues

| Crawler concern | Candidate Arwes substrate | Crawler abstraction |
| --- | --- | --- |
| active navigation | `FrameUnderline`, animation | `AuthorityNavigationSignal` |
| structural region | frame primitives | `AuthorityFrame` |
| system interruption | frames + `Animator`/`Animated` | `AuthorityTransition` / `SystemMessage` |
| persistent status | frame/line primitives | `AuthoritySurface` / `AuthorityIndicator` |
| countdown | text + threshold transition | `CountdownPresentation` |
| party | restrained line/frame treatment | `PartyPresentation` |
| evidence | subtle frame/text treatment | `EvidenceMark` |
| replay | context/header/underline | `TemporalPresentation` |
| ambient environment | background primitives | `AuthorityBackground` |
| optional sound | Bleeps | system-event sound policy |

## Visual validation

The POC should eventually have deterministic visual states suitable for the repository's existing Playwright/screenshot infrastructure.

Candidate states:

- Authority Arwes Live;
- Authority Arwes Replay;
- system notification;
- critical interruption;
- countdown threshold;
- evidence/estimated state;
- mobile composition.

The first compatibility issue does not need to create all screenshots. It should establish the path for later visual regression coverage.

## Reversibility requirement

A later issue should be able to replace the Arwes implementation with native/CSS/SVG implementation while retaining the same presentation contracts.

If removing Arwes requires changes to domain state, replay semantics, persistence, or application commands, the boundary has failed.

## Disposition criteria

The POC should eventually classify Arwes as one of:

- `ARWES_RUNTIME` — viable as the runtime visual substrate;
- `ARWES_SELECTIVE` — useful only for selected primitives/packages;
- `ARWES_REFERENCE` — valuable as a visual/interaction reference, but not a runtime dependency;
- `ARWES_REJECTED` — insufficient technical or experiential value.

The disposition must be evidence-based and recorded after the vertical slice, responsive/accessibility checks, and reversibility test.

## Source references

- Arwes React documentation: https://arwes.dev/docs/develop/react
- Arwes main documentation: https://arwes.dev/docs
- Arwes GitHub repository: https://github.com/arwes/arwes
- Arwes releases: https://github.com/arwes/arwes/releases

The current Arwes documentation states React 18-specific support and no Strict Mode/RSC support; the repository README states that Arwes is no longer maintained/outdated. Those facts are compatibility constraints for this POC, not reasons to change the Crawler architecture around Arwes.
