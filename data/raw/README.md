# Raw floor authoring

`data/raw/` is the authoritative Phase 1 source for the checked-in Floor 1 and Floor 2 timeline fixture.

Raw authoring data is decomposed into concern-specific files under `data/raw/catalogs/` (shared crawlers, items, achievements, skills, spells) and `data/raw/floors/floor-*/` (`floor.json`, `events.json`, `observations.json`, `countdowns.json`, `sources.json`). `app/domain/raw-loader.ts` assembles these files into domain raw floor documents (`RawCrawlerFloorDocument`).

Raw documents preserve sourced events and record point-in-time HUD facts as observations linked to stable `eventId` values. An event records a documented state transition; an observation records what the HUD shows without inventing a cause.

Supported observation kinds are `countdown-remaining`, `crawler-condition`, `crawler-attributes`, `xp-progress`, `broadcast-metrics`, `inventory-state`, and `equipment-state`. Only countdown observations are converted into the current `crawler-floor/v2` compatibility shape; the remaining raw observations are retained for the future observation projection layer.

The files in `data/floors` are retained only as frozen legacy compatibility baselines for the adapter-equivalence tests. Do not independently update both representations. New source edits belong in `data/raw/`.
