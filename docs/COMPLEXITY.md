# Architecture and Complexity Evidence

The `.maritime/` directory is Crawler Command Interface's generated, authoritative architecture and complexity evidence bundle. It contains:

- [`.maritime/complexity-report.md`](../.maritime/complexity-report.md) — the human-readable complexity report.
- [`.maritime/complexity-metrics.json`](../.maritime/complexity-metrics.json) — machine-readable, per-file complexity measurements.
- [`.maritime/dependency-graph.json`](../.maritime/dependency-graph.json) — the analyzed dependency graph for the application source roots.
- [`.maritime/manifest.json`](../.maritime/manifest.json) — the versioned bundle manifest and validation envelope.
- [`docs/images/dependency-graph.svg`](images/dependency-graph.svg) — the generated Graphviz presentation of the canonical Maritime dependency graph.

## Regenerating the evidence

The [Maritime Architecture Analysis workflow](../.github/workflows/maritime-analysis.yml) generates and verifies architecture evidence on every PR update. To keep PR verification agent-safe and read-only, `maritime-analysis.yml` uploads generated evidence as a workflow artifact rather than committing directly to active PR branches.

When substantive architecture changes occur, maintainers promote the updated `.maritime/` evidence and `docs/images/dependency-graph.svg` through the approval-gated [Publish Generated Artifacts workflow](../.github/workflows/publish-artifacts.yml) (`artifact-finalization` environment). Finalization evaluates `scripts/has-substantive-maritime-changes.mjs` and updates the tracked baseline in a single controlled commit alongside any updated screenshots.

For equivalent local analysis, consumer verification, and diagram rendering, install the matching published CLI without saving it as a project dependency:

```bash
npm install --no-save --package-lock=false @dependency-maritime/cli@0.1.0-beta.4
npm run analyze:architecture
npm run generate:graph
npm run verify:maritime
```

The `npm run analyze:architecture` script uses the same source roots (`app` and `src`), output directory (`.maritime`), and `--fail-on-unmeasured` strictness as CI. `npm run generate:graph` uses a version-pinned `npx --package` wrapper to render `docs/images/dependency-graph.svg` from existing `.maritime/dependency-graph.json` evidence without starting a second dependency analysis. Run `npm run verify:maritime` after rendering so Crawler's consumer contract checks the freshly generated evidence and SVG together. Graphviz's `dot` executable must be installed locally for direct local graph rendering.

The files under `.maritime/` are canonical machine-readable evidence. Do not hand-edit them; regenerate the complete bundle through the workflow or the equivalent local commands.

The dependency SVG (`docs/images/dependency-graph.svg`) is a derived presentation artifact produced by Maritime and Graphviz. It is not hand-edited; folder hierarchy is recursively derived from repository paths by Maritime.
