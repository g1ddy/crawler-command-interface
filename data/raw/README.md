# Raw floor authoring

`data/raw/floors` is the authoritative Phase 1 source for the checked-in Floor 1 and Floor 2 timeline fixture.

Raw documents preserve sourced events and record point-in-time HUD facts as observations linked to stable `eventId` values. An event records a documented state transition; an observation records what the HUD shows without inventing a cause.

Supported observation kinds are `countdown-remaining`, `crawler-condition`, `crawler-attributes`, `xp-progress`, `broadcast-metrics`, `inventory-state`, and `equipment-state`. Only countdown observations are converted into the current `crawler-floor/v2` compatibility shape; the remaining raw observations are retained for the future observation projection layer.

The files in `data/floors` are retained only as frozen legacy compatibility baselines for the adapter-equivalence tests. Do not independently update both representations. New source edits belong in `data/raw/floors`.

Phase 2 will add further raw observation kinds and a derived UI projection model.
