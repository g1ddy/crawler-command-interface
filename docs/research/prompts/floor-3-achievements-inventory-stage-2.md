# Stage 2 Extraction — Floor 3 Research → YAML
## Achievements, Entitlements, Crafting, Inventory, Equipment, Loot, and Award State

### Purpose and input
Use this prompt with the complete Stage 1 report and the repository's current `app/domain/schema/research-claim.schema.json`. Produce a Floor 3 claim ledger using the existing `crawler-research/v1` contract.

You are an evidence extractor, not a researcher, software designer, or CCI modeling agent. Use only the supplied report; do not browse or fill gaps from memory.

The ledger is an evidence-organizing authoring surface for later curation into existing raw CCI JSON. It is not runtime data, an application model, or a new staging representation.

### Claim granularity
Extract the narrowest useful proposition supported by the report. Keep claims independently understandable. Split distinct actions, outcomes, recipients, items, quantities, and causal relationships when meaningful.

For example, keep quest completion, achievement/recipient, reward upgrade, box opening, resulting item, and later veto as separate claims when supported. Do not collapse them into “everyone received the reward.”

### Curation rules

**Achievements and rewards:** Separate trigger, recipient, notification, stated reward, reward modification, and causal link. Record causation only when supported. Do not infer every participant received an achievement or reward.

**Entitlements:** Record explicit access/entitlement, recipient, condition, benefit, restriction, and duration only as supported. Do not generalize one character's access route or invent persistence.

**Crafting:** Preserve the source's description. Distinguish explicit crafting from improvised construction, containment, or item use. Do not invent recipes, materials, workstations, timers, or universal mechanics. A crafted result does not imply CCI should expose a crafting capability.

**Inventory/equipment:** Keep identity separate from acquisition, transfer, storage, equip/unequip, reading, use, consumption, loss, and effect. Acquisition does not prove equip/use. An effect does not prove an unstated property. Do not invent persistence, durability, degradation, removability, or quantity.

**Loot/partial awards:** Keep participant, survivor, achievement recipient, reward recipient, box, opened/claimed, item, and vetoed/withheld counts distinct. Preserve explicit totals; show derived arithmetic in detail when the report supplies inputs. A box awarded then vetoed is not inherently contradictory. One box opened before intervention does not establish a universal reward-delivery rule.

**Chronology:** Preserve supported sequence and locators. Do not infer timestamps, chapter placement, or ordering from report section order. `floor: 3` is research scope, not a claim every fact occurred at the same point in the story.

### Evidence and secondary-source policy
Credible secondary sources are valid evidence. A clear, credible secondary-source finding may be extracted with `confidence: confirmed` even when the primary book passage is unavailable. Do not downgrade it to `candidate` or `unknown` solely because it is secondary or the book text could not be checked.

Keep source identity and claim confidence separate:
- Source records honestly identify a wiki, chapter summary, discussion, editorial, official source, or other source using schema-supported `kind` and `trust`.
- Confidence reflects how well the evidence supports that proposition.
- Secondary evidence remains secondary even when it supports a confirmed claim.
- A source's direct statement is not the same as direct inspection of the book.
- Do not describe a secondary paraphrase as a book quotation.
- If a secondary source reproduces a purported quotation, note that distinction.
- Do not count repeated copies of one underlying account as independent corroboration.
- Preserve material disagreement, uncertainty, and inference.
- Confirmed premises do not automatically make an inferred conclusion confirmed.
- Do not require multiple sources solely to use confirmed.

Use schema confidence values:
- `confirmed`: clearly supported by credible evidence for this workflow, including credible secondary evidence.
- `corroborated`: materially independent evidence reinforces it.
- `candidate`: tentative, weakly supported, or incompletely established.
- `disputed`: credible evidence conflicts.

### Provenance and relationships
Create one source record for each identifiable source used by claims. Preserve the Stage 1 title, exact URL when supplied, source type, and metadata. Do not invent URLs, titles, locators, bibliographic details, or primary-source records not consulted.

Use only schema evidence relationships: `supports`, `corroborates`, `contradicts`, `context`. Use `contradicts` only for incompatible propositions. Different event stages or perspectives are not automatically contradictions.

Preserve useful locators and notes. Use `unknowns`, `dependencies`, and `contradictions` only when supported. Do not add empty fields.

### Domain and kind
Use only schema domains: `pet`, `crawler`, `inventory`, `equipment`, `quest`, `party`, `broadcast`, `achievement`, `skills`, `magic`, `floor-system`, `other`.
Use only claim kinds: `event`, `observation`, `state`.

Choose the best existing domain; do not invent `loot`, `crafting`, `entitlement`, or `award-state`. Use `other` only if no specific domain fits. Claim kind describes the proposition, not a CCI event type.

### Document and ID contract
Use:
```yaml
schemaVersion: crawler-research/v1
storyId: carls-doomsday-scenario
floor: 3
sources: []
claims: []
```

The top-level document contains only `schemaVersion`, `storyId`, `floor`, `sources`, and `claims`. Follow the supplied repository schema exactly.

Use stable sequential claim IDs `F3-INV-001`, `F3-INV-002`, etc., in supported chronological/authoring order. This prefix is a ledger identifier and does not assign every claim to inventory.

Each source requires `id`, `kind`, `trust`, `title`, and `url`, using only schema-supported values. Copy the exact URL from the report; never fabricate or normalize it.

Each claim requires `id`, `domain`, `kind`, `claim`, and `evidence`. The claim is an object with concise `summary` and optional useful `detail`. Each evidence item requires `sourceId` and `confidence`; include optional relationship, locator, and note only when applicable. Use only schema enums and fields.

Do not add application identifiers, event types, catalog records, modeling decisions, runtime payloads, or unsupported properties.

### Final audit
Verify every claim is supported by the report; every source reference resolves; secondary sources remain correctly classified; confidence reflects claim support; claims are atomic and traceable; action/effect/recipient/count/award/opening/claiming/veto stages are distinct; chronology and uncertainty are preserved; contradictions are genuine; and no unsupported identity, quantity, property, persistence, recipe, mechanic, or causal link was added. Ensure the YAML conforms to the supplied schema.

### Output
Return only the complete YAML document. No Markdown fences, commentary, or explanation.