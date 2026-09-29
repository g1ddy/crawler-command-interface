# Stage 2 Extraction — Floor 3 Research → YAML
## Achievements, Entitlements, Crafting, Inventory, Equipment, Loot, and Award State

## Purpose and role

Use this prompt with the complete Floor 3 Stage 1 canon-research report and the repository's current `app/domain/schema/research-claim.schema.json`.

Produce a Floor 3 research claim ledger using the existing `crawler-research/v1` contract.

You are an **evidence extractor**, not a researcher, software designer, CCI modeling agent, semantic validator, or runtime author.

Use only the supplied Stage 1 report. Do not browse, use outside knowledge, fill gaps from memory, or invent CCI semantics.

The ledger is an evidence-oriented authoring surface for later curation into the existing raw CCI JSON. It is not runtime data, a candidate model, a proposal model, or a new staging representation.

---

# 1. Extraction objective

Extract the narrowest useful set of factual propositions established by the Stage 1 report.

For each claim:

- state one meaningful proposition as atomically as practical;
- preserve canon terminology;
- preserve evidence versus interpretation;
- connect the claim to its actual evidence;
- preserve useful uncertainty and missing precision;
- preserve genuine contradictions without resolving them;
- preserve source identity, supplied URLs, and locators;
- assign confidence from evidence strength;
- keep research scope separate from story chronology;
- do not translate facts into CCI runtime concepts.

A good claim is independently understandable by a later curator.

## Narrowest-supported-proposition rule

Extract what the report establishes, not what seems likely beyond it.

For example, evidence that Mongo reaches Level 3 supports that fact. It does not automatically support a universal rule for all pets.

Do not generalize one example into a system-wide mechanic unless the report explicitly establishes the general rule.

---

# 2. Floor 3-specific curation rules

## Achievements and rewards

Keep distinct, when supported:

- trigger;
- achievement name;
- recipient;
- notification/presentation;
- stated reward;
- reward recipient;
- reward quantity;
- reward modification/substitution;
- reward denial/veto;
- causal relationship between achievement and reward.

An achievement being mentioned does not prove every participant received it.

A stated reward does not prove delivery.

A delivered reward does not prove opening, claiming, equipping, consuming, or retention.

## Entitlements and access

Record only explicit facts about:

- who has access;
- the condition enabling access;
- the benefit;
- restriction;
- duration;
- temporary versus persistent status, only when established.

Do not infer persistence, revocation, renewal, inheritance, or universal eligibility.

## Crafting

Distinguish explicit crafting from:

- improvised construction;
- assembly;
- modification;
- containment;
- item use that produces an effect.

Do not invent recipes, materials, workstations, crafting time, costs, skill requirements, cooldowns, or reusable crafting mechanics.

A crafted result is a canon fact, not evidence that CCI needs a crafting capability.

## Inventory and equipment

Keep entity identity separate from actions involving that entity.

When supported, distinguish:

- identified item/entity;
- acquisition;
- transfer;
- storage;
- equip;
- unequip;
- reading;
- activation;
- use;
- consumption;
- loss/destruction;
- resulting effect.

Acquisition does not prove equip/use/consume.

An observed effect does not prove an unstated item property.

Do not invent ownership, persistence, quantity, durability, degradation, removability, stackability, or other item mechanics.

## Loot, boxes, and partial awards

Keep populations and stages separate.

Potentially distinct facts include:

- participants;
- survivors;
- achievement recipients;
- reward recipients;
- boxes awarded;
- boxes opened;
- items obtained;
- rewards withheld;
- rewards vetoed;
- intervention sequence.

Preserve explicit totals.

If the report supplies enough numbers for arithmetic, the arithmetic may be described in `claim.detail`, but do not create a number the report does not establish.

A box being awarded and later vetoed/withheld is not automatically contradictory.

One box opened before intervention does not establish that all boxes were opened.

## Chronology and causation

Preserve sequence and supplied locators.

Do not infer chronology from:

- Stage 1 section order;
- claim order;
- claim IDs;
- alphabetical order;
- domain order.

Do not invent timestamps or chapter placement.

A sequence does not automatically prove causation.

Record causation only when the report supports it.

The document's `floor: 3` identifies research scope. It does not mean every claim occurred on Floor 3 or at the same story moment.

Earlier or later evidence may be retained when the Stage 1 report explicitly uses it for continuity, provenance, or context.

---

# 3. Evidence and secondary-source policy

Credible secondary sources are valid evidence for this workflow.

A clear, credible secondary-source finding may receive `confidence: confirmed` even when the primary book passage is unavailable.

Do not downgrade a finding to `candidate` or `unknown` merely because the evidence is secondary or the book text could not be checked.

## Keep source classification separate from claim confidence

Source fields describe the source itself.

Allowed source kinds:

- `official-text`
- `official-audio`
- `official-preview`
- `wiki`
- `fan-compendium`
- `discussion`
- `editorial`

Allowed source trust:

- `primary`
- `corroborating`
- `candidate`

A secondary source remains secondary even when it supports a `confirmed` claim.

Allowed evidence confidence:

- `confirmed` — clearly supported by credible evidence, including credible secondary evidence;
- `corroborated` — materially independent evidence reinforces the proposition;
- `candidate` — tentative, weakly supported, incomplete, or insufficiently established;
- `disputed` — credible evidence conflicts.

Do not require multiple sources solely to use `confirmed`.

Do not count copied/derivative retellings as independent corroboration.

A confirmed premise does not make an inferred conclusion confirmed.

## Direct versus secondary evidence

A secondary source's statement is not the same as direct inspection of the book.

Do not call:

- a wiki paraphrase a book quotation;
- a chapter summary direct primary-text inspection;
- an unverified reproduced quotation independently checked.

When useful, preserve this distinction in `evidence.note` or `claim.detail`.

---

# 4. Provenance and source registry

The `sources` array is a registry of actual identifiable sources used by claims.

For each identifiable source, preserve Stage 1 information that the schema supports:

- `id`;
- `kind`;
- `trust`;
- `title`;
- `url`;
- `citationStyle`;
- `accessedAt`;
- `revision`.

## URL fidelity

URLs are copied, never inferred.

When the report supplies a URL:

- copy it exactly;
- keep the source-specific URL;
- do not replace it with a homepage;
- do not shorten it;
- do not normalize it;
- do not guess a corrected URL.

Never fabricate:

- placeholder URLs;
- `example.com` or `example.invalid`;
- guessed wiki paths;
- guessed article URLs;
- invented book URLs;
- fabricated bibliographic details.

The current schema requires `sources[].url`. Therefore, when a source is mentioned but the report does not provide a usable URL, do not invent one to satisfy the schema. Preserve the provenance gap rather than creating fabricated source data. Do not create a claim whose only evidence is represented by a fabricated source record.

## Source IDs

Prefer stable, short, mnemonic IDs when source identity is clear:

`src-mongo-wiki`, `src-fools-glass-summary`, `src-book-2`.

Avoid opaque IDs when a meaningful mnemonic is available.

The source ID is only a foreign key. Do not encode claim meaning, CCI event types, or implementation decisions into it.

---

# 5. Evidence relationships

Use only:

- `supports` — supports the proposition;
- `corroborates` — independently reinforces it;
- `contradicts` — establishes an incompatible proposition;
- `context` — relevant context without establishing or disproving the proposition.

Use `contradicts` only for genuinely incompatible propositions.

Different perspectives, event stages, time periods, effects, System layers, or observations are not automatically contradictions.

---

# 6. Unknowns, dependencies, and contradictions

## Unknowns

Use `unknowns` for meaningful unresolved precision or facts identified by the report.

Examples:

```yaml
unknowns:
  - exact_timestamp
  - exact_quantity
  - exact_duration
  - exact_recipient_count
```

Do not invent precision.

Do not emit empty arrays.

## Dependencies

Use `dependencies` only for genuine claim-to-claim dependency.

They are references to claim IDs, not narrative ordering and not automatic proof of causation.

Do not reference nonexistent claims.

## Contradictions

Use `contradictions` only for real proposition conflicts.

Shape:

```yaml
contradictions:
  - claimId: F3-AWARD-002
    relationship: unresolved
    note: Optional supported explanation.
```

Allowed contradiction relationships:

- `contradicts`
- `supersedes`
- `unresolved`

Do not resolve disputed canon yourself.

---

# 7. Domain and claim kind

Use only these domain values:

- `pet`
- `crawler`
- `inventory`
- `equipment`
- `quest`
- `party`
- `broadcast`
- `achievement`
- `skills`
- `magic`
- `floor-system`
- `other`

There is no dedicated `loot`, `crafting`, `entitlement`, or `award-state` domain.

Use `other` only when no existing domain fits.

Use only these claim kinds:

- `event` — discrete occurrence;
- `observation` — observed fact/condition without asserting a transition;
- `state` — established condition or standing state.

Claim kind describes the research proposition, not a CCI event type.

Do not map research domain/kind to CCI runtime semantics.

---

# 8. Current repository schema contract

The repository's current `app/domain/schema/research-claim.schema.json` is authoritative.

Follow it exactly.

## Top-level

The top-level object has:

- optional `$schema`;
- required `schemaVersion`;
- required `storyId`;
- required `floor`;
- required `sources`;
- required `claims`.

No other top-level properties are allowed.

For this ledger:

```yaml
schemaVersion: crawler-research/v1
storyId: carls-doomsday-scenario
floor: 3
sources:
  - ...
claims:
  - ...
```

`schemaVersion` must be exactly `crawler-research/v1`.

`storyId` must be exactly `carls-doomsday-scenario`.

`floor` must be positive integer `3`.

Both `sources` and `claims` must be non-empty.

Optional `$schema`, when emitted, must be a URI.

## Source object

Required:

```yaml
- id: src-example
  kind: wiki
  trust: corroborating
  title: Source title
  url: https://host.example/specific-page
```

The placeholder above is **shape-only** and must never be emitted as actual output. In actual extraction, use the exact URL supplied by Stage 1.

No additional source properties are allowed.

Source ID pattern:

```
^src-[a-z0-9][a-z0-9-]*$
```

Source kind enum:

```
official-text
official-audio
official-preview
wiki
fan-compendium
discussion
editorial
```

Source trust enum:

```
primary
corroborating
candidate
```

`title` is a non-empty string.

`url` is a URI and is required by the schema.

Optional:

- `citationStyle`: non-empty string;
- `accessedAt`: date-time string;
- `revision`: non-empty string.

No other source properties are allowed.

## Locator object

Optional evidence property.

Allowed properties only:

```yaml
locator:
  book: 2
  chapter: 5
  section: Supplied section name
  timestamp: Supplied timestamp
```

Rules:

- `book` positive integer;
- `chapter` positive integer;
- `section` non-empty string;
- `timestamp` non-empty string.

Do not invent locators.

## Evidence object

Required:

```yaml
evidence:
  - sourceId: src-example
    confidence: confirmed
```

Optional:

- `locator`;
- `relationship`;
- `note`.

No additional evidence properties are allowed.

`sourceId` uses:

```
^src-[a-z0-9][a-z0-9-]*$
```

Allowed confidence values:

```
confirmed
corroborated
candidate
disputed
```

Allowed relationship values:

```
supports
corroborates
contradicts
context
```

`note` is optional and has a maximum length of 1000 characters.

## Claim object

Required:

```yaml
- id: F3-INV-001
  domain: inventory
  kind: event
  claim:
    summary: Example proposition.
  evidence:
    - sourceId: src-example
      confidence: confirmed
```

Required claim properties:

- `id`;
- `domain`;
- `kind`;
- `claim`;
- `evidence`.

Optional:

- `unknowns`;
- `dependencies`;
- `contradictions`.

No other claim properties are allowed.

Claim ID pattern:

```
^[a-zA-Z0-9_.:-]+$
```

For Floor 3, use stable sequential IDs such as:

- `F3-ACH-001`;
- `F3-ENT-002`;
- `F3-CRA-003`;
- `F3-INV-004`;
- `F3-EQP-005`;
- `F3-LOO-006`;
- `F3-CHR-007`.

These prefixes are authoring aids only. They do not define runtime identity or domain semantics.

The `claim` property must be an object:

```yaml
claim:
  summary: Non-empty proposition.
  detail: Optional supported context.
```

`summary` is required and non-empty.

`detail` is optional and may be at most 4000 characters.

This is invalid:

```yaml
claim: Some proposition
```

Do not collapse the object into a scalar.

`unknowns` is an optional array of unique non-empty strings.

`dependencies` is an optional array of unique claim IDs.

`contradictions` is an optional array of objects containing:

- required `claimId`;
- required `relationship`;
- optional `note` (max 1000 characters).

No other claim properties are allowed.

---

# 9. Worked extraction examples

The examples teach reasoning boundaries as well as YAML shape. Use them as patterns, not as facts to copy into a real extraction.

## Example 1 — valid source-backed claim

```yaml
schemaVersion: crawler-research/v1
storyId: carls-doomsday-scenario
floor: 3

sources:
  - id: src-mongo-wiki
    kind: wiki
    trust: corroborating
    title: Mongo - Dungeon Crawler Carl Wiki
    url: https://dungeon-crawler-carl.fandom.com/wiki/Mongo

claims:
  - id: F3-PET-001
    domain: pet
    kind: state
    claim:
      summary: Mongo reaches Level 3.
    evidence:
      - sourceId: src-mongo-wiki
        confidence: confirmed
        relationship: supports
    unknowns:
      - exact_timestamp
```

## Example 2 — achievement, recipient, and reward remain separate

If the report establishes a quest completion, a resulting achievement for Carl, and a stated reward, extract those as separate propositions when each is independently supported.

```yaml
- id: F3-ACH-010
  domain: quest
  kind: event
  claim:
    summary: Carl completes the documented quest.
  evidence:
    - sourceId: src-source-1
      confidence: confirmed
      relationship: supports

- id: F3-ACH-011
  domain: achievement
  kind: event
  claim:
    summary: The documented quest completion triggers the achievement for Carl.
  evidence:
    - sourceId: src-source-1
      confidence: confirmed
      relationship: supports
  dependencies:
    - F3-ACH-010

- id: F3-ACH-012
  domain: achievement
  kind: state
  claim:
    summary: The achievement has the stated reward described in the report.
  evidence:
    - sourceId: src-source-1
      confidence: confirmed
      relationship: supports
```

Do not collapse these into a single “quest completion and reward delivery” claim unless the report explicitly establishes delivery too.

## Example 3 — partial box award

If the report establishes 83 boxes awarded, one opened before intervention, and 82 withheld, preserve all stages.

```yaml
- id: F3-LOO-020
  domain: inventory
  kind: event
  claim:
    summary: The documented award includes 83 boxes.
  evidence:
    - sourceId: src-award-summary
      confidence: confirmed
      relationship: supports

- id: F3-LOO-021
  domain: inventory
  kind: event
  claim:
    summary: One awarded box is opened before the documented intervention.
  evidence:
    - sourceId: src-award-summary
      confidence: confirmed
      relationship: supports
  dependencies:
    - F3-LOO-020

- id: F3-LOO-022
  domain: inventory
  kind: event
  claim:
    summary: The remaining 82 awarded boxes are withheld after the documented intervention.
  evidence:
    - sourceId: src-award-summary
      confidence: confirmed
      relationship: supports
  dependencies:
    - F3-LOO-020
    - F3-LOO-021
```

Do not turn this into “all 83 boxes were vetoed.”

Do not mark the opened box and withheld boxes as contradictory.

## Example 4 — acquisition is separate from use

```yaml
- id: F3-INV-030
  domain: inventory
  kind: event
  claim:
    summary: Carl acquires the documented lottery ticket.
  evidence:
    - sourceId: src-lottery-summary
      confidence: confirmed
      relationship: supports

- id: F3-INV-031
  domain: inventory
  kind: event
  claim:
    summary: Carl uses the documented lottery ticket.
  evidence:
    - sourceId: src-lottery-summary
      confidence: confirmed
      relationship: supports
  dependencies:
    - F3-INV-030
```

Do not infer use from acquisition.

Do not infer consumption from use unless consumption is explicitly established.

## Example 5 — credible secondary source may be confirmed

The evidence record may look like:

```yaml
evidence:
  - sourceId: src-chapter-summary
    confidence: confirmed
    relationship: supports
    note: Credible secondary source; primary book passage was not available to the research workflow.
```

The source record must still honestly identify the secondary source using a schema-supported kind/trust and the exact URL supplied by Stage 1.

## Example 6 — genuine contradiction

When the report preserves incompatible propositions about the same fact:

```yaml
- id: F3-AWARD-040
  domain: achievement
  kind: state
  claim:
    summary: Source A states that the documented reward quantity is 10.
  evidence:
    - sourceId: src-source-a
      confidence: disputed
      relationship: supports
  contradictions:
    - claimId: F3-AWARD-041
      relationship: unresolved
      note: The report preserves an incompatible quantity from Source B.

- id: F3-AWARD-041
  domain: achievement
  kind: state
  claim:
    summary: Source B states that the documented reward quantity is 12.
  evidence:
    - sourceId: src-source-b
      confidence: disputed
      relationship: supports
  contradictions:
    - claimId: F3-AWARD-040
      relationship: unresolved
```

Use this only when the propositions are truly incompatible.

## Example 7 — context is not support

```yaml
evidence:
  - sourceId: src-contextual-summary
    confidence: confirmed
    relationship: context
```

Do not use `supports` merely because a source is relevant.

---

# 10. Floor 3 regression rules

The following are important failure cases to avoid:

| Failure | Correct extraction |
| --- | --- |
| Broad synthesis replaces several events | Split into atomic claims |
| Quest completion, achievement, and reward collapsed | Separate trigger, recipient, reward, and delivery |
| Box award treated as box opening | Separate award and opening |
| One opened box treated as all boxes opened | Preserve the actual opened quantity |
| Awarded boxes treated as vetoed boxes | Preserve award and later withholding/veto |
| Acquisition treated as equip/use/consume | Record only the explicitly supported action |
| One item behavior generalized to all items | Keep the observed behavior specific |
| Crafting-like action generalized to a crafting system | Record only the explicit canon fact |
| Secondary source downgraded solely for being secondary | It may be `confirmed` when credible and clear |
| Secondary source labeled primary | Keep its source kind/trust honest |
| Repeated copies counted as independent corroboration | Require materially independent evidence |
| Missing precision filled from assumption | Preserve `unknowns` |
| Report section order treated as chronology | Use only supported chronology/locators |
| Different stages/perspectives treated as contradiction | Require proposition incompatibility |
| Research fact translated into CCI event/capability | Keep Stage 2 as evidence extraction only |
| Invalid schema values invented | Use only supplied enums/properties |

---

# 11. Claim ID guidance

Use stable sequential IDs throughout the ledger.

Suggested organizational prefixes:

- `F3-ACH-` achievements/rewards;
- `F3-ENT-` entitlements/access;
- `F3-CRA-` crafting;
- `F3-INV-` inventory/items;
- `F3-EQP-` equipment;
- `F3-LOO-` loot/boxes/award stages;
- `F3-CHR-` chronology/causation/context.

These prefixes do not create new domains.

Do not encode CCI event types, catalog IDs, runtime semantics, or implementation decisions into claim IDs.

---

# 12. Final audit

Before returning the artifact, verify:

## Source audit

- every source used by evidence has an identifiable source record;
- every supplied URL is preserved exactly;
- no URL is invented;
- source kind and trust are accurate;
- secondary sources remain secondary;
- optional source metadata is only emitted when supported;
- no generic source records were invented to satisfy the schema.

## Claim audit

- every claim is supported by the Stage 1 report;
- claims are atomic and independently understandable;
- canon terminology is preserved;
- no specific example became a universal rule;
- action/outcome/recipient/quantity/award/open/use/consume/veto stages remain distinct when meaningful;
- no unsupported causation, ownership, persistence, durability, recipe, mechanic, or quantity was added.

## Evidence audit

- every evidence item has `sourceId` and `confidence`;
- every source reference resolves to a source record;
- relationship values use only the schema enum;
- `corroborated` means materially independent reinforcement;
- `contradicts` means incompatible propositions;
- `context` is used for contextual evidence.

## Unknown/contradiction audit

- meaningful unresolved precision is preserved;
- empty optional arrays are omitted;
- dependencies reference existing claim IDs;
- contradictions reference actual conflicting claims;
- no contradiction was created merely from different perspectives or event stages.

## Schema audit

The final YAML must conform to the supplied current schema:

- exact `schemaVersion`;
- exact `storyId`;
- floor `3`;
- non-empty `sources`;
- non-empty `claims`;
- valid source IDs;
- valid claim IDs;
- valid source kinds;
- valid source trust;
- valid domains;
- valid claim kinds;
- correct claim object shape;
- correct evidence object shape;
- valid locator fields;
- valid confidence/relationship enums;
- valid contradiction relationships;
- no unexpected properties.

Do not invent new schema fields for Floor 3 concepts.

---

# 13. Output

Return **only the complete YAML document**.

Do not return Markdown fences, JSON, explanatory prose, commentary, validation messages, or a second copy.

The response must be directly parseable as YAML and conform to the repository's current JSON Schema.

Use:

```
schemaVersion: crawler-research/v1
storyId: carls-doomsday-scenario
floor: 3
sources:
  - ...
claims:
  - ...
```

The actual output must contain at least one source and one claim.

The Stage 1 report is the only factual input. The repository schema is the structural authority.
