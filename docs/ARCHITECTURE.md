# Architecture Specification

The Crawler Command Interface is a deterministic, replay-first browser application shared by the ChatGPT/Vinext and GitHub Pages hosts. The repository deliberately separates story/domain meaning from feature behavior, shell orchestration, and host adapters.

## Architectural model

```text
authored raw evidence
    ↓
compiled domain timeline
    ↓
projection
    ↓
feature presentation / feature UI
    ↓
shell + application composition
    ↓
host adapter
```

The product layers are related but not identical to the navigation tree:

- **Domain** — what the story/data means.
- **Feature** — useful application behavior over projected state.
- **Navigation** — where supported features are reachable at the selected replay sequence.
- **Shell / HUD** — persistent global status, replay, navigation, and secondary tools.
- **Host adapter** — ChatGPT/Vinext or GitHub Pages integration.

A modeled domain does not receive a UI namespace merely for symmetry. Magic is the current example: spell state is modeled/projected, but there is no `src/features/magic/` or Magic navigation until a source-backed useful behavior warrants it.

## Shared browser application

```text
ChatGPT/Vinext adapter ─┐
                        ├─→ src/CrawlerApp.tsx
GitHub Pages adapter ───┘        │
                                 ├─ shell/navigation
                                 ├─ shell/hud
                                 ├─ shell/replay
                                 ├─ shell/tools
                                 └─ features/*
                                       │
                                       ↓
                                  app/domain/*
```

`src/CrawlerApp.tsx` is the application composition/state root. It owns timeline-document lifecycle, selected sequence/floor/live state, top-level projections, capability coordination, and global modal state. Detailed feature rendering is delegated to `src/shell/ActiveFeatureView.tsx`; persistent replay rendering is delegated to `src/shell/replay/ReplaySurface.tsx`; data tools are delegated to `src/shell/tools/TimelineToolsModal.tsx`.

User interactions emit events that append to the live timeline endpoint without mutating historical sequence states. Shared state composition is centralized at the state root and projected deterministically.

## Application mutation boundary

Feature UI expresses crawler intent through the focused action contracts in
`src/application/crawler-actions.ts`; it does not construct persisted timeline
events. The command executor validates requests against the projected live state,
reuses domain eligibility helpers, assigns runtime identity and sequence metadata,
and appends one immutable event at the live endpoint. Runtime actions carry an
explicit `user-runtime` origin and empty evidence instead of claiming authored
story provenance.

Crawler, inventory, and skills actions belong at this boundary. Import, export,
and reset remain secondary shell tooling because they replace, serialize, or clear
the timeline document rather than representing actions performed by the crawler.
To add an interactive domain mutation, add a focused intent and validation/event
mapping here, expose only its domain action interface to the feature, and test both
rejection and live-endpoint append behavior. Do not duplicate projection reducers
in the application layer.

## Navigation and capability ownership

`src/shell/navigation/navigation-model.ts` is the single non-React source of truth for root destination IDs, order, and labels. `capabilities.ts` evaluates replay-aware availability from projected state, and `RootNavigation.tsx` renders only available destinations. Keyboard navigation consumes the same filtered ordering.

Baseline destinations:

- Crawler
- Inventory
- Skills

Conditional destinations become available only when projected state supports them:

- Quests
- Ratings
- Party
- Notifications

When replay crosses back before a capability boundary, the destination disappears and an unavailable active destination resolves safely to Crawler.

## Replay, Timeline, and Floor ownership

Replay is a persistent application capability; Timeline is a detailed inspection feature family.

### Shell replay (`src/shell/replay/`)

Owns globally available:

- selected floor/replay context;
- Live vs Replay state;
- sequence scrubber and previous/next stepping;
- Return to Live;
- entry points to Floor Rules, Timeline History, Timeline Evidence, and countdown evidence.

### Timeline feature (`src/features/timeline/`)

Owns:

- history presentation;
- evidence/telemetry inspection;
- sequence/event diagnostics;
- semantic/category filtering and optional markers;
- detailed countdown provenance.

### Floor feature (`src/features/floor/`)

Owns floor-specific rules/directives and detailed floor presentation.

This split keeps time scrubbing permanently visible without using one mega-component as the owner of every replay, history, evidence, floor, and diagnostic responsibility.

## Feature ownership

```text
src/features/
├── crawler/
│   ├── stats/
│   └── health/
├── inventory/
│   ├── items / browsing composition
│   ├── equipment/
│   ├── provenance/
│   └── awards/history
├── skills/
├── quests/
├── ratings/
├── party/
├── notifications/
├── timeline/
│   ├── diagnostics/
│   ├── evidence/
│   └── history/
└── floor/
```

`src/shared/` is intentionally small. Shared primitives may understand generic UI mechanics such as panels, modals, badges, or meters, but not crawler-specific domain concepts.

## Host boundary and shared styles

`app/` is the ChatGPT/Vinext host namespace plus the intentionally retained shared runtime boundary `app/domain/`.

- `app/page.tsx` is a thin ChatGPT/Vinext adapter.
- `app/chatgpt-auth.ts` contains host-specific identity helpers.
- `src/main.pages.tsx` is the GitHub Pages browser entry point.
- `src/styles/application.css` contains host-neutral application styling consumed by both adapters.

Shared browser UI must not depend on host-specific UI/assets. `app/domain/` remains intentionally shared and must stay safe for the runtime intersection, including Cloudflare Worker import/render constraints.

## Domain and data lifecycle

Authoritative story evidence lives under `data/raw/`. The raw authoring/storage decomposition and compiler/projection contracts are defined by the authoring guide in [`RAW_OBSERVATIONS.md`](../RAW_OBSERVATIONS.md); this document does not duplicate those rules.

The runtime pipeline is:

```text
data/raw/
   ↓ Node authoring/compiler tooling
RawCrawlerFloorDocument
   ↓
data/floors/*.json + data/compiled-timeline.json
   ↓
app/domain/fixtures/compiled-timeline.ts
   ↓
projectState / projectObservations / projectCountdownState
   ↓
feature UI + shell
```

Durable rules:

- raw evidence is authoritative;
- generated floor/timeline artifacts are not hand-edited;
- historical projection is deterministic and immutable;
- Node-only authoring/validation behavior stays out of Worker/browser execution paths;
- unsupported capabilities stay absent rather than filled with plausible defaults.

## Source honesty in runtime UI

Missing story data remains unknown/unavailable. The shell must not manufacture fallback countdowns or plausible timestamps. Directly stated and estimated telemetry remain distinguishable and inspectable through Timeline evidence/provenance UI.

The same rule applies to visual documentation. `tests/screenshots/canonical-screenshots.ts` contains only canonical product screenshots backed by real supported application/story state. Synthetic Playwright fixtures may test a component or conditional feature, but they are not promoted into `docs/images/` or represented as canonical story state. Quests currently have noncanonical rendering coverage only because Floors 1–2 do not contain authored quest state.

## Directory map

```text
/
├── app/
│   ├── domain/                  # shared deterministic domain/runtime boundary
│   ├── chatgpt-auth.ts          # ChatGPT-specific identity helpers
│   ├── layout.tsx               # host layout consuming shared styles
│   └── page.tsx                 # thin ChatGPT/Vinext adapter
├── src/
│   ├── CrawlerApp.tsx           # application composition/state root
│   ├── features/                # feature-owned UI and presentation
│   ├── shell/
│   │   ├── navigation/
│   │   ├── hud/
│   │   ├── replay/
│   │   └── tools/
│   ├── shared/ui/               # generic UI primitives only
│   ├── styles/application.css   # host-neutral application styles
│   └── main.pages.tsx           # GitHub Pages adapter
├── data/raw/                    # authoritative hand-authored evidence
├── data/floors/                 # generated compatibility artifacts
├── data/compiled-timeline.json  # generated runtime timeline
├── tests/
├── scripts/
└── worker/
```

## Dependency direction

The repository machine-enforces these boundaries against imports parsed directly
from the current working source:

- domain/projection must not import anything under `src/`;
- `src/shared/` must remain domain-neutral and cannot import domain, application,
  feature, shell, or host modules;
- features must not import shell orchestration and sibling feature internals;
- `src/application/` may depend downward on `app/domain/`, but cannot import
  React, feature/shell UI, or host adapters;
- shell may compose feature entry points;
- shared browser code cannot import ChatGPT/Vinext-specific `app/` modules (the
  documented `app/domain/` runtime boundary is the sole exception);
- browser/Worker entry points cannot transitively reach Node-only authoring
  modules or Node built-ins;
- shared browser code must not depend on ChatGPT-host-specific UI/assets;
- Worker-reachable modules must not execute Node-only behavior or dynamic schema compilation during import/render.

The reviewable policy is [`architecture-policy.json`](../architecture-policy.json),
and [`scripts/check-architecture.mjs`](../scripts/check-architecture.mjs) performs
the lightweight dependency analysis. `npm run test:architecture` includes focused
positive and negative fixtures, and is part of `npm run verify`. Its analysis is
always derived from the exact source being verified; a previously committed
`.maritime/dependency-graph.json` cannot satisfy this gate.

### Application mutation contracts

`src/application/` is the typed mutation boundary. Features consume only the
focused interfaces in `src/application/crawler-action-contracts.ts`; they cannot
import `crawler-actions.ts`, its executor, append mechanics, command/event mapping,
or future implementation modules. The composition root constructs those action
implementations and distributes the narrow interfaces. New mutation domains
should extend a focused application contract and implement it in this layer using
domain projection, eligibility, and type helpers—never construct persisted events
inside a feature.

### Intentional cross-feature contracts

A feature may expose semantics that another feature genuinely needs through the
single narrow entry point `src/features/<feature>/public.ts`. For example,
Timeline's public contract exposes its evidence-aware `TelemetryBadge` to crawler,
inventory, and ratings presentation without pretending that domain-aware evidence
UI is a generic `src/shared/ui` primitive. Arbitrary sibling implementation imports
fail architecture verification.

To introduce another intentional contract, add or extend the owning feature's
`public.ts`, keep its exports focused, document why the concept is owned there,
and add a positive architecture fixture. Do not add path-specific exceptions to
the checker or move crawler semantics into `src/shared/` to evade the boundary.

Maritime remains generated structural evidence describing dependencies and should
be regenerated and reviewed after architecture changes rather than hand-edited.
The independent policy defines whether dependencies are allowed; developers do
not need to inspect the generated SVG to understand a policy failure.

### Conceptual vs. generated architecture views

Conceptual diagrams document architectural intent and layer ownership. Generated diagrams (such as Maritime architecture graphs in [COMPLEXITY.md](COMPLEXITY.md)) document observed repository structure and static module dependencies. Neither replaces the other.

## Verification

Before merge:

```bash
npm run verify
npm run test:screenshots
```

Maritime and screenshot artifact workflows provide generated evidence for review/promotion. Generated architecture/screenshot assets must not be manually retouched.
