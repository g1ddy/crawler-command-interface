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
                  | YAML parse
                  v
             JSON object
                  |
                  | JSON Schema / AJV
                  v
          structural validation
                  |
                  | semantic validation
                  v
          validated research claims
                  |
                  v
                 STAGE 3
       modeling-decisions.yaml
                  |
                  v
       disposable candidate review
                  |
                  v
           human / Jules review
                  |
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
| `research.yaml` | Structured claims and provenance | Research artifact |
| Validated research object | Machine-checked research | Research artifact |
| `modeling-decisions.yaml` | Explicit CCI modeling decisions | Review decision |
| Candidate proposal | Disposable review output | Non-authoritative |
| `data/raw/floors/**` | Executable CCI authoring | **Authoritative** |
| Generated runtime state | Application execution/replay | Existing CCI pipeline |

A research artifact never becomes authoritative merely because it passes JSON Schema validation.

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

> # Dungeon Crawler Carl — Pet Research for CCI
>
> ## Role
>
> You are performing canon research for an application that recreates the Crawler interface from *Dungeon Crawler Carl*.
>
> Your job is to produce an evidence-rich research report about **Pet / Pet Progression / Pet Condition / Pet Equipment / Pet Deployment**.
>
> You are a researcher, not an application designer.
>
> Do NOT invent application fields, runtime state, event names, JSON structures, or implementation details.
>
> The downstream system will separately decide how supported evidence should be modeled.
>
> ## Research scope
>
> Focus on **Book 2 / Floor 3**, while using earlier material only when necessary to establish continuity.
>
> The primary subject is Mongo and his relationship with Donut.
>
> Investigate:
>
> 1. **Mongo's progression**
>    - Level changes
>    - Explicitly stated levels
>    - Physical growth
>    - Training
>    - Combat participation
>    - Any explicitly stated progression mechanics
>
> 2. **Mongo's condition**
>    - Injuries
>    - Fatigue
>    - Recovery
>    - Rest
>    - Temporary conditions
>    - Any explicitly named condition or status
>
> 3. **Mongo's equipment**
>    - Magical fang caps
>    - Acquisition
>    - Who provides them
>    - What they demonstrably do
>    - Any other explicitly documented pet equipment
>
> 4. **Pet containment / deployment**
>    - Magical pet carrier
>    - When it is acquired
>    - Whether Mongo is active, contained, stored, released, transported, etc.
>    - Circumstances where Mongo must or may be contained
>    - Any explicit restrictions on deployment
>
> 5. **Behavioral effects**
>    - Meat Hooks
>    - Any magical, environmental, or system effect that changes Mongo's behavior
>    - Distinguish explicit effects from interpretation
>
> 6. **Pet examples used to establish the broader system**
>    - Miriam's pet/goat
>    - Lucia Mar's dog
>    - Other relevant pet examples
>
> 7. **Donut's relationship to Mongo**
>    - Bond
>    - Ownership/control language
>    - Any explicit system consequences of the relationship
>
> ## Evidence requirements
>
> Prefer sources in this order:
>
> 1. The published text of *Dungeon Crawler Carl*
> 2. Official author material
> 3. High-quality secondary sources that directly quote or accurately reference the text
> 4. Other secondary summaries only when necessary
>
> For every substantive claim, provide:
>
> - Book
> - Chapter or other precise locator when available
> - A short quotation or close textual reference where copyright limits permit
> - Source
> - Whether the evidence directly states the claim or merely supports an interpretation
>
> Do not treat a secondary summary as equivalent to primary text.
>
> ## Critical distinction: fact vs inference
>
> Explicitly distinguish:
>
> **DIRECT** — the text directly establishes the fact.
>
> **CORROBORATED** — the fact is supported by multiple sources, but the primary text may not be directly available.
>
> **INFERRED** — the fact is a reasonable interpretation but is not directly stated.
>
> **UNKNOWN** — the research does not establish the requested detail.
>
> Never convert an inference into a fact.
>
> If the text establishes that Mongo grows but gives no exact size, report the growth and mark exact size as unknown. If an event clearly occurred but no exact timestamp is given, do not invent one.
>
> ## Important negative rule
>
> Absence of evidence is NOT evidence of absence.
>
> Do not claim that Mongo did not have something unless the text explicitly establishes its absence. Instead state that no evidence was found establishing it.
>
> ## Chronology
>
> Construct a chronological Pet timeline for Floor 3.
>
> For each entry provide:
>
> - approximate sequence/order;
> - chapter when known;
> - subject;
> - event/fact;
> - evidence;
> - confidence;
> - unresolved details.
>
> Do not invent timestamps.
>
> ## Known areas to verify
>
> Specifically verify or correct:
>
> - Mongo persists from Floor 2 as Donut's bonded pet.
> - Mongo has explicitly documented progression around levels 4, 6, and 13.
> - Mongo grows physically.
> - Mongo participates in combat.
> - Mongo suffers injury.
> - Mongo experiences fatigue/rest/recovery.
> - Mongo receives magical fang caps.
> - Mongo uses a magical pet carrier.
> - Mongo can be contained/stored/released.
> - There are circumstances where pet deployment is restricted.
> - Meat Hooks has an effect on pet behavior.
> - Miriam's goat and Lucia Mar's dog provide examples relevant to the pet system.
>
> Do NOT assume any of these are correct merely because they are listed here. Verify each one.
>
> ## Separate system concepts from Mongo-specific facts
>
> Distinguish:
>
> - Mongo-specific fact;
> - Donut/Mongo relationship;
> - general pet-system rule;
> - example involving another pet;
> - interpretation.
>
> If Mongo uses a carrier, do not conclude that all pets require carriers unless the text establishes that broader rule.
>
> ## Output structure
>
> Produce a detailed Markdown research report with:
>
> 1. Executive Summary
> 2. Sources
> 3. Pet System Evidence
> 4. Mongo Chronology
> 5. Progression
> 6. Condition / Injury / Recovery
> 7. Equipment
> 8. Carrier / Deployment / Containment
> 9. Behavioral Effects
> 10. Donut / Mongo Relationship
> 11. Other Pet Examples
> 12. Explicitly Supported Facts
> 13. Corroborated but Secondary Facts
> 14. Inferences
> 15. Unknowns / Unresolved Questions
> 16. Potential Contradictions
> 17. Recommended Follow-up Research
>
> The report will be consumed by a separate LLM that converts evidence into a strict machine-readable research claim format.
>
> **Do not produce YAML or JSON.**
>
> The purpose of this stage is to maximize evidence quality, provenance, uncertainty, and traceability.

---

# Stage 2 — LLM-Assisted Research → YAML

## Goal

Convert the Stage 1 report into the structured research-claim artifact.

The extraction LLM:

- receives the research report;
- receives the JSON Schema;
- does not need repository access;
- does not need CCI source code;
- does not decide CCI modeling;
- does not create runtime events.

The output is a **research evidence ledger**, not executable CCI data.

## Inputs

Provide the extraction model:

1. the complete Stage 1 research report;
2. the current JSON Schema;
3. the extraction prompt below.

Do not provide the model with an outdated schema embedded in a prompt if the repository schema has changed. The repository schema is the contract.

## Research YAML conceptual schema

The current CCI implementation uses the `crawler-research/v1` contract. The following is a conceptual representation; the repository's JSON Schema is authoritative.

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
    citationStyle: optional
    accessedAt: optional
    revision: optional

claims:
  - id: P3-PET-001
    domain: pet
    kind: event

    claim:
      summary: Mongo reaches Level 3.
      context: Mongo's progression on Floor 3.

    evidence:
      - sourceId: src-book-2
        locator:
          book: 2
          chapter: 5
        relationship: supports
        confidence: confirmed
        note: optional

    unknowns:
      - exact_timestamp

    dependencies:
      - P3-PET-000

    contradictions:
      - claimId: P3-PET-099
        relationship: unresolved
        note: optional
```

### Schema principles

The research schema intentionally contains:

- stable claim identity;
- research domain;
- research kind;
- factual statement;
- source registry;
- evidence references;
- evidence relationship;
- confidence;
- unknowns;
- optional research dependencies;
- optional contradictions.

It intentionally does **not** contain:

- CCI event payloads;
- reducer state;
- runtime fields;
- UI fields;
- authoritative event IDs;
- modeling dispositions;
- automatic promotion instructions.

### Evidence relationship

Every evidence item should identify its relationship to the claim:

| Relationship | Meaning |
| --- | --- |
| `supports` | Source directly supports the claim |
| `corroborates` | Source independently reinforces the claim |
| `contradicts` | Source conflicts with the claim |
| `context` | Source provides context but does not establish the claim |

The relationship is important because a source appearing in the evidence list does not necessarily support the claim.

### Confidence

Confidence describes the strength of the evidence, not what CCI should do with the claim.

Current vocabulary:

- `confirmed`
- `probable`
- `candidate`
- `disputed`

Do not use numerical probabilities.

### Unknowns

Unknowns are explicit safety constraints.

Examples:

```yaml
unknowns:
  - exact_timestamp
  - exact_quantity
  - exact_duration
  - numerical_item_statistics
```

An explicit unknown must never silently become a concrete value later.

---

## Stage 2 extraction prompt

### Prompt

> # Dungeon Crawler Carl Research → Structured Claims
>
> ## Role
>
> You are a structured-data extraction agent.
>
> You are given:
>
> 1. a human-readable research report;
> 2. a JSON Schema defining the required research-claim format.
>
> Your job is to extract the report's supported claims into the schema.
>
> You are NOT the application designer.
>
> You are NOT deciding how CCI should represent the information.
>
> You are NOT allowed to invent facts that are not supported by the research report.
>
> ## Primary rule
>
> Extract evidence; do not invent application state.
>
> The output is a research evidence ledger.
>
> It is NOT CCI runtime data.
>
> It is NOT a replacement for CCI's raw-floor data.
>
> It is NOT a modeling decision document.
>
> ## What counts as a claim?
>
> Create a claim when the research report establishes a meaningful factual proposition relevant to the requested domain.
>
> Examples:
>
> - Mongo reaches Level 3.
> - Mongo receives a magical tracking collar.
> - Mongo is injured during a particular encounter.
> - Mongo uses a magical pet carrier.
> - Donut and Mongo have an explicitly documented bond.
>
> Do NOT create claims merely because something might be useful to an application.
>
> ## Preserve uncertainty
>
> If the report says a value is unknown, preserve that unknown.
>
> If the report establishes that Mongo grows but gives no exact size, record the growth and preserve exact size as unknown.
>
> Do NOT invent a value.
>
> ## Do not turn implications into facts
>
> If the report says Mongo is placed in a carrier during transport, do not create a universal rule that all pets require carriers unless the research explicitly establishes it.
>
> ## Evidence relationships
>
> Every evidence entry MUST have exactly one relationship:
>
> - supports
> - corroborates
> - contradicts
> - context
>
> Use `supports` when the source directly supports the claim.
>
> Use `corroborates` when it independently reinforces the claim without being the primary direct statement.
>
> Use `contradicts` when the source conflicts with the claim.
>
> Use `context` when the source provides surrounding information without establishing the claim.
>
> ## Confidence
>
> Confidence describes what the evidence warrants.
>
> It does NOT mean whether the claim should be included in the application.
>
> Use:
>
> - confirmed — directly established by strong evidence;
> - probable — strong but not completely direct;
> - candidate — plausible and worth retaining for review;
> - disputed — conflicting or materially uncertain.
>
> Never change confidence merely because a fact would be useful to the application.
>
> ## Unknowns
>
> Record details that the research explicitly leaves unresolved.
>
> Typical examples:
>
> - exact_timestamp
> - exact_quantity
> - exact_level
> - exact_duration
> - exact_location
> - exact_effect
> - acquisition_chapter
>
> Only include an unknown when it is relevant and genuinely unresolved.
>
> ## Contradictions
>
> If the research identifies conflicting evidence:
>
> - preserve both claims when appropriate;
> - use the contradiction structure;
> - do not silently choose one version;
> - do not resolve a contradiction merely because one version seems more convenient.
>
> ## Claim IDs
>
> Generate stable, deterministic IDs.
>
> For the Floor 3 Pet pilot use:
>
> P3-PET-001
> P3-PET-002
> P3-PET-003
>
> and so on.
>
> Do not use random UUIDs.
>
> Do not renumber an existing claim merely because another claim is added.
>
> ## Domain and kind
>
> Use the supplied schema vocabulary.
>
> For this extraction task, use:
>
> `domain: pet`
>
> unless the claim genuinely belongs to another domain represented by the schema.
>
> Choose `kind` based on the shape of the evidence:
>
> - event — something happened;
> - state — an established condition/status;
> - observation — a documented observation without asserting a state transition;
> - relationship — relationship between entities;
> - system — broader system behavior/rule.
>
> Do not create a new enum value.
>
> ## Research report is authoritative for extraction
>
> Do not browse the web to fill gaps.
>
> Do not add information from your own knowledge.
>
> Do not silently correct the research report.
>
> If the report is incomplete, represent the available evidence and preserve the gap.
>
> ## Do not perform CCI modeling
>
> Do NOT add:
>
> - CCI event names;
> - runtime payloads;
> - raw-floor JSON;
> - reducer state;
> - projection state;
> - UI fields;
> - application capabilities;
> - promotion decisions;
> - candidate runtime objects;
> - implementation-specific IDs.
>
> Those decisions happen later.
>
> ## Output requirements
>
> Return ONLY YAML.
>
> The YAML MUST conform to the supplied JSON Schema.
>
> Required top-level fields:
>
> `schemaVersion`
> `storyId`
> `floor`
> `sources`
> `claims`
>
> Every claim must contain:
>
> `id`
> `domain`
> `kind`
> `claim`
> `evidence`
>
> Every evidence entry must contain:
>
> `sourceId`
> `relationship`
> `confidence`
>
> Every sourceId must refer to a source in the `sources` array.
>
> Every dependency must refer to an existing claim ID.
>
> Every contradiction must refer to an existing claim ID.
>
> Do not output Markdown fences.
>
> Do not output commentary before or after the YAML.
>
> ## Self-check before producing output
>
> Before returning YAML:
>
> 1. Check every source reference.
> 2. Check every claim ID is unique.
> 3. Check every dependency reference.
> 4. Check every contradiction reference.
> 5. Check every evidence relationship.
> 6. Check every confidence value.
> 7. Check that no unsupported facts were invented.
> 8. Check that explicit unknowns were preserved.
> 9. Check that no promotion decisions were added.
> 10. Check that no CCI runtime representation was invented.
> 11. Check that the output is valid YAML.
> 12. Check that it conforms to the supplied JSON Schema.
>
> If the research report does not establish something, leave it unknown rather than guessing.

---

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

# Stage 4 — Candidate Projection

The candidate compiler is deterministic and disposable.

```
validated research
        +
validated modeling decisions
        |
        v
compileCandidateProjection()
        |
        +--> candidate proposal
        |
        +--> provenance sidecar
```

The generic compiler must:

- be deterministic;
- have no network access;
- make no LLM calls;
- not parse arbitrary Markdown;
- not mutate `data/raw/floors/**`;
- preserve research claim IDs;
- preserve explicit unknowns;
- fail closed when required information is unavailable;
- reject references to unknown claims;
- reject unsupported target representations.

It must not:

- decide whether a claim is true;
- invent values;
- invent timestamps;
- infer missing mechanics;
- silently choose an event type;
- become a second CCI domain model.

## Candidate identity

Research and executable identities remain independent.

Example:

```
P3-PET-001
"The evidence establishes Mongo reaches Level 3."
        |
        v
candidate-... / review proposal
        |
        v
event-f3-mongo-level-3
```

The research claim ID is the stable evidence identity.

The eventual CCI event ID belongs to the executable representation.

---

# Stage 5 — Human / Jules Review

Candidate output is reviewed before authoritative authoring.

Review should ask:

1. Does the evidence actually support the claim?
2. Is the provenance adequate?
3. Are unknowns preserved?
4. Does the modeling decision match the evidence?
5. Does the target map to an existing CCI domain concept?
6. Is any precision being invented?
7. Does the resulting representation fit existing Floor 1/2 conventions?
8. Does the representation preserve replay semantics?
9. Is a new domain contract genuinely necessary?
10. Should the claim remain research-only?

Claims that cannot safely map to the current CCI model should remain in the research ledger or become an explicit follow-up rather than forcing the runtime to accommodate them.

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

compileCandidateProjection(
  validatedResearch,
  validatedModeling
)
  -> CandidateProjection
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
