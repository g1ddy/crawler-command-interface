# Research-to-CCI Ingestion Workflow

## Status

Living workflow documentation for the CCI research-ingestion pipeline.

This document defines the practical handoff between:

1. canon research;
2. LLM-assisted extraction into structured YAML;
3. deterministic parsing and validation;
4. CCI-aware semantic validation;
5. explicit modeling decisions;
6. disposable candidate projection;
7. human/Jules review;
8. authoritative CCI raw authoring.

It is intended to be referenced by domain research issues such as #181 rather than repeating the entire workflow in every issue.

The workflow is deliberately conservative:

> **LLMs discover and extract evidence. Deterministic code validates structure and internal consistency. CCI-aware modeling decides what the evidence means operationally. Existing raw-floor data remains authoritative.**

---

## 1. End-to-end pipeline

```
                 STAGE 1
          Canon / Deep Research
                  |
                  v
        human-readable report.md
                  |
                  |  evidence extraction
                  v
                 STAGE 2
          Extraction LLM + schema
                  |
                  v
             research.yaml
                  |
                  | YAML parse + schema validation
                  v
          validated research.yaml
                  |
                  | research compiler (compileRawDraft)
                  v
          deterministic raw JSON draft
         (data/raw/floors/<floor>/ or draft dir)
                  |
                  | existing CCI raw JSON validation
                  v
          validation errors (missing CCI mappings)
                  |
                  | human / Jules curation
                  v
       data/raw/floors/<floor>/*
                  |
                  | existing CCI compiler
                  v
             runtime state
```

### Representation boundaries

| Representation | Purpose | Authority |
| --- | --- | --- |
| Research report | Human-auditable evidence gathering | Research source |
| `research.yaml` | Structured claims and provenance | Evidence-oriented authoring format |
| Raw JSON draft (`.tmp/...`) | Mechanically compiled draft items | Non-authoritative draft |
| `data/raw/floors/**` | Executable CCI authoring | **Authoritative** |
| Generated runtime state | Application execution/replay | Existing CCI pipeline |

Research YAML is an evidence-oriented authoring format. It is not another runtime model.
The compiler automates mechanical translation but intentionally leaves unresolved CCI mappings incomplete so existing validation exposes the remaining curation work.

A research artifact never becomes authoritative merely because it passes JSON Schema validation.

---

## Core design intent: authoring scaffold, not finished data

The compiler is an authoring assistant, not an authoritative-data generator. Its purpose is to eliminate repetitive mechanical work between the research ledger and CCI raw-data authoring while refusing to invent CCI domain semantics.

The output is therefore an incomplete, raw-shaped authoring scaffold. It must be syntactically valid JSON, but it does not need to pass the CCI raw-data schema.

Intentional validation failures are expected whenever the research evidence does not establish a required CCI mapping. Those failures are the curation checklist for Jules/human review.

The compiler's success criterion is not "generated output is validator-clean." It is "mechanical authoring work has been eliminated and every remaining domain decision is explicit and actionable."

Raw-shaped does not mean raw-valid.
Intentional schema incompleteness (such as unpopulated event `type` discriminators) must be distinguished from malformed JSON or compiler defects.

---

# Stage 1 — Canon Research

## Goal

Produce a detailed, evidence-rich research report that another model can extract into structured claims.

The researcher should optimize for:

- primary-source evidence;
- precise locators;
- chronology;
- explicit uncertainty;
- contradictions;
- distinction between direct facts and inference.

The research agent does **not** need to know CCI's internal schema.

It should not produce CCI events, runtime payloads, reducer state, or application JSON.

## Pet research prompt

The following prompt is the standard starting point for the Floor 3 Pet pilot.

### Prompt

The reusable Floor 3 Pet canon-research prompt is maintained separately:

[Stage 1 — Canon / Deep Research Prompt](./prompts/stage-1-canon-research.md)


---

# Stage 2 — LLM-Assisted Research → YAML

## Goal

Convert the Stage 1 research report into a structured research-claim artifact.

The extraction LLM receives:

1. the complete research report;
2. the current repository JSON Schema;
3. the extraction prompt below.

It does **not** need CCI source code or repository access.

Its job is **structured evidence extraction**, not CCI modeling, semantic validation, or authoritative authoring.

The Stage 2 contract should stay deliberately small. The prompt guides reasoning about evidence; deterministic tooling enforces syntax, structure, enums, references, and cross-record consistency.

### Source identifiability

A source record represents an **actual identifiable source**, not merely a source category or generic canon corpus. A source ID is only a stable foreign key; it is not provenance by itself.

Stage 2 should preserve enough identifying information to distinguish the source when the research report provides it:

- books: specific book identity and available bibliographic information;
- web sources: specific page/work title and URL;
- interviews, articles, wikis, and other sources: specific work/page/interview identity and available locators.

Do not create generic records such as `src-canon-general`, `src-book`, or `src-wiki` merely to satisfy the schema. If the report does not identify the source precisely, preserve the provenance gap rather than inventing a plausible source. Likewise, do not require a URL where the source does not have one.

### Prompt examples are part of the extraction contract

The Stage 2 prompt is itself an input to the extraction model, so examples are not neutral formatting samples. They teach the model what a successful extraction looks like. An example that uses a generic source identity, an invented URL, or an unnecessary placeholder can reinforce exactly the behavior the contract is intended to prevent.

For that reason, examples should demonstrate **source fidelity**, not merely schema shape:

- use an identifiable, mnemonic source ID when the source identity is known;
- preserve the exact URL supplied by the research report for web sources;
- omit `url` when the source has no supplied URL, such as a book;
- never use placeholder URLs such as `example.com` or `example.invalid`;
- never invent bibliographic details to make an example look complete;
- prefer realistic, traceable source metadata over generic examples when illustrating provenance.

This is a prompt-design lesson, not a downstream validation rule. Deterministic validation can reject malformed or structurally invalid source records, but it cannot reliably correct an LLM that has been taught the wrong provenance behavior by its own examples.

The same principle applies to claim examples: they should demonstrate the desired reasoning boundary without smuggling in unsupported generalizations, false contradictions, or software abstractions.

## What a good Stage 2 extraction does

A good extraction follows this reasoning sequence:

1. Identify meaningful claims established by the research report.
2. Make each claim as atomic as practical.
3. Preserve the terminology used by the source/report.
4. Separate what the evidence directly establishes from interpretation.
5. Preserve uncertainty and missing precision.
6. Preserve genuine contradictions rather than resolving them.
7. Record provenance and available locators.
8. Distinguish direct support, corroboration, contradiction, and context.
9. Assign confidence based on the strength of the evidence for the proposition.
10. Keep research scope separate from the chronology of individual evidence.
11. Avoid making CCI modeling or promotion decisions.
12. Output only the research YAML contract.

### The narrowest-supported-proposition rule

Prefer the **narrowest proposition actually established by the evidence**.

If the report documents one pet receiving a particular item, extract that fact. Do not turn it into a general System rule unless the report explicitly establishes the rule.

For example, evidence that Mongo receives pet-specific equipment does not by itself establish that the System dynamically changes all loot tables whenever any active pet exists.

Similarly, evidence that one character exhibits a behavior does not establish a universal pet mechanic.

### Evidence is not implementation

Research claims may describe canon concepts such as pets, crawlers, equipment, achievements, System behavior, or interface behavior. They must not be translated into CCI concepts such as:

- runtime state;
- reducer actions;
- application events;
- UI components;
- capabilities;
- database records;
- API payloads;
- executable event IDs;
- promotion/disposition decisions.

Those decisions belong to later CCI-aware modeling.

### Contradiction means incompatibility

Only record a contradiction when the evidence establishes **mutually incompatible propositions**.

Different perspectives, terminology, behaviors, or layers of the System are not contradictions merely because they appear conceptually tense.

For example, an AI addressing a character in a pet-oriented manner does not contradict a separate claim that the System has mechanically registered that character as a Crawler.

### Scope is not chronology

The document-level `floor` identifies the research scope. Individual evidence retains its own chronology.

A Floor 3 research report may contain useful Book 1 or Book 2 evidence. Preserve the actual book/chapter/section locator when supplied rather than rejecting the claim because it predates the research scope.

### Research completeness is not promotion

Stage 2 should extract useful claims even when they are not currently known to map cleanly to CCI.

The extractor must not decide:

- whether a claim should be promoted;
- whether a claim is runtime-relevant;
- which CCI event or observation represents it;
- whether a new domain contract is required.

Those decisions belong to Stage 3.

## Conceptual schema

The repository's **current JSON Schema is authoritative**. The example below illustrates the intended contract; it is not a replacement for the repository schema.

```yaml
schemaVersion: crawler-research/v1
storyId: dcc
floor: 3

sources:
  - id: src-book-2
    kind: official-text
    trust: primary
    title: Dungeon Crawler Carl — Book 2
    url: https://example.invalid/source

claims:
  - id: P3-PET-001
    domain: pet
    kind: event
    claim:
      summary: Mongo reaches Level 3.
      detail: Mongo's progression is explicitly described in the researched material.
    evidence:
      - sourceId: src-27
        locator:
          book: 2
          chapter: 5
        relationship: supports
        confidence: confirmed
    unknowns:
      - exact_timestamp
```

### Source records

A source ID is an identifier, not provenance by itself.

For each source, preserve the information supplied by the research report, such as:

- source ID;
- source kind;
- trust classification;
- title;
- URL when applicable;
- bibliographic information when applicable;
- other schema-supported metadata.

Do not require a URL for sources that do not have one, such as books.

Prefer **stable, short, mnemonic source IDs** when the source identity is clear. For example, use `src-book-2`, `src-donut-wiki`, or `src-interview-1` rather than opaque incremental IDs such as `src-27`. Mnemonic IDs give the extraction model a useful retrieval cue when the same source is referenced repeatedly.

Do not overload IDs with locator or claim semantics. Avoid IDs such as `src-book-2-chapter-14-mongo-leveling-secondary-fandom`; book, chapter, trust, domain, and other metadata belong in structured fields. If no useful mnemonic is available, a simple stable identifier such as `src-27` is acceptable.

### Claim records

Claims should contain:

- stable ID;
- domain;
- claim kind;
- factual proposition;
- evidence references;
- explicit unknowns when relevant;
- dependencies only when genuinely established;
- contradictions only when genuinely established.

Use an object for the `claim` field when required by the supplied schema:

```yaml
claim:
  summary: Mongo reaches Level 3.
  detail: Optional additional context.
```

Do not collapse an object-shaped claim into a scalar:

```yaml
# Incorrect when the schema expects an object
claim: Mongo reaches Level 3.
```

### Evidence relationships

Use only values allowed by the supplied schema. The current conceptual vocabulary is:

- `supports` — evidence directly supports the proposition.
- `corroborates` — evidence independently reinforces it.
- `contradicts` — evidence establishes an incompatible proposition.
- `context` — evidence provides relevant context but does not establish the proposition.

Do not invent relationship kinds.

### Confidence

Use only confidence values defined by the supplied schema. The current conceptual vocabulary is:

- `confirmed`
- `probable`
- `candidate`
- `disputed`

Confidence describes the strength of evidence for the **claim**, not whether CCI should implement it.

A secondary source can support a claim with high confidence when the research report clearly establishes the proposition, but that does not make the source primary or make the claim automatically authoritative CCI data.

### Unknowns

Preserve meaningful unknowns explicitly:

```yaml
unknowns:
  - exact_timestamp
  - exact_quantity
  - exact_duration
```

Do not invent precision merely because the downstream application might prefer a concrete value.

Omission of an unknown does not mean the value is known; extract an explicit unknown when the research report identifies missing precision or when the requested fact remains unresolved.

## Prompt

The reusable Stage 2 extraction prompt is maintained separately:

[Stage 2 — Research → YAML Extraction Prompt](./prompts/stage-2-research-yaml-extraction.md)


## Why the prompt is intentionally limited

Observed Stage 2 failures show that adding every failure case to the prompt eventually recreates the validator in prose.

One refinement is especially important: **prompt examples are behavioral guidance**. During the extraction pilot, a conceptual source example that used a placeholder URL (`example.com`/`example.invalid`) undermined the adjacent provenance rule by demonstrating fabricated completeness. The example was more likely to be copied than the prose rule was to override it. We therefore treat examples as part of the contract's teaching surface: every example must itself obey the provenance and evidence rules we want Gemini to follow.

The extraction prompt should also avoid exposing internal design reasoning. The workflow records why the prompt has these boundaries; the Gemini-facing prompt should contain the operational extraction rules and examples needed to produce the artifact, not the retrospective reasoning used to design those rules.

The prompt should therefore teach **reasoning principles**, while deterministic tooling enforces **mechanical constraints**.

### LLM reasoning belongs in the prompt

The extractor should reason about:

- what constitutes a useful claim;
- atomicity;
- evidence versus interpretation;
- canon terminology;
- uncertainty;
- genuine contradictions;
- source provenance;
- evidence relationships;
- confidence;
- chronology versus research scope;
- the boundary between evidence extraction and CCI modeling.

### Deterministic enforcement belongs downstream

The parser/schema/semantic validator should enforce:

- YAML syntax;
- property names;
- object/scalar shape;
- required fields;
- enum values;
- ID uniqueness;
- foreign-key integrity;
- source references;
- claim references;
- schema compliance;
- cross-record consistency.

This division is deliberate. The Stage 2 prompt should not become a prose implementation of AJV or the CCI semantic validator.

## Known failure patterns to use as regression cases

The following failures are particularly valuable as Stage 2 regression fixtures:

| Failure | Expected behavior |
| --- | --- |
| `claim: "..."` when an object is required | Produce the schema-defined claim object |
| Invented relationship/system enum | Use only supplied schema enums |
| Specific example generalized into universal mechanic | Keep the claim specific |
| Missing exact timestamp/quantity | Preserve as unknown |
| Source ID treated as provenance | Use the source registry and evidence locator |
| Generic source category presented as a source | Require an identifiable source when the report provides one; otherwise preserve the provenance gap |
| Book source forced to have URL | Preserve URL only when applicable |
| Missing source details filled with invented provenance | Preserve the deficiency; never fabricate source identity, URL, or bibliographic details |
| Floor 3 scope treated as evidence restriction | Preserve actual chronology |
| Strong source claim automatically treated as CCI promotion | Keep promotion out of Stage 2 |
| Different system behaviors labeled contradictory | Require actual proposition incompatibility |
| Secondary evidence treated as primary | Preserve source trust independently from claim confidence |
| One broad synthesis replaces multiple atomic facts | Prefer independently reviewable claims |
| Canon term replaced with software abstraction | Preserve canon terminology |

The supplied research output should be judged against these principles rather than against a requirement that the LLM reproduce the validator's logic.

## Stage 2 acceptance criteria

A useful Stage 2 implementation should demonstrate that it can:

1. extract atomic, source-backed claims;
2. preserve source terminology;
3. preserve identifiable source provenance and available locators;
4. preserve meaningful unknowns;
5. distinguish evidence from interpretation;
6. avoid generalizing examples into system-wide mechanics;
7. preserve genuine contradictions without resolving them;
8. avoid false contradictions;
9. keep research scope separate from chronology;
10. keep evidence confidence independent from CCI modeling disposition;
11. emit only the supplied contract's structural vocabulary;
12. leave structural and semantic enforcement to deterministic validation.

The output should be considered a **research artifact**, not authoritative CCI data, even when every structural and semantic validation check passes.

# Stage 2.5 — Deterministic YAML → JSON Validation

## The important architectural decision

The YAML-to-JSON conversion should **not** be another LLM task.

Use deterministic code:

```
research.yaml
    |
    v
YAML parser
    |
    v
JavaScript object / JSON-compatible value
    |
    v
AJV JSON Schema validation
    |
    v
CCI semantic validation
    |
    v
validated research document
```

The conversion itself is mechanical.

## Responsibility of each validator

### YAML parser

Answers:

> Is this valid YAML that can be parsed?

It should not decide whether the research is true.

### JSON Schema / AJV

Answers:

> Does the parsed object conform to the research contract?

It catches:

- missing required fields;
- incorrect types;
- invalid enum values;
- malformed evidence;
- malformed sources;
- malformed claims;
- unexpected properties;
- invalid schema version;
- structural violations.

The repository's existing AJV setup should remain the structural validation gate.

### CCI semantic validator

Answers:

> Does a structurally valid research document make internal sense?

It should detect things that JSON Schema cannot conveniently express, including:

- duplicate source IDs;
- duplicate claim IDs;
- missing source references;
- missing claim references;
- self-references where invalid;
- invalid dependency relationships;
- invalid contradiction relationships;
- modeling decisions referencing nonexistent claims;
- candidate proposals referencing unknown claims;
- contradictory evidence entering candidate projection;
- explicit unknowns being violated by concrete projection values;
- other cross-record consistency rules.

Semantic validation is CCI-specific code. It is not part of the extraction LLM.

---

# Stage 2.6 — Optional LLM Review / "Polishing"

An LLM may optionally review the validated artifact for **problems**, but it should not silently rewrite the artifact.

Preferred pattern:

```
validated research.yaml
        |
        v
optional review LLM
        |
        v
diagnostics / suggested corrections
        |
        v
human or deterministic correction
        |
        v
validate again
```

Example diagnostic:

```json
{
  "claimId": "P3-PET-007",
  "problem": "Evidence is marked supports, but the research report describes this source as contextual.",
  "suggestedChange": {
    "relationship": "context"
  }
}
```

Avoid:

```
LLM → JSON → LLM polish → trusted JSON
```

The second LLM could alter claims without a deterministic audit trail.

If a correction is accepted, rerun the complete validation pipeline.

---

# Stage 3 — Modeling Decisions

Once research claims are validated, CCI-aware modeling begins.

This stage requires repository access because the model must understand:

- existing Pet domain contracts;
- raw-floor schemas;
- existing events;
- projections;
- provenance;
- loaders;
- compiler behavior;
- tests;
- Floors 1–3 examples.

The key question changes from:

> What does the evidence establish?

to:

> How, if at all, should CCI represent it?

## Modeling decision conceptual schema

```yaml
schemaVersion: crawler-modeling/v1

decisions:
  - claimId: P3-PET-001

    disposition: promote

    target:
      domain: pet
      concept: progression

    rationale: >
      The claim is sufficiently supported and maps to an
      existing Pet-domain representation without invented precision.
```

Current conceptual dispositions:

- `promote`
- `review`
- `ledger_only`

### Critical distinction

```
confidence = evidence strength

disposition = CCI modeling decision
```

They are independent.

For example:

```yaml
confidence: confirmed
disposition: review
```

is valid when the evidence is strong but the CCI representation is not yet established.

Likewise, `promote` means:

> eligible for disposable candidate-review projection

It does **not** mean:

> automatically write authoritative runtime data.

---

# Stage 4 — Raw Draft Compilation

The research draft compiler (`compileRawDraft`) is deterministic and outputs ordinary CCI raw floor JSON structures.

```
validated research (research.yaml)
        |
        v
compileRawDraft()
        |
        v
raw-shaped draft (target raw floor directory)
```

The direct raw compiler must:

- be deterministic;
- have no network access;
- make no LLM calls;
- not parse arbitrary Markdown;
- not mutate `data/raw/floors/**`;
- preserve research claim IDs;
- preserve explicit unknowns;
- preserve evidence and locators;
- leave unpopulated CCI fields unpopulated.

It must not:

- decide whether a claim is true;
- invent values;
- invent timestamps;
- infer missing mechanics;
- silently choose an event type;
- become a second CCI domain model.

---

# Stage 5 — Human / Jules Curation & Raw Validation

The generated raw JSON draft is reviewed and curated in the working tree.

Curation workflow:

1. Run existing CCI raw floor validation (`validateRawCrawlerFloor`) against the draft.
2. Unpopulated fields (e.g. missing required event `type`) produce actionable validation errors.
3. Jules/human resolves validation errors by supplying the explicit CCI domain mappings.
4. Once valid, the curated events are placed into `data/raw/floors/<floor>/events.json`.

Claims that cannot safely map to the current CCI model remain in `data/raw/research/floor-3/pet-research.yaml` as research context without forcing runtime extensions.

---

# Stage 6 — Authoritative CCI Raw Data

Only after review should supported information enter:

```
data/raw/floors/<floor>/
```

For Floor 3 Pet work this means using the existing conventions for:

- `floor.json`;
- `sources.json`;
- `events.json`;
- `observations.json`;
- `catalog.json`;
- `countdowns.json`;
- `claim-ledger.md`.

The existing CCI raw schemas and compiler remain authoritative.

Research ingestion must not become a second runtime model.

---

# Validation matrix

| Stage | Mechanism | Failure examples |
| --- | --- | --- |
| Research | Human/research LLM | weak source, missing locator, unsupported inference |
| YAML parsing | YAML library | malformed YAML |
| Structural | AJV / JSON Schema | missing field, invalid enum, wrong type |
| Semantic | CCI validator | broken source reference, duplicate claim ID |
| Modeling | Human/Jules + modeling schema | invalid disposition, unknown claim, unsupported target |
| Candidate | Deterministic compiler | unknown executable value, unsupported projection |
| Authoring | Existing CCI schemas/compiler/tests | invalid raw data, broken replay behavior |
| Final | `npm run verify` | repository-wide regression |

---

# Recommended implementation APIs

The implementation should retain independent boundaries rather than one opaque command.

Conceptually:

```ts
parseResearchDocument(input)
  -> unknown

validateResearchSchema(document)
  -> SchemaValidationResult

indexResearchDocument(document)
  -> ResearchIndex

validateResearchSemantics(document, index)
  -> SemanticValidationResult

validateModelingDecisions(document, researchIndex)
  -> ModelingValidationResult

compileRawDraft(
  validatedResearch
)
  -> RawCompilationResult
```

The exact public API names remain subject to the repository implementation.

The important property is that each stage can be tested independently.

---

# Failure behavior

The pipeline fails closed.

| Condition | Behavior |
| --- | --- |
| Invalid YAML | Stop |
| Invalid JSON Schema | Stop |
| Broken source reference | Stop |
| Broken claim reference | Stop |
| Invalid modeling decision | Stop |
| Explicit unknown required for projection | Stop |
| Unsupported target | Stop |
| Contradictory evidence | Preserve/block projection |
| Review disposition | No authoritative projection |
| Ledger-only disposition | No executable projection |
| Compiler exception | No raw-data mutation |

Never partially update authoritative raw data during candidate compilation.

---

# Testing strategy

The test suite should cover both positive and negative cases.

Minimum research fixtures:

1. primary-supported promoted claim;
2. corroborating evidence;
3. context-only evidence;
4. ledger-only claim;
5. explicit unknown;
6. contradictory evidence;
7. missing source reference;
8. missing claim reference;
9. duplicate claim ID;
10. independent confidence/disposition;
11. deterministic candidate identity;
12. preserved research claim provenance;
13. no invented timestamp;
14. no invented quantity;
15. candidate compiler does not mutate inputs;
16. candidate output is not treated as authoritative runtime state.

For the Pet pilot, add domain-specific tests for the actual CCI representation selected by the modeling decision.

---

# What each LLM does and does not know

## Deep Research LLM

### Knows

- story/canon scope;
- research questions;
- source priorities;
- evidence requirements.

### Does not need

- CCI source code;
- CCI runtime schemas;
- CCI event types;
- repository architecture.

### Produces

`research.md`

---

## Extraction LLM

### Knows

- Stage 1 research report;
- JSON Schema;
- extraction rules;
- controlled vocabularies.

### Does not need

- CCI source code;
- CCI runtime implementation;
- GitHub issues;
- domain event definitions.

### Produces

`research.yaml`

---

## CCI-aware coding agent / Jules

### Knows

- repository;
- research schema;
- research YAML;
- modeling schema;
- existing CCI domain contracts;
- raw-floor schemas;
- loaders/compiler;
- tests.

### Produces

- modeling decisions;
- candidate review;
- authoritative raw authoring after review.

---

# Pet pilot example

A single fact should travel through the system like this:

```
BOOK TEXT

"Mongo reaches Level 3."
        |
        v
STAGE 1

Research report:
Mongo reaches Level 3.
Book 2, chapter N.
Primary evidence.
Exact event timestamp unknown.
        |
        v
STAGE 2

P3-PET-001
domain: pet
kind: event
claim:
  summary: Mongo reaches Level 3.
evidence:
  - sourceId: src-book-2
    locator:
      chapter: N
    relationship: supports
    confidence: confirmed
unknowns:
  - exact_timestamp
        |
        v
VALIDATION

YAML parses
        +
JSON Schema valid
        +
semantic references valid
        |
        v
STAGE 3

claimId: P3-PET-001
disposition: promote
target:
  domain: pet
  concept: progression
        |
        v
CANDIDATE

Disposable Pet progression proposal.
Claim ID and unknown timestamp preserved.
        |
        v
REVIEW

Jules confirms existing Pet representation is sufficient.
No timestamp invented.
        |
        v
AUTHORITATIVE CCI

Existing Floor 3 events/observations representation.
Existing source provenance.
Existing CCI compiler.
        |
        v
RUNTIME

Mongo progression can participate in replay.
```

This example demonstrates why the research claim and the eventual CCI event should not be the same object.

---

# Rules for future domain pilots

For #181–#186:

1. Start from the research questions for that domain.
2. Produce the research report before modeling.
3. Give the extraction LLM the current schema, not repository code.
4. Validate deterministically.
5. Keep research claims independent from modeling decisions.
6. Review modeling against actual CCI code.
7. Generate only disposable candidates.
8. Author only reviewed facts into `data/raw/floors/**`.
9. Preserve unknowns.
10. Do not infer absence from omission.
11. Do not introduce domain mechanics merely because the research artifact can describe them.
12. Do not modify the generic research contract for a single domain gap without a separate architectural justification.
13. Run `npm run verify`.

---

# Architectural invariant

The complete workflow can be summarized as:

```
Research discovers.
Extraction structures.
Schema validates shape.
Semantic validation checks consistency.
Modeling decides meaning.
Candidate compilation proposes.
Human/Jules reviews.
CCI raw authoring establishes authority.
Existing CCI compilation produces runtime state.
```

Or more compactly:

> **Evidence → structured claims → validation → modeling decision → candidate → review → authoritative CCI authoring.**

The research system is therefore a **compiler-adjacent evidence pipeline**, not an alternative CCI domain model.