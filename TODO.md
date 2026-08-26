# Crawler Command Interface — Current Roadmap

This document tracks the remaining product and delivery work. Completed work stays
here when it explains an architectural decision; superseded ideas are retained with
the implementation that replaced them.

## Operating constraints

- [x] Treat the **browser as the primary runtime**: the core HUD, timeline
  scrubber, event projection, and read-only historical replay run without a
  server, account, API, or Cloudflare binding.
- [x] Keep core domain rules deterministic and portable so the same fixture
  projects the same state in GitHub Pages, the ChatGPT live app, and local
  development.
- [x] Keep device-local saves optional and retain validated JSON import/export
  for moving a timeline between browsers.
  - [x] A validated `localStorage` adapter, an in-memory adapter for tests, and
    an optional remote adapter exist.
  - [ ] Move to IndexedDB only if timeline size, multiple saved timelines, or
    offline-query needs make `localStorage` inadequate.
- [x] Treat any future API as an optional persistence/collaboration adapter,
  never as a requirement for replaying crawler history.
- [x] Make GitHub `main` the authoritative source and verify both deployment
  artifacts from the same checkout with build provenance.

## 1. Historical state and timeline replay

- [x] Add persistent **Live / Replay** controls, readable selected time, event
  markers, floor navigation, and a **Return to Live** action.
- [x] Reproject Crawler, Inventory, Skills, Journal, Broadcast telemetry, and
  persistent HUD chrome from the same selected sequence.
- [x] Show a clear `HISTORICAL VIEW` state and prevent a replayed HUD from
  silently falling back to later live data.
- [x] Add event/observation marker previews, sequence diagnostics, telemetry
  provenance, and inventory/journal navigation back to a source sequence.
- [x] Load checked-in seeded fixtures in the browser for static Pages replay.
- [ ] Add direct links from a Journal entry to its related item, skill, quest,
  achievement, or entitlement where that entity has a dedicated inspector.

### Superseded replay rule

- [x] **“Make replay read-only” is superseded.** Historical sequences remain
  immutable, but users may initiate an interaction while viewing replay. The
  action appends a new event at the live endpoint and returns the UI to Live;
  it never rewrites the selected historical state.

## 2. Event-sourced crawler data

- [x] Define and validate a richer append-only event model, including inventory,
  attributes, conditions, XP, skills, quests, effects, broadcast, entitlements,
  and countdown lifecycle transitions.
- [x] Compile raw floor-local ordering into a deterministic global `sequence`
  and preserve available correlation/causation and evidence metadata.
- [x] Build deterministic `projectState`, observation projection, and
  countdown projection functions that are independent of the UI and server.
- [x] Add a stat “Why this value?” inspector showing base, gear, permanent
  modifiers, and active effects.
- [x] Keep runtime fixture imports Worker-safe by compiling and validating raw
  data in tooling rather than during Worker import.
- [ ] Decide when periodic snapshots are warranted for larger timelines.
  - [x] The timeline contract and projector already support snapshots.
  - [ ] Add snapshot generation, invalidation, and replay-performance tests only
    when measurement shows replaying the full event stream is no longer cheap.
- [ ] Define a provenance policy for `occurred_at`, `recorded_at`,
  `causation_id`, and `correlation_id` when the authoring sources can
  establish them consistently. Do not invent these values merely to fill fields.
- [ ] Support globally chronological ordering for overlapping floor transitions.
  - Floor-local `order` values are currently compiled as contiguous floor
    segments, so a source-backed event that occurs after entry to the next
    floor cannot yet be placed in its true global position.
  - Establish a sourced cross-floor ordering field and compiler interleaving
    rules before restoring zero-time Floor 1 collapse anchors or similar
    overlapping-transition events.

## 3. Inventory, gear, and provenance

- [x] Give non-stackable items stable instance IDs and preserve acquisition,
  modification, durability, quantity, and disposition history.
- [x] Model stack quantity as explicit changes rather than overwriting totals.
- [x] Make equipment slot-aware and show compatibility, requirements, stat
  deltas, durability, provenance, and sourced equipment observations.
- [x] Make **Use**, **Equip**, **Unequip**, **Lock**, **Repair**, and **Drop**
  append state-changing events, including a live-state requirement check.
- [x] Show an item’s personal event timeline and source-backed inventory state.

## 4. Interaction polish

- [x] Implement attribute assignment with validation and derived-stat updates.
- [x] Connect **Manage in Inventory** to the equipment view and selected slot.
- [x] Add inventory search, sorting, filters/counts, keyboard navigation,
  selection stability, labels/tooltips, responsive mobile layout, and a
  bottom-sheet inspector.
- [ ] Add drag-and-drop reordering for skill hotlist slots on desktop.
- [ ] Add Playwright browser E2E coverage for keyboard shortcuts, mobile
  bottom-sheet behavior, and the replay contract.

## 5. Application architecture

- [x] Keep one shared browser React application with deliberately thin Sites
  and GitHub Pages adapters.
- [x] Move storyline data into typed raw floor documents, catalogs, schemas, a
  compiler, and a checked-in runtime fixture rather than static UI arrays.
- [x] Provide local persistence adapters and validated timeline JSON
  import/export.
- [x] Seed a realistic, sourced replay with Floors 1–2.

### Superseded implementation target

- [x] **“Seed a realistic Floor 6 event stream” is superseded.** A contiguous,
  evidence-backed Floors 1–2 replay is a better first vertical slice than
  skipping directly to Floor 6.
- [ ] Split orchestration currently concentrated in `src/CrawlerApp.tsx` into
  focused view/state modules when a concrete change is made safer by doing so.
  Do not refactor solely to introduce a state library; preserve the existing
  deterministic projection boundary.

## 6. Dual build and deployment targets

- [x] Keep a shared browser app with no host-specific imports in its domain/UI
  path.
- [x] Keep a thin ChatGPT Sites/Vinext entry point and a standalone static
  GitHub Pages entry point.
- [x] Build and verify both targets, including the Pages project-path and custom
  domain base paths, from the same commit.
- [x] Deploy `dist-pages/` from `main` with GitHub Pages Actions rather than
  a generated `gh-pages` branch.
- [x] Document the intentional differences and shared deployment contract in
  the README.
- [x] **Static fallback before multiple routes is conditional, not currently
  applicable.** The UI has no client-side routes; add a Pages fallback before
  introducing history-based routes.
- [ ] Record the reviewed `main` SHA when a ChatGPT live-app release is
  performed, or automate that release metadata if the live deployment process
  becomes repository-controlled.

## 7. Quality, delivery, and collaboration

- [x] Replace the starter README with project purpose, local setup, architecture,
  raw-data/replay documentation, and deployment instructions.
- [x] Add focused unit coverage for projection, observation telemetry,
  inventory/requirements, persistence, floors, countdowns, validation safety,
  and rendered/artifact contracts.
- [x] Run lint, unit tests, both production builds, artifact checks, and Pages
  deployment verification in GitHub Actions.
- [x] Add a repository guide for coding agents with the authoritative documents,
  runtime map, and Worker-safety constraints.
- [ ] Add Playwright E2E tests as the next quality milestone.
  - [ ] Scrub to a pre-change sequence and prove later inventory/stat/telemetry
    is absent.
  - [ ] Verify floor selection uses the derived floor endpoint.
  - [ ] Verify **Return to Live** restores the latest projection.
  - [ ] Verify a live interaction appends a new endpoint event without altering
    an earlier sequence.
  - [ ] Smoke-test the same flow for the Pages build and a mobile viewport.
- [ ] Add Dependabot, code scanning, `.editorconfig`, issue templates, and a
  pull-request template.
- [ ] Add a clear non-commercial fan-project disclaimer before wider public
  promotion.

## Next candidate: protect the replay contract in a browser

The next cohesive effort is Playwright E2E coverage. The domain and artifact
tests already establish the individual rules; browser tests should protect their
visible integration before more data, interaction polish, or refactoring is
added.
