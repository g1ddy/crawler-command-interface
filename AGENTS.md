# AGENTS.md — Crawler Command Interface

## Purpose

This repository is a replayable Dungeon Crawler Carl HUD. It presents a single
browser React application through two adapters:

- ChatGPT Sites/Vinext / Cloudflare Worker
- static GitHub Pages

The UI is a point-in-time replay, not a mutable game simulation. Selecting a
sequence must reproduce the same HUD state every time.

## Start here

- [README.md](README.md) — architecture, local development, deployment targets,
  and the complete verification path.
- [RAW_OBSERVATIONS.md](RAW_OBSERVATIONS.md) — authoritative authoring,
  evidence, countdown, scrubbing, and projection semantics.
- [TODO.md](TODO.md) — current product backlog and intentionally deferred work.
- [CI workflow](.github/workflows/ci.yml) — the exact required CI commands.
- [Raw Floor 1](data/raw/floors/floor-1.json) and
  [Raw Floor 2](data/raw/floors/floor-2.json) — current source-of-truth story
  fixtures.

## Runtime map

| Concern | Primary locations |
| --- | --- |
| Shared HUD | `src/CrawlerApp.tsx` |
| Replay controls and countdown details | `app/components/TimelineScrubber.tsx` |
| ChatGPT Sites adapter | `app/page.tsx` |
| GitHub Pages adapter | `src/main.pages.tsx`, `index.html`, `vite.pages.config.ts` |
| Event-state projection | `app/domain/projection.ts` |
| Observation projection | `app/domain/observations.ts` |
| Countdown interpolation/extrapolation | `app/domain/countdowns.ts` |
| Domain types and schemas | `app/domain/types.ts`, `app/domain/schema/` |
| Raw-to-runtime compilation | `app/domain/raw-compiler.ts`, `app/domain/compiler.ts` |
| Checked-in Worker-safe runtime fixture | `app/domain/fixtures/compiled-timeline.ts` |
| Fixture generation | `scripts/sync-derived-fixtures.mjs` |

## Data and projection rules

1. Author story evidence in `data/raw/floors/`; do not edit derived
   `data/floors/`, `data/compiled-timeline.json`, or the runtime fixture by
   hand. Run `npm run generate:fixture`.
2. Events are causal state transitions. Observations are sourced readings.
   Preserve partial/unknown data; never fill missing fields just to satisfy a
   widget.
3. Projection is derived in memory for the selected replay sequence. Do not
   persist per-sequence HUD state.
4. Countdown values are exact at a sourced reference, estimated between
   compatible anchors, and may extrapolate after a compatible final pair.
   Never cross a lifecycle phase break for that countdown. See the countdown
   section in [RAW_OBSERVATIONS.md](RAW_OBSERVATIONS.md).
5. The checked-in runtime fixture avoids AJV schema compilation during Worker
   imports. Keep runtime imports on that fixture path; validation and
   compilation belong in tooling/tests.

## Change workflow

- For UI work, confirm the value is projected at the replay sequence before
  adding a fallback to current/live state.
- For a new event or observation kind, update the schema, TypeScript types,
  compiler, validation, projection (when it has a defined state effect), and
  focused regression tests together.
- Keep the two deployment adapters working. Avoid Node-only APIs in browser or
  Worker import paths.
- Treat generated build directories and `.sites-runtime/` as disposable.

## Verification

Use the narrowest relevant command while iterating:

```bash
npm run generate:fixture
npm run test:unit
npm run build:live
npm run build:pages
```

Before requesting review, run:

```bash
npm run verify
```

`npm run verify` regenerates fixtures, lints, runs the explicit unit-test
suite, builds both adapters, and verifies the output contracts. The supported
minimum is Node 22.13, so direct TypeScript tests use
`--experimental-strip-types`.

## Common pitfalls

- Do not run runtime AJV compilation from `app/page.tsx` or the fixture import
  chain; Workers prohibit the code generation it relies on.
- Do not let a replayed HUD field silently use a later live value.
- Do not infer inventory presence, quantity, equipment, or telemetry from an
  unrelated partial observation.
- Do not encode business semantics in narrative summary text; use structured
  event fields.
