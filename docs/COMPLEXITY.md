# Architecture and Complexity Evidence

The `.maritime/` directory is Crawler Command Interface's generated, authoritative architecture and complexity evidence bundle. It contains:

- [`.maritime/complexity-report.md`](../.maritime/complexity-report.md) — the human-readable complexity report.
- [`.maritime/complexity-metrics.json`](../.maritime/complexity-metrics.json) — machine-readable, per-file complexity measurements.
- [`.maritime/dependency-graph.json`](../.maritime/dependency-graph.json) — the analyzed dependency graph for the application source roots.
- [`.maritime/manifest.json`](../.maritime/manifest.json) — the versioned bundle manifest and validation envelope.

## Regenerating the evidence

The [Maritime Architecture Analysis workflow](../.github/workflows/maritime-analysis.yml) is the canonical CI regeneration path. It installs Crawler's dependencies, pins the Maritime Action implementation to commit `0291da99242e70080522c9d465d902a31966e47e`, and explicitly consumes the exact published `@dependency-maritime/cli@0.1.0-beta.2` package. CI analyzes `app` and `src` in strict measurement mode, then validates the completed bundle.

For labeled baseline updates, CI ignores `manifest.json.generatedAt` only while deciding whether the generated evidence changed substantively. A timestamp-only regeneration does not create a commit; any substantive change commits the entire newly generated `.maritime/` bundle, including its real generation timestamp.

For equivalent local analysis, install the matching published CLI without saving it as a project dependency, then run the repository script:

```bash
npm install --no-save --package-lock=false @dependency-maritime/cli@0.1.0-beta.2
npm run analyze:architecture
```

The `npm run analyze:architecture` script uses the same source roots, output directory, and `--fail-on-unmeasured` strictness as CI.

The files under `.maritime/` are generated evidence. Do not hand-edit them; regenerate the complete bundle through the workflow or the equivalent local command.
