# Stage 2 Extraction — Floor 3 Skills, Magic, Quests, and Progression Capabilities

## Purpose

Convert the supplied Stage 1 research report into a crawler-research/v1 claim ledger for Issue #184.

The output is evidence extraction, not CCI runtime modeling.

## Rules

1. Extract only claims supported by the supplied Stage 1 report.
2. Keep claims atomic and independently usable.
3. Preserve canon terminology.
4. Preserve source URLs, titles, source kinds, trust, locators, relationships, dependencies, contradictions, and unknowns supplied by the report.
5. Do not invent provenance or URLs.
6. Do not create a primary source merely because the report discusses the novel. If the accessible evidence is a secondary web source, use that source.
7. trust describes the source; confidence describes the claim. A corroborating source can support a confirmed claim. Do not downgrade a claim solely because the source is secondary.
8. Preserve uncertainty rather than filling gaps.
9. Do not infer universal System rules from character-specific evidence.
10. Do not create CCI event IDs, runtime payloads, implementation types, UI behavior, or modeling dispositions.
11. Do not include inventory/equipment claims unless the fact is specifically necessary to establish an in-scope skill, magic, quest, or progression capability.
12. Do not turn population-level reward facts into Carl inventory quantities.
13. Use only fields and enum values allowed by app/domain/schema/research-claim.schema.json.

## Required coverage

The resulting ledger should cover the research actually established for:

- Primal race selection and persistent consequences.
- Compensated Anarchist persistent modifiers.
- Iron Punch / Breadbasket progression.
- Wisp Armor's independently established effects.
- Other supported Floor 3 magic progression.
- The Show Must Go On.
- HOA / Neighborhood Cleansing.
- Retrieve Maestro's Instruments / Grimaldi sequence.
- Sex Workers Who Fell from the Heavens / CockBlock.
- Fools Who Broke the Glass and the Bandit consequence.
- Other explicitly supported Floor 3 skills or progression capabilities from the report.

## Atomic claims

Split compound mechanics when they have independent meaning.

For Fools Who Broke the Glass, keep separate claims for the resolution, the affected crawler population/survival outcome, the Bandit achievement trigger, and the reward-tier consequence.

For Wisp Armor, keep separate claims for damage mitigation and mind-control/psionic immunity.

Keep quest resolution separate from the capability used to resolve it.

## Exclusions

Do not include Carl's Doomsday Scenario as an inventory claim in this ledger. That belongs to Floor 3 inventory/equipment research.

Do not duplicate the complete Pet research ledger. Include pet/familiar facts only when they establish an in-scope progression capability.

## Output

Output only valid crawler-research/v1 YAML.
