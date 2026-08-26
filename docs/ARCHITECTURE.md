# Architecture Specification

This document details the system architecture, browser-first runtime boundaries, deployment adapters, data processing pipeline, and directory organization for the Crawler Command Interface.

## Architectural Overview

The Crawler Command Interface is a deterministic, replayable dungeon crawler HUD. The application operates as a point-in-time state projector: selecting a timeline sequence reconstructs exact historical HUD state without persisting per-sequence snapshots or running active server-side game loops.

```
+-------------------------------------------------------------------------+
|                         Shared Browser Application                       |
|                             (src/CrawlerApp.tsx)                        |
|                                                                         |
|  +------------------------+  +-------------------+  +----------------+  |
|  |  TimelineScrubber.tsx  |  | State Projection  |  | HUD Telemetry  |  |
|  |  (Sequence controls)   |  | (projection.ts)   |  | (Inspectors)   |  |
|  +------------------------+  +-------------------+  +----------------+  |
+-------------------------------------------------------------------------+
                    ^                                       ^
                    |                                       |
    +---------------+---------------+       +---------------+---------------+
    | ChatGPT Sites/Vinext Adapter |       | Static GitHub Pages Adapter   |
    | (app/page.tsx, Cloudflare)    |       | (src/main.pages.tsx, Vite)    |
    +-------------------------------+       +-------------------------------+
```

## Runtime Boundaries & Shared Core

### Shared Core (`src/CrawlerApp.tsx`)
- Contains the main browser React application component, UI layout, telemetry inspectors, and local timeline state management.
- Implements deterministic point-in-time replay: state is derived in memory for the selected sequence via domain projection functions.
- Client-side interactions (e.g., inventory actions, attribute allocation) append new events to the live end of the timeline without mutating historical sequence states.

### ChatGPT Sites Adapter (`app/page.tsx`)
- Server-rendered React entry point optimized for Cloudflare Workers / Vinext deployment.
- Deliberately thin wrapper around `CrawlerApp.tsx`.
- Serves the live ChatGPT app surface.

### GitHub Pages Adapter (`src/main.pages.tsx`, `index.html`)
- Standalone client-side Vite entry point for static web hosting.
- Mounts `CrawlerApp.tsx` directly in the browser DOM.
- Supports configurable base paths (`PAGES_BASE_PATH`, defaulting to `/crawler-command-interface/`).

Both adapters execute the identical core browser application and domain logic.

## Data Processing Pipeline: Raw → Compiled → Projection

```
  +-----------------------+
  |  data/raw/floors/*.json|  <-- Hand-authored evidence, events & observations
  +-----------------------+
              |
              v (npm run generate:fixture / raw-compiler.ts)
  +-------------------------------------------+
  | app/domain/fixtures/compiled-timeline.ts |  <-- Worker-safe TypeScript runtime fixture
  +-------------------------------------------+
              |
              v (Imported by browser app)
  +-------------------------------------------+
  |  Replay Engine & Domain Projectors        |
  |  - projectState (app/domain/projection.ts)  |  <-- Event state derivation
  |  - projectObservations (observations.ts)  |  <-- Evidence telemetry projection
  |  - projectCountdownState (countdowns.ts)  |  <-- Countdown interpolation/extrapolation
  +-------------------------------------------+
              |
              v
  +-------------------------------------------+
  |          Rendered HUD Component           |
  +-------------------------------------------+
```

### Raw Story Documents (`data/raw/floors/`)
- Authoritative source of truth for storyline events, observations, countdown anchors, and evidence.
- Authored manually and validated against the `crawler-floor-raw/v1` schema (`app/domain/schema/crawler-floor-raw.schema.json`).

### Derived & Worker-Safe Fixture (`app/domain/fixtures/compiled-timeline.ts`)
- The raw floor documents are compiled at build time into `compiled-timeline.ts`.
- **Worker-Safe Import Boundary**: Cloudflare Workers prohibit dynamic code generation (`eval`/`new Function`) used by JSON Schema compilers like Ajv. Therefore, raw schema compilation and validation occur in build tooling and tests (`scripts/sync-derived-fixtures.mjs`). Runtime imports in `app/page.tsx` and `src/CrawlerApp.tsx` load `compiled-timeline.ts` directly without performing runtime Ajv schema compilation.

### Deterministic State Projection
- **Event Projection (`app/domain/projection.ts`)**: Applies causal events (`ItemAcquired`, `AttributeModified`, `ConditionApplied`, etc.) to produce point-in-time crawler state.
- **Observation Telemetry (`app/domain/observations.ts`)**: Projects non-causal readings (attributes, XP progress, broadcast telemetry) with evidence provenance. Non-discrete readings use linear interpolation between compatible anchors unless separated by countdown phase breaks or floor boundaries.
- **Countdown Engine (`app/domain/countdowns.ts`)**: Derives exact countdown values at references, linear estimates between references, and after-final extrapolation (`~`). Phase break events (`CountdownReset`, `CountdownPaused`, etc.) strictly terminate countdown phases.

## File Placement & Repository Directory Map

```
/
├── app/
│   ├── components/         # HUD React components (TimelineScrubber, inspectors)
│   ├── domain/             # Core domain projection, countdowns, observations, types, schemas
│   │   ├── fixtures/       # Compiled runtime timeline fixture (compiled-timeline.ts)
│   │   └── schema/         # Ajv JSON schemas for raw floor, compiled floor, and timeline
│   └── page.tsx            # ChatGPT Sites / Vinext Worker entry point
├── src/
│   ├── CrawlerApp.tsx      # Shared main browser React application component
│   └── main.pages.tsx      # GitHub Pages static client entry point
├── data/
│   ├── raw/floors/         # Primary hand-authored story JSON evidence
│   └── floors/             # Generated floor JSON files
├── scripts/                # Build, fixture-sync, and environment scripts
├── tests/                  # Node test runner unit and integration test suites
├── worker/                 # Worker runtime configuration and support
├── index.html              # Static HTML entry point for Vite Pages build
├── vite.config.ts          # Vite configuration for ChatGPT Sites / dev server
└── vite.pages.config.ts    # Vite configuration for static GitHub Pages build
```

## Generated vs. Authored Data Invariants

1. **Authored Data**: Only `data/raw/floors/` contains hand-authored story evidence and events.
2. **Generated Data**: Files in `data/floors/`, `data/compiled-timeline.json`, and `app/domain/fixtures/compiled-timeline.ts` are derived build artifacts created by `npm run generate:fixture`. Never hand-edit derived fixtures.
3. **No Stored HUD Snapshots**: Replayed HUD state is derived strictly in memory for the active sequence. Snapshot persistence is prohibited to prevent stale state leakage.
4. **Worker-Safe Import Integrity**: Files imported along the runtime app path (`app/page.tsx`, `src/CrawlerApp.tsx`) must never import Ajv or trigger schema compilation during initialization.
