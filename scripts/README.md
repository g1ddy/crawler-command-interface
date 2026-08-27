# Codex Environment Scripts

This directory contains project-specific automation used by local development, CI, ChatGPT Sites, and Codex environments.

## Codex environment lifecycle

### `setup.sh`

Use `setup.sh` when creating a fresh Codex environment. It performs the heavyweight bootstrap needed to make the repository immediately usable:

- installs the exact npm dependency graph with `npm ci`;
- installs Chromium and its operating-system dependencies for Playwright;
- regenerates derived story fixtures from `data/raw/floors/`.

```bash
./scripts/setup.sh
```

### `maintenance.sh`

Use `maintenance.sh` when resuming an existing Codex environment after pulling changes or switching branches. It is intentionally cheaper and idempotent:

- reruns `npm ci` only when `node_modules` is missing or `package-lock.json` changed;
- ensures the Chromium browser required by the E2E suite is present;
- refreshes generated story fixtures.

```bash
./scripts/maintenance.sh
```

The maintenance lockfile checksum is local environment state stored under `.codex/` and must not be committed.

## Other scripts

The Codex scripts do not replace the hardened ChatGPT Sites / CI helpers:

- `sites-env.sh` establishes the isolated writable Sites runtime environment.
- `install-ci.sh` performs the bounded, integrity-checked Sites dependency installation.
- `build-verified.sh` performs the bounded Vinext production build.
- `sync-derived-fixtures.mjs` regenerates checked-in derived timeline fixtures.
- `write-build-provenance.mjs` records the source commit in built artifacts.

`package.json` remains the normal user-facing command interface; these scripts encapsulate environment and orchestration details that are awkward to express directly as npm commands.
