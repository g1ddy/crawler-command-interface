# Crawler Command Interface — Future Implementation Ideas

This roadmap is intentionally ordered around making the interface a believable, replayable crawler record before expanding the simulation.

## 1. Historical state and the timeline scrubber

- [ ] Add a persistent **Live / Replay** control beside the level-collapse timer.
- [ ] Let users scrub by event sequence, with readable in-world time and event markers for loot, combat, skills, quests, and level-ups.
- [ ] Make replay read-only and show a clear `HISTORICAL VIEW` label plus a **Return to Live** action.
- [ ] Update Crawler, Inventory, Skills, Journal, and Broadcast from the same selected point in time.
- [ ] Add event-card previews on marker hover/tap and direct links from a Journal event to the relevant item, skill, or quest.

## 2. Event-sourced crawler data

- [ ] Create an append-only `crawler_events` model with an authoritative `sequence`, `occurred_at`, `recorded_at`, `causation_id`, and `correlation_id`.
- [ ] Define initial event types: `ItemAcquired`, `ItemQuantityChanged`, `ItemEquipped`, `ItemUnequipped`, `ItemConsumed`, `ItemDiscarded`, `AttributeModified`, `EffectApplied`, `EffectExpired`, `SkillGranted`, `XpAwarded`, `QuestUpdated`, and `AchievementUnlocked`.
- [ ] Build a deterministic projection function: `applyEvent(state, event) => nextState`.
- [ ] Store periodic snapshots so a scrubber jump replays only events after the nearest snapshot.
- [ ] Add a “Why this value?” inspector that breaks a stat into base value, gear, permanent modifiers, and active effects.

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

- [ ] Split `app/page.tsx` into domain components for crawler, inventory, equipment, skills, journal, timeline, and shared UI primitives.
- [ ] Move static arrays to typed item, skill, effect, quest, and event definitions with stable IDs.
- [ ] Introduce a client-side state store behind a repository interface; seed it with a realistic Floor 6 event stream.
- [ ] Start with local persistence (IndexedDB) and later use a .NET API with PostgreSQL for durable multi-session history.
- [ ] Add import/export of a crawler timeline as JSON for fixture data and sharing.

## 6. Quality, delivery, and collaboration

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
