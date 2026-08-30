# Architecture and Complexity Evidence

The `.maritime/` directory is Crawler Command Interface's generated, authoritative architecture and complexity evidence bundle. It contains:

- [`.maritime/complexity-report.md`](../.maritime/complexity-report.md) — the human-readable complexity report.
- [`.maritime/complexity-metrics.json`](../.maritime/complexity-metrics.json) — machine-readable, per-file complexity measurements.
- [`.maritime/dependency-graph.json`](../.maritime/dependency-graph.json) — the analyzed dependency graph for the application source roots.
- [`.maritime/manifest.json`](../.maritime/manifest.json) — the versioned bundle manifest and validation envelope.
- [`docs/images/dependency-graph.svg`](images/dependency-graph.svg) — the generated Graphviz presentation of the canonical Maritime dependency graph.

## Regenerating the evidence

The [Maritime Architecture Analysis workflow](../.github/workflows/maritime-analysis.yml) is the single canonical branch-writing workflow for generated architecture evidence. It installs Crawler's dependencies, pins the Maritime Action implementation to commit `05315851a619ef8b854af365e09d64290370639b`, and explicitly consumes the exact published `@dependency-maritime/cli@0.1.0-beta.4` package. CI analyzes `app` and `src` in strict measurement mode, renders the canonical dependency graph SVG (`docs/images/dependency-graph.svg`), validates the bundle via `npm run verify:maritime`, and automatically commits substantive baseline changes on same-repository PRs.

CI ignores `manifest.json.generatedAt` only while deciding whether the generated evidence changed substantively via `scripts/has-substantive-maritime-changes.mjs`. A timestamp-only regeneration does not create a commit; any substantive change commits the entire newly generated `.maritime/` bundle and updated SVG graph artifact together.

For equivalent local analysis, consumer verification, and diagram rendering, install the matching published CLI without saving it as a project dependency:

```bash
npm install --no-save --package-lock=false @dependency-maritime/cli@0.1.0-beta.4
npm run analyze:architecture
npm run verify:maritime
npm run generate:graph
```

The `npm run analyze:architecture` script uses the same source roots (`app` and `src`), output directory (`.maritime`), and `--fail-on-unmeasured` strictness as CI. `npm run verify:maritime` performs Crawler's consumer contract check to ensure evidence completeness and SVG validity. `npm run generate:graph` uses a version-pinned `npx --package` wrapper to render `docs/images/dependency-graph.svg` from existing `.maritime/dependency-graph.json` evidence without starting a second dependency analysis. Graphviz's `dot` executable must be installed locally for direct local graph rendering.

The files under `.maritime/` are canonical machine-readable evidence. Do not hand-edit them; regenerate the complete bundle through the workflow or the equivalent local commands.

The dependency SVG (`docs/images/dependency-graph.svg`) is a derived presentation artifact produced by Maritime and Graphviz. It is not hand-edited; folder hierarchy is recursively derived from repository paths by Maritime.
