# Floor 3 Inventory / Equipment / Loot / Award Research Design

## Status

Living research design for Issue #183 — Floor 3 research: inventory, equipment, loot, and award state.

This document is the design authority for the Stage 1 research pass and subsequent Stage 2 extraction handoff. The GitHub issue should remain a concise execution brief and reference this document rather than duplicating its methodology.

Related workflow:
- docs/research/research-to-cci-workflow.md
- docs/research/prompts/stage-1-canon-research.md
- docs/research/prompts/stage-2-research-yaml-extraction.md
- docs/research/floor-3-pet-research-abstract.md

The Pet research is the precedent for this work. Issue #183 should follow the same research → extraction → curation boundary rather than inventing a domain-specific pipeline.

---

## 1. Objective

Produce an evidence-rich, human-auditable research record for Book 2 / Floor 3 inventory, equipment, loot, acquisitions, transformations, and awards.

The research should establish:
- concrete items and equipment;
- acquisition, receipt, creation, transfer, equipping, consumption, transformation, and destruction;
- consequential loot and rewards;
- award causation versus actual delivery and receipt;
- persistence across floor boundaries;
- unresolved quantity, identity, timing, ownership, and mechanics.

Stage 1 produces research evidence, not CCI runtime data.

Do not create CCI events, runtime state, raw floor JSON, catalog entries, event IDs, application capabilities, UI state, candidate application-state models, promotion decisions, or additional staging representations.

The only Stage 1 artifact is the human-readable research report. Stage 2 converts that report directly into the existing crawler-research/v1 claim ledger.

---

## 2. Research scope

Focus on Book 2 / Floor 3.

Use earlier or later evidence only when it materially establishes:
- identity;
- provenance;
- continuity;
- persistence;
- terminology;
- consequences of a Floor 3 event;
- clarification of an otherwise ambiguous Floor 3 claim.

Research scope is not chronology scope. If an item entered Floor 3 from Floor 2, the earlier acquisition may be relevant. If a Floor 3 item is explicitly shown to persist into Floor 4, that later evidence may be relevant.

Preserve the chronology of the event and the chronology of the supporting evidence separately.

---

## 3. Research domains

### Inventory

Investigate explicit evidence for:
- items possessed;
- items acquired or received;
- items created or transformed;
- items consumed or expended;
- items transferred, lost, discarded, or destroyed;
- items carried across floor boundaries;
- unusual or consequential consumables;
- quest or System objects.

Distinguish possession from acquisition. A later reference to an item does not automatically establish when or how it was acquired.

### Equipment

Investigate:
- items explicitly equipped, worn, attached, or wielded;
- equipment changes, removal, replacement, upgrades, and destruction;
- temporary equipment states;
- pet-adjacent equipment.

Do not infer equipment merely from possession.

### Loot and acquisitions

Investigate consequential acquisition sources:
- mobs and named enemies;
- quests;
- boxes;
- achievements;
- System rewards;
- sponsors;
- gifts;
- trades;
- purchases;
- crafting;
- other explicitly documented mechanisms.

Do not turn one observed loot event into a universal loot-table rule. Repeated secondary descriptions of the same event are not independent corroboration.

### Boxes and awards

Distinguish:
1. achievement/event occurs;
2. reward becomes earned or awarded;
3. reward is generated;
4. reward is delivered;
5. recipient possesses it;
6. box is opened/unlocked;
7. contents are received;
8. contents are used, transferred, or destroyed.

Award causation is not the same as award grant, delivery, receipt, opening, or use.

### Creation and transformation

Investigate explicit crafting, assembly, upgrading, combining, containment, conversion, transformation, and item destruction as part of another creation.

Preserve causal sequences rather than collapsing them into generic acquisition.

### Continuity

Investigate items entering Floor 3 from earlier floors, surviving Floor 3, equipment carried forward, persistent unique items, and temporary/consumable objects.

Do not infer persistence merely because a later source does not mention destruction.

---

## 4. Known research targets

These are targets for verification, not assumed facts. Confirm, qualify, or reject them.

Inventory / rewards:
- hobby potion results including Cesta Punta, cactus, and Louis L'Amour books;
- Donut's Enchanted Anklet of the Fallen Oak;
- cat tree;
- scented candle;
- Pharmaceutical Starter Kit;
- Blitz Sticks;
- Hoblobbers;
- Dynamite / Hobgoblin Dynamite;
- Fan Box contents;
- Carl's Xistera;
- Donut's photograph;
- Kimaris figure;
- Sheol Glass Reaper Case;
- Carl's Doomsday Scenario.

Equipment:
- Mongo's tracking collar;
- Enchanted Fang Caps;
- Enchanted Crown of the Sepsis Whore;
- explicit equipment upgrades and effects;
- equipment destruction/removal.

Awards / achievement-linked state:
- Fan Boxes;
- Platinum Quest Boxes;
- Celestial Quest Boxes;
- Bandit Achievement relationship;
- Hadji Achievement relationship;
- reported 83 Celestial-quality boxes;
- Borant's veto;
- whether boxes were delivered, withheld, opened, or merely awarded.

The target list must not bias the researcher toward confirming the claims.

---

## 5. Evidence methodology

Follow the existing Stage 1 research prompt.

Use the best accessible evidence available. Primary text is preferred when accessible. When it is not accessible, use the most specific credible secondary evidence available and explicitly preserve the limitation.

Never imply direct inspection of the novels when evidence is secondary.

For each substantive claim, preserve where available:
- source/page title;
- publication/site;
- exact URL;
- book/chapter/section/timestamp locator;
- short quotation or close reference within copyright limits;
- whether the source directly states the proposition;
- whether the research is interpreting it;
- source quality/trust;
- accessibility limitations.

Use these evidence distinctions:
- DIRECT — accessible source directly states the proposition;
- CORROBORATED — materially independent sources reinforce it;
- INFERRED — reasonable interpretation not directly stated;
- UNKNOWN — evidence does not establish the requested detail;
- SECONDARY-ONLY / PRIMARY-VERIFICATION-REQUIRED — useful secondary evidence exists but primary verification would materially improve confidence.

A secondary source can directly state a proposition without becoming primary evidence.

Do not equate repeated summaries with independent corroboration.

---

## 6. Atomic claim discipline

Extract the narrowest useful proposition.

Do not let one narrative sentence silently bundle unrelated facts.

For example, these may be separate claims:
- Carl receives a Scroll of Upgrade.
- Carl applies the scroll to his BigBoi Boxers.
- The upgrade adds the Freeballing benefit.
- The benefit changes specific damage/armor behavior.

Likewise, distinguish:
- achievement occurs;
- boxes are awarded;
- boxes are upgraded;
- boxes are delivered;
- boxes are opened;
- contents are received;
- contents are used or transferred.

Split materially distinct propositions so each can be independently evidenced and curated, but do not over-fragment inseparable details.

---

## 7. Inventory-specific reasoning

### Acquisition versus possession

If research establishes that Carl possesses item X at the beginning of Floor 3, do not automatically claim that Carl acquires item X on Floor 3.

### Equipment versus possession

If research establishes that Katia has a bow, that becomes an equipment claim only when the evidence establishes that the bow is equipped, wielded, worn, or otherwise actively used as equipment.

### Use versus consumption

Distinguish uses, consumes, equips, activates, destroys, and loses according to the terminology supported by the evidence.

### Loot attribution

A later statement such as "an item from the fight" does not establish an exact acquisition moment, enemy source, loot table, or quantity.

### Quantity

Preserve qualitative quantities when that is all the evidence establishes. Do not turn "some," "multiple," "a collection," or "a stack" into invented numeric values.

---

## 8. Award reasoning

For consequential rewards, investigate separately:

### Causation
What event or achievement caused the reward?

### Grant
What did the System, sponsor, or authority actually award?

### Delivery
Was the reward delivered?

### Receipt
Is there evidence the recipient actually possessed it?

### Opening
If it is a box or container, was it opened?

### Contents
What did the opened container actually produce?

### Subsequent action
Was the result equipped, consumed, transferred, destroyed, or otherwise changed?

If evidence stops at any point, stop the chain there. Do not infer receipt from entitlement.

---

## 9. Chronology

Produce a chronological Floor 3 inventory/equipment/loot/award view similar to the successful Pet research workflow.

For each significant entry capture:
- approximate sequence;
- chapter when known;
- subject;
- item/equipment/award;
- event or observed state;
- evidence;
- confidence;
- unresolved details.

Do not invent timestamps.

Do not create a second competing Floor 3 timeline. Issue #180 owns the overall Floor 3 chronological spine. This research provides the inventory/equipment/loot/award evidence within that spine.

---

## 10. Cross-domain boundaries

Coordinate with:
- #180 — overall Floor 3 chronological spine;
- #181 — Pet progression, condition, equipment, deployment;
- #182 — crawler progression, stats, condition;
- #184 — skills, magic, quests, progression capabilities;
- #185 — ratings, notifications, party/social-system state;
- #186 — achievements, entitlements, crafting evidence.

When domains overlap, preserve the relationship without creating duplicate authoritative claims.

For example, #186 may establish that the Bandit Achievement causes an award while #183 establishes evidence about the resulting 83 Celestial-quality boxes and their distribution/veto state.

Pet-adjacent items should remain distinct from Mongo's overall Pet state. #181 may own Mongo's progression or condition; #183 owns evidence about an item, acquisition, transfer, or equipment state when that is the research question.

---

## 11. Contradiction handling

Only identify a contradiction when propositions are actually incompatible.

Do not call these contradictions merely because they describe different dimensions:
- an item is awarded but not delivered;
- a character is teleported but incapacitated;
- an item is possessed but its acquisition is unknown;
- a reward is earned but vetoed before receipt.

These can be different state dimensions rather than conflicting facts.

Preserve genuine contradictions and their evidence without resolving them.

---

## 12. Unknowns and verification

Explicitly preserve unresolved:
- exact quantity;
- exact identity;
- exact item tier;
- exact acquisition timing;
- exact ownership;
- exact equipment state;
- exact persistence;
- exact reward delivery/receipt;
- exact opening;
- exact mechanical effect;
- exact causal relationship.

Absence of evidence is not evidence of absence.

Use a targeted Primary Verification Queue where primary-text verification would materially improve confidence.

Prioritize:
1. exact item identity;
2. exact quantities;
3. acquisition timing;
4. equipment state;
5. reward causation;
6. reward delivery/receipt;
7. destruction/consumption;
8. persistence;
9. apparent system-wide rules.

---

## 13. Stage 1 deliverable

Create the human-readable report under docs/research/ using this structure:

1. Executive Summary
2. Sources
3. Observed Inventory / Equipment / Loot / Award Evidence
4. Floor 3 Chronology
5. Persistent Inventory
6. Equipment
7. Loot / Acquisitions
8. Boxes / Awards / Rewards
9. Item Creation / Transformation / Destruction
10. Award Causation
11. Inventory Continuity
12. Cross-Domain / Pet-Adjacent Findings
13. Explicitly Supported Facts
14. Corroborated but Secondary Facts
15. Inferences
16. Quantities / Identity / Timing Unknowns
17. Evidence Gaps / Potential Contradictions
18. Primary Verification Queue
19. Recommended Follow-up Research

The report should be detailed enough that Stage 2 can extract atomic claims without rediscovering the underlying evidence.

---

## 14. Stage 2 handoff

Use docs/research/prompts/stage-2-research-yaml-extraction.md after Stage 1.

The repository JSON Schema at app/domain/schema/research-claim.schema.json is authoritative.

Stage 2 output is the existing crawler-research/v1 claim ledger.

Use stable domain-oriented claim IDs such as:
- F3-INV-001
- F3-EQUIP-001
- F3-ACHIEVEMENT-001
- F3-REWARD-001

The YAML is an evidence-oriented research artifact, not authoritative CCI data.

---

## 15. Research → CCI boundary

Follow docs/research/research-to-cci-workflow.md.

The intended path is:

Stage 1 research report
→ research.yaml
→ deterministic schema validation
→ existing raw CCI authoring
→ existing validation / compilation

Do not introduce candidate JSON, modeling-decision YAML, disposable scaffolds, promotion models, alternate raw representations, or additional runtime staging.

If research establishes an item but not its CCI identity, preserve the evidence and leave the mapping unresolved. Existing validation should expose the remaining curation work.

---

## 16. Later curation principles

When research is eventually curated into CCI:

1. Read the claim and evidence first.
2. Find equivalent existing raw records before creating anything.
3. Check established catalogs and domain contracts.
4. Determine whether the claim is an event, observation, catalog/reference fact, or research-only fact.
5. Reuse established semantic representations.
6. Preserve existing authored IDs when the occurrence already exists.
7. Do not infer an event merely because a state is observed.
8. Do not invent an event type because the research domain has no exact match.
9. Preserve the research claim ID as provenance.
10. Leave unsupported mappings unresolved rather than inventing semantics.
11. Run the existing compiler and validators.
12. Review the final diff as the audit trail.

Research evidence and CCI modeling remain separate responsibilities.

---

## 17. Acceptance criteria

Stage 1 is complete when:
- [ ] The research report exists under docs/research/.
- [ ] Sources are independently identifiable and URLs are preserved exactly when supplied.
- [ ] Primary versus secondary evidence is explicit.
- [ ] Direct evidence, corroboration, inference, and unknowns are distinguished.
- [ ] Significant Floor 3 inventory/equipment/loot/award events are chronologically organized.
- [ ] Acquisition is not inferred from possession.
- [ ] Equipment is not inferred from possession.
- [ ] Award causation, grant, delivery, receipt, opening, and subsequent use are kept distinct where evidence permits.
- [ ] Quantities, identity, timing, persistence, and mechanics remain unknown where evidence is insufficient.
- [ ] Repeated summaries are not treated as independent corroboration.
- [ ] Pet-adjacent evidence does not duplicate Pet-state ownership.
- [ ] Cross-domain boundaries are explicit.
- [ ] Important secondary-only claims have targeted primary-verification follow-up.
- [ ] No CCI runtime or candidate modeling artifacts are introduced.

Stage 2 is complete when:
- [ ] The report has been extracted using the repository Stage 2 prompt.
- [ ] YAML conforms to crawler-research/v1.
- [ ] Source provenance remains traceable.
- [ ] Claims remain atomic and evidence-backed.
- [ ] Unknowns and contradictions are preserved.
- [ ] No application-state model has been introduced.

---

## 18. Living-document rule

This document is the design authority for Issue #183.

If the research methodology changes, update this document rather than expanding the GitHub issue with another large procedural section.

The issue should contain only:
- objective;
- link to this design;
- current execution step;
- deliverable;
- acceptance status.

The Pet research demonstrated the pattern; this document generalizes it for inventory/equipment/loot/award research while preserving the same architecture and representation boundaries.
