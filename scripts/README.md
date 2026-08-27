# Codex Environment Scripts

This directory contains project-specific automation used by local development, CI, ChatGPT Sites, and Codex environments.

## Codex environment lifecycle

### `setup.sh`

Use `setup.sh` when creating a fresh ChatGPT Codex environment:

```bash
./scripts/setup.sh
```

It performs a clean install from `package-lock.json` with `npm ci`, then installs Chromium and its Linux dependencies for the Playwright E2E suite.

### `maintenance.sh`

Use `maintenance.sh` when Codex resumes an existing environment after pulling changes or switching branches:

```bash
./scripts/maintenance.sh
```

It incrementally reconciles the existing npm environment with the current branch using `npm install`, then refreshes Chromium and its Linux dependencies.

Neither Codex script generates fixtures, builds artifacts, runs tests, or writes repository-local bookkeeping state. Those remain explicit repository commands.

## Other scripts

The Codex scripts do not replace the hardened ChatGPT Sites / CI helpers:

- `sites-env.sh` establishes the isolated writable Sites runtime environment.
- `install-ci.sh` performs the bounded, integrity-checked Sites dependency installation.
- `build-verified.sh` performs the bounded Vinext production build.
- `sync-derived-fixtures.mjs` regenerates checked-in derived timeline fixtures.
- `write-build-provenance.mjs` records the source commit in built artifacts.

`package.json` remains the normal user-facing command interface; these scripts only prepare the Codex environment.
