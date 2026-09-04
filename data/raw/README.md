# Raw floor authoring

`data/raw/` is the authoritative Phase 1 source for the checked-in Floor 1 and Floor 2 timeline fixture.

Raw authoring data is decomposed into concern-specific files under `data/raw/catalogs/` (shared item and achievement definitions, with reserved placeholder files `crawlers.json`, `skills.json`, `spells.json`) and `data/raw/floors/floor-*/` (`floor.json`, `catalog.json`, `events.json`, `observations.json`, `countdowns.json`, `sources.json`). Each floor's required `catalog.json` declares floor-local item and achievement membership by ID. `app/domain/raw-loader.ts` resolves those IDs against the shared definitions and assembles the established `RawCrawlerFloorDocument` contract.

Raw documents preserve sourced events and record point-in-time HUD facts as observations linked to stable `eventId` values. An event records a documented state transition; an observation records what the HUD shows without inventing a cause.

Supported observation kinds are `countdown-remaining`, `crawler-condition`, `crawler-attributes`, `xp-progress`, `broadcast-metrics`, `inventory-state`, and `equipment-state`. Only countdown observations are converted into the current `crawler-floor/v2` compatibility shape; the remaining raw observations are retained for the future observation projection layer.

The files in `data/floors/` and `data/compiled-timeline.json` are generated compatibility/runtime outputs. Do not hand-edit or maintain them as a second source of truth. During this storage migration, `tests/unit/raw-storage-baseline.test.mjs` pins the generated Floor 1 and Floor 2 compatibility files to their pre-refactor Git blob identities so `npm run generate:fixture` cannot silently redefine the migration baseline before the equivalence tests run. New source edits belong in `data/raw/`.
