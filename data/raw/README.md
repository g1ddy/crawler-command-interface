# Raw floor authoring

`data/raw/floors` is the authoritative Phase 1 source for the checked-in Floor 1 and Floor 2 timeline fixture.

Raw documents preserve sourced events and record countdown facts as observations linked to stable `eventId` values. `app/domain/raw-adapter.ts` converts them into the current `crawler-floor/v2` compatibility shape, so the interface and runtime timeline contract remain unchanged.

The files in `data/floors` are retained only as frozen legacy compatibility baselines for the adapter-equivalence tests. Do not independently update both representations. New source edits belong in `data/raw/floors`.

Phase 2 will add further raw observation kinds and a derived UI projection model.
