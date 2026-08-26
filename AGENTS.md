# AGENTS.md — Repository Operating Guide

This document is a concise repository map and operating guide for coding agents working in this codebase.

## Documentation Index

Refer to the canonical documentation for detailed guidance:

- [README.md](README.md) — Concise user-facing introduction, deployment summary, and quick start.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Local setup (`npm run install:ci`), diagnostic scripts, build targets (`build:live`, `build:pages`), fixture generation, and contribution rules.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Shared browser core (`src/CrawlerApp.tsx`), deployment adapters (`app/page.tsx` and `src/main.pages.tsx`), data flow, and Worker-safe boundaries.
- [docs/ROADMAP.md](docs/ROADMAP.md) — Authoritative active product backlog, deferred work, and architectural constraints.
- [RAW_OBSERVATIONS.md](RAW_OBSERVATIONS.md) — Authoritative raw evidence authoring rules, JSON schemas, countdown lifecycle breaks, scrubbing, and projection semantics.

## Durable Invariants

Always preserve the following invariants:

1. **Deterministic Point-in-Time Replay**: The HUD is a deterministic point-in-time replay, not a mutable game simulation. Selecting a sequence must reconstruct the exact same HUD state without mutating historical sequence states.
2. **Authoritative Raw Evidence**: Story evidence is authored only in `data/raw/floors/`. Derived floor documents, compiled timelines, and Worker-safe fixtures (`app/domain/fixtures/compiled-timeline.ts`) are generated (`npm run generate:fixture`) rather than hand-edited.
3. **Worker-Safe Import Boundary**: Runtime imports along the application path (`app/page.tsx`, `src/CrawlerApp.tsx`) must not trigger AJV schema compilation or other Node-only dynamic code generation (`eval`/`new Function`) in the Worker/browser runtime.
4. **No Evidence Fallback Leakage**: Missing or partial observations must not be inferred from unrelated evidence or silently replaced with later live state. Preserve partial readings as authored.
5. **Dual Deployment Adapter Compatibility**: Both deployment adapters (ChatGPT Sites/Vinext Worker and GitHub Pages) continue to use the identical browser-first shared core.

## Repository Map

| Concern | Primary Location |
| --- | --- |
| Shared HUD Application | `src/CrawlerApp.tsx` |
| Timeline Scrubber & Replay Controls | `app/components/TimelineScrubber.tsx` |
| ChatGPT Sites / Vinext Entry Point | `app/page.tsx` |
| GitHub Pages Static Entry Point | `src/main.pages.tsx`, `index.html`, `vite.pages.config.ts` |
| Event State Projection | `app/domain/projection.ts` |
| Observation Telemetry Projection | `app/domain/observations.ts` |
| Countdown Engine | `app/domain/countdowns.ts` |
| Domain Schemas & Types | `app/domain/schema/`, `app/domain/types.ts` |
| Compiler & Raw Adapter | `app/domain/raw-compiler.ts`, `app/domain/compiler.ts` |
| Runtime Fixture | `app/domain/fixtures/compiled-timeline.ts` |
| Fixture Sync Script | `scripts/sync-derived-fixtures.mjs` |

## Narrow Verification Commands

When iterating on changes:

```bash
# Sync runtime fixture
npm run generate:fixture

# Run unit tests
npm run test:unit

# Build ChatGPT Worker bundle
npm run build:live

# Build GitHub Pages static bundle
npm run build:pages
```

Before requesting review or submitting code, execute the full verification suite:

```bash
npm run verify
```

`npm run verify` runs fixture generation, linting, unit tests, both deployment builds, rendered preview tests, and artifact contract checks.
