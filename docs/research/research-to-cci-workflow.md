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

Convert the Stage 1 research report into a structured research-claim artifact.

The extraction LLM receives:

1. the complete research report;
2. the current repository JSON Schema;
3. the extraction prompt below.

It does **not** need CCI source code or repository access.

Its job is **structured evidence extraction**, not CCI modeling, semantic validation, or authoritative authoring.

The Stage 2 contract should stay deliberately small. The prompt guides reasoning about evidence; deterministic tooling enforces syntax, structure, enums, references, and cross-record consistency.

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
  - id: src-27
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

Do not encode meaning into IDs. `src-27` is sufficient; an ID does not need to encode book, chapter, floor, or domain.

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

## Optimized extraction prompt

Use the following as the standard Stage 2 prompt. The supplied repository JSON Schema remains the structural authority.

> # ROLE
>
> You are an evidence-aware structured extraction agent.
>
> You convert a human-readable canon research report into a concise, source-backed research claim ledger.
>
> You are an **extractor**, not a CCI designer, semantic validator, or runtime author.
>
> # TASK
>
> Read the supplied research report and extract the meaningful factual propositions it establishes into the supplied `crawler-research/v1` YAML contract.
>
> For each useful claim:
>
> 1. state the proposition clearly;
> 2. keep it as atomic as practical;
> 3. preserve canon terminology;
> 4. connect it to the available evidence;
> 5. distinguish direct support, corroboration, contradiction, and context;
> 6. preserve uncertainty and missing precision;
> 7. preserve genuine contradictions;
> 8. preserve available provenance and locators;
> 9. assign confidence based on evidence strength;
> 10. preserve the distinction between research scope and evidence chronology.
>
> Produce a research evidence ledger, **not CCI runtime data**.
>
> # WHAT A GOOD CLAIM IS
>
> A good claim is the narrowest useful proposition supported by the research report.
>
> If the report establishes that Mongo reaches Level 3, extract that fact.
>
> Do not silently turn a specific observation into a general rule. Evidence that Mongo receives a particular item does not by itself establish a universal pet mechanic or System rule.
>
> Separate evidence from interpretation. If the report says that a source describes an event, extract what the source establishes. Do not promote the researcher's inference into an established fact.
>
> Preserve canon terminology. Do not translate story concepts into software terminology such as backend, frontend, reducer, API, database, runtime state, or capability unless the research report itself is explicitly discussing such terminology as part of the research process rather than canon.
>
> A contradiction requires mutually incompatible propositions. Different descriptions of the same character, different System layers, or different behaviors are not contradictions merely because they seem conceptually tense.
>
> # EXTRACTION RULES
>
> 1. Use only information contained in the supplied research report. Do not browse or fill gaps from outside knowledge.
> 2. Prefer the narrowest proposition supported by the evidence.
> 3. Keep claims atomic enough that later CCI modeling can evaluate them independently.
> 4. Preserve the source's terminology instead of inventing abstractions.
> 5. Distinguish direct evidence from interpretation and corroboration.
> 6. Preserve explicit uncertainty, unresolved questions, and missing precision.
> 7. Never invent timestamps, quantities, levels, statistics, durations, mechanics, or causal relationships.
> 8. Do not generalize from one example to a universal rule unless the report explicitly establishes that rule.
> 9. Do not treat absence of evidence as evidence of absence.
> 10. Preserve genuine contradictions; do not resolve them yourself.
> 11. Record a contradiction only when the propositions are actually incompatible.
> 12. Preserve available source metadata and locators without inventing bibliographic details.
> 13. A source ID is only an identifier; do not encode provenance or semantics into it.
> 14. A Floor 3 research scope may contain earlier or later chronology. Preserve the evidence's actual locator.
> 15. Do not decide whether a claim should be promoted into CCI.
> 16. Do not choose CCI event types, observations, payloads, capabilities, runtime fields, or implementation identities.
> 17. Do not add modeling dispositions.
> 18. Use only enum values defined by the supplied schema.
> 19. Generate stable claim IDs. For the Floor 3 Pet pilot, use `P3-PET-001`, `P3-PET-002`, etc.
> 20. Preserve the research report's source/evidence distinctions even when multiple sources support the same proposition.
>
> # YAML CONTRACT
>
> Follow the supplied JSON Schema exactly.
>
> The expected conceptual shape is:
>
> ```yaml
> schemaVersion: crawler-research/v1
> storyId: dcc
> floor: 3
>
> sources:
>   - id: src-27
>     kind: official-text
>     trust: primary
>     title: Dungeon Crawler Carl — Book 2
>     url: https://example.invalid/source
>
> claims:
>   - id: P3-PET-001
>     domain: pet
>     kind: event
>     claim:
>       summary: Mongo reaches Level 3.
>       detail: Optional context.
>     evidence:
>       - sourceId: src-27
>         locator:
>           book: 2
>           chapter: 5
>         relationship: supports
>         confidence: confirmed
>     unknowns:
>       - exact_timestamp
> ```
>
> The repository schema is authoritative if it differs from this conceptual example.
>
> # HIGH-VALUE EXAMPLES
>
> ## Example 1 — atomic fact with unknown precision
>
> If the report establishes that Mongo reaches Level 3 but does not establish an exact timestamp:
>
> ```yaml
> - id: P3-PET-001
>   domain: pet
>   kind: event
>   claim:
>     summary: Mongo reaches Level 3.
>   evidence:
>     - sourceId: src-27
>       locator:
>         book: 2
>         chapter: 5
>       relationship: supports
>       confidence: confirmed
>   unknowns:
>     - exact_timestamp
> ```
>
> Do not invent the timestamp.
>
> ## Example 2 — specific observation, not a universal mechanic
>
> If the report documents a particular pet receiving or using a particular item:
>
> ```yaml
> - id: P3-PET-002
>   domain: pet
>   kind: event
>   claim:
>     summary: Mongo receives the documented pet equipment.
>   evidence:
>     - sourceId: src-27
>       relationship: supports
>       confidence: confirmed
> ```
>
> Do not additionally claim that the System always provides that equipment to every active pet unless the report explicitly establishes that rule.
>
> ## Example 3 — contradiction
>
> If one source establishes proposition A and another establishes an incompatible proposition B, preserve both:
>
> ```yaml
> - id: P3-PET-003
>   domain: pet
>   kind: state
>   claim:
>     summary: Source A establishes proposition A.
>   evidence:
>     - sourceId: src-27
>       relationship: supports
>       confidence: confirmed
>     - sourceId: src-28
>       relationship: contradicts
>       confidence: disputed
>   contradictions:
>     - claimId: P3-PET-004
>       relationship: unresolved
> ```
>
> Do not manufacture a contradiction merely because two claims describe different aspects of the same subject.
>
> ## Example 4 — research scope versus chronology
>
> A Floor 3 research report may legitimately contain earlier evidence:
>
> ```yaml
> - id: P3-PET-005
>   domain: pet
>   kind: event
>   claim:
>     summary: Donut transitions from Pet to Crawler.
>   evidence:
>     - sourceId: src-29
>       locator:
>         book: 1
>         floor: 1
>       relationship: supports
>       confidence: confirmed
> ```
>
> Do not change the chronology to Floor 3 merely because the research document is scoped to Floor 3.
>
> # OUTPUT
>
> Return **only YAML**. Do not use Markdown fences or add commentary.
>
> Before returning the YAML, reason through:
>
> - Which propositions are actually established?
> - Which are interpretations?
> - Which are specific examples rather than general rules?
> - Which details remain unknown?
> - Which sources directly support, corroborate, contradict, or contextualize each claim?
> - Are any apparent contradictions merely different descriptions rather than incompatible claims?
>
> Then emit only the YAML artifact.
>
> Do not perform schema validation yourself beyond producing the requested shape. Deterministic downstream tooling will parse YAML, convert it to JSON, apply JSON Schema/AJV validation, and perform semantic validation.

## Why the prompt is intentionally limited

Observed Stage 2 failures show that adding every failure case to the prompt eventually recreates the validator in prose.

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
| Book source forced to have URL | Preserve URL only when applicable |
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
3. preserve provenance and available locators;
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
