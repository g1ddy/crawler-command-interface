# Crawler Command Interface

A deterministic, replayable dungeon-crawler command interface with one browser React application and two deployment adapters:
- **ChatGPT Live App**: Hosted on Cloudflare Workers via [vinext](https://github.com/cloudflare/vinext).
- **Static Web App**: Hosted on GitHub Pages.

The interface presents a point-in-time state replay of dungeon crawler observations and evidence.

## Quick Start

### Prerequisites
- Node.js `>=22.13.0`
- Linux environment with `flock`, `curl`, and GNU `timeout`

### Installation & Local Development

```bash
# Initialize locked dependencies
npm run install:ci

# Start local dev server (ChatGPT live app adapter)
npm run dev
```

To preview the static GitHub Pages adapter locally:
```bash
npx vite --config vite.pages.config.ts
```

## Supported Deployment Targets

- **ChatGPT Live App Worker (`npm run build:live`)**: Produces the Cloudflare Worker bundle in `dist/`.
- **Static GitHub Pages (`npm run build:pages`)**: Produces the static client bundle in `dist-pages/`.

## Documentation Index

Each document in this repository serves as the single authoritative home for one concern:

- [AGENTS.md](AGENTS.md) — Concise agent operating guide, durable invariants, high-level repository map, and canonical verification entry points.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Stable responsibility/dependency boundaries, application composition root, host adapters, and data flow.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Contributor setup, canonical commands, builds, verification, generated-artifact workflows, and documentation ownership matrix.
- [docs/COMPLEXITY.md](docs/COMPLEXITY.md) — Metric and evidence interpretation, alongside canonical machine-readable Maritime evidence and derived graph presentation.
- [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) — Durable visual-state contract, canonical vs. synthetic fixture rules, and screenshot regeneration semantics.
- [docs/ROADMAP.md](docs/ROADMAP.md) — Unfinished product and architecture goals and intentional deferrals only.
- [RAW_OBSERVATIONS.md](RAW_OBSERVATIONS.md) — Sourced evidence authoring guide, JSON schema validation, countdown anchor semantics, and observation projection contracts.
- [docs/CANON_READINESS.md](docs/CANON_READINESS.md) — Durable domain readiness ledger governing conditional Crawler Menu capabilities.
