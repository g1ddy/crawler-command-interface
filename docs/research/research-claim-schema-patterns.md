# Research Claim Schema — External Pattern Survey and CCI Design

## Status

Design research for issue #221. This is a design input, not the final schema implementation. Repository evidence is authoritative; external patterns inform constraints and failure modes.

## Executive conclusion

CCI should use a small provenance-preserving claim ledger, not a second version of the runtime model.

The intended pipeline is:

    external evidence
          |
          v
    research claim
          |
          v
    evidence / provenance
          |
          v
    interpretation + uncertainty
          |
          v
    explicit modeling / promotion decision
          |
          v
    optional candidate CCI representation
          |
          v
    human/Jules review
          |
          v
    existing CCI raw authoring

JSON Schema is appropriate for structural validation. The JSON Schema specification defines assertions about the structure of JSON instances and supports composition and conditional subschemas. It does not establish semantic truth. See the JSON Schema 2020-12 specification. https://json-schema.org/draft/2020-12/json-schema-core

Structured-output research and current engineering analysis reinforce the same boundary: constrained generation can guarantee output shape, while schema-conforming values can still be semantically wrong or hallucinated. A second semantic/domain validation layer is required. See Liu et al. (2024) and the OpenAI Structured Outputs documentation. https://www.sciencedirect.com/science/article/pii/S0306457324001687 and https://openai.com/index/introducing-structured-outputs-in-the-api/

Therefore:

> The research schema proves that a research artifact is well-formed. It does not prove that the claim is true, sourced correctly, or safe to project into the runtime.

## 1. Repository findings

### Floor 1

The Floor 1 claim ledger preserves Pet/familiar claims that are not yet representable as typed raw events and explicitly warns against inferring mechanics merely to make the model complete.

Implication: a research claim must not require an executable projection.

A record can legitimately remain:

- supported research;
- unresolved research;
- awaiting primary evidence;
- awaiting a domain contract.

### Floor 2

The Floor 2 ledger distinguishes pet acquisition, hostility change, bonding, and persistence across the floor boundary. Those claims became typed Pet events rather than one generic narrative event.

Implication: the research model should retain enough information to explain the modeling decision, but it should not reproduce the final Pet event schema.

### Floor 3

The Floor 3 ledger is the strongest specimen:

    claim
      -> source tier
      -> locator
      -> confidence
      -> modeling category
      -> promotion
      -> resulting CCI artifact
      -> domain ownership

It also demonstrates promoted and ledger-only claims living together, conceptual countdowns without invented runtime values, unknown numerical state, domain handoff, and catalog/reference concepts distinct from replay events.

### Existing executable provenance

Existing raw events use structured evidence such as sourceId, locator, and confidence. The research layer should reference the same source vocabulary where practical rather than inventing a parallel source system.

A research claim needs one additional thing beyond executable evidence: why the claim was or was not promoted.

## 2. External pattern findings

### A. JSON Schema for structure, not truth

JSON Schema is appropriate for:

- required fields;
- types;
- small controlled vocabularies;
- mutually exclusive structures;
- conditional requirements;
- reference shape;
- document-level structural invariants.

Use oneOf, allOf, if/then/else, $defs, and references where they make the contract clearer.

Do not encode canon semantics into the schema.

A schema can assert that a promoted claim has evidence. It cannot assert that a chapter actually proves Mongo reached Level 3.

### B. Separate structural and semantic validation

The external research consistently reinforces this pipeline:

    Layer 1: JSON Schema
      shape / type / required / enum / conditional structure

    Layer 2: CCI research validator
      duplicate IDs
      broken references
      source references
      promotion safety
      unknown safety
      domain rules
      cross-record consistency

Schema validation must never be presented as canon verification. https://www.sciencedirect.com/science/article/pii/S0306457324001687

### C. Keep provenance first-class

The W3C provenance model treats provenance as information describing entities, activities, and agents involved in producing or influencing another entity. CCI should borrow the principle, not implement the full ontology.

The useful CCI subset is:

    claim -> evidence/source -> locator

Optionally:

    claim -> related claim / dependency
    claim -> resulting authored artifact

Do not import a general provenance framework.

### D. Give claims and projections different identities

A research claim and an executable event are different things:

    P3-PET-001
    "The book establishes Mongo reaches Level 3."
            |
            v
    evt-f3-mongo-level-3

The claim ID should survive reclassification or changes to the resulting CCI event ID.

### E. Prefer source references over copied metadata

A research package should have a source registry and claim evidence references rather than repeating URLs and source titles on every claim.

This matches the existing CCI pattern and prevents provenance drift.

### F. Avoid a giant optional claim object

The actual repository examples support:

- a common claim envelope;
- evidence/provenance;
- uncertainty;
- modeling decision;
- optional typed claim payload.

Only make a payload structured where CCI has a real need to validate or compile it.

## 3. Proposed conceptual contract

The final schema should be derived by Jules, but the investigation supports this conceptual shape:

    schemaVersion: crawler-research/v1
    storyId: dcc
    floor: 3

    sources:
      - id: src-book-2
        kind: official-text
        trust: primary
        title: Dungeon Crawler Carl — Book 2
        url: ...

    claims:
      - id: P3-PET-001
        domain: pet
        kind: event

        claim:
          summary: Mongo reaches Level 3.

        evidence:
          - sourceId: src-book-2
            locator:
              chapter: 5
            confidence: confirmed

        modeling:
          decision: promote
          target: Pet progression

        unknowns:
          - exact_timestamp

This is a conceptual example, not a prescribed final schema.

The important separation is:

| Concern | Meaning |
| --- | --- |
| id | Stable research identity |
| domain | CCI ownership/context |
| kind | Shape/semantic class of research claim |
| claim | What the evidence says |
| evidence | Where it comes from |
| modeling | What CCI intends to do with it |
| unknowns | What must not be inferred |
| dependencies | Relationships between claims |

## 4. Classification

The investigation supports keeping domain and claim kind separate.

Domain answers: What CCI area owns this claim?

Examples observed in Floor 3 include pet, crawler, inventory, equipment, quest, party, broadcast/social, achievement, and floor/system.

Kind answers: What sort of research fact is being asserted?

The repository suggests at least event/transition, state/reference, observation, and ledger-only/context.

Equipment and capability should not automatically become top-level claim kinds merely because they were proposed earlier. They may instead be domain/modeling categories or target representations.

## 5. Promotion

The current #223 idea of explicit promotion is directionally correct.

Recommended conceptual states:

    promote
    review
    ledger_only

Promotion means "what may CCI do with this claim?" It does not mean "how confident are we that this statement is true?"

These are independent axes.

For example:

    confidence = confirmed
    promotion = review

is legitimate when the evidence is strong but the runtime lacks an appropriate representation.

Likewise:

    confidence = corroborated
    promotion = ledger_only

is legitimate when the claim is useful research context but not suitable for executable state.

## 6. Confidence and source tier

Keep source trust/tier and claim confidence separate.

Source tier describes the source, such as primary or corroborating.

Claim confidence describes CCI's assessment of the claim based on its evidence.

Derive exact vocabulary from existing sources.json and claim ledgers. Do not introduce a numerical confidence score. A number such as 0.83 implies precision the research process does not possess.

## 7. Unknowns

Unknown must not be represented by omission alone.

The contract should support explicit statements such as:

    unknowns:
      - exact_timestamp

This matters because an omitted field can mean unknown, not applicable, forgotten, or not researched.

The validator should prevent an explicitly unknown precision from being compiled into a fabricated concrete value.

## 8. Contradictions

Do not build a general argumentation or knowledge-graph system.

The minimum useful model is:

    claim A
      evidence -> source 1

    claim B
      evidence -> source 2

    relationship:
      contradicts / supersedes / unresolved

Even this should become formal only if real Floor 1–3 research requires it.

The invariant is more important than the mechanism:

> conflicting evidence must not be silently collapsed into one executable fact.

## 9. Dependencies

Dependencies should mean research dependency, not execution ordering.

For example:

    P3-PET-002 depends on P3-PET-001

Validation should catch duplicate IDs, missing references, self references, and cycles if the selected semantics make cycles invalid.

Do not build a general graph engine.

## 10. Evidence linkage

The strongest direction is:

    research claim ID
          |
          v
    authored CCI artifact
          |
          v
    existing source evidence

The research claim ID should not necessarily replace the current executable evidence object.

A possible future shape is:

    event
      - researchClaimIds: [P3-PET-001]
      - evidence:
          - sourceId / locator / confidence

Whether this belongs in the raw schema should be decided only after Jules traces the current evidence model.

If adding research IDs requires a runtime contract change, #221 should produce a focused follow-up issue rather than silently expanding scope.

## 11. Assessment of PR #223

### Keep

- immutable claim IDs;
- source registry;
- provenance references;
- explicit promotion;
- explicit unknowns;
- dependency references;
- schema validation;
- semantic validation after schema validation;
- deterministic compiler;
- provenance mapping from candidate output back to claims;
- negative fixtures.

### Revisit

- claimType: event | state | ledger_only;
- current domain enum;
- current source trust vocabulary;
- current confidence vocabulary;
- whether stateTransition belongs in the generic envelope;
- whether every promoted claim needs the same provenance shape;
- whether candidate raw representation belongs in the same compiler at all;
- whether the compiler is premature before the contract is proven against Floor 1/2/3.

### Avoid

- generic payloads with unrestricted additionalProperties;
- research fields that exist only for a single Floor 3 example;
- a parallel provenance vocabulary;
- automatic promotion based on confidence;
- direct generation of CCI runtime JSON by the research agent;
- research-schema knowledge leaking into runtime code.

## 12. Recommended implementation boundary

### Phase 1 — this research artifact

Establish external patterns and failure modes. Prevent over-engineering.

### Phase 2 — Jules derives the repository contract

Jules should use this document, #221, and the repository to produce:

1. repository-to-research concept mapping;
2. final small schema;
3. semantic validator rules;
4. representative real fixtures;
5. comparison against #223;
6. explicit retained/changed/discarded concepts.

### Phase 3 — revise #223 (Completed)

PR #223 is now an obsolete historical experiment superseded by merged PR #225 and the follow-up candidate pipeline implementation in issue #222.
- **Retained**: Immutable claim IDs, source registry, provenance references, explicit unknowns, explicit dependencies, structured schema validation (using JSON Schema), and semantic cross-record validation. Negative fixture requirements were kept.
- **Modified**: YAML became the structured input format (`research.yaml` and `modeling-decisions.yaml`) instead of JSON, but JSON Schema validation via Ajv 2020-12 remains the structural gate. Trace mapping compilation combines both artifacts instead of extracting decisions embedded inside claims. Evidence items now carry explicit relationships (`supports`, `corroborates`, `contradicts`, `context`), and candidate projections are strictly separated into disposable candidate outputs with sidecar provenance tracing (`candidate/provenance.json`).
- **Obsolete/Discarded**: PR #223's API and file structure are fully obsolete and replaced by `crawler-research/v1` and `crawler-modeling/v1`. Runtime event payloads embedded inside research claims were abandoned in favor of separate architectural modeling decisions and conservative, disposable candidate projections.

### Phase 4 — #222

Validate and compile the finalized contract.

### Phase 5 — #181 pilot

Use the Pet domain as the first production research workflow.

## 13. Non-goals

This design does not propose:

- a universal research ontology;
- a knowledge graph;
- an argumentation framework;
- probabilistic truth scoring;
- a replacement for sources.json;
- a replacement for CCI raw schemas;
- automatic canon verification;
- automatic promotion;
- direct LLM-to-runtime JSON generation;
- a runtime dependency on research prose;
- a Floor-specific schema.

## 14. Design invariants

These should become architectural tests or review rules:

1. Schema-valid does not mean canon-valid.
2. Research claims and executable events have independent identities.
3. Promotion is explicit.
4. Confidence and promotion are independent.
5. Unknown is not omission.
6. Source provenance is traceable.
7. Research-only claims are valid records.
8. Partial coverage is not negative evidence.
9. Catalog/reference concepts do not automatically become replay events.
10. The research contract must not require invented precision.
11. Existing CCI authoring remains authoritative for executable representation.
12. No Floor-specific special case belongs in the generic research compiler.


## 15. Concrete artifact boundaries

The pipeline should use distinct artifacts because each boundary answers a different question.

### 15.1 Research report — human-oriented

Recommended:

    docs/research/floor-3/<domain>-research.md

or an equivalent research report location.

Purpose:

- preserve the research narrative;
- record source discovery and context;
- explain contradictory evidence;
- retain useful observations that do not become structured claims;
- provide human-auditable context for the structured artifact.

This is **not an input to the CCI compiler**.

Markdown may contain prose, quotations, notes, and links. No runtime or validator should parse arbitrary research prose.

### 15.2 Structured research claim artifact — machine-oriented

Recommended:

    research/<story-or-floor>/<domain>/claims.yaml

The exact repository location is a Jules design decision, but the artifact should be YAML on disk and JSON-compatible in memory.

Conceptual shape:

    schemaVersion: crawler-research/v1

    scope:
      story: dcc
      book: 2
      floor: 3
      domain: pet

    sources:
      - id: src-book-2
        kind: official-text
        trust: primary
        title: ...
        url: ...

    claims:
      - id: P3-PET-001

        statement:
          summary: Mongo reaches Level 3.
          context: ...

        evidence:
          - sourceId: src-book-2
            locator:
              chapter: 5
            relationship: supports

        confidence: confirmed

        unknowns:
          - exact_timestamp

        relatedClaims: []

The structured artifact describes **what the research supports**. It should not contain authoritative CCI event names, raw runtime payloads, or final promotion decisions.

### 15.3 Modeling decision artifact — architecture-oriented

Recommended conceptual shape:

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

        resultingArtifacts:
          - evt-f3-mongo-level-3

The decision artifact is intentionally separate from the research claim.

This permits:

    research claim remains stable
             |
             +--> decision A: ledger_only
             |
             +--> later decision B: promote
             |
             +--> resulting CCI artifact changes

A research correction therefore does not require rewriting the identity of the executable artifact, and a CCI refactor does not rewrite the underlying research.

### 15.4 Candidate projection — generated, disposable

A compiler may produce candidate proposals:

    candidate/
      events.json
      provenance.json

Candidate output is disposable. It is a review artifact, not automatically authoritative raw data.

Candidate target concepts are modeling decisions preserved by the generic candidate compiler. Domain-specific projection adapters/pilots interpret target concepts into CCI event representations. The generic research compiler is not a second CCI domain model and does not hard-code domain field semantics or fabricate executable domain values.

Evidence items marked with `relationship: "contradicts"` block promotion in semantic validation, ensuring contradictory evidence cannot silently produce candidate projections.

The compiler must never overwrite `data/raw/floors/**` merely because a claim was marked `promote`.

### 15.5 CCI raw authoring — authoritative application data

Only after modeling review should data enter:

    data/raw/floors/<floor>/

using the existing CCI schemas and domain conventions.

The existing raw authoring model remains authoritative.

## 16. Programmatic pipeline

The authoritative conceptual pipeline:

    human research report
            ↓
    research.yaml
            ↓
    structural/schema validation
            ↓
    semantic validation
            ↓
    modeling-decisions.yaml
            ↓
    optional disposable candidate projection
            ↓
    human/Jules review
            ↓
    existing CCI raw authoring
            ↓
    existing CCI compiler/runtime

The programmatic pipeline should be deterministic after the research artifact exists.

No stage after structured research ingestion should call an LLM as part of normal compilation.

## 17. Library/tool responsibilities

### YAML parsing

Use the repository's existing YAML dependency rather than introducing another parser.

Responsibility:

    YAML text -> JavaScript value

The parser should not perform domain validation.

### JSON Schema

Use JSON Schema 2020-12 for the research document contract.

JSON Schema 2020-12 supports conditional subschemas and composition mechanisms appropriate for a discriminated research document. The specification explicitly defines conditional application through `if`/`then`/`else`, and Ajv supports the 2020-12 dialect. [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/json-schema-core) [Ajv JSON Schema support](https://ajv.js.org/json-schema)

### AJV

Use the repository's existing Ajv dependency for structural validation.

Use the 2020-12 Ajv entry point if the final schema selects draft 2020-12. Ajv documents that 2020-12 is not backwards-compatible with earlier drafts and therefore uses a dedicated Ajv2020 class. [Ajv JSON Schema documentation](https://ajv.js.org/json-schema)

Do not add a second schema-validation library.

### TypeScript semantic validator

Implement CCI-specific semantic rules in TypeScript.

Recommended internal indexes:

    sourcesById: Map<string, ResearchSource>
    claimsById: Map<string, ResearchClaim>

Optionally:

    decisionsByClaimId: Map<string, ModelingDecision>

The validator should produce structured diagnostics rather than throwing on the first error.

Conceptually:

    interface ValidationDiagnostic {
      code: string;
      severity: "error" | "warning";
      path: string;
      message: string;
      claimId?: string;
    }

At minimum, semantic validation should detect:

- duplicate source IDs;
- duplicate claim IDs;
- missing source references;
- missing claim references;
- self-references;
- invalid dependency relationships;
- invalid claim-to-source relationships;
- promotion/modeling decisions that reference nonexistent claims;
- candidate projections that reference unknown claims;
- explicit unknowns contradicted by a candidate concrete value;
- invalid cross-record combinations that cannot be expressed safely in JSON Schema.

Warnings should not silently become errors unless the repository deliberately promotes the rule.

## 18. Validation stages must be independent

Do not combine all validation into one giant validator.

Recommended API boundary:

    parseResearchDocument()
        -> unknown

    validateResearchSchema()
        -> SchemaValidationResult

    indexResearchDocument()
        -> ResearchIndex

    validateResearchSemantics()
        -> SemanticValidationResult

    compileCandidateProjection()
        -> CandidateArtifacts

This allows each stage to be tested independently.

It also makes failures understandable:

    STRUCTURE_INVALID
    REFERENCE_INVALID
    SEMANTIC_INVALID
    MODELING_INVALID
    PROJECTION_INVALID

A malformed YAML document should fail before semantic validation begins.

A structurally valid but referentially broken document should fail before candidate compilation.

## 19. JSON Schema design rules

The final schema should follow these rules.

### 19.1 Validate the envelope tightly

Require:

- schema version;
- research scope;
- source registry;
- claims.

Reject unknown top-level properties unless a deliberate extension mechanism is established.

### 19.2 Use reusable definitions

Use `$defs` for:

- source;
- locator;
- evidence;
- claim identity;
- confidence;
- relationship;
- unknown marker.

This prevents duplicated definitions from drifting.

### 19.3 Use discriminated structures only where semantics differ

If two claim kinds genuinely have different required structures, use `oneOf` or conditional schemas.

Do not create a dozen variants merely to make the schema look formal.

### 19.4 Avoid unrestricted payload escape hatches

Do not use:

    additionalProperties: true

as a generic way to avoid making design decisions.

If an extension point is needed, make it explicit and isolated, for example:

    extensions:
      <namespace>: ...

The runtime compiler must ignore unknown extension namespaces unless a specific compiler understands them.

### 19.5 Keep IDs syntactically constrained but semantically stable

A claim ID should be:

- non-empty;
- unique within its research document/scope;
- stable after publication;
- safe to reference from other artifacts.

The schema may enforce a conservative syntax, but the semantic validator owns uniqueness.

Do not encode GitHub issue numbers, source URLs, mutable event IDs, or generated timestamps into claim identity.

## 20. Source and evidence model

Use a source registry:

    sources:
      - id: src-book-2
        ...

and references from claims:

    evidence:
      - sourceId: src-book-2
        locator:
          chapter: 5
        relationship: supports

This has several advantages:

- source metadata has one canonical location;
- multiple claims can reference the same source;
- URLs and source names do not drift;
- source-level metadata remains separate from claim-level confidence.

A source describes the provenance object.

An evidence record describes how that source supports, corroborates, conflicts with, or otherwise relates to a specific claim.

This follows the useful principle from the W3C provenance model—preserve lineage as a first-class relationship—without adopting the full PROV ontology. [W3C PROV Primer](https://www.w3.org/TR/prov-primer/)

## 21. Claim confidence, source trust, and disposition

These must remain separate.

### Source trust

Answers:

    How should this source be classified?

Examples may include:

    primary
    corroborating
    tertiary

### Claim confidence

Answers:

    How strongly does the available evidence support this claim?

Use the repository's existing vocabulary once derived. Do not introduce numerical probabilities.

### Modeling disposition

Answers:

    What should CCI do with this claim?

Conceptually:

    promote
    review
    ledger_only

These are independent.

A valid combination is:

    source trust = primary
    confidence = confirmed
    disposition = review

because the evidence may be strong while the runtime representation remains unsettled.

The `promote` disposition explicitly means "accepted for a candidate CCI representation". It does not mean the evidence itself is simply high confidence. A modeling safety rule requires `promote` decisions to possess `confirmed` or `corroborated` confidence, explicitly avoiding the combination of `promote` with `candidate` or `disputed` confidence, ensuring only sufficiently supported claims project forward.

## 22. Unknowns and precision safety

Unknowns must be explicit where their absence could otherwise be mistaken for omission.

Example:

    unknowns:
      - exact_timestamp
      - exact_quantity
      - numerical_item_statistics

The semantic validator should enforce a one-way rule:

    explicit unknown
        |
        +--> may remain unknown
        |
        +--> may be resolved by a later research artifact
        |
        X--> may not silently become a concrete value

This is especially important for countdowns, timestamps, levels, quantities, stats, and item effects.

A compiler may only emit a concrete value when the claim/modeling decision contains evidence sufficient for that precision.

## 23. Modeling decision semantics

The modeling decision is the architectural boundary.

It should answer:

1. Is the claim accepted for CCI modeling?
2. If so, what existing CCI domain concept owns it?
3. What executable representation should result?
4. What information is intentionally not projected?
5. Why is this representation faithful?

It should not copy the entire research claim.

It should reference it by ID.

Conceptually:

    decision
      claimId
      disposition
      target
      rationale
      omittedInformation

The final names are subject to Jules' repository-derived design. (Note: `resultingArtifacts` was deliberately excluded from the current decision schema to avoid premature coupling to mutable runtime artifact IDs before a true candidate compiler exists.)

## 24. Candidate compiler contract

If #223 retains a compiler, it should be a pure transformation:

    compile(
      validatedResearch,
      validatedModelingDecisions
    ) -> CandidateArtifacts

It must:

- be deterministic;
- have no network access;
- have no LLM calls;
- not read arbitrary Markdown;
- not mutate raw data;
- preserve claim IDs in candidate provenance;
- fail closed when a required value is unknown;
- reject decisions targeting nonexistent claims;
- reject projections that cannot satisfy the existing CCI raw schema.

The compiler should not decide whether a claim is true.

It should not infer missing values.

It should not invent timestamps.

It should not select a CCI event type that was not specified by the modeling decision.

## 25. Candidate artifact provenance

Every generated candidate artifact should be traceable back to the research claim(s) that caused it.

Conceptually:

    candidate event
      |
      +-- researchClaimIds
      |
      +-- existing source evidence

The exact placement of research IDs must be derived from the current CCI evidence schema.

If the existing raw schema cannot safely carry research claim IDs, preserve the linkage in a sidecar candidate artifact rather than changing runtime contracts as part of #221.

Example:

    candidate/provenance.json

    {
      "evt-f3-mongo-level-3": {
        "researchClaims": ["P3-PET-001"]
      }
    }

This is preferable to weakening an existing raw schema solely for research metadata.

## 26. Negative fixtures are mandatory

The research compiler must prove that unsafe inputs fail.

At minimum, fixtures should cover:

### Invalid structure

    missing claim ID

Expected:

    JSON Schema failure

### Broken source reference

    evidence.sourceId = src-does-not-exist

Expected:

    semantic validation failure

### Broken dependency

    dependsOn = P3-PET-999

Expected:

    semantic validation failure

### Explicit unknown

    unknowns = [exact_timestamp]

Expected:

    candidate timestamp must not be invented

### Unresolved claim

    disposition = ledger_only

Expected:

    no executable artifact generated

### Review claim

    disposition = review

Expected:

    candidate projection either absent or explicitly non-authoritative

### Valid promotion

    disposition = promote

Expected:

    deterministic candidate artifact with preserved provenance

### Conflicting claims

    claim A supports X
    claim B contradicts X

Expected:

    conflict preserved; no automatic winner selected

## 27. Determinism and reproducibility

Given the same:

    research artifact
    +
    modeling decision artifact
    +
    compiler version

the candidate output should be byte-for-byte stable wherever practical.

Do not include:

- current timestamps;
- random IDs;
- network-fetched metadata;
- unordered object iteration;
- LLM-generated text;
- environment-specific paths.

If candidate files contain generated metadata, make it deterministic or explicitly exclude it from reproducibility comparisons.

This makes the research compiler suitable for CI.

## 28. CLI boundary

The eventual implementation should expose small commands rather than one opaque command.

Conceptually:

    npm run research:validate -- claims.yaml
    npm run research:semantic-validate -- claims.yaml
    npm run research:compile -- claims.yaml modeling-decisions.yaml
    npm run research:check -- claims.yaml modeling-decisions.yaml

The exact npm scripts are a Jules implementation decision.

A combined command may orchestrate the stages, but each stage should remain independently callable for debugging and tests.

## 29. Failure handling

The pipeline should fail closed.

Rules:

- invalid schema -> stop;
- broken references -> stop;
- invalid modeling decision -> stop;
- explicit unknown required for projection -> stop;
- unsupported target representation -> stop;
- ambiguous/conflicting claims without an explicit modeling decision -> do not project;
- compiler exception -> no partial raw-data mutation.

Do not produce a partially updated `data/raw` directory.

Candidate output should be written to a separate location and promoted only after validation/review.

## 30. Ownership model

The intended ownership is:

| Artifact / operation | Owner |
| --- | --- |
| Research report | researcher / Gemini / human |
| Structured claims | researcher / Gemini / human |
| Schema | CCI architecture / Jules |
| Structural validator | program |
| Semantic validator | CCI code |
| Modeling decisions | Jules / human |
| Candidate compiler | program |
| Candidate review | Jules / human |
| Final raw authoring | Jules / human |
| Raw compiler/runtime | existing CCI |
| CI verification | program |

LLM-generated modeling proposals may be useful, but they should be represented as proposals and must not silently become authoritative modeling decisions.

## 31. Recommended repository layout

Do not create this layout until Jules confirms it fits the existing repository conventions, but the conceptual separation is:

    docs/research/
      ...
    
    data/research/
      floor-3/
        pet/
          claims.yaml
          modeling-decisions.yaml

    app/domain/research/
      types.ts
      schema.ts
      semantic-validator.ts
      compiler.ts

    app/domain/schema/
      research-claim.schema.json
      modeling-decision.schema.json

    tests/research/
      fixtures/
        valid/
        invalid/
      research-schema.test.mjs
      research-semantic.test.mjs
      research-compiler.test.mjs

The exact paths should follow existing CCI architecture and naming conventions. This layout is an implementation target, not a requirement to create every directory.

## 32. Recommended TypeScript interfaces

These are conceptual contracts to guide implementation, not final public APIs.

    interface ResearchDocument {
      schemaVersion: string;
      scope: ResearchScope;
      sources: ResearchSource[];
      claims: ResearchClaim[];
    }

    interface ResearchClaim {
      id: string;
      domain: string;
      kind: string;
      statement: ResearchStatement;
      evidence: ResearchEvidence[];
      confidence: string;
      unknowns?: string[];
      relatedClaims?: ResearchRelation[];
    }

    interface ResearchEvidence {
      sourceId: string;
      locator?: ResearchLocator;
      relationship: "supports" | "corroborates" | "contradicts" | "context";
    }

    interface ModelingDecision {
      claimId: string;
      disposition: "promote" | "review" | "ledger_only";
      target?: {
        domain: string;
        concept: string;
      };
      rationale: string;
      resultingArtifacts?: string[];
    }

These names and enums remain provisional until Jules derives them from the existing CCI model.

## 33. Implementation sequence for a sandbox coding agent

A coding agent implementing #221/#222 should work in this order.

### Step 1 — inspect

Read:

    data/raw/floors/floor-1/**
    data/raw/floors/floor-2/**
    data/raw/floors/floor-3/**
    loaders
    compilers
    schemas
    existing evidence types
    existing tests
    #223

Do not edit code yet.

### Step 2 — produce a repository mapping

Create a design note/table showing:

    existing CCI concept
        -> research concept
        -> evidence
        -> modeling decision
        -> executable representation

Every proposed enum must have at least one real repository example.

### Step 3 — derive schemas

Create the smallest JSON Schema capable of expressing the real examples.

Validate the schema itself.

Do not start with the complete Floor 3 research corpus.

### Step 4 — build representative fixtures

Use real patterns from Floors 1–3.

Include positive and negative cases.

### Step 5 — implement semantic validation

Build indexes first, then reference checks, then domain-specific invariants.

Keep semantic rules outside JSON Schema when they depend on relationships between records.

### Step 6 — model decisions

Create a small modeling-decision fixture that references the research claims.

Prove that the claim artifact itself contains no authoritative runtime projection.

### Step 7 — implement candidate compilation

Only after validation and decision fixtures work.

The compiler should be pure and deterministic.

### Step 8 — compare #223

Explicitly document:

    retained
    changed
    removed

Do not preserve an abstraction merely because it already exists.

### Step 9 — integrate with existing CCI

Only now determine whether research IDs need to enter raw CCI evidence.

If so, create a focused follow-up if the raw contract must change.

### Step 10 — verify

Run:

    npm run verify

and all research-specific tests.

The implementation is complete only when existing CCI verification remains green.

## 34. Definition of done for #221/#222 boundary

The architecture is ready for the #181 pilot when:

- a researcher can create a structured claim artifact without knowing CCI runtime event schemas;
- AJV can reject malformed research artifacts;
- TypeScript semantic validation can reject broken references;
- unknown precision cannot silently become a value;
- research claims have stable IDs;
- provenance can be traced to existing source records;
- modeling decisions are separate from claims;
- ledger-only claims remain valid;
- review claims do not silently compile;
- promoted claims can produce deterministic candidate output;
- candidate output never mutates authoritative raw data;
- candidate output can be traced back to claim IDs;
- #223's useful implementation ideas have been reconciled with the repository;
- the existing CCI compiler remains unchanged unless a separately justified contract change is required.

## 35. Updated architectural principle

The research system should be thought of as a **compiler-adjacent evidence pipeline**, not an alternative CCI domain model.

Its job is:

    discover
      -> record
      -> validate
      -> preserve provenance
      -> expose modeling decisions
      -> optionally project

CCI's job remains:

    author
      -> compile
      -> project
      -> render
      -> replay

That separation lets research become richer without forcing the runtime to understand research concepts it does not need.

## Recommended decision

Proceed with #221 as a repository-derived design exercise, using this research as external input.

Do not merge the current #223 implementation unchanged.

The current #223 PR is a useful prototype and provides concrete implementation ideas, but the repository evidence shows that its abstraction should remain a hypothesis until Jules reconciles it against the actual Floor 1/2/3 model.

## References

- JSON Schema 2020-12 specification: https://json-schema.org/draft/2020-12/json-schema-core
- Liu et al. (2024), Are LLMs good at structured outputs?: https://www.sciencedirect.com/science/article/pii/S0306457324001687
- OpenAI, Introducing Structured Outputs in the API: https://openai.com/index/introducing-structured-outputs-in-the-api/
- W3C PROV-DM: https://www.w3.org/TR/prov-dm/
