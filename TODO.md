# Crawler Command Interface — Future Implementation Ideas

This roadmap is intentionally ordered around making the interface a believable, replayable crawler record before expanding the simulation.

## Operating constraints

- [ ] Treat the **browser as the primary runtime**: the core HUD, timeline scrubber, event projection, and read-only replay must work with no server, API, account, or Cloudflare binding.
- [ ] Keep all core domain rules deterministic and portable so the same event fixture produces the same state in GitHub Pages, the ChatGPT live app, and local development.
- [ ] Use browser storage (IndexedDB) only for optional device-local saves and preferences; retain JSON import/export so a timeline can be moved between browsers.
- [ ] Treat a future API as an optional persistence and collaboration adapter, never as a requirement for viewing or replaying crawler history.
- [ ] Make GitHub `main` the authoritative human-edited source; every deployment must identify the exact source commit it was built from.

## 1. Historical state and the timeline scrubber

- [ ] Add a persistent **Live / Replay** control beside the level-collapse timer.
- [ ] Let users scrub by event sequence, with readable in-world time and event markers for loot, combat, skills, quests, and level-ups.
- [ ] Make replay read-only and show a clear `HISTORICAL VIEW` label plus a **Return to Live** action.
- [ ] Update Crawler, Inventory, Skills, Journal, and Broadcast from the same selected point in time.
- [ ] Add event-card previews on marker hover/tap and direct links from a Journal event to the relevant item, skill, or quest.
- [ ] Load seeded timeline fixtures and snapshots in the browser so the complete replay experience runs from a static GitHub Pages deployment.

## 2. Event-sourced crawler data

- [ ] Create an append-only `crawler_events` model with an authoritative `sequence`, `occurred_at`, `recorded_at`, `causation_id`, and `correlation_id`.
- [ ] Define initial event types: `ItemAcquired`, `ItemQuantityChanged`, `ItemEquipped`, `ItemUnequipped`, `ItemConsumed`, `ItemDiscarded`, `AttributeModified`, `EffectApplied`, `EffectExpired`, `SkillGranted`, `XpAwarded`, `QuestUpdated`, and `AchievementUnlocked`.
- [ ] Build a deterministic projection function: `applyEvent(state, event) => nextState`.
- [ ] Store periodic snapshots so a scrubber jump replays only events after the nearest snapshot.
- [ ] Add a “Why this value?” inspector that breaks a stat into base value, gear, permanent modifiers, and active effects.
- [ ] Keep the projection engine free of browser UI and server dependencies so it can be unit-tested and later reused by an optional .NET API.

## 3. Inventory, gear, and provenance

- [ ] Give each non-stackable item a stable `itemInstanceId`; retain its acquisition source, modification history, durability, and final disposition.
- [ ] Track stack quantities with explicit quantity-change events instead of overwriting a total.
- [ ] Make equipment candidates slot-aware and show compatibility, stat deltas, durability, requirements, and item provenance.
- [ ] Make **Use**, **Equip**, **Unequip**, **Lock**, **Repair**, and **Drop** write state-changing events.
- [ ] Show an item’s personal timeline: acquired → equipped → repaired/upgraded → consumed/discarded.

## 4. Interaction polish

- [ ] Implement real attribute assignment: choose an attribute, validate available points, emit an event, and update the derived stat.
- [ ] Connect “Manage in Inventory” to the Equipment view and preselect the relevant body slot.
- [ ] Add item search, sorting, filters with real counts, keyboard navigation, and a stable inspector selection.
- [ ] Add tooltips and descriptive labels for icon-only controls.
- [ ] Design a responsive layout: compact persistent HUD, drawer navigation, and a bottom-sheet inspector on mobile.

## 5. Application architecture

- [ ] Split `app/page.tsx` into shared domain components for crawler, inventory, equipment, skills, journal, timeline, and UI primitives.
- [ ] Move static arrays to typed item, skill, effect, quest, and event definitions with stable IDs.
- [ ] Introduce a client-side state store behind a repository interface; seed it with a realistic Floor 6 event stream.
- [ ] Start with local persistence (IndexedDB); add a .NET API with PostgreSQL only when durable multi-device history, collaboration, or authoritative event ingestion is needed.
- [ ] Add import/export of a crawler timeline as JSON for fixture data and sharing.

## 6. Dual build and deployment targets

- [ ] Keep one shared browser application under `src/` (UI, event projection, fixtures, and styles) with no host-specific imports.
- [x] Keep `app/page.tsx` as the thin ChatGPT Sites/Vinext entry point that renders the shared app and preserves the current live-app build.
- [x] Add a standalone static entry point such as `src/main.pages.tsx` plus `vite.pages.config.ts` for GitHub Pages.
- [x] Add `npm run build:live` for the existing Worker-compatible ChatGPT build and `npm run build:pages` for the static GitHub Pages bundle.
- [x] Configure the Pages build base path for `/crawler-command-interface/` so routes and static assets work on the project Pages URL.
- [ ] Ensure client-side routing has a static fallback strategy before adding multiple standalone routes.
- [x] Add a single verification command that lint-checks and builds both targets from the same commit.
- [x] Use GitHub Actions to verify both builds on pull requests and deploy the static `build:pages` output from `main` through GitHub Pages Actions—not a generated `gh-pages` branch.
- [ ] Keep the ChatGPT live-app deployment as a second release target built from the same reviewed `main` commit; record the deployed commit SHA in release notes or deployment metadata.
- [ ] Keep Pages and the live app free of production-only configuration differences unless a capability truly requires it; document any intentional difference in the README.

## 7. Quality, delivery, and collaboration

- [ ] Replace the starter README with project purpose, screenshots, local setup, architecture, and deployment instructions.
- [ ] Add unit tests for event projection, stat calculations, inventory operations, and historical replay.
- [ ] Add Playwright end-to-end coverage for navigation, equipment changes, and timeline scrubbing.
- [ ] Add GitHub Actions to run install, lint, test, and production build on pull requests.
- [ ] Enable Dependabot and code scanning; add `.editorconfig`, issue templates, and a pull-request template.
- [ ] Add a non-commercial fan-project disclaimer before making the project publicly visible.

## Suggested first vertical slice

- [ ] Seed one floor with 50–100 events.
- [ ] Add the timeline scrubber and a projection engine.
- [ ] Make Inventory show the exact items owned at the selected event.
- [ ] Make Equipment and the Crawler stat panel update from that same projection.
- [ ] Add one provenance drawer for a selected gear item.
