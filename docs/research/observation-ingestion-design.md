# Observation Ingestion and Research-to-CCI Mapping Design

## Status and authority

This is the living design contract for issue #318 and future work on observation ingestion. Implementation issues should link here and describe their specific deliverable instead of copying this full specification.

**Decision:** observations are researched in Stage 1 and extracted as evidence claims in Stage 2. CCI-specific payload and timeline-anchor mapping belongs in Stage 3 CCI-aware modeling/curation. The deterministic importer routes approved event claims to event output and approved observation claims to the existing `observations.json`. The decomposed raw-floor files remain authoritative after curation.

## 1. Current gap

The research model distinguishes `event`, `observation`, and `state`, but a claim currently contains textual summary/detail, evidence, unknowns, dependencies, and contradictions—not a typed CCI observation payload. `app/domain/research-compiler.ts` currently compiles claims into event-shaped scaffolds and returns sources, catalog, and events, without observations. Consequently, an `observation` claim can be present in YAML without becoming a raw observation. It must never be disguised as a `NarrativeEvent` merely because that compiler path exists.

The runtime already has an observation contract: `data/raw/floors/floor-*/observations.json`, `app/domain/raw-loader.ts`, `app/domain/schema/crawler-floor-raw.schema.json`, `app/domain/raw-compiler.ts`, and sequence-scoped observation projection/replay. This design closes the import gap; it does not create a parallel runtime model or redesign projection/UI.

## 2. Target flow

```text
Stage 1: canon research -> evidence-rich report
    |
Stage 2: report + extraction prompt/schema -> crawler-research/v1 YAML
    |  atomic claims, evidence, locators, uncertainty; no CCI payloads
Deterministic validation: parse + schema + semantic/reference checks
    |
Stage 3: CCI-aware modeling/curation
    |  classify each claim and assign existing CCI representation
    |  event -> event mapping; observation -> typed observation mapping + explicit anchor
    |  state -> existing catalog/state/curation path or unresolved
Deterministic importer
    |-> events.json
    |-> observations.json
    |-> sources/catalog outputs as applicable
    |-> trace and actionable unresolved-mapping diagnostics
Human/Jules reconciliation -> authoritative decomposed raw JSON
    -> raw schema validation -> timeline compile -> projection/replay verification
```

The importer is an authoring assistant, not an authority generator. Schema-valid research YAML is not automatically approved runtime data. Existing curated raw records and the raw schema remain authoritative.

## 3. Stage responsibilities

### Stage 1 — Research

Research both transitions and point-in-time readings. Reports should state the narrowest supported fact/value, source identity and URL, best available locator, chronology, confidence/limitations, and contradictions. Do not invent runtime IDs, raw payloads, event sequence numbers, or precise anchors not established by evidence.

### Stage 2 — Evidence extraction

Keep `crawler-research/v1` CCI-neutral. Extract atomic claims with `kind: event | observation | state`, textual claim, evidence/source references and locators, confidence, unknowns, dependencies, and contradictions.

Do **not** add CCI-specific observation payloads, runtime event IDs, raw observation IDs, sequence numbers, or promotion decisions to the research claim. The claim kind classifies the evidence; it is not a complete raw mapping. Stage 2 should not decide how a fact is represented by CCI.

### Stage 3 — CCI-aware modeling and curation

Extend the existing `crawler-modeling/v1` decision contract with a typed observation mapping for observation claims. Preserve disposition, target, and rationale. The mapping for a promoted observation must specify:

- an existing raw observation kind;
- only that kind's schema-supported payload fields;
- an explicit anchor using one of the two forms below;
- an optional note only where needed to preserve meaning.

Use the existing raw observation schema and domain types as the payload authority. Do not create a second observation schema or hand-maintained parallel list of payload properties. Keep evidence on the research claim and carry its provenance through the existing compiler trace; map to raw evidence only through existing supported raw fields.

Disposition rules: `promote` may compile only when the mapping and anchor validate. `review` and `ledger_only` never produce runtime-ready observations. Missing mapping on a promoted observation is a validation/curation error, not permission to guess.

## 4. Existing observation kinds and payloads

The raw schema currently supports these families (consult `app/domain/schema/crawler-floor-raw.schema.json` for exact required fields and constraints):

- `xp-progress`: sourced subset of `xp`, `maxXp`, and/or `level`.
- `crawler-attributes`: non-empty map of explicitly reported attributes; optional available attribute points.
- `crawler-condition`: any sourced subset of current/max health, mana, and stamina; current does not imply max.
- `countdown-remaining`: defined countdown ID and sourced remaining seconds; optional schema-supported activation offset.
- `broadcast-metrics`: explicitly reported viewer/follower/favorite/patron/rank/bounty metrics.
- `floor-metrics`: explicitly reported crawler/boss/death metrics using the schema's quantity shape.
- `inventory` and `equipment`: only the specific state supported by the existing schema.

This list is orientation, not a substitute schema. Do not invent a kind to fit a fact. If the source-backed fact has no existing representation, leave it unresolved and raise a separate domain-contract issue.

Every raw observation requires stable `id`, `kind`, `eventId`, and evidence. Keep the existing `eventId` contract; do not add chapter locator or sequence as a substitute.

## 5. Anchor resolution

Model exactly one of:

- `event-id`: exact existing raw event ID in the target floor.
- `claim-id`: an event claim ID in the same research document, resolved through the compiler's deterministic claim-to-event mapping.

A claim reference is valid only if the referenced claim exists, has kind `event`, and resolves unambiguously. Reject missing, ambiguous, wrong-kind, cross-floor, or nonexistent anchors with actionable diagnostics. A chapter/section locator is evidence provenance, not a runtime anchor; temporal proximity is not an anchor.

Never create a synthetic event to attach an observation, guess a sequence, or silently attach to a convenient nearby event. If curation changes a generated event ID, the observation must be reconciled to the final authored event ID before raw data is accepted. Final authoritative observations must reference an event ID that exists in the same floor.

## 6. Compiler, provenance, and reconciliation

Extend the compiler output contract with `observations` alongside existing sources/catalog/events, and write it to the existing `data/raw/floors/floor-<n>/observations.json`. Do not add a parallel file, staging model, database, or runtime-only shortcut.

For each claim, require exactly one modeling decision and route by claim kind plus disposition:

1. Event claims retain existing event compilation behavior.
2. Promoted observation claims require valid typed mapping and explicit resolvable anchor, then compile to raw observation shape.
3. Review/ledger-only observation claims remain in trace and produce no runtime-ready raw observation.
4. State claims continue through the existing state/catalog/curation path; never blindly emit them as events or observations.

Use deterministic temporary observation IDs in a distinct `obs-` namespace derived from floor and claim ID. Detect normalized-ID collisions; never invent alternate IDs to evade a collision. Repeated compilation of identical inputs must be deterministic and idempotent.

Preserve unrelated manually authored observations exactly. Reconcile generated data by deterministic identity and explicit payload/anchor comparison, not summary text or shared locator alone. A generated ID that collides with a different record, or a conflicting payload/anchor, must fail explicitly rather than silently overwrite curated semantics. Merge evidence only under a deterministic rule; never overwrite authored kind, payload, anchor, or ID merely because summaries match.

Keep the full chain `raw observation -> research claim ID -> source ID -> locator` traceable, including confidence, evidence relationship, notes, and unknowns that raw evidence cannot represent. Raw evidence fields may be a subset; the trace must not discard the rest. Preserve unknowns as unknowns. Do not fill in default stats, maxima, XP thresholds, countdown values, metrics, or completeness.

A compiler success means mechanically mapped, not beyond review. Normal raw schema validation and human/Jules curation remain required.

## 7. Compiler-generated import coverage report

The importer must produce a deterministic, versioned JSON report for every run, alongside normal outputs and diagnostics. It is generated from the exact research YAML, modeling decisions, existing raw records, and compiler result; it is never manually maintained.

### Required metrics

- **Input claims:** total parsed YAML claims and counts by claim kind (`event`, `observation`, `state`). Report validation failures and duplicate/invalid IDs rather than silently deduplicating them.
- **Unknowns:** total entries in claim `unknowns`, counts by claim kind, and counts still unresolved after curation. Count entries per claim, not globally unique strings. Preserve claim ID and unknown-entry reference/text so totals are auditable.
- **Event stubs:** newly generated event scaffolds, grouped by actual event type. Count reused/matched authored events separately.
- **Observation stubs:** newly generated observation scaffolds, grouped by actual raw observation kind. Count reused/matched authored observations separately.
- **Manual mappings:** valid explicit CCI modeling decisions grouped by resulting event type and observation kind. Do not infer manual mapping from claim kind or output shape. A manual mapping is distinct from a generated stub.
- **Disposition/outcome:** counts by `promote`, `review`, `ledger_only`, missing/invalid disposition, and final outcome (compiled, reused/matched, unresolved, rejected/invalid, or not applicable).
- **Diagnostics:** counts by stable diagnostic code and item-level diagnostics linked to claim and/or raw record IDs.

### Definitions and correctness

A YAML claim is one claim in the parsed input. A YAML unknown is one entry in a claim's `unknowns` list; identical wording under two claims counts twice. A stub is generated authoring scaffolding, not proof of canonical or fully curated runtime data. A manual mapping is an explicit, valid CCI-aware decision that selects the existing CCI representation and supplies required payload/anchor details. Missing mappings and failures must remain visible in report totals.

Keep generated stubs, reused records, review-only/ledger-only claims, unresolved claims, and invalid claims as separate categories. Do not let a failed claim disappear from the report or count a review-only claim as runtime output. Unknowns and mapping errors are different concepts: an unknown is research uncertainty; a mapping error is an import problem.

### Report structure

Use a versioned schema such as `crawler-import-report/v1`, with summary counts, breakdowns by claim kind and output type, unknown entries/status, stubs, manual mappings, dispositions/outcomes, diagnostics, and item-level trace records. Exact property names may follow repository conventions, but every metric above must be explicit. Item-level records should connect claim ID/kind, disposition, resulting type/kind, output ID if any, and outcome. Preserve provenance through stable claim/source/locator references.

Write the report to a predictable path using existing repository output conventions. Avoid machine-specific paths and incidental timestamps so identical inputs produce identical report output.

### Required tests

- Input claim totals reconcile to parsed claims, including countable invalid claims.
- Unknown totals reconcile to per-claim unknown entries and unresolved-status breakdowns.
- Event/observation stub counts reconcile to newly generated records and group by actual output type/kind.
- Manual-mapping counts derive from valid explicit decisions and are not conflated with stubs or reused records.
- Review/ledger-only, reused, unresolved, and invalid claims remain distinct.
- Diagnostic counts reconcile to diagnostic items using stable codes.
- Identical inputs yield identical reports; failed claims remain represented.
- Reporting does not change raw output, schema validation, provenance, or replay behavior.

## 8. Runtime/replay invariants

Observations stay point-in-time readings through raw loading and timeline compilation. They are not causal transitions. Projection exposes only the payload's sourced fields at/after its anchor according to current observation semantics.

- A future reading must not affect a replay sequence before its anchor.
- A partial reading is not a complete snapshot.
- Level does not imply XP/max XP; current resources do not imply maxima.
- One reported attribute does not imply other attributes or defaults.
- A countdown reading does not establish a start, reset, pause, elapsed-time formula, or additional readings unless independently supported.
- Existing interpolation and countdown phase-break behavior remains governed by current contracts.
- Missing UI widgets are not a reason to rewrite observations as events.

## 9. Required implementation sequence and tests

Implement in this order:

1. Extend modeling decision schema/types with typed observation mapping; keep `crawler-research/v1` evidence-focused. Add semantic checks for mapping, claim kind, unique decisions, and anchor forms.
2. Extend raw-floor compiler output and route claims by kind/disposition, reusing existing raw observation types/schema.
3. Implement deterministic anchor resolution and actionable diagnostics.
4. Write to existing `observations.json`; preserve curated data, detect collisions, preserve provenance trace, prove idempotency.
5. Test the actual path: research document + modeling decisions + existing raw floor -> compiler -> raw schema validation -> raw loader/timeline compilation -> projection/replay.
6. Run `npm run generate:fixture` and `npm run verify`; report actual outcomes. Never hand-edit generated fixtures.

Required tests:

- Promoted observation maps to correct typed raw observation and floor.
- XP payload permits sourced subsets only; partial attributes/resources remain partial.
- Exact event ID and event-claim ID anchors resolve correctly.
- Missing, ambiguous, wrong-kind, cross-floor, and nonexistent anchors fail actionably without fabricated records/events.
- Unsupported/malformed kind/payload fails validation.
- Event claims retain existing route; state claims are not blindly emitted as events/observations.
- Review/ledger-only claims do not become runtime-ready observations.
- Source IDs, locators, confidence, relationships, and unknowns remain traceable.
- Repeated compile is deterministic; no duplicates; unrelated curated observations remain unchanged.
- Identity/payload/anchor conflicts fail explicitly.
- Observations remain point-in-time and do not leak backward in replay.
- Existing event, raw schema, and floor compilation regressions remain green.

## 10. Scope boundaries

This design does not authorize rewriting Stage 1/Stage 2 prompts in the compiler implementation, broad Floor 1–3 re-research, a UI coverage report or new widgets, a projection/countdown redesign, a new observation model, invented values/IDs/anchors/chronology, treating generated scaffolds as authoritative, or weakening validation to hide curation gaps.

After the compiler work is merged, a separate data-research/curation task should use the improved pipeline to address source-backed observation gaps (especially Floor 3) and verify the result through replay.

## 11. Repository references

- [Research-to-CCI Ingestion Workflow](./research-to-cci-workflow.md) — overall process.
- [Raw Observation Authoring Guide](../../RAW_OBSERVATIONS.md) — raw ownership and observation semantics.
- `app/domain/research-compiler.ts`, `app/domain/types/research.ts`, `app/domain/schema/research-claim.schema.json` — current evidence-claim/compiler contract.
- `app/domain/schema/modeling-decision.schema.json` — CCI-aware decision contract to extend.
- `app/domain/schema/crawler-floor-raw.schema.json` — authoritative raw payload shapes.
- `app/domain/raw-loader.ts`, `app/domain/raw-compiler.ts` — runtime ingestion.
- `docs/DEVELOPMENT.md` — verification workflow.
- [Issue #318](../../issues/318) — implementation tracking; this document is the detailed design authority.
