# Product & Delivery Roadmap

This document is the authoritative list of unfinished product, data, and maintenance work for the Crawler Command Interface.

## Active Architectural Constraints

The following core constraints guide all ongoing and future roadmap work:

- **Browser-First Primary Runtime**: The core HUD, timeline scrubber, event state projection, and read-only historical replay execute entirely in the browser without requiring a server, account, API, or Cloudflare binding.
- **Dual Deployment Targets**: Single shared browser core (`src/CrawlerApp.tsx`) with thin adapters for ChatGPT Sites / Vinext Worker (`app/page.tsx`) and static GitHub Pages (`src/main.pages.tsx`).
- **Worker-Safe Import Boundary**: Runtime import chains must avoid AJV schema compilation or dynamic code generation (`eval`/`new Function`) to comply with Cloudflare Worker constraints.
- **Deterministic Historical Replay**: State at sequence $N$ is derived in memory from event/observation history. Replayed state is immutable; user interactions append new events to the live endpoint rather than mutating historical sequences.
- **Raw Story Authoring Source**: Story evidence is authored strictly in `data/raw/floors/`. Derived fixtures (`app/domain/fixtures/compiled-timeline.ts`) are generated via `npm run generate:fixture`.

---

## Roadmap & Backlog

### 1. Historical State and Replay

- [ ] Add direct navigation links from Journal entries to their related item, skill, quest, achievement, or entitlement inspector.
- [ ] *Intentional Deferral*: Evaluate moving from `localStorage` to `IndexedDB` only if timeline size, multiple saved timelines, or offline query needs make `localStorage` inadequate.

### 2. Event-Sourced Crawler Data

- [ ] Define provenance policy for `occurred_at`, `recorded_at`, `causation_id`, and `correlation_id` when authoring sources establish them consistently. Do not invent timestamps/IDs merely to fill fields.
- [ ] Support globally chronological ordering for overlapping floor transitions:
  - Establish sourced cross-floor ordering fields and compiler interleaving rules to support events occurring after entry to a new floor.
- [ ] *Intentional Deferral*: Add periodic snapshot generation and invalidation only when measurement demonstrates replaying the full event stream is no longer fast. (Timeline contract and projector already support snapshots).

### 3. Interaction Polish

- [ ] Add drag-and-drop reordering for skill hotlist slots on desktop.
- [ ] Add Playwright browser E2E coverage for keyboard shortcuts, mobile bottom-sheet behavior, and replay state contract.

### 4. Application Architecture

- [ ] Incrementally split orchestration concentrated in `src/CrawlerApp.tsx` into focused view/state modules when a concrete change benefits from it. Preserve deterministic projection boundaries without introducing unnecessary state-management libraries.

### 5. Deployment and Delivery

- [ ] Record reviewed `main` commit SHA during ChatGPT live-app releases, or automate release metadata generation in CI/CD.

### 6. Quality, Governance, and Disclaimers

- [ ] **Next Priority Milestone**: Implement Playwright E2E browser tests:
  - Verify scrubbing backward clears later inventory/stat/telemetry state.
  - Verify floor navigation updates sequence to derived floor endpoints.
  - Verify **Return to Live** restores latest projected state.
  - Verify live interactions append endpoint events without altering earlier sequences.
  - Smoke-test GitHub Pages static bundle and mobile viewport layouts.
- [ ] Add Dependabot configuration, GitHub code scanning, `.editorconfig`, issue templates, and PR template.
- [ ] Add clear non-commercial fan-project disclaimer prior to wider public promotion.
