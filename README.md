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

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Prerequisites, local environment setup, npm commands, build targets, fixture generation, verification workflows, and generated screenshot rules.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Shared browser core, ChatGPT Sites and GitHub Pages adapters, raw-to-compiled fixture pipeline, and Worker-safe runtime boundaries.
- [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) — Living visual documentation for the four top-level views and three Crawler profile views, backed by generated `docs/images/` assets.
- [docs/ROADMAP.md](docs/ROADMAP.md) — Product backlog, upcoming milestones, and active architectural constraints.
- [RAW_OBSERVATIONS.md](RAW_OBSERVATIONS.md) — Sourced evidence authoring rules, JSON schema validation, countdown anchor semantics, and observation projection interpretations.
- [AGENTS.md](AGENTS.md) — Repository operating guide and durable invariants for coding agents and contributors.
