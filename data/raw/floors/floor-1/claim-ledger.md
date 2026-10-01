# First Floor Claim Ledger — Pets and Dungeon Familiars

This ledger captures pet/familiar claims relevant to the Pet domain before they are promoted into typed raw events. It follows the repository rule that source evidence should be preserved before projection/UI support exists, and that unsupported mechanics must not be inferred merely to make a complete model.

Primary chronology should be verified against *Dungeon Crawler Carl*, Book 1 before any of these claims are promoted to `confirmed` causal events. The community [Pets & Dungeon Familiars](https://dungeon-crawler-carl.fandom.com/wiki/Pets_%26_Dungeon_Familiars) reference is retained here as corroborating research and as a locator to cited book chapters; because this PR is evidence-only and introduces no raw Pet events, it is intentionally **not** added to executable `sources.json` yet.

## Floor 1 claims

| Claim | Current evidence | Authoring decision |
| --- | --- | --- |
| Donut enters the Dungeon as Carl's biological cat and is initially treated as a pet/familiar rather than a normal trained crawler. | Pets & Dungeon Familiars, Classification / Dungeon Familiars; cites Book 1 ch. 2 and related early-book material. | Preserve as a Pet-domain research claim. Do not infer a complete pet inventory, class, abilities, or pet-management UI from the classification alone. |
| Surface animals above the Dungeon's threshold may receive crawler IDs while still being designated pets when they do not qualify for crawler training. | Pets & Dungeon Familiars, Classification; cites Book 1 ch. 4. | Treat as a classification rule candidate. The exact threshold/intelligence semantics should remain unmodeled until primary text is inspected. |
| Donut has a crawler ID and level before becoming a regular crawler, but no class at that point. | Pets & Dungeon Familiars, Dungeon Familiars / Story; cites Book 1 ch. 2. | Candidate for a future classification/status model. Do not retrofit these fields into Party state. |
| Donut consumes an enhanced pet biscuit and is reclassified from pet/familiar to a regular crawler before forming the Royal Court with Carl. | Pets & Dungeon Familiars, Story; cites early Book 1 chapters. | This is an important state transition for the future Pet model. It should become a dedicated typed classification transition only when #130 defines the contract; do not encode it only in narrative summary text. |
| Pet boxes and enhanced pet biscuits exist by Floor 1, but the later branching transformation tree and many detailed outcomes are explained in later books. | Pets & Dungeon Familiars, Pet Biscuits / Story. | Preserve only the Floor 1 fact that Donut's transformation was caused by an enhanced pet biscuit. Do not backport later-book transformation mechanics into the Floors 1–3 model. |

## Relationship to existing raw events

`evt-f1-party-royal-court-formed` correctly begins after Donut has become a crawler. It should remain a Party event and must not be overloaded to represent her earlier pet/familiar classification or the biscuit-driven reclassification.

The current raw schema has no Pet/classification transition type. This ledger intentionally leaves those facts unprojected until #130 adds a coherent Pet contract across raw schema, runtime schema, types, compiler, projection, validation, and tests.

## Source-boundary notes

The supplied Pets/Familiars reference mixes Book 1 evidence with mechanics clarified much later in the series. For Floors 1–3 work, do **not** treat the following as early-book facts unless independently established by Books 1–2: later pet-stable behavior, later transformation subtrees, later species/regeneration mechanics, later accessory sets, later administrative classifications, or later examples used only to explain general rules retroactively.
