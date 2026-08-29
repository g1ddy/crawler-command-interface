# Architecture and Complexity Evidence

The `.maritime/` directory is Crawler Command Interface's generated, authoritative architecture and complexity evidence bundle. It contains:

- [`.maritime/complexity-report.md`](../.maritime/complexity-report.md) — the human-readable complexity report.
- [`.maritime/complexity-metrics.json`](../.maritime/complexity-metrics.json) — machine-readable, per-file complexity measurements.
- [`.maritime/dependency-graph.json`](../.maritime/dependency-graph.json) — the analyzed dependency graph for the application source roots.
- [`.maritime/manifest.json`](../.maritime/manifest.json) — the versioned bundle manifest and validation envelope.
- [`docs/images/dependency-graph.svg`](images/dependency-graph.svg) — the generated Graphviz presentation of the canonical Maritime dependency graph.

## Regenerating the evidence

The [Maritime Architecture Analysis workflow](../.github/workflows/maritime-analysis.yml) is the canonical CI regeneration path. It installs Crawler's dependencies, pins the Maritime Action implementation to commit `70b1882dbe37728bba511ea396645421170789f7`, and explicitly consumes the exact published `@dependency-maritime/cli@0.1.0-beta.3` package. CI analyzes `app` and `src` in strict measurement mode, then validates the completed bundle and renders the canonical dependency graph SVG (`docs/images/dependency-graph.svg`) using Maritime's first-class graph renderer.

For labeled baseline updates, CI ignores `manifest.json.generatedAt` only while deciding whether the generated evidence changed substantively. A timestamp-only regeneration does not create a commit; any substantive change commits the entire newly generated `.maritime/` bundle, including its real generation timestamp and updated SVG graph artifact.

For equivalent local analysis and diagram rendering, install the matching published CLI without saving it as a project dependency, then run analysis and graph rendering:

```bash
npm install --no-save --package-lock=false @dependency-maritime/cli@0.1.0-beta.3
npm run analyze:architecture
npx maritime graph --input .maritime --output docs/images/dependency-graph.svg
```

The `npm run analyze:architecture` script uses the same source roots, output directory, and `--fail-on-unmeasured` strictness as CI.

Run the commands in that order: diagram rendering consumes the existing `.maritime/dependency-graph.json` canonical machine evidence and never starts a second dependency analysis. Graphviz's `dot` executable must be installed locally for direct CLI graph rendering. The Maritime workflow performs the same rendering immediately after successful analysis and updates the SVG in the existing labeled baseline commit, so no competing branch-writing workflow is involved.

The files under `.maritime/` are canonical machine-readable evidence. Do not hand-edit them; regenerate the complete bundle through the workflow or the equivalent local commands.

The dependency SVG (`docs/images/dependency-graph.svg`) is a derived presentation artifact produced by Maritime and Graphviz. It is not hand-edited; folder hierarchy is recursively derived from repository paths by Maritime.
