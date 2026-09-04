# Raw Observation Authoring Guide

The files under `data/raw/` are the source-of-truth authoring format for sourced Dungeon Crawler Carl observations. Story evidence is decomposed into concern-specific files under `data/raw/catalogs/` and `data/raw/floors/floor-*/`. They are intentionally more expressive than the current UI. The loader assembles these files into domain raw floor documents (`RawCrawlerFloorDocument`), the compiler turns them into the runtime timeline, and projection applies supported events to the point-in-time HUD state.

Use this guide when adding or correcting storyline data. The goal is to record what a source actually establishes without inventing a complete snapshot around a partial observation.

## Authoring pipeline

Keep the layers distinct:

1. **Decomposed raw source** — `data/raw/catalogs/` and `data/raw/floors/floor-*/`; concern-specific authored files (events, observations, countdowns, sources, floor-local catalog membership, and shared catalog definitions).
2. **Raw floor loader** — `app/domain/raw-loader.ts`; assembles decomposed authored files into the established `RawCrawlerFloorDocument` domain input contract by resolving catalog IDs against shared catalog definitions.
3. **Raw schema** — `app/domain/schema/crawler-floor-raw.schema.json`; what authors may record.
4. **Compiler / compatibility representation** — `app/domain/raw-compiler.ts` and the floor/timeline schemas; preserves structured observations for runtime use.
5. **Projection** — `app/domain/projection.ts`; applies event types that have a defined HUD-state effect.
6. **UI** — renders the projected state. A raw observation may be valid and preserved before every field has a dedicated widget.

Do not reshape source data merely to fit the current UI. Prefer preserving a structured observation and adding projection/UI support deliberately later.

## Decomposed Directory Structure

Raw authoring data is organized cleanly by concern under `data/raw/`:

```
data/raw/
├── catalogs/
│   ├── crawlers.json
│   ├── items.json
│   ├── achievements.json
│   ├── skills.json
│   └── spells.json
└── floors/
    ├── floor-1/
    │   ├── floor.json
    │   ├── catalog.json
    │   ├── events.json
    │   ├── observations.json
    │   ├── countdowns.json
    │   └── sources.json
    └── floor-2/
        ├── floor.json
        ├── catalog.json
        ├── events.json
        ├── observations.json
        ├── countdowns.json
        ├── sources.json
        └── claim-ledger.md
```

### File Ownership Rules

- **`events.json`**: Answers what happened and when. Its array order remains the single authoritative authored chronological event ledger for that floor. Do not create parallel per-domain or per-view event files (such as `party-events.json` or `spell-events.json`) that duplicate historical facts.
- **`observations.json`**: Answers what was measured or read at a point in time, referencing stable event IDs (`eventId`).
- **`countdowns.json`**: Owns countdown definitions for that floor. Point-in-time countdown readings remain in `observations.json`.
- **`sources.json`**: Owns source metadata and provenance definitions for that floor.
- **`floor.json`**: Contains floor metadata (`ordinal`, `title`, `book`, `continuity`, `coverage`).
- **`catalog.json`**: Declares floor-local item and achievement membership by ID (`items: string[]`, `achievements: string[]`).
- **`catalogs/`**: Contains shared static catalog definitions (`items.json`, `achievements.json`, with reserved files `crawlers.json`, `skills.json`, `spells.json`) referenced across floors.

## Scrubbing and projected HUD state

The replay slider selects a timeline sequence; it does not mutate the authored story data. At that sequence, `projectState`, `projectObservations`, and `projectCountdownState` derive the HUD state in memory from the compiled event stream and sourced observations. Moving the slider backward recomputes the same point-in-time state, so a replay cannot accidentally retain a later item, stat, or telemetry value.

The repository stores three different things deliberately:

1. **Raw floor JSON** is the durable authored evidence record.
2. **Derived JSON and the checked-in runtime fixture** are compile outputs that make the same document available to the browser and Worker without running schema compilation during page import.
3. **Projected HUD state is not stored.** It is deterministic, sequence-scoped, and cheap to derive in memory. Persisting it would create stale snapshots and duplicate the event/observation interpretation rules.

Events are causal transitions: replay applies them to produce state. Raw observations are sourced readings: projection exposes only what their payload establishes and preserves their evidence. They are not promoted to causal events merely because a widget can display them.

Countdowns are the one visible numeric estimate. At an exact reference the HUD shows its stated value. Between compatible references it interpolates; past a compatible final pair it extrapolates and marks the value with `~`. Details and hover text expose the basis, confidence, and reference points. A lifecycle phase break (`CountdownReset`, `CountdownPaused`, `CountdownResumed`, or `CountdownPhaseChanged`) ends the prior countdown phase: a reading from before that boundary must not be carried into the new phase without a new source.


## Start from the source, not the desired HUD state

Record the smallest claim supported by the evidence.

If a source establishes that Carl gained 2 Strength, prefer an `AttributeModified` event with the observed delta rather than inventing a full attribute snapshot. If it establishes only current health, record current health rather than filling in an unsupported maximum. If a source says an item quantity changed, do not infer unrelated equipment or inventory changes.

Use snapshots only when the source actually supports a point-in-time collection of state. Events are preferable for isolated changes.

## Raw-data collection methodology

Collect claims before authoring JSON. Keep a short claim ledger for each floor that records the fact, its source, the exact locator, source tier, and whether it is an event, an observation, or both. Then author only the claims that the source directly supports. The current conditional-domain research ledger is [docs/FLOORS_1_2_CANON_READINESS.md](docs/FLOORS_1_2_CANON_READINESS.md); update it when new evidence changes a capability decision.

`Source-backed` means that a claim is traceable to evidence of sufficient quality and specificity for that claim. It does **not** require a directly accessible book citation.

Use sources in this order of preference:

1. **Primary** — published text, licensed audiobook, or an official preview. Use `trust: "primary"` and normally `confidence: "confirmed"` only when the cited passage or timestamp was actually inspected and establishes the payload.
2. **Corroborating** — maintained fan databases, wikis, reference sites, and substantive editorial sources. A reliable corroborating source may independently support a production claim when it states the fact explicitly, offers a reasonably stable locator, and the authored payload contains nothing beyond what that source establishes. Preserve `trust: "corroborating"` and normally `confidence: "corroborated"`; do not upgrade secondary evidence to primary or `confirmed` merely because it attributes the fact to the book.
3. **Candidate** — discussions, unverified lists, comments, and search snippets. Use these to identify material needing verification; do not normally use them as the sole basis for projected state or a precise causal transition.

For durable causal transitions, identity/relationship claims, or capability-enabling state, multiple independent corroborating sources are preferred when primary evidence is unavailable. Evidence requirements should scale with precision: an explicit qualitative fact such as a named party membership may be supportable from a reliable secondary reference, while exact numbers, timestamps, countdown values, causation, notification delivery, item quantities, or similarly precise claims require stronger evidence.

Never synthesize primary provenance. If the book, audiobook, or official preview was not directly verified, do not add a primary citation or `confirmed` confidence merely because a secondary source names a chapter or says the fact came from the book. Add the verified secondary evidence honestly and upgrade the provenance later if primary material becomes available.

For every accepted claim, capture the narrowest stable locator available: book and chapter for primary text, timestamp for audio, and a page/section heading or revision marker for community or editorial sources. If a source supports only a level change, author a level transition or `xp-progress` level anchor; do not infer numeric XP. If a source supports a single stat, item, or broadcast metric, preserve only that field rather than constructing a complete HUD snapshot.

When a corroborating source supplies a page-derived table, note the page in the locator's `section` text until the evidence schema gains a dedicated page field. Add the source once to the floor's `sources.json`, reuse its stable ID, and retain each claim's individual locator and confidence. Recheck community-sourced facts against a primary source when one becomes available, updating the evidence rather than silently changing the payload.

## Evidence is part of the observation

Every authored event should remain traceable to a declared source.

- Add the source to the floor's `sources.json` collection before referencing it.
- Use stable source IDs and reference them from `evidence`.
- Set confidence according to what the source establishes; do not upgrade inference or secondary provenance to confirmed fact.
- Keep `summary` human-readable, but never depend on summary text to drive domain behavior.
- When multiple sources corroborate an observation, preserve the useful evidence rather than collapsing provenance into prose.

A summary such as `The countdown resets` is descriptive text. The structured `type`, `countdownId`, and reset fields are the machine-readable fact.

## Position and ordering

The order of entries in the raw `events.json` array is the authoritative floor-local chronology. Raw events do not carry a duplicated numeric `order` field. The adapter derives floor-local `order` for compatibility output, and the compiler derives globally increasing `sequence` values for the runtime timeline. `position` separately records where the event belongs in the story.

- Keep event IDs stable once published; IDs are references, not display labels.
- Author floor event IDs as `evt-f<floor>-<semantic-event>[-<qualifier>...]`. Do not encode array position, generated order, or compiled sequence. Numbers are appropriate only when intrinsic to the fact (for example `episode-8`, `floor-3-descent`, or `crawlers-990303`).
- Author observation IDs in the `obs-...` namespace. Event identity describes what happened; observation identity describes what was measured about it.
- Reserve semantic namespaces for other stable authored identities as they are adopted: `src-`, `countdown-`, `item-`, `achievement-`, `inst-`, `skill-`, `spell-`, `party-`, `crawler-`, `effect-`, `quest-`, and `entitlement-`. The schema exposes reusable definitions for these prefixes so individual fields can migrate to them incrementally without duplicating regexes.
- Schema owns ID syntax. Domain/build validation checks relationships schema cannot express, such as matching the `evt-fN-` prefix to `floor.ordinal` and resolving referenced event IDs.
- Insert new events at the intended chronological position in the raw `events.json` array.
- Use the correct floor/book position and add more precise position data only when supported.
- Place lifecycle events between the observations they are intended to separate. Validation reasons about ordering, especially for countdown phases.
- Treat generated `order` and `sequence` as sanity checks on compilation, not facts authors maintain by hand.
- Do not reorder existing observations casually. A reorder can change projected point-in-time state even when no payload changes.

## Prefer explicit event types

Use the structured event type that represents the observation. `NarrativeEvent` is for narrative information that does not have a supported structured event, not as a generic escape hatch.

In particular, never encode behavior only in `summary`. Countdown resets, pauses, resumes, and phase changes must use their lifecycle event types. Inventory changes, hotlist changes, conditions, XP, quests, effects, attributes, and broadcast/social observations should likewise use their structured types when available.

When a needed fact cannot be represented without abusing another event type, extend the schema intentionally instead of hiding the fact in prose.

### Magic grants

Use `SpellGranted` only for a sourced spell acquisition. Its `spell` payload keeps
Magic separate from `SkillGranted` and records only a stable spell ID, name,
known owner, the explicit `abilityKind: "spell"` discriminator, and the named
acquisition source (`crawler-menu`, `loot-box`, `equipment`, or `dungeon-book`).
For an equipment grant, retain the known `itemInstanceId` so the relationship is
not flattened into an unexplained permanent spell. Do not add rank, cooldown, mana cost, duration, or mechanics
that the cited evidence does not establish. A spell grant projects into `spells`,
never `skills`; it does not imply party membership or a separate permanent
entitlement.

### Party formation

Use `PartyFormed` only when a source establishes a crawler roster, its name,
and the member roles being recorded. The current contract intentionally keeps
the payload small: stable party and crawler IDs, displayed names, and either
`leader` or `member`. It projects from that sequence onward and therefore must
be placed at the actual formation boundary, not at co-entry or the first
party-scoped achievement.

Do not add a crawler to Party because they travel together, share an
achievement, are mentioned in a social group, or are called part of a court or
team in ordinary narration. Pets, summons, and other bonded entities are not
crawler Party members unless the source explicitly establishes a crawler roster
membership. Do not infer levels, health, equipment, class, readiness, combat
role, or later join/leave events from a formation payload.

## Countdown observations

Countdowns have stable IDs. Every lifecycle event must identify the countdown it affects.

For `CountdownReset`, `CountdownPaused`, `CountdownResumed`, and `CountdownPhaseChanged`:

- always provide `countdownId`;
- reference an ID declared in the document's countdown catalog;
- use the ID of the countdown whose phase actually changed;
- include lifecycle-specific values such as `newRemainingSeconds` when the source establishes them;
- do not rely on phrases such as `countdown reset` or `countdown paused` in `summary`.

A lifecycle event for countdown A is **not** a phase break for countdown B. If references for B increase without a lifecycle event for B between them, validation should reject the sequence.

When constructing test fixtures, do not convert an unrelated event by spreading its entire payload and replacing `type`. Event schemas reject properties belonging to the original variant. Construct the replacement from shared event fields plus the fields belonging to the lifecycle event.

## Hotlist observations

`HotlistUpdated` must describe an actual update. Use one of these forms:

- `hotlist`: the observed complete replacement list; or
- `skillId` **and** `index`: an observed targeted slot update.

Do not emit a payload-free `HotlistUpdated`, `skillId` without `index`, or `index` without `skillId`. Both valid forms are intentionally allowed; a document is not invalid merely because it contains enough information to satisfy both forms.

## Inventory quantity, discard, and equipment state

Inventory observations must preserve identity and equipment consistency.

- Use the stable `itemInstanceId` for changes to an existing inventory instance.
- A partial `ItemDiscarded` reduces quantity but does not implicitly unequip the surviving instance.
- A discard that removes the full remaining quantity removes the instance and clears equipment references to it.
- An unquantified `ItemDiscarded` represents full removal under the current contract.
- Use `ItemUnequipped` when the source explicitly establishes an unequip independently of removal.
- Do not author a sequence that leaves the same projected instance simultaneously reported as equipped and absent from `equippedSlots`, or present in a slot after the instance has been removed.

The same general rule applies to quantity-changing events: do not infer unrelated state transitions merely because they would be convenient for the UI.

## Partial observations and unknown values

Absence of evidence is not evidence of a default value.

Prefer optional fields and partial events when only part of a state is known. Do not manufacture zeroes, maxima, timestamps, quantities, viewer counts, XP totals, attributes, or other values to make an event look complete.

Where the schema provides an explicit known/unknown quantity representation, use it rather than guessing an exact quantity.

## Adding a new observation type

Before introducing a new event type, confirm that an existing structured event cannot express the fact accurately. If a new type is necessary, update the full contract coherently:

1. raw floor schema;
2. floor compatibility schema where applicable;
3. runtime timeline schema;
4. TypeScript event/domain types;
5. compiler preservation/translation behavior;
6. domain validation for invariants that JSON Schema alone cannot express clearly;
7. projection only if the event has a defined derived-state effect;
8. regression tests for valid, malformed, and interaction cases.

Do not require a UI widget merely to preserve a sourced observation. Conversely, do not mutate derived HUD state unless the projection semantics are intentional and tested.

## Validation and tests

Run the repository verification path before merging raw-data changes:

```bash
npm run verify
```

For faster iteration on domain changes:

```bash
npm run test:unit
```

Any new unit-test file intended to protect production behavior must be placed under `tests/unit/` so `npm run test:unit` discovers it automatically.

Tests for invalid fixtures should assert the specific invariant/error being exercised. Avoid tests that merely assert `valid === false`, because an unrelated schema error can make such a test pass without reaching the intended domain validation.

For event-variant fixtures, keep them schema-valid except for the single condition under test. This is especially important for `additionalProperties: false` variants.

## Review checklist

Before submitting raw observations, verify:

- the observation says no more than its source establishes;
- every evidence reference resolves to a declared source;
- IDs are stable and references use the correct entity/countdown/item ID;
- event ordering and position are correct;
- a structured event type is used instead of behavior encoded in summary text;
- partial observations do not invent missing state;
- lifecycle events affect only their identified countdown;
- inventory changes cannot produce contradictory equipment state;
- accepted events have a meaningful payload and defined preservation/projection behavior;
- existing Floor 1/Floor 2 sources still validate and compile;
- new regression tests are reachable from `npm run test:unit`;
- `npm run verify` passes.

## Common failure modes

**Changing only `type` on an existing fixture.** The old variant's fields remain and can fail schema validation before the intended assertion. Build the new event from the common fields and the target variant's fields.

**Using prose as control data.** A summary containing `reset`, `paused`, or similar words does not create a lifecycle transition. Use the structured event.

**Using the wrong countdown ID.** A valid reset for one countdown cannot excuse an increase in another countdown.

**Creating no-op structured events.** If the event type promises a state change, supply the payload required to identify that change.

**Treating partial removal as full removal.** Quantity remaining on an equipped item means the instance still exists and remains equipped unless a separate observation says otherwise.

**Adding tests outside `tests/unit/`.** Always place new unit tests in `tests/unit/**/*.test.mjs` so they are automatically discovered by `npm run test:unit`.
