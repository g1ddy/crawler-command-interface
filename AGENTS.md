# AGENTS.md — Repository Operating Guide

This file is a concise map for coding agents. Detailed contracts live in the canonical documentation.

## Documentation index

- [README.md](README.md) — introduction, deployment summary, quick start.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — local setup, scripts, build targets, verification.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — application/shell/feature/host boundaries and dependency direction.
- [docs/COMPLEXITY.md](docs/COMPLEXITY.md) — generated Maritime architecture/complexity evidence.
- [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) — canonical source-honest product screenshots.
- [docs/ROADMAP.md](docs/ROADMAP.md) — active product backlog and intentional deferrals.
- [RAW_OBSERVATIONS.md](RAW_OBSERVATIONS.md) — authoritative raw evidence authoring/projection rules.
- [docs/FLOORS_1_2_CANON_READINESS.md](docs/FLOORS_1_2_CANON_READINESS.md) — readiness ledger for conditional canon domains.

## Durable invariants

1. **Deterministic replay** — selecting a sequence reconstructs the same historical state.
2. **Immutable history** — user actions never rewrite an earlier sequence; current generic mutation plumbing is transitional and #143 owns typed commands.
3. **Authoritative raw evidence** — story evidence is authored under `data/raw/`; generated floor/timeline files are regenerated rather than hand-edited.
4. **Source honesty** — missing state remains unknown/unavailable. Do not invent fallback clocks, timestamps, stats, roster details, or other plausible values.
5. **Capability-driven navigation** — modeled domains appear in root navigation only after projected state provides useful supported behavior.
6. **No symmetry-only features** — Magic is modeled but intentionally has no feature/navigation surface yet.
7. **Thin host adapters** — ChatGPT/Vinext and Pages share one browser application. Host-specific identity/runtime behavior stays at host boundaries.
8. **Shared runtime portability** — Worker-reachable shared code must not execute Node-only APIs, Ajv code generation, `eval`, or `new Function` during import/render.
9. **Generated evidence** — Maritime and canonical screenshots are generated artifacts; do not hand-edit them.
10. **Canonical screenshot truthfulness** — synthetic Playwright scenarios may test behavior, but only real supported application/story states are published as canonical screenshots.

## Repository map

| Concern | Primary location |
| --- | --- |
| Application composition/state root | `src/CrawlerApp.tsx` |
| Root navigation model/capabilities | `src/shell/navigation/` |
| Persistent HUD | `src/shell/hud/` |
| Persistent replay controls | `src/shell/replay/` |
| Timeline diagnostics/history/evidence | `src/features/timeline/` |
| Floor rules/context | `src/features/floor/` |
| Crawler stats/health | `src/features/crawler/` |
| Inventory/items/equipment/provenance | `src/features/inventory/` |
| Feature rendering composition | `src/shell/ActiveFeatureView.tsx` |
| Secondary import/export/reset tools | `src/shell/tools/` |
| Generic UI primitives | `src/shared/ui/` |
| Shared application styles | `src/styles/application.css` |
| ChatGPT/Vinext entry point | `app/page.tsx`, `app/layout.tsx` |
| ChatGPT identity helpers | `app/chatgpt-auth.ts` |
| GitHub Pages entry point | `src/main.pages.tsx`, `vite.pages.config.ts` |
| Domain/projection/types/schemas | `app/domain/` |
| Raw evidence | `data/raw/` |
| Generated runtime timeline | `data/compiled-timeline.json` |
| Screenshot browser spec | `tests/screenshots/crawler-views.spec.ts` |
| Canonical screenshot manifest | `tests/screenshots/canonical-screenshots.ts` |

## Dependency direction

```text
authored/raw data
    ↓
domain / compiled timeline
    ↓
projection
    ↓
feature presentation + UI
    ↓
shell / application composition
    ↓
host adapter
```

Keep `src/shared/` generic, features below shell, and host-specific assets outside the shared browser core. Do not create feature-to-shell imports or domain-to-React imports. #144 owns durable machine enforcement after the structure stabilizes.

## Verification

During iteration:

```bash
npm run generate:fixture
npm run test:unit
npm run build:live
npm run build:pages
```

For documented UI changes:

```bash
npm run test:screenshots
```

Before review/merge:

```bash
npm run verify
```

Generated screenshot and Maritime workflows are read-only verification/promotion paths. Use their generated artifacts for review; never edit generated visual/architecture evidence manually.
