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
- deterministic compilation;
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

### Phase 3 — revise #223

Rewrite #223 against the repository-derived contract rather than patching the current abstraction until it happens to fit.

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

## Recommended decision

Proceed with #221 as a repository-derived design exercise, using this research as external input.

Do not merge the current #223 implementation unchanged.

The current #223 PR is a useful prototype and provides concrete implementation ideas, but the repository evidence shows that its abstraction should remain a hypothesis until Jules reconciles it against the actual Floor 1/2/3 model.

## References

- JSON Schema 2020-12 specification: https://json-schema.org/draft/2020-12/json-schema-core
- Liu et al. (2024), Are LLMs good at structured outputs?: https://www.sciencedirect.com/science/article/pii/S0306457324001687
- OpenAI, Introducing Structured Outputs in the API: https://openai.com/index/introducing-structured-outputs-in-the-api/
- W3C PROV-DM: https://www.w3.org/TR/prov-dm/
