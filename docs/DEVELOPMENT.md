# Development Guide

This guide covers local environment setup, npm commands, build targets, fixture generation, verification workflows, and contribution expectations for the Crawler Command Interface.

## Prerequisites

- **Node.js**: `>=22.13.0`
- **Operating Environment**: Linux with `flock`, `curl`, GNU `timeout`, and `sha256sum` (required for `install:ci` and sites environment scripts)

## Environment Setup

Before running tests or builds, initialize dependencies using the single bounded lockfile install:

```bash
npm run install:ci
```

`npm run install:ci` performs a single, non-retrying install that enforces lockfile integrity, manages socket concurrency, and verifies the `vinext` binary.

To start the local development server for the ChatGPT live-app adapter:

```bash
npm run dev
```

To preview the static GitHub Pages adapter locally:

```bash
npx vite --config vite.pages.config.ts
```
The Pages adapter defaults to base path `/crawler-command-interface/`.

## Diagnostic and Build Scripts

| Command | Description |
| --- | --- |
| `npm run install:ci` | Perform bounded lockfile installation |
| `npm run dev` | Start local Vite / Vinext development server for ChatGPT live app |
| `npm run generate:fixture` | Compile raw floor documents into the runtime fixture (`app/domain/fixtures/compiled-timeline.ts`) |
| `npm run build` / `npm run build:live` | Build deployable ChatGPT live-app Worker artifact (`dist/`) |
| `npm run build:pages` | Build deployable static GitHub Pages artifact (`dist-pages/`) |
| `npm run test:unit` | Run domain unit tests via Node test runner |
| `npm run test:artifacts` | Verify build artifact capture contracts and commit provenance matching |
| `npm run test:pages:custom-base` | Test custom domain Pages build (`PAGES_BASE_PATH=/`) and restore default Pages build |
| `npm run test:rendered` | Verify development preview metadata rendering |
| `npm run verify` | Full verification suite: sync fixtures, lint, run unit tests, build both targets, and test artifacts |
| `npm run start` | Start built Vinext production server locally |
| `npm run db:generate` | Generate Drizzle migrations after schema changes |

## Fixture Generation Workflow

Storyline evidence is authored in `data/raw/floors/`. When raw floor files are created or modified, regenerate the Worker-safe runtime fixture:

```bash
npm run generate:fixture
```

This compiles `data/raw/floors/*.json` into `app/domain/fixtures/compiled-timeline.ts`. Derived floor outputs in `data/floors/` and `app/domain/fixtures/compiled-timeline.ts` are generated artifacts and must not be edited manually.

## Deployment Builds

The project produces two distinct production deployment targets from the same repository:

1. **ChatGPT Live App Worker (`npm run build:live`)**:
   Outputs to `dist/`. Complies with Cloudflare Worker runtime constraints (no AJV compilation or dynamic code generation during Worker import).
2. **Static GitHub Pages (`npm run build:pages`)**:
   Outputs to `dist-pages/`. Generates a static client application bundle. Supports the `PAGES_BASE_PATH` environment variable (defaults to `/crawler-command-interface/`).

Both build tasks generate `build-provenance.json` in their respective output directories to record the source commit SHA.

## Verification Workflow

Before submitting changes, run the full verification suite:

```bash
npm run verify
```

`npm run verify` executes:
1. `npm run generate:fixture`
2. `npm run lint`
3. `npm run test:unit`
4. `npm run build:live`
5. `npm run test:rendered`
6. `npm run build:pages`
7. `npm run test:artifacts`

Domain unit tests run directly against TypeScript source using Node's `--experimental-strip-types` flag (supported on Node 22.13+).

## Contribution Expectations

- **Source vs. Artifacts**: Edit source files in `app/`, `src/`, `data/raw/floors/`, `scripts/`, or `tests/`. Do not edit build output artifacts (`dist/`, `dist-pages/`) or generated fixtures directly.
- **Verification**: Ensure `npm run verify` passes completely before submitting code.
- **Documentation Boundaries**:
  - Refer to [docs/ARCHITECTURE.md](ARCHITECTURE.md) for system architecture, runtime boundaries, and data flow.
  - Refer to [docs/ROADMAP.md](ROADMAP.md) for current product goals and task backlogs.
  - Refer to [RAW_OBSERVATIONS.md](../RAW_OBSERVATIONS.md) for evidence authoring, JSON schemas, and countdown projection semantics.
