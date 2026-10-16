# Research Ingestion Roadmap

## Purpose and status

This is the living, task-oriented implementation roadmap for bringing the research-ingestion pipeline to its intended end state. It is the planning companion to the more detailed behavioral contract in [Observation Ingestion and Research-to-CCI Mapping Design](./observation-ingestion-design.md) and the end-to-end process in [Research-to-CCI Ingestion Workflow](./research-to-cci-workflow.md).

Use this roadmap to track completion across focused issues and PRs. **Implementation issues for Jules should reference this file and identify only the roadmap task IDs they are implementing**, along with any issue-specific scope or acceptance details. Do not copy the entire design into each issue.

- **Roadmap status:** In progress
- **Implementation authority:** existing raw-floor schemas, domain types, runtime pipeline, and the design contract linked above
- **Data authority:** curated files under `data/raw/floors/`; research YAML and generated importer output are not authoritative merely because they validate
- **Last status review:** 2026-10-15
- **Status rule:** check a task only after its acceptance criteria are demonstrated in code/tests and the implementing change is merged to `main`. A PR being open or a test merely being added does not count as completion.

## Non-negotiable design rules

1. **Evidence is not runtime data.** Stage 1/2 research records facts and provenance. Only an explicit CCI modeling decision may promote a claim into an existing CCI representation.
2. **No implicit promotion.** Missing, invalid, duplicate, or ambiguous modeling decisions must not silently become `promote`. They must remain visible as missing/invalid/unresolved.
3. **Events and observations are different kinds of truth.** Events represent supported transitions/occurrences; observations represent source-backed point-in-time readings. Do not turn an observation into a `NarrativeEvent` just because an event path already exists.
4. **Use existing contracts.** Reuse `crawler-floor-raw.schema.json`, existing observation types, raw-loader/compiler behavior, and current projection/replay semantics. Do not create a parallel observation schema or runtime model.
5. **Explicit anchors only.** An observation must anchor to an exact existing raw event ID or an unambiguous event claim ID that resolves to a compiled event. Never create an event, sequence, time, or anchor just to make an observation fit.
6. **Preserve authored data.** Existing curated records must not be silently overwritten, deduplicated by summary, or reinterpreted. Conflicting identity, kind, payload, or anchor is a visible error.
7. **Deterministic and idempotent.** Identical inputs must yield identical outputs and reports. Re-running the importer must not create duplicate records, drift evidence, or mutate unrelated authored records.
8. **Unknown means unknown.** A partial reading does not imply a complete snapshot. XP does not imply max XP; current resources do not imply maxima; one attribute does not imply other attributes; a countdown reading does not imply a start/reset/pause model.
9. **Reports must be truthful.** Every input claim and diagnostic must be accounted for. Counts must reconcile to item-level records; a permissive schema is not meaningful validation.
10. **Runtime acceptance is separate from importer success.** A mechanically generated scaffold is not canonical or replay-safe until curation, raw validation, timeline compilation, and projection/replay checks pass.

## Current implementation areas

Treat this list as a starting inventory, not as proof that any behavior is complete. Verify actual `main` and the current PR before implementing a task.

- Research contracts and validation: `app/domain/types/research.ts`, `app/domain/schema/research-claim.schema.json`, `app/domain/schema/modeling-decision.schema.json`, `app/domain/research-loader.ts`, `app/domain/research-validator.ts`.
- Importer/compiler: `app/domain/research-compiler.ts`, `scripts/compile-research-raw.mjs`.
- Raw observation contract: `app/domain/types/observations.ts`, `app/domain/schema/crawler-floor-raw.schema.json`, `data/raw/floors/floor-*/observations.json`.
- Runtime ingestion and replay: `app/domain/raw-loader.ts`, `app/domain/raw-compiler.ts`, timeline/projection/replay modules and their tests.
- Existing design/workflow: this directory's `observation-ingestion-design.md` and `research-to-cci-workflow.md`.
- Focused tests: `tests/unit/research-ingestion.test.mjs`, plus raw-schema, timeline, projection, and replay tests.

The current baseline compiler has historically emitted sources/catalog/events without a complete observation path. The canonical CLI has also been able to run without a modeling document. Those are gaps to close, not behavior to preserve. The import-report schema must be checked on the implementation branch; a schema that accepts an arbitrary object does not satisfy the report contract.

---

## Roadmap status at a glance

| ID | Workstream | Status | Completion outcome |
| --- | --- | --- | --- |
| R0 | Establish safe promotion and reconciliation behavior | Not started | No implicit promotion; decisions and output reconciliation are safe |
| R1 | Complete typed observation modeling contract | Not started | Modeling schema/types/validation express explicit observation mapping |
| R2 | Compile observations into existing raw-floor files | Not started | Valid promoted observations compile to `observations.json` with explicit anchors |
| R3 | Make compilation deterministic, idempotent, and non-destructive | Not started | Repeated imports are stable; collisions fail; authored records survive |
| R4 | Deliver a strict, reconciled import coverage report | Not started | Versioned report schema, complete per-claim trace, consistent metrics |
| R5 | Verify the full runtime/replay path | Not started | Imported observations pass raw validation and behave correctly in replay |
| R6 | Apply the pipeline to source-backed data gaps | Not started | Research/curation uses the pipeline; gaps are explicit and replay-verified |

Update this table when work moves to `In progress` or `Complete`. Do not mark a workstream complete until all its task checkboxes and exit criteria are satisfied.

---

## R0 — Establish safe promotion and reconciliation behavior

**Goal:** Fix the importer safety boundary before adding more capability. A missing modeling decision must never be interpreted as approval to generate runtime-shaped records.

### Tasks

- [ ] **R0.1 — Require explicit modeling input in the canonical CLI.**
  - Update `scripts/compile-research-raw.mjs` to accept a documented `--modeling <path>` argument and load/validate that document.
  - Remove the unsafe default behavior that invokes the compiler without modeling decisions.
  - If modeling input is missing, unreadable, malformed, or schema-invalid, exit non-zero with an actionable error before writing any output.
  - Remove or document any positional-argument compatibility path that could accidentally omit modeling input. Do not retain a hidden fallback that changes the contract.
  - Add CLI tests for missing flag, missing file, malformed document, and valid invocation.

- [ ] **R0.2 — Make missing and invalid decisions non-promoting.**
  - In compiler and validator paths, distinguish at least: valid explicit disposition, missing decision, duplicate decision, decision for unknown claim, and invalid decision.
  - Never default missing disposition to `promote`.
  - A claim with no valid decision must emit no event, observation, catalog record, or other runtime-ready output on the strength of that claim.
  - Keep the claim in trace/report output with its real state and actionable reason.
  - Ensure a valid decision for one claim cannot mask an invalid or duplicate decision for another.

- [ ] **R0.3 — Reconcile claim-level and aggregate disposition accounting.**
  - Each input claim has exactly one final item-level outcome and one accurately represented disposition state.
  - Aggregate counts are derived from the item-level claim results rather than maintained independently.
  - Missing/invalid decisions are not reported as `promote` in one location and `missing` in another.
  - Add tests that compare aggregate totals with detailed claim records.

- [ ] **R0.4 — Protect compiler-owned payload fields by property presence.**
  - Mapping payloads must reject user-supplied compiler-owned fields `id`, `kind`, `eventId`, `evidence`, and `unknowns` whenever those keys are present, including values `null`, `false`, `0`, or an empty string.
  - Compiler-owned identity, kind, anchor, and provenance must be written only by the compiler from validated inputs.
  - Add a test for each reserved key with both a normal value and a falsy value.

- [ ] **R0.5 — Define the safe failure/write boundary.**
  - Validation failures must not partially overwrite existing raw files.
  - Validate all inputs and build all outputs in memory before replacing any output file.
  - Write outputs using a safe temporary-file/replace strategy or an equivalent all-validation-before-write approach consistent with repository conventions.
  - Add a test proving a rejected import leaves pre-existing files unchanged.

### Exit criteria

- No CLI or API path silently promotes claims when modeling is absent.
- Missing/invalid decisions are visible and generate no runtime-ready records.
- Compiler-owned fields cannot be spoofed through mapping payloads.
- Failure leaves existing curated files unchanged.
- Focused ingestion tests pass.

**PR guidance:** Keep this stage narrow. Do not combine it with a broad research-data backfill or UI work.

---

## R1 — Complete the typed observation modeling contract

**Goal:** Make Stage 3 explicitly describe how an observation claim maps to an existing CCI observation, without contaminating the evidence-oriented Stage 2 research schema.

### Tasks

- [ ] **R1.1 — Extend the modeling decision schema and TypeScript types.**
  - Update `app/domain/schema/modeling-decision.schema.json` and `app/domain/types/research.ts` to support a typed `observationMapping` for observation claims.
  - Keep `crawler-research/v1` claims CCI-neutral: no raw payload, runtime event ID, observation ID, sequence number, or promotion choice in the research claim.
  - The mapping must identify an existing raw observation kind, schema-supported payload fields, and exactly one explicit anchor form.
  - Reuse the raw schema and domain types as authority. Do not create a parallel hand-maintained list of observation payload fields.

- [ ] **R1.2 — Define decision semantics by claim kind.**
  - Event claims continue to use the existing event modeling path.
  - Observation claims with `promote` require a valid typed observation mapping and valid anchor.
  - Observation claims with `review` or `ledger_only` remain in trace/report but emit no runtime-ready observation.
  - State claims continue through the existing state/catalog/curation path or remain unresolved. They must not be blindly routed to events or observations.
  - A promoted observation with missing mapping is an error/unresolved outcome, never permission to guess.

- [ ] **R1.3 — Validate modeling decisions semantically.**
  - Enforce one decision per claim; detect duplicate and unknown claim IDs.
  - Enforce that an observation mapping appears only where applicable and that required mapping fields are present for promoted observations.
  - Reject unsupported observation kinds, unknown payload fields, invalid payload shape, and conflicting mapping/claim semantics.
  - Validate the selected kind and payload against the authoritative observation schema definition in `app/domain/schema/crawler-floor-raw.schema.json`.
  - Keep errors actionable: include claim ID, mapping field/path, and reason.

- [ ] **R1.4 — Specify explicit anchor variants.**
  - Support exactly:
    - `event-id`: an exact existing raw event ID in the same target floor.
    - `claim-id`: an event claim ID in the same research document, resolved through the compiler's deterministic claim-to-event mapping.
  - A claim-ID anchor is valid only if the referenced claim exists, has kind `event`, and resolves unambiguously to an emitted/reused event.
  - Reject missing, ambiguous, wrong-kind, nonexistent, and cross-floor anchors.
  - A chapter/section locator, nearby event, event sequence, or temporal proximity is not a runtime anchor.

### Exit criteria

- Schema, TypeScript types, and semantic validator agree on the modeling contract.
- Negative tests cover invalid mapping and anchor cases.
- Research YAML remains evidence-only and existing event modeling remains compatible.

---

## R2 — Compile observations into the existing raw-floor representation

**Goal:** Route approved observation claims into `data/raw/floors/floor-<n>/observations.json` using the existing raw observation contract.

### Tasks

- [ ] **R2.1 — Extend compiler input/output contracts.**
  - Extend `ExistingRawFloorData` and `RawFloorCompilation` in `app/domain/research-compiler.ts` to include observations.
  - Load existing `observations.json` in `scripts/compile-research-raw.mjs` and write the compiler's observation output to that same path.
  - Do not introduce a parallel observation file, staging model, database, or runtime shortcut.

- [ ] **R2.2 — Route claims without conflating representation types.**
  - Valid promoted event claims use the existing event compilation path.
  - Valid promoted observation claims compile only after typed mapping, payload validation, and explicit anchor resolution succeed.
  - Review/ledger-only observations remain in trace/report but are not emitted as runtime-ready observations.
  - State claims use their existing state/catalog/curation path or remain unresolved.
  - No observation may be emitted as an event simply because event compilation already exists.

- [ ] **R2.3 — Generate deterministic observation IDs.**
  - Generate temporary observation IDs in a distinct `obs-` namespace derived deterministically from floor and claim ID.
  - Normalize IDs deterministically and detect collisions after normalization.
  - A collision between different claims must fail explicitly; do not invent a suffix or alternate ID to evade it.
  - Never use summary text, locator, or current array position as the sole identity.

- [ ] **R2.4 — Resolve anchors before emitting observations.**
  - Resolve `event-id` only against existing events in the target floor.
  - Resolve `claim-id` through the deterministic claim-to-event map, including when the event was matched/reused.
  - Reject unresolved anchors without creating synthetic events or guessed sequence numbers.
  - Ensure the final observation `eventId` is the actual event ID that exists in the same floor.
  - If curation replaces a temporary event ID, require the observation anchor to be reconciled to the final authored ID before acceptance.

- [ ] **R2.5 — Preserve evidence and uncertainty.**
  - Carry the claim's evidence/provenance into supported raw fields without discarding source IDs, locators, confidence, evidence relationship, notes, or unknowns from the trace.
  - Where the raw evidence shape cannot represent all research provenance, retain the complete chain in the import report/trace.
  - Do not fill unreported XP, max XP, levels, stats, resource maxima, countdown values, or metrics.
  - Preserve partial payloads as partial payloads.

### Exit criteria

- At least one valid observation of each supported mapping pattern compiles into `observations.json`.
- Invalid/unsupported mappings and anchors produce no observation and yield actionable diagnostics.
- Existing event output behavior remains correct.
- The raw observation schema is used as the payload authority.

---

## R3 — Make compilation deterministic, idempotent, and non-destructive

**Goal:** Make repeated runs safe when existing raw files contain both generated scaffolds and manually curated records.

### Tasks

- [ ] **R3.1 — Define deterministic reconciliation by identity.**
  - Reconcile generated records by deterministic compiler identity and explicit field comparison—not by matching summaries or locators alone.
  - Preserve unrelated manually authored events, observations, catalog entries, and sources exactly.
  - Do not silently rewrite a curated ID, kind, payload, anchor, or other semantic field.
  - Document the exact deterministic evidence-merge rule. Evidence merging must not vary with run order and must not remove provenance.

- [ ] **R3.2 — Distinguish generated, reused, and conflicting records.**
  - Same deterministic identity and equivalent compiler-owned semantic content: reuse the record.
  - Same identity but different kind, payload, anchor, or incompatible evidence semantics: fail with a conflict diagnostic.
  - Different identity: preserve the existing record and generate only if it does not collide with another identity.
  - A record must not be counted as both newly generated and reused.

- [ ] **R3.3 — Add two-pass idempotency tests.**
  - Compile the same research + modeling inputs once.
  - Feed the first compilation's output back as existing raw data and compile a second time.
  - Assert stable IDs, kinds, payloads, anchors, order, evidence, and unknowns.
  - Assert the second pass creates no duplicate generated records and reports accurate reuse counts.
  - Assert unrelated authored records are byte/structurally unchanged.
  - Repeat the test for event and observation outputs.

- [ ] **R3.4 — Add collision and conflict tests.**
  - Normalized ID collision between different claim IDs fails.
  - Existing generated identity with a conflicting observation kind, payload, or anchor fails.
  - Falsy reserved fields fail (see R0.4).
  - A malformed existing raw file or unsupported existing record fails without destructive partial writes.

### Exit criteria

- Identical inputs and identical existing raw data yield deterministic outputs.
- Re-running the importer is idempotent for event and observation records.
- Conflicts are explicit and non-destructive.
- Manually authored unrelated records remain unchanged.

---

## R4 — Deliver a strict, reconciled import coverage report

**Goal:** Make every importer run explain what was input, decided, generated, reused, left unresolved, or rejected. The report is a deterministic audit artifact, not a decorative summary.

### Tasks

- [ ] **R4.1 — Define and enforce a versioned report schema.**
  - Add/complete `app/domain/schema/import-report.schema.json` for `crawler-import-report/v1` (or the repository's explicitly chosen versioned identifier).
  - Require the schema version, floor/story scope, summary metrics, per-claim records, and diagnostics structure.
  - Use `additionalProperties: false` for contract-owned objects unless a specific extension point is documented.
  - Define enums for claim kind, disposition, and outcome; define non-negative integer counts; require all fields needed to interpret a report.
  - Validate the actual generated report with AJV. A schema that only says `type: object` or permits arbitrary properties is not completion.
  - Add negative schema tests for missing required fields, invalid enums, negative counts, malformed claim records, and unexpected properties.

- [ ] **R4.2 — Record exactly one item-level outcome for every input claim.**
  - Each record links claim ID/kind, decision/disposition state, selected CCI type/kind where applicable, output ID when emitted/reused, outcome, and diagnostics.
  - Missing, invalid, duplicate, review-only, ledger-only, unresolved, rejected, compiled, and reused states must remain distinguishable.
  - Keep research uncertainty (unknowns) distinct from import/modeling errors (diagnostics).

- [ ] **R4.3 — Report all required metrics from detailed records.**
  - Input claim totals and counts by research kind (`event`, `observation`, `state`).
  - Unknown entries: total entries, breakdown by claim kind, and unresolved status; count entries per claim rather than globally deduplicating identical wording.
  - Generated event stubs grouped by actual event type and generated observation stubs grouped by actual observation kind.
  - Reused/matched existing records, separate from newly generated records.
  - Valid explicit manual mappings grouped by output event type/observation kind; never infer a manual mapping merely from claim kind or output shape.
  - Dispositions (`promote`, `review`, `ledger_only`, missing/invalid) and final outcomes.
  - Diagnostics by stable code, plus item-level diagnostics connected to claim and/or raw record IDs.
  - Preserve enough provenance to trace raw output to claim ID, source ID, and locator.

- [ ] **R4.4 — Enforce arithmetic reconciliation.**
  - Derive summary counters from item-level claim, unknown, generated/reused record, mapping, and diagnostic records.
  - Test that totals reconcile exactly; no claim or diagnostic can disappear from the summary.
  - Ensure a review/ledger-only claim is not counted as runtime output.
  - Ensure invalid claims and failed mappings remain represented.
  - Avoid machine-specific paths, incidental timestamps, and other nondeterministic report fields.

- [ ] **R4.5 — Add report determinism and failure coverage.**
  - Identical inputs and existing raw records produce byte-equivalent report output.
  - A failed claim remains present with its failure state.
  - Report generation does not mutate raw output, provenance, schema validation, or replay behavior.
  - CLI writes the report to a documented predictable location and includes it in success/failure diagnostics appropriately.

### Exit criteria

- The report is meaningfully schema-validated.
- Every input claim and diagnostic is represented once at the correct level.
- All summary counts reconcile to item-level details.
- Repeated identical imports produce identical reports.

**Sequencing note:** R4 may be implemented after R0–R3 to keep the first safety PR reviewable. Do not ship a misleading, effectively permissive report validator in the interim; either complete schema and validator together or keep the report validation change out until this workstream lands.

---

## R5 — Verify the full runtime/replay path

**Goal:** Prove that an imported observation is valid and behaves correctly through the existing authoritative pipeline, not just that the importer returns a plausible object.

### Tasks

- [ ] **R5.1 — Add representative payload tests.**
  - XP progress: support only sourced subsets of `xp`, `maxXp`, and/or `level`.
  - Attributes: preserve only explicitly reported attributes; do not fill missing attributes or points.
  - Conditions: current health/mana/stamina do not imply maxima, and vice versa.
  - Countdown remaining: does not imply countdown start/reset/pause/elapsed-time formula.
  - Metrics/inventory/equipment: use only currently supported schema fields and established semantics.
  - Unsupported kind/field combinations fail explicitly.

- [ ] **R5.2 — Add an end-to-end import acceptance test.**
  - Input: research claim document + explicit modeling decisions + existing raw floor data.
  - Run deterministic compilation into decomposed raw-shaped outputs.
  - Validate the resulting floor using the existing raw schema/domain validator.
  - Compile the derived timeline/fixture through the normal repository path.
  - Load and project the result using the existing runtime path.
  - Assert observation values and provenance remain associated with the correct floor and anchor.
  - Do not hand-edit generated fixtures; use the repository's fixture-generation workflow.

- [ ] **R5.3 — Verify temporal/replay invariants.**
  - An observation does not affect projection before its anchor.
  - The observation becomes available at the expected sequence according to existing observation semantics.
  - Scrubbing backward removes later readings from the visible projection.
  - A later partial reading does not imply earlier or missing fields.
  - Existing interpolation/countdown phase-break behavior remains unchanged.
  - A missing UI widget is not a reason to rewrite an observation as an event.

- [ ] **R5.4 — Protect existing behavior.**
  - Existing event compilation, raw schema validation, timeline ordering, projections, replay, and curated observations remain green.
  - No broad UI changes, new widgets, or projection/countdown redesign is bundled into importer implementation unless a separate issue explicitly authorizes it.

- [ ] **R5.5 — Run repository verification.**
  - At minimum run focused research-ingestion tests and `npm run typecheck`.
  - Before declaring the end-to-end workstream complete, run `npm run verify` (which includes fixture generation, typecheck, lint, architecture/unit tests, builds, rendered tests, and artifact tests).
  - Report actual commands and results in the PR; do not claim tests passed if they were not run.

### Exit criteria

- A promoted observation can travel through importer → raw validation → timeline → projection/replay.
- Future observations do not leak backward in replay.
- Existing runtime behavior and regression tests remain green.

---

## R6 — Apply the pipeline to source-backed data gaps

**Goal:** Use the finished import workflow to improve the authored Floor 1–3 data without confusing a tooling milestone with data completeness.

### Tasks

- [ ] **R6.1 — Audit the research ledger against existing raw events and observations.**
  - Identify research claims that are point-in-time readings but currently have no observation representation.
  - Identify event records that incorrectly carry a snapshot/readout, without automatically converting them; each conversion requires evidence and an explicit modeling decision.
  - Report coverage by floor, claim kind, output kind, and source/provenance completeness.
  - Preserve the distinction between “not found in accessible evidence,” “researched but not modeled,” “modeled but unresolved,” and “not represented in the runtime/UI.”

- [ ] **R6.2 — Prioritize source-backed observation families.**
  - XP and max-XP progress.
  - Crawler attributes and explicit stat changes/readings.
  - Current/max health, mana, and stamina only when separately established.
  - Countdown-remaining readings, preserving chronology and uncertainty.
  - Broadcast/floor metrics, inventory, and equipment only where current schemas support them.
  - Do not create values to make the UI appear complete. Unknown remains unknown.

- [ ] **R6.3 — Curate Floor 3 through the new pipeline.**
  - Use Stage 1 research and Stage 2 extraction to capture the strongest accessible source evidence, including exact URLs and locators where available.
  - Add/repair Stage 3 decisions explicitly; do not place runtime payloads in research YAML.
  - Compile observations to the existing Floor 3 `observations.json`.
  - Resolve anchors against actual same-floor events.
  - Reconcile the generated scaffold into authoritative raw data and preserve full provenance.
  - Include the known audit concerns where supported by evidence: missing/limited countdown-remaining readings, early crawler stat readings (including the known Intelligence change around sequence 34), and missing floor title/metadata coverage. Do not treat those examples as permission to invent values or anchors.

- [ ] **R6.4 — Verify each curated floor through runtime replay.**
  - Confirm the observation is visible at the correct point in timeline/replay and absent before its anchor.
  - Confirm partial fields stay partial and no defaults are introduced.
  - Confirm raw source and evidence links remain inspectable.
  - Update the floor audit with completed, unresolved, and inaccessible-evidence gaps.

### Exit criteria

- Each curated observation has a supported source, explicit modeling decision, valid payload, and real same-floor anchor.
- Remaining gaps are documented rather than hidden.
- Floor coverage statements distinguish evidence availability from implementation and UI coverage.

---

## Definition of done for a roadmap task

An issue referencing this roadmap is complete only when all of the following applicable conditions are met:

- The requested roadmap checkboxes are completed in the same PR or are already completed on `main`.
- Behavior is covered by focused positive and negative tests; tests assert the contract, not merely that code executes.
- Existing curated data is preserved and conflict cases fail explicitly.
- The report/trace accurately accounts for the claim and its provenance where the task affects importing.
- The PR states which roadmap task IDs it closes and lists exact verification commands with their actual results.
- No unrelated UI redesign, broad re-research, or architecture refactor was added without explicit authorization.
- The roadmap's status table and checkboxes are updated only when the implementation is merged and its acceptance criteria are met.

## Suggested issue/PR slicing

Use one focused issue per cohesive set of tasks, and reference this document rather than pasting its contents into the issue.

1. **Importer safety:** R0.1–R0.5.
2. **Typed modeling contract:** R1.1–R1.4.
3. **Observation compilation and anchor resolution:** R2.1–R2.5.
4. **Idempotent reconciliation:** R3.1–R3.4.
5. **Import coverage report:** R4.1–R4.5.
6. **End-to-end acceptance:** R5.1–R5.5.
7. **Research and floor curation:** R6.1–R6.4.

These are suggested implementation boundaries, not a requirement to create all issues immediately. Keep each PR small enough to review, but do not split a contract so that a partially implemented feature is merged in an unsafe state. In particular, report schema validation must not be enabled with a placeholder schema, and observation emission must not land before explicit mapping/anchor validation.

## Reference documents and code

- [Observation Ingestion and Research-to-CCI Mapping Design](./observation-ingestion-design.md) — detailed semantics and invariants.
- [Research-to-CCI Ingestion Workflow](./research-to-cci-workflow.md) — Stage 1–3 responsibilities and overall pipeline.
- [Raw Observation Authoring Guide](../../RAW_OBSERVATIONS.md) — raw ownership and observation semantics.
- `app/domain/research-compiler.ts`
- `app/domain/research-validator.ts`
- `app/domain/types/research.ts`
- `app/domain/types/observations.ts`
- `app/domain/schema/modeling-decision.schema.json`
- `app/domain/schema/crawler-floor-raw.schema.json`
- `app/domain/schema/import-report.schema.json` (to be added/completed under R4)
- `scripts/compile-research-raw.mjs`
- `tests/unit/research-ingestion.test.mjs`
- `package.json` scripts: `research:compile`, `typecheck`, `test:unit`, `verify`
